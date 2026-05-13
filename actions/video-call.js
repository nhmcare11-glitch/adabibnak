"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

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

    // Update appointment notes
    await db.appointment.update({
      where: { id: appointmentId },
      data: { notes: notes?.trim() || null },
    });

    // Upsert prescription if diagnosis provided
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

    // Upsert prescription
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

    // Notify patient
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

    // Only doctor can complete
    if (appointment.doctorId === user.id) {
      await db.appointment.update({
        where: { id: appointmentId },
        data: { status: "COMPLETED" },
      });

      // Notify patient
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
  export async function startVideoConsultation(appointmentId) {
  try {
    await db.appointment.update({
      where: {
        id: appointmentId,
      },

      data: {
        status: "IN_CONSULTATION",
        videoCallStarted: true,
      },
    });

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

    if (appointment?.patientId) {
      await createNotification({
        userId: appointment.patientId,
        title: "بدأت الاستشارة الطبية",
        message:
          "الطبيب متصل الآن. يمكنك الانضمام للمكالمة.",
        type: "VIDEO_CALL",
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: error.message,
    };
  }
}
}