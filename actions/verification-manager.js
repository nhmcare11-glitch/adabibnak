"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * تحقق من صلاحية verification manager
 */
export async function verifyVerificationManager() {
  const { userId } = await auth();
  if (!userId) return false;
  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    return (
      user?.role === "VERIFICATION_MANAGER" || user?.role === "ADMIN"
    );
  } catch {
    return false;
  }
}

/**
 * إحصائيات عامة
 */
export async function getVerificationStats() {
  const isAllowed = await verifyVerificationManager();
  if (!isAllowed) throw new Error("Unauthorized");

  const [pending, verified, rejected, total] = await Promise.all([
    db.user.count({ where: { role: "DOCTOR", verificationStatus: "PENDING" } }),
    db.user.count({ where: { role: "DOCTOR", verificationStatus: "VERIFIED" } }),
    db.user.count({ where: { role: "DOCTOR", verificationStatus: "REJECTED" } }),
    db.user.count({ where: { role: "DOCTOR" } }),
  ]);

  return { pending, verified, rejected, total };
}

/**
 * قائمة الأطباء المنتظرين
 */
export async function getPendingDoctorsVM() {
  const isAllowed = await verifyVerificationManager();
  if (!isAllowed) throw new Error("Unauthorized");

  const doctors = await db.user.findMany({
    where: { role: "DOCTOR", verificationStatus: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return doctors.map((d) => ({
    ...d,
    createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
    updatedAt: d.updatedAt?.toISOString?.() ?? d.updatedAt,
  }));
}

/**
 * قائمة الأطباء المقبولين
 */
export async function getVerifiedDoctorsVM() {
  const isAllowed = await verifyVerificationManager();
  if (!isAllowed) throw new Error("Unauthorized");

  const doctors = await db.user.findMany({
    where: { role: "DOCTOR", verificationStatus: "VERIFIED" },
    orderBy: { name: "asc" },
  });

  return doctors.map((d) => ({
    ...d,
    createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
    updatedAt: d.updatedAt?.toISOString?.() ?? d.updatedAt,
  }));
}

/**
 * قائمة الأطباء المرفوضين
 */
export async function getRejectedDoctorsVM() {
  const isAllowed = await verifyVerificationManager();
  if (!isAllowed) throw new Error("Unauthorized");

  const doctors = await db.user.findMany({
    where: { role: "DOCTOR", verificationStatus: "REJECTED" },
    orderBy: { updatedAt: "desc" },
  });

  return doctors.map((d) => ({
    ...d,
    createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
    updatedAt: d.updatedAt?.toISOString?.() ?? d.updatedAt,
  }));
}

/**
 * قبول طبيب
 */
export async function approveDoctorVM(formData) {
  const isAllowed = await verifyVerificationManager();
  if (!isAllowed) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  if (!doctorId) throw new Error("Doctor ID required");

  const doctor = await db.user.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new Error("Doctor not found");

  await db.user.update({
    where: { id: doctorId },
    data: { verificationStatus: "VERIFIED" },
  });

  // إشعار للطبيب
  await db.notification.create({
    data: {
      userId: doctorId,
      type: "DOCTOR_VERIFIED",
      title: "✅ تم قبول حسابك",
      message: `تهانينا دكتور ${doctor.name}! تم قبول حسابك. يمكنك الآن استقبال المواعيد.`,
      link: "/doctor",
    },
  });

  revalidatePath("/verification-manager");
  return { success: true };
}

/**
 * رفض طبيب
 */
export async function rejectDoctorVM(formData) {
  const isAllowed = await verifyVerificationManager();
  if (!isAllowed) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const reason = formData.get("reason") || "لم يتم ذكر سبب";
  if (!doctorId) throw new Error("Doctor ID required");

  const doctor = await db.user.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new Error("Doctor not found");

  await db.user.update({
    where: { id: doctorId },
    data: { verificationStatus: "REJECTED" },
  });

  await db.notification.create({
    data: {
      userId: doctorId,
      type: "DOCTOR_REJECTED",
      title: "❌ لم يتم قبول طلبك",
      message: `عذراً دكتور ${doctor.name}، لم يتم قبول حسابك. السبب: ${reason}.`,
      link: "/onboarding",
    },
  });

  revalidatePath("/verification-manager");
  return { success: true };
}