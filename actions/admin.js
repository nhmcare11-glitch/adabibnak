"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

/**
 * Verifies if current user has admin role
 */
export async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    return user?.role === "ADMIN";
  } catch {
    return false;
  }
}

/**
 * Gets all doctors with pending verification
 */
export async function getPendingDoctors() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");
  try {
    const pendingDoctors = await db.user.findMany({
      where: { role: "DOCTOR", verificationStatus: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    return { doctors: pendingDoctors };
  } catch {
    throw new Error("Failed to fetch pending doctors");
  }
}

/**
 * Gets all verified doctors
 */
export async function getVerifiedDoctors() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");
  try {
    const verifiedDoctors = await db.user.findMany({
      where: { role: "DOCTOR", verificationStatus: "VERIFIED" },
      orderBy: { name: "asc" },
    });
    return { doctors: verifiedDoctors };
  } catch (error) {
    return { error: "Failed to fetch verified doctors" };
  }
}

/**
 * Updates a doctor's verification status
 */
export async function updateDoctorStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const status = formData.get("status");

  if (!doctorId || !["VERIFIED", "REJECTED"].includes(status))
    throw new Error("Invalid input");

  try {
    await db.user.update({
      where: { id: doctorId },
      data: { verificationStatus: status },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update doctor status: ${error.message}`);
  }
}

/**
 * Suspends or reinstates a doctor
 */
export async function updateDoctorActiveStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const suspend = formData.get("suspend") === "true";
  if (!doctorId) throw new Error("Doctor ID is required");

  try {
    await db.user.update({
      where: { id: doctorId },
      data: { verificationStatus: suspend ? "PENDING" : "VERIFIED" },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update doctor status: ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABILITY MANAGEMENT (Admin only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all verified doctors with their current availability slots
 */
export async function getAllDoctorsWithAvailability() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const doctors = await db.user.findMany({
      where: { role: "DOCTOR", verificationStatus: "VERIFIED" },
      orderBy: { name: "asc" },
      include: {
        availabilities: {
          orderBy: { startTime: "asc" },
        },
      },
    });
    return { doctors };
  } catch (error) {
    throw new Error("Failed to fetch doctors with availability: " + error.message);
  }
}

/**
 * Get a single doctor's availability slots (for admin)
 */
export async function getDoctorAvailabilityByAdmin(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  if (!doctorId) throw new Error("Doctor ID is required");

  try {
    const slots = await db.availability.findMany({
      where: { doctorId },
      orderBy: { startTime: "asc" },
    });
    return { slots };
  } catch (error) {
    throw new Error("Failed to fetch availability: " + error.message);
  }
}
// ================================================
// زيد هذه الدالة في actions/admin.js
// بعد دالة getDoctorAvailabilityByAdmin (السطر ~150)
// ================================================

/**
 * Create availability slot(s) for a doctor — Admin only
 */
export async function setDoctorAvailabilityByAdmin(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");

  if (!doctorId || !startTime || !endTime) {
    throw new Error("doctorId, startTime and endTime are required");
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format");
  }

  if (start >= end) {
    throw new Error("وقت البدء يجب أن يكون قبل وقت الانتهاء");
  }

  try {
    // تحقق أن الطبيب موجود
    const doctor = await db.user.findUnique({
      where: { id: doctorId, role: "DOCTOR" },
    });
    if (!doctor) throw new Error("Doctor not found");

    // تحقق من عدم وجود تعارض في المواعيد
    const conflicting = await db.availability.findFirst({
      where: {
        doctorId,
        status: { not: "BLOCKED" },
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } },
        ],
      },
    });

    if (conflicting) {
      throw new Error("يوجد تعارض مع فترة توافر موجودة مسبقاً");
    }

    // إنشاء السلوت
    const slot = await db.availability.create({
      data: {
        doctorId,
        startTime: start,
        endTime: end,
        status: "AVAILABLE",
      },
    });

    // إشعار الطبيب
    await createNotification({
      userId: doctor.id,
      type: "AVAILABILITY_SET",
      title: "📅 تم تحديد وقت توافرك",
      message: `الإدارة أضافت فترة توافر جديدة لك بتاريخ ${start.toLocaleDateString("ar-DZ")} من ${start.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })} إلى ${end.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}`,
      link: "/doctor",
    });

    revalidatePath("/admin");
    revalidatePath("/doctor");

    return { success: true, slot };
  } catch (error) {
    throw new Error("Failed to set availability: " + error.message);
  }
}


/**
 * Delete a specific availability slot — Admin only
 */
export async function deleteDoctorAvailabilitySlot(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const slotId = formData.get("slotId");
  if (!slotId) throw new Error("Slot ID is required");

  try {
    const slot = await db.availability.findUnique({ where: { id: slotId } });
    if (!slot) throw new Error("Slot not found");
    if (slot.status === "BOOKED") throw new Error("Cannot delete a booked slot");

    await db.availability.delete({ where: { id: slotId } });

    revalidatePath("/admin");
    revalidatePath("/doctor");
    return { success: true };
  } catch (error) {
    throw new Error("Failed to delete slot: " + error.message);
  }
}

/**
 * Block/unblock a specific availability slot — Admin only
 */
export async function toggleSlotStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const slotId = formData.get("slotId");
  if (!slotId) throw new Error("Slot ID is required");

  try {
    const slot = await db.availability.findUnique({ where: { id: slotId } });
    if (!slot) throw new Error("Slot not found");
    if (slot.status === "BOOKED") throw new Error("Cannot modify a booked slot");

    const newStatus = slot.status === "AVAILABLE" ? "BLOCKED" : "AVAILABLE";

    await db.availability.update({
      where: { id: slotId },
      data: { status: newStatus },
    });

    revalidatePath("/admin");
    return { success: true, newStatus };
  } catch (error) {
    throw new Error("Failed to toggle slot: " + error.message);
  }
}

/**
 * Gets all pending payouts
 */
export async function getPendingPayouts() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");
  try {
    const pendingPayouts = await db.payout.findMany({
      where: { status: "PROCESSING" },
      include: {
        doctor: {
          select: { id: true, name: true, email: true, specialty: true, credits: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { payouts: pendingPayouts };
  } catch {
    throw new Error("Failed to fetch pending payouts");
  }
}

/**
 * Approves a payout
 */
export async function approvePayout(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const payoutId = formData.get("payoutId");
  if (!payoutId) throw new Error("Payout ID is required");

  try {
    const { userId } = await auth();
    const admin = await db.user.findUnique({ where: { clerkUserId: userId } });

    const payout = await db.payout.findUnique({
      where: { id: payoutId, status: "PROCESSING" },
      include: { doctor: true },
    });

    if (!payout) throw new Error("Payout not found or already processed");
    if (payout.doctor.credits < payout.credits)
      throw new Error("Doctor doesn't have enough credits");

    await db.$transaction(async (tx) => {
      await tx.payout.update({
        where: { id: payoutId },
        data: { status: "PROCESSED", processedAt: new Date(), processedBy: admin?.id || "unknown" },
      });
      await tx.user.update({
        where: { id: payout.doctorId },
        data: { credits: { decrement: payout.credits } },
      });
      await tx.creditTransaction.create({
        data: { userId: payout.doctorId, amount: -payout.credits, type: "ADMIN_ADJUSTMENT" },
      });
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to approve payout: ${error.message}`);
  }
}




// ═══════════════════════════════════════════════════════
// ANALYTICS & STATS
// ═══════════════════════════════════════════════════════

export async function getAllUsers() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { doctors: [], patients: [], visitors: [] };
  try {
    const [doctors, patients] = await Promise.all([
      db.user.findMany({
        where: { role: "DOCTOR" },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, specialty: true, experience: true, verificationStatus: true, createdAt: true },
      }),
      db.user.findMany({
        where: { role: "PATIENT" },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);
    const serialize = (u) => ({ ...u, createdAt: u.createdAt?.toISOString?.() ?? u.createdAt });
    return { doctors: doctors.map(serialize), patients: patients.map(serialize), visitors: [] };
  } catch (error) {
    return { doctors: [], patients: [], visitors: [] };
  }
}

export async function getVisitorsAndDoctorsStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { doctorsCount: 0, patientsCount: 0, visitorsCount: 0, total: 0, doctorsPercentage: 0, patientsPercentage: 0, visitorsPercentage: 0 };
  try {
    const [doctorsCount, patientsCount] = await Promise.all([
      db.user.count({ where: { role: "DOCTOR" } }),
      db.user.count({ where: { role: "PATIENT" } }),
    ]);
    const total = doctorsCount + patientsCount;
    return {
      doctorsCount,
      patientsCount,
      visitorsCount: 0,
      total,
      doctorsPercentage: total ? Math.round((doctorsCount / total) * 100) : 0,
      patientsPercentage: total ? Math.round((patientsCount / total) * 100) : 0,
      visitorsPercentage: 0,
    };
  } catch {
    return { doctorsCount: 0, patientsCount: 0, visitorsCount: 0, total: 0, doctorsPercentage: 0, patientsPercentage: 0, visitorsPercentage: 0 };
  }
}

export async function getMonthlyAppointmentsStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { months: [], total: new Array(12).fill(0) };
  try {
    const now = new Date();
    const months = [];
    const total = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push(d.toLocaleString("ar", { month: "short" }));
      const count = await db.appointment.count({ where: { createdAt: { gte: d, lt: next } } });
      total.push(count);
    }
    return { months, total };
  } catch {
    return { months: [], total: new Array(12).fill(0) };
  }
}

export async function getMonthlyPatientsStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return new Array(12).fill(0);
  try {
    const now = new Date();
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await db.user.count({ where: { role: "PATIENT", createdAt: { gte: d, lt: next } } });
      result.push(count);
    }
    return result;
  } catch {
    return new Array(12).fill(0);
  }
}

export async function getAppointmentCompletionRate() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return 0;
  try {
    const [total, completed] = await Promise.all([
      db.appointment.count(),
      db.appointment.count({ where: { status: "COMPLETED" } }),
    ]);
    return total ? Math.round((completed / total) * 100) : 0;
  } catch {
    return 0;
  }
}

export async function getPatientSatisfactionRate() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return 0;
  try {
    const ratings = await db.appointment.findMany({
      where: { rating: { not: null } },
      select: { rating: true },
    });
    if (!ratings.length) return 85;
    const avg = ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length;
    return Math.round((avg / 5) * 100);
  } catch {
    return 85;
  }
}

export async function getDoctorsPerformance() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return [];
  try {
    const doctors = await db.user.findMany({
      where: { role: "DOCTOR", verificationStatus: "VERIFIED" },
      select: { id: true, name: true, specialty: true },
      take: 10,
    });
    const result = await Promise.all(
      doctors.map(async (d) => {
        const count = await db.appointment.count({ where: { doctorId: d.id } });
        return { ...d, appointmentsCount: count };
      })
    );
    return result.sort((a, b) => b.appointmentsCount - a.appointmentsCount);
  } catch {
    return [];
  }
}

export async function getSpecialtiesDistribution() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return [];
  try {
    const doctors = await db.user.findMany({
      where: { role: "DOCTOR", specialty: { not: null } },
      select: { specialty: true },
    });
    const map = {};
    doctors.forEach((d) => { map[d.specialty] = (map[d.specialty] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  } catch {
    return [];
  }
}

export async function getGrowthStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { doctorsGrowth: 0, appointmentsGrowth: 0 };
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [doctorsThis, doctorsLast, apptThis, apptLast] = await Promise.all([
      db.user.count({ where: { role: "DOCTOR", createdAt: { gte: thisMonth } } }),
      db.user.count({ where: { role: "DOCTOR", createdAt: { gte: lastMonth, lt: thisMonth } } }),
      db.appointment.count({ where: { createdAt: { gte: thisMonth } } }),
      db.appointment.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
    ]);
    const growth = (cur, prev) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
    return { doctorsGrowth: growth(doctorsThis, doctorsLast), appointmentsGrowth: growth(apptThis, apptLast) };
  } catch {
    return { doctorsGrowth: 0, appointmentsGrowth: 0 };
  }
}

export async function getRecentActivities(limit = 8) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return [];
  try {
    const appointments = await db.appointment.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { name: true } },
        doctor: { select: { name: true, specialty: true } },
      },
    });
    return appointments.map((a) => ({
      id: a.id,
      type: "appointment",
      description: `${a.patient?.name || "مريض"} حجز موعد مع ${a.doctor?.name || "طبيب"}`,
      status: a.status,
      createdAt: a.createdAt?.toISOString(),
    }));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════

export async function getReports() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return [];
  try {
    const reports = await db.report.findMany({ orderBy: { createdAt: "desc" } });
    return reports.map((r) => ({
      ...r,
      date: r.createdAt?.toLocaleDateString("ar-DZ"),
      createdAt: r.createdAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function createReport({ name, type, status, content }) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { doctors: [], patients: [], visitors: [] };
  try {
    await db.report.create({ data: { name, type, status, content } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateReport({ id, name, type, status, content }) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { doctorsCount: 0, patientsCount: 0, visitorsCount: 0, total: 0, doctorsPercentage: 0, patientsPercentage: 0, visitorsPercentage: 0 };
  try {
    await db.report.update({ where: { id }, data: { name, type, status, content } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteReport(id) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { months: [], total: new Array(12).fill(0) };
  try {
    await db.report.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}







export async function approveDoctor(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  if (!doctorId) throw new Error("Invalid input");

  try {
    const doctor = await db.user.findUnique({
      where: { id: doctorId, role: "DOCTOR" },
    });

    if (!doctor) throw new Error("Doctor not found");

    await db.user.update({
      where: { id: doctorId },
      data: { verificationStatus: "VERIFIED" },
    });

    // ➕ إضافة إشعار للطبيب
    await createNotification({
      userId: doctor.id,
      type: "DOCTOR_VERIFIED_BY_ADMIN",
      title: "✅ تم قبول طلبك",
      message: `تهانينا دكتور ${doctor.name}! تم قبول حسابك كطبيب في منصة Adabibanek. يمكنك الآن البدء في استقبال المواعيد.`,
      link: "/doctor",
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to approve doctor: ${error.message}`);
  }
}



export async function rejectDoctor(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const reason = formData.get("reason") || "لم يتم ذكر سبب";

  if (!doctorId) throw new Error("Invalid input");

  try {
    const doctor = await db.user.findUnique({
      where: { id: doctorId, role: "DOCTOR" },
    });

    if (!doctor) throw new Error("Doctor not found");

    await db.user.update({
      where: { id: doctorId },
      data: { verificationStatus: "REJECTED" },
    });

    // ➕ إضافة إشعار للطبيب
    await createNotification({
      userId: doctor.id,
      type: "DOCTOR_REJECTED_BY_ADMIN",
      title: "❌ لم يتم قبول طلبك",
      message: `عذراً دكتور ${doctor.name}، لم يتم قبول حسابك كطبيب في الوقت الحالي. السبب: ${reason}. يمكنك التواصل مع الدعم للمزيد من المعلومات.`,
      link: "/contact",
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to reject doctor: ${error.message}`);
  }



// ============================================================
// أضف هذا الكود في نهاية ملف actions/admin.js
// ============================================================
}
// ============================================================
// PAYMENT & COMMISSIONS MANAGEMENT
// ============================================================

/**
 * جلب جميع المدفوعات مع تفاصيل العمولة
 */


export async function getAllPaymentsWithCommissions() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const payments = await db.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        appointment: {
          include: {
            doctor: { select: { id: true, name: true, specialty: true, createdAt: true } },
            patient: { select: { id: true, name: true } },
          },
        },
        approvedBy: { select: { name: true, role: true } },
      },
    });

    return {
      payments: payments.map((p) => {
        const oneMonthAfterJoin = new Date(p.appointment.doctor.createdAt);
        oneMonthAfterJoin.setMonth(oneMonthAfterJoin.getMonth() + 1);
        const isInFreeMonth = new Date() <= oneMonthAfterJoin;

        return {
          ...p,
          isInFreeMonth,
          freeMonthEndsAt: oneMonthAfterJoin.toISOString(),
        };
      }),
    };
  } catch (error) {
    throw new Error("فشل جلب المدفوعات: " + error.message);
  }
}

/**
 * إحصاءات العمولة الشهرية للأدمن
 */
export async function getCommissionsStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCommissions, thisMonthCommissions, paidPayments] = await Promise.all([
      // إجمالي العمولات الكلي
      db.payment.aggregate({
        where: { status: "PAID", adminCommission: { gt: 0 } },
        _sum: { adminCommission: true },
      }),
      // عمولات هذا الشهر
      db.payment.aggregate({
        where: {
          status: "PAID",
          adminCommission: { gt: 0 },
          paidAt: { gte: startOfMonth },
        },
        _sum: { adminCommission: true },
      }),
      // عدد المدفوعات المكتملة
      db.payment.count({ where: { status: "PAID" } }),
    ]);

    return {
      totalCommissions: totalCommissions._sum.adminCommission || 0,
      thisMonthCommissions: thisMonthCommissions._sum.adminCommission || 0,
      paidPayments,
    };
  } catch (error) {
    throw new Error("فشل جلب إحصاءات العمولة: " + error.message);
  }
}

/**
 * جلب عمولات طبيب معين
 */
export async function getDoctorCommissions(doctorId) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const payments = await db.payment.findMany({
      where: {
        appointment: { doctorId },
        status: "PAID",
        adminCommission: { gt: 0 },
      },
      include: {
        appointment: {
          include: {
            patient: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    const totalCommission = payments.reduce((sum, p) => sum + (p.adminCommission || 0), 0);

    return { payments, totalCommission };
  } catch (error) {
    throw new Error("فشل جلب عمولات الطبيب: " + error.message);
  }
}

// ============================================================
// SECRETARY SALARY MANAGEMENT
// ============================================================

/**
 * جلب جميع السكرتيرات
 */
export async function getAllSecretaries() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const secretaries = await db.user.findMany({
      where: { role: { in: ["SECRETARY", "SECRETARY_GENERAL"] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageUrl: true,
        createdAt: true,
        salariesAsSecretary: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
        },
      },
      orderBy: { name: "asc" },
    });

    return { secretaries };
  } catch (error) {
    throw new Error("فشل جلب السكرتيرات: " + error.message);
  }
}

/**
 * إنشاء أو تحديث راتب شهري للسكرتيرة
 */
export async function setSecretarySalary(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const { userId } = await auth();
  const secretaryId = formData.get("secretaryId");
  const amount = parseFloat(formData.get("amount"));
  const month = parseInt(formData.get("month"));
  const year = parseInt(formData.get("year"));
  const notes = formData.get("notes") || null;

  if (!secretaryId || !amount || !month || !year) {
    throw new Error("جميع الحقول مطلوبة");
  }

  try {
    const admin = await db.user.findUnique({ where: { clerkUserId: userId } });

    const salary = await db.secretarySalary.upsert({
      where: { secretaryId_month_year: { secretaryId, month, year } },
      update: { amount, notes, status: "PENDING", paidAt: null, approvedById: null },
      create: { secretaryId, amount, month, year, notes, status: "PENDING" },
    });

    const secretary = await db.user.findUnique({ where: { id: secretaryId } });
    const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

    // إشعار للسكرتيرة
    await db.notification.create({
      data: {
        userId: secretaryId,
        type: "SALARY_SET",
        title: "💰 تم تحديد راتبك",
        message: `تم تحديد راتبك لشهر ${monthNames[month - 1]} ${year}: $${amount}`,
        link: "/secretary-dashboard",
        metadata: { salaryId: salary.id, amount, month, year },
      },
    });

    revalidatePath("/admin");
    return { success: true, salary };
  } catch (error) {
    throw new Error("فشل تحديد الراتب: " + error.message);
  }
}

/**
 * تأكيد دفع راتب السكرتيرة
 */
export async function paySecretarySalary(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const { userId } = await auth();
  const salaryId = formData.get("salaryId");

  if (!salaryId) throw new Error("معرّف الراتب مطلوب");

  try {
    const admin = await db.user.findUnique({ where: { clerkUserId: userId } });

    const salary = await db.secretarySalary.findUnique({
      where: { id: salaryId },
      include: { secretary: true },
    });

    if (!salary) throw new Error("الراتب غير موجود");
    if (salary.status === "PAID") throw new Error("تم دفع هذا الراتب مسبقاً");

    const updated = await db.secretarySalary.update({
      where: { id: salaryId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        approvedById: admin?.id,
      },
    });

    const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

    // إشعار للسكرتيرة
    await db.notification.create({
      data: {
        userId: salary.secretaryId,
        type: "SALARY_PAID",
        title: "✅ تم دفع راتبك",
        message: `تم دفع راتبك لشهر ${monthNames[salary.month - 1]} ${salary.year}: $${salary.amount}`,
        link: "/secretary-dashboard",
        metadata: { salaryId, amount: salary.amount },
      },
    });

    revalidatePath("/admin");
    revalidatePath("/secretary-dashboard");
    return { success: true, salary: updated };
  } catch (error) {
    throw new Error("فشل دفع الراتب: " + error.message);
  }
}

/**
 * جلب سجل رواتب سكرتيرة معينة
 */
export async function getSecretarySalaryHistory(secretaryId) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const salaries = await db.secretarySalary.findMany({
      where: { secretaryId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        approvedBy: { select: { name: true } },
      },
    });

    return { salaries };
  } catch (error) {
    throw new Error("فشل جلب سجل الرواتب: " + error.message);
  }
}

/**
 * إحصاءات الرواتب للأدمن
 */
export async function getSalariesStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [totalPaid, pendingThisMonth, paidThisMonth] = await Promise.all([
      db.secretarySalary.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      db.secretarySalary.count({
        where: { status: "PENDING", month: currentMonth, year: currentYear },
      }),
      db.secretarySalary.count({
        where: { status: "PAID", month: currentMonth, year: currentYear },
      }),
    ]);

    return {
      totalPaid: totalPaid._sum.amount || 0,
      pendingThisMonth,
      paidThisMonth,
    };
  } catch (error) {
    throw new Error("فشل جلب إحصاءات الرواتب: " + error.message);
  }
}
