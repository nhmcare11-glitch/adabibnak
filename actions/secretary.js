"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const getAllAppointmentsForSecretary = async () => {
  try {
    const appointments = await db.appointment.findMany({
      include: {
        doctor: { select: { id: true, name: true, specialty: true, imageUrl: true } },
        patient: { select: { id: true, name: true, email: true, imageUrl: true } },
      },
      orderBy: { startTime: "desc" },
    });
    return { success: true, appointments };
  } catch (error) {
    console.error(error);
    return { success: false, appointments: [], error: "فشل جلب المواعيد" };
  }
};

export const getDoctorsListForSecretary = async () => {
  try {
    const doctors = await db.user.findMany({
      where: { role: "DOCTOR", verificationStatus: "VERIFIED" },
      select: { id: true, name: true, email: true, specialty: true, experience: true, imageUrl: true },
      orderBy: { name: "asc" },
    });
    return { success: true, doctors };
  } catch (error) {
    console.error(error);
    return { success: false, doctors: [], error: "فشل جلب الأطباء" };
  }
};

export const getPatientsListForSecretary = async () => {
  try {
    const patients = await db.user.findMany({
 where: { 
  role: { in: ["PATIENT", "UNASSIGNED"] } 
},
      select: { id: true, name: true, email: true, imageUrl: true, createdAt: true, age: true, bloodType: true },
      orderBy: { name: "asc" },
    });
    return { success: true, patients };
  } catch (error) {
    console.error(error);
    return { success: false, patients: [], error: "فشل جلب المرضى" };
  }
};

export const updatePatientInfo = async (patientId, formData) => {
  try {
    const patient = await db.user.update({
      where: { id: patientId },
      data: {
        name: formData.name || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        bloodType: formData.bloodType || undefined,
      },
    });
    revalidatePath("/secretary-dashboard");
    return { success: true, patient };
  } catch (error) {
    console.error(error);
    return { success: false, error: "فشل تحديث بيانات المريض" };
  }
};

export const cancelAppointmentBySecretary = async (appointmentId, reason) => {
  try {
    const appointment = await db.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED", cancellationReason: reason || null },
    });
    revalidatePath("/secretary-dashboard");
    return { success: true, appointment };
  } catch (error) {
    console.error(error);
    return { success: false, error: "فشل إلغاء الموعد" };
  }
};

export const rescheduleAppointment = async (appointmentId, newStartTime, newEndTime, reason) => {
  try {
    const appointment = await db.appointment.update({
      where: { id: appointmentId },
      data: {
        startTime: new Date(newStartTime),
        endTime: new Date(newEndTime),
        status: "SCHEDULED",
        cancellationReason: reason || null,
      },
    });
    revalidatePath("/secretary-dashboard");
    return { success: true, appointment };
  } catch (error) {
    console.error(error);
    return { success: false, error: "فشل تأجيل الموعد" };
  }
};
// ============================================================
// أضف هذا الكود في نهاية ملف actions/secretary.js
// ============================================================

/**
 * جلب راتب السكرتيرة الحالية
 */
export const getMySecretarySalaries = async () => {
  const { userId } = await auth();
  if (!userId) return { success: false, salaries: [], error: "غير مصرح" };

  try {
    const secretary = await db.user.findUnique({
      where: { clerkUserId: userId, role: { in: ["SECRETARY", "SECRETARY_GENERAL"] } },
    });
    if (!secretary) return { success: false, salaries: [], error: "لم يتم العثور على السكرتيرة" };

    const salaries = await db.secretarySalary.findMany({
      where: { secretaryId: secretary.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        approvedBy: { select: { name: true } },
      },
    });

    const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

    const formatted = salaries.map((s) => ({
      ...s,
      monthName: monthNames[s.month - 1],
      paidAt: s.paidAt?.toISOString() || null,
      createdAt: s.createdAt.toISOString(),
    }));

    return { success: true, salaries: formatted };
  } catch (error) {
    console.error(error);
    return { success: false, salaries: [], error: "فشل جلب بيانات الراتب" };
  }
};

/**
 * جلب راتب الشهر الحالي
 */
export const getCurrentMonthSalary = async () => {
  const { userId } = await auth();
  if (!userId) return { success: false, salary: null };

  try {
    const secretary = await db.user.findUnique({
      where: { clerkUserId: userId, role: { in: ["SECRETARY", "SECRETARY_GENERAL"] } },
    });
    if (!secretary) return { success: false, salary: null };

    const now = new Date();
    const salary = await db.secretarySalary.findUnique({
      where: {
        secretaryId_month_year: {
          secretaryId: secretary.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
    });

    return { success: true, salary };
  } catch (error) {
    return { success: false, salary: null, error: error.message };
  }
};

// ⚠️ تأكد من إضافة هذا الاستيراد في أعلى ملف secretary.js:
// import { auth } from "@clerk/nextjs/server";