"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

// ============================================================
// EXISTING FUNCTIONS (preserved)
// ============================================================

/**
 * Save doctor notes and diagnosis during/after video call
 */
export async function saveDoctorNotes(appointmentId, notes, diagnosis, medications, instructions) {
  const { userId } = await auth();
  if (!userId) return { error: "غير مصرح" };

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId, role: "DOCTOR" },
    });
    if (!doctor) return { error: "غير مصرح" };

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId, doctorId: doctor.id },
    });
    if (!appointment) return { error: "الموعد غير موجود" };

    await db.appointment.update({
      where: { id: appointmentId },
      data: { notes: notes?.trim() || null },
    });

    if (diagnosis?.trim()) {
      await db.prescription.upsert({
        where: { appointmentId },
        update: {
          diagnosis: diagnosis.trim(),
          medications: Array.isArray(medications) ? medications : [],
          instructions: instructions?.trim() || null,
        },
        create: {
          appointmentId,
          doctorId: doctor.id,
          patientId: appointment.patientId,
          diagnosis: diagnosis.trim(),
          medications: Array.isArray(medications) ? medications : [],
          instructions: instructions?.trim() || null,
        },
      });
    }

    revalidatePath(`/video-call`);
    return { success: true };
  } catch (error) {
    console.error("saveDoctorNotes error:", error);
    return { error: "حدث خطأ أثناء الحفظ" };
  }
}

/**
 * Save prescription and send notification to patient
 */
export async function saveAndSendPrescription(appointmentId, diagnosis, medications, instructions) {
  const { userId } = await auth();
  if (!userId) return { error: "غير مصرح" };

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId, role: "DOCTOR" },
    });
    if (!doctor) return { error: "غير مصرح" };

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId, doctorId: doctor.id },
    });
    if (!appointment) return { error: "الموعد غير موجود" };
    if (!diagnosis?.trim()) return { error: "التشخيص مطلوب" };

    const prescription = await db.prescription.upsert({
      where: { appointmentId },
      update: {
        diagnosis: diagnosis.trim(),
        medications: Array.isArray(medications) ? medications : [],
        instructions: instructions?.trim() || null,
      },
      create: {
        appointmentId,
        doctorId: doctor.id,
        patientId: appointment.patientId,
        diagnosis: diagnosis.trim(),
        medications: Array.isArray(medications) ? medications : [],
        instructions: instructions?.trim() || null,
      },
    });

    await createNotification({
      userId: appointment.patientId,
      type: "PRESCRIPTION_READY",
      title: "💊 وصفة طبية جديدة",
      message: `أرسل لك الدكتور ${doctor.name} وصفة طبية جديدة`,
      link: "/patient-dashboard",
      metadata: { prescriptionId: prescription.id, appointmentId },
    });

    revalidatePath(`/video-call`);
    revalidatePath(`/patient-dashboard`);
    return { success: true, prescription };
  } catch (error) {
    console.error("saveAndSendPrescription error:", error);
    return { error: "حدث خطأ أثناء إرسال الوصفة" };
  }
}

/**
 * Mark appointment as completed after call ends
 */
export async function completeAppointment(appointmentId) {
  const { userId } = await auth();
  if (!userId) return { error: "غير مصرح" };

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return { error: "المستخدم غير موجود" };

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true, patient: true },
    });

    if (!appointment) return { error: "الموعد غير موجود" };
    if (appointment.doctorId !== user.id && appointment.patientId !== user.id)
      return { error: "غير مصرح" };

    if (appointment.doctorId === user.id) {
      await db.appointment.update({
        where: { id: appointmentId },
        data: { status: "COMPLETED", videoCallStatus: "ENDED" },
      });

      await createNotification({
        userId: appointment.patientId,
        type: "APPOINTMENT_COMPLETED",
        title: "✅ انتهت الاستشارة",
        message: `انتهت استشارتك مع الدكتور ${appointment.doctor.name}`,
        link: "/patient-dashboard",
        metadata: { appointmentId },
      });
    }

    revalidatePath("/appointments");
    revalidatePath("/patient-dashboard");
    revalidatePath("/doctor");
    return { success: true };
  } catch (error) {
    console.error("completeAppointment error:", error);
    return { error: "حدث خطأ" };
  }
}

/**
 * Start video consultation - notify patient that doctor joined (LEGACY)
 */
export async function startVideoConsultation(appointmentId) {
  try {
    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "ONGOING",
        videoCallStatus: "DOCTOR_JOINED",
      },
    });

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    });

    if (appointment?.patientId) {
      await createNotification({
        userId: appointment.patientId,
        type: "VIDEO_CALL_STARTED",
        title: "📹 بدأت الاستشارة الطبية",
        message: `الدكتور ${appointment.doctor?.name || ""} متصل الآن. انقر للانضمام للمكالمة.`,
        link: `/video-call?appointmentId=${appointmentId}`,
        metadata: { appointmentId, sessionId: appointment.videoSessionId },
      });
    }

    revalidatePath("/patient-dashboard");
    return { success: true };
  } catch (error) {
    console.error("startVideoConsultation error:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// NEW FUNCTIONS (Video Call Notification System)
// ============================================================

/**
 * Doctor joins video call → notify patient (NEW)
 */
export async function doctorJoinedVideoCall(appointmentId) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("غير مصرح لك");
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    if (!appointment) throw new Error("الموعد غير موجود");
    if (appointment.doctorId !== doctor.id) throw new Error("غير مصرح لك");

    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "ONGOING",
        videoCallStatus: "DOCTOR_JOINED",
      },
    });

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

    revalidatePath("/patient-dashboard");
    revalidatePath("/video-call");

    return { success: true };
  } catch (error) {
    console.error("DOCTOR JOINED ERROR:", error);
    throw new Error(error.message || "فشل تحديث حالة المكالمة");
  }
}

/**
 * Patient joins video call → update status
 */
export async function patientJoinedVideoCall(appointmentId) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  try {
    const patient = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!patient || patient.role !== "PATIENT") {
      throw new Error("غير مصرح لك");
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) throw new Error("الموعد غير موجود");
    if (appointment.patientId !== patient.id) throw new Error("غير مصرح لك");

    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        videoCallStatus: "IN_PROGRESS",
      },
    });

    return { success: true };
  } catch (error) {
    throw new Error(error.message || "فشل تحديث الحالة");
  }
}

/**
 * End video call
 */
export async function endVideoCall(appointmentId) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId },
    });

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) throw new Error("الموعد غير موجود");
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

    await Promise.all([
      createNotification({
        userId: appointment.patientId,
        type: "VIDEO_CALL_ENDED",
        title: "📹 انتهت الاستشارة",
        message: "تم إنهاء مكالمة الفيديو.",
        link: "/patient-dashboard",
      }),
      createNotification({
        userId: appointment.doctorId,
        type: "VIDEO_CALL_ENDED",
        title: "📹 انتهت الاستشارة",
        message: "تم إنهاء مكالمة الفيديو.",
        link: "/doctor-dashboard",
      }),
    ]);

    revalidatePath("/patient-dashboard");
    revalidatePath("/doctor-dashboard");

    return { success: true };
  } catch (error) {
    throw new Error(error.message || "فشل إنهاء المكالمة");
  }
}

/**
 * Check if doctor joined (for patient polling)
 */
export async function checkVideoCallStatus(appointmentId) {
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

    if (!appointment) return { error: "الموعد غير موجود" };

    return {
      status: appointment.status,
      videoCallStatus: appointment.videoCallStatus,
      sessionId: appointment.videoSessionId,
      doctorJoined: appointment.videoCallStatus === "DOCTOR_JOINED" || 
                    appointment.videoCallStatus === "IN_PROGRESS",
      inProgress: appointment.videoCallStatus === "IN_PROGRESS",
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Get active video call for patient (for dashboard)
 */
export async function getActiveVideoCallForPatient() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  try {
    const patient = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!patient || patient.role !== "PATIENT") return null;

    const appointment = await db.appointment.findFirst({
      where: {
        patientId: patient.id,
        status: { in: ["SCHEDULED", "ONGOING"] },
        startTime: { lte: new Date(Date.now() + 30 * 60 * 1000) },
      },
      include: {
        doctor: {
          select: { id: true, name: true, specialty: true, imageUrl: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return { appointment };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Get active video call for doctor (for dashboard)
 */
export async function getActiveVideoCallForDoctor() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!doctor || doctor.role !== "DOCTOR") return null;

    const appointment = await db.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        status: { in: ["SCHEDULED", "ONGOING"] },
        startTime: { lte: new Date(Date.now() + 30 * 60 * 1000) },
      },
      include: {
        patient: {
          select: { id: true, name: true, imageUrl: true, patientProfile: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return { appointment };
  } catch (error) {
    return { error: error.message };
  }
}