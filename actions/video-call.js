"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

// ============================================================
// NEW: Doctor joins video call → notify patient
// ============================================================

export async function doctorJoinedVideoCall(appointmentId) {
  console.log("🔔 doctorJoinedVideoCall called for:", appointmentId);
  
  const { userId: clerkUserId } = await auth();
  console.log("👤 Current clerkUserId:", clerkUserId);

  if (!clerkUserId) {
    console.error("❌ No clerkUserId found");
    throw new Error("Unauthorized - no user ID");
  }

  try {
    // 1. Find the doctor
    const doctor = await db.user.findUnique({
      where: { clerkUserId },
    });
    console.log("👨‍⚕️ Found doctor:", doctor?.id, "Role:", doctor?.role);

    if (!doctor || doctor.role !== "DOCTOR") {
      console.error("❌ User is not a doctor:", doctor?.role);
      throw new Error("غير مصرح لك - لست طبيباً");
    }

    // 2. Find the appointment
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
      throw new Error("غير مصرح لك - هذا ليس موعدك");
    }

    // 3. Update appointment status
    console.log("📝 Updating appointment status to DOCTOR_JOINED...");
    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "ONGOING",
        videoCallStatus: "DOCTOR_JOINED",
      },
    });
    console.log("✅ Appointment updated:", updated.videoCallStatus);

    // 4. Create notification for patient
    console.log("📨 Creating notification for patient:", appointment.patientId);
    try {
      await createNotification({
        userId: appointment.patientId,
        type: "VIDEO_CALL_STARTED",
        title: "📹 الطبيب في الاستشارة",
        message: `د. ${appointment.doctor.name} دخل غرفة الاستشارة. انقر للانضمام الآن.`,
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
      // Don't throw - notification failure shouldn't break the call
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
    throw new Error("Unauthorized");
  }

  try {
    const patient = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!patient || patient.role !== "PATIENT") {
      throw new Error("غير مصرح لك - لست مريضاً");
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error("الموعد غير موجود");
    }

    if (appointment.patientId !== patient.id) {
      throw new Error("غير مصرح لك - هذا ليس موعدك");
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
    throw new Error("Unauthorized");
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
      throw new Error("غير مصرح لك");
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
// Get active video call for patient
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
          lte: new Date(Date.now() + 30 * 60 * 1000),
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