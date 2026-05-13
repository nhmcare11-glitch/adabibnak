"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// الطبيب يكتب وصفة جديدة أو يعدل وصفة موجودة
export async function savePrescription(appointmentId, data) {
  const { userId } = await auth();
  if (!userId) return { error: "غير مصرح" };

  const doctor = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!doctor || doctor.role !== "DOCTOR") return { error: "غير مصرح" };

  // تحقق أن الموعد تاع هذا الطبيب
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true },
  });

  if (!appointment || appointment.doctorId !== doctor.id) {
    return { error: "الموعد غير موجود أو غير مصرح" };
  }

  const prescription = await db.prescription.upsert({
    where: { appointmentId },
    create: {
      appointmentId,
      doctorId: doctor.id,
      patientId: appointment.patientId,
      diagnosis: data.diagnosis,
      medications: data.medications,
      instructions: data.instructions,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
    },
    update: {
      diagnosis: data.diagnosis,
      medications: data.medications,
      instructions: data.instructions,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
    },
    include: {
      doctor: { select: { name: true, specialty: true } },
      patient: { select: { name: true } },
      appointment: { select: { startTime: true } },
    },
  });

  return { prescription };
}

// جلب الوصفة حسب الموعد
export async function getPrescriptionByAppointment(appointmentId) {
  const { userId } = await auth();
  if (!userId) return { error: "غير مصرح" };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { error: "المستخدم غير موجود" };

  const prescription = await db.prescription.findUnique({
    where: { appointmentId },
    include: {
      doctor: { select: { name: true, specialty: true, imageUrl: true } },
      patient: { select: { name: true, email: true } },
      appointment: { select: { startTime: true } },
    },
  });

  if (!prescription) return { prescription: null };

  // تأكد أن المستخدم إما الطبيب أو المريض
  if (
    prescription.doctorId !== user.id &&
    prescription.patientId !== user.id &&
    user.role !== "ADMIN"
  ) {
    return { error: "غير مصرح" };
  }

  return { prescription };
}

// جلب كل وصفات المريض
export async function getPatientPrescriptions() {
  const { userId } = await auth();
  if (!userId) return { error: "غير مصرح" };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user || user.role !== "PATIENT") return { error: "غير مصرح" };

  const prescriptions = await db.prescription.findMany({
    where: { patientId: user.id },
    include: {
      doctor: { select: { name: true, specialty: true } },
      appointment: { select: { startTime: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { prescriptions };
}