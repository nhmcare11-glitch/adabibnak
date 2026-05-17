"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

// ============================================================
// Doctor joins video call → notify patient
// ============================================================

export async function doctorJoinedVideoCall(appointmentId) {
  console.log("🔔 doctorJoinedVideoCall called for:", appointmentId);

  const { userId: clerkUserId } = await auth();
  console.log("👤 Current clerkUserId:", clerkUserId);

  if (!clerkUserId) {
    console.error("❌ No clerkUserId found");
    throw new Error("غير مصرح — لم يتم العثور على معرف المستخدم");
  }

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId },
    });
    console.log("👨‍⚕️ Found doctor:", doctor?.id, "Role:", doctor?.role);

    if (!doctor || doctor.role !== "DOCTOR") {
      console.error("❌ User is not a doctor:", doctor?.role);
      throw new Error("غير مصرح لك — لست طبيباً");
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true, clerkUserId: true } },
        doctor: { select: { id: true, name: true } },
      },
    });
    console.log("📅 Found appointment:", appointment?.id, "Doctor:", appointment?.doctorId);

    if (!appointment) {
      console.error("❌ Appointment not found:", appointmentId);
      throw new Error("الموعد غير موجود");
    }

    if (appointment.doctorId !== doctor.id) {
      console.error("❌ Doctor mismatch:", appointment.doctorId, "!==", doctor.id);
      throw new Error("غير مصرح لك — هذا ليس موعدك");
    }

    console.log("📝 Updating appointment status to DOCTOR_JOINED...");
    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "ONGOING",
        videoCallStatus: "DOCTOR_JOINED",
      },
    });
    console.log("✅ Appointment updated:", updated.videoCallStatus);

    console.log("📨 Creating notification for patient:", appointment.patientId);
    try {
      await createNotification({
        userId: appointment.patientId,
        type: "VIDEO_CALL_STARTED",
        title: "📹 مكالمة واردة",
        message: `د. ${appointment.doctor.name} انضم إلى غرفة الاستشارة. انقر للانضمام الآن.`,
        link: `/video-call?appointmentId=${appointmentId}`,
        metadata: {
          appointmentId,
          sessionId: appointment.videoSessionId,
          doctorId: doctor.id,
          type: "VIDEO_CALL_STARTED",
        },
      });
      console.log("✅ Notification created successfully");
    } catch (notifError) {
      console.error("⚠️ Notification creation failed:", notifError.message);
    }

    revalidatePath("/patient-dashboard");
    revalidatePath("/video-call");

    return { success: true, status: "DOCTOR_JOINED" };
  } catch (error) {
    console.error("❌ doctorJoinedVideoCall ERROR:", error);
    throw new Error(error.message || "فشل تحديث حالة المكالمة");
  }
}

// ============================================================
// Check video call status (for patient polling)
// ============================================================

export async function checkVideoCallStatus(appointmentId) {
  console.log("🔍 checkVideoCallStatus called for:", appointmentId);

  try {
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        videoCallStatus: true,
        videoSessionId: true,
        status: true,
        doctorId: true,
        patientId: true,
      },
    });

    if (!appointment) {
      console.log("❌ Appointment not found");
      return { error: "الموعد غير موجود" };
    }

    const result = {
      status: appointment.status,
      videoCallStatus: appointment.videoCallStatus,
      sessionId: appointment.videoSessionId,
      doctorJoined: appointment.videoCallStatus === "DOCTOR_JOINED" || 
                    appointment.videoCallStatus === "IN_PROGRESS",
      inProgress: appointment.videoCallStatus === "IN_PROGRESS",
      ended: appointment.videoCallStatus === "ENDED" || appointment.status === "COMPLETED",
    };

    console.log("📡 Status result:", result);
    return result;
  } catch (error) {
    console.error("❌ checkVideoCallStatus ERROR:", error);
    return { error: error.message };
  }
}

// ============================================================
// Patient joins video call
// ============================================================

export async function patientJoinedVideoCall(appointmentId) {
  console.log("👤 patientJoinedVideoCall called for:", appointmentId);

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("غير مصرح — لم يتم العثور على معرف المستخدم");
  }

  try {
    const patient = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!patient || patient.role !== "PATIENT") {
      throw new Error("غير مصرح لك — لست مريضاً");
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error("الموعد غير موجود");
    }

    if (appointment.patientId !== patient.id) {
      throw new Error("غير مصرح لك — هذا ليس موعدك");
    }

    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        videoCallStatus: "IN_PROGRESS",
      },
    });

    console.log("✅ Patient joined, status updated to IN_PROGRESS");
    return { success: true };
  } catch (error) {
    console.error("❌ patientJoinedVideoCall ERROR:", error);
    throw new Error(error.message || "فشل تحديث الحالة");
  }
}

// ============================================================
// End video call
// ============================================================

export async function endVideoCall(appointmentId) {
  console.log("📞 endVideoCall called for:", appointmentId);

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("غير مصرح — لم يتم العثور على معرف المستخدم");
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId },
    });

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error("الموعد غير موجود");
    }

    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error("غير مصرح لك — لا يمكنك إنهاء هذه المكالمة");
    }

    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "COMPLETED",
        videoCallStatus: "ENDED",
      },
    });

    console.log("✅ Call ended, status updated to ENDED");
    return { success: true };
  } catch (error) {
    console.error("❌ endVideoCall ERROR:", error);
    throw new Error(error.message || "فشل إنهاء المكالمة");
  }
}

// ============================================================
// Get active video call for patient (24 hours window)
// ============================================================

export async function getActiveVideoCallForPatient() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    console.log("❌ No user ID in getActiveVideoCallForPatient");
    return { success: false, error: "Unauthorized" };
  }

  try {
    const patient = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!patient || patient.role !== "PATIENT") {
      return { success: false, error: "Not a patient" };
    }

    const appointment = await db.appointment.findFirst({
      where: {
        patientId: patient.id,
        status: { in: ["SCHEDULED", "ONGOING"] },
        startTime: { 
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
      include: {
        doctor: {
          select: { id: true, name: true, specialty: true, imageUrl: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    console.log("📅 getActiveVideoCallForPatient found:", appointment?.id);
    return { success: true, appointment };
  } catch (error) {
    console.error("❌ getActiveVideoCallForPatient ERROR:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// Complete appointment (legacy support)
// ============================================================

export async function completeAppointment(appointmentId) {
  console.log("✅ completeAppointment called for:", appointmentId);

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("غير مصرح — لم يتم العثور على معرف المستخدم");
  }

  try {
    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "COMPLETED",
        videoCallStatus: "ENDED",
      },
    });

    revalidatePath("/doctor-dashboard");
    revalidatePath("/patient-dashboard");

    return { success: true };
  } catch (error) {
    console.error("❌ completeAppointment ERROR:", error);
    throw new Error(error.message || "فشل إكمال الموعد");
  }
}

// ============================================================
// Start video consultation (legacy support)
// ============================================================

export async function startVideoConsultation(appointmentId) {
  console.log("🚀 startVideoConsultation called for:", appointmentId);

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("غير مصرح — لم يتم العثور على معرف المستخدم");
  }

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("غير مصرح لك — لست طبيباً");
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true, clerkUserId: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      throw new Error("الموعد غير موجود");
    }

    if (appointment.doctorId !== doctor.id) {
      throw new Error("غير مصرح لك — هذا ليس موعدك");
    }

    let sessionId = appointment.videoSessionId;
    if (!sessionId) {
      sessionId = `session-${appointmentId}-${Date.now()}`;
      await db.appointment.update({
        where: { id: appointmentId },
        data: { videoSessionId: sessionId },
      });
    }

    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "ONGOING",
        videoCallStatus: "DOCTOR_JOINED",
      },
    });

    try {
      await createNotification({
        userId: appointment.patientId,
        type: "VIDEO_CALL_STARTED",
        title: "📹 مكالمة واردة",
        message: `د. ${appointment.doctor.name} بدأ الاستشارة. انقر للانضمام الآن.`,
        link: `/video-call?appointmentId=${appointmentId}`,
        metadata: {
          appointmentId,
          sessionId,
          doctorId: doctor.id,
          type: "VIDEO_CALL_STARTED",
        },
      });
    } catch (notifError) {
      console.error("⚠️ Notification creation failed:", notifError.message);
    }

    revalidatePath("/patient-dashboard");
    revalidatePath("/video-call");

    return { success: true, sessionId };
  } catch (error) {
    console.error("❌ startVideoConsultation ERROR:", error);
    throw new Error(error.message || "فشل بدء الاستشارة");
  }
}