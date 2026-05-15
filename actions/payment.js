"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getPaymentLabel } from "@/lib/payment-utils";

// ============================================================
// منطق اقتراح طريقة الدفع
// ============================================================
function suggestPaymentMethod({ incomeLevel, hasInsurance, hasChronicDisease, isEmergency }) {
  if (isEmergency) return "DEFERRED";
  if (hasInsurance) return "CARD";
  if (incomeLevel === "LOW" && !hasInsurance && hasChronicDisease) return "FREE";
  if (incomeLevel === "LOW" && !hasInsurance) return "DEFERRED";
  return "CASH";
}

// ============================================================
// حفظ ملف المريض + إنشاء اقتراح الدفع
// ============================================================
export async function savePatientProfileAndSuggestPayment(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const incomeLevel = formData.get("incomeLevel");
  const hasInsurance = formData.get("hasInsurance") === "true";
  const hasChronicDisease = formData.get("hasChronicDisease") === "true";
  const isEmergency = formData.get("isEmergency") === "true";
  const appointmentId = formData.get("appointmentId");

  try {
    const patient = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!patient) throw new Error("المريض غير موجود");

    await db.patientProfile.upsert({
      where: { userId: patient.id },
      update: { incomeLevel, hasInsurance, hasChronicDisease, isEmergency },
      create: { userId: patient.id, incomeLevel, hasInsurance, hasChronicDisease, isEmergency },
    });

    if (appointmentId) {
      const suggested = suggestPaymentMethod({ incomeLevel, hasInsurance, hasChronicDisease, isEmergency });

      await db.payment.upsert({
        where: { appointmentId },
        update: {
          suggestedMethod: suggested,
          status: "PENDING_APPROVAL",
          approvedMethod: null,
          approvedById: null,
          approvedAt: null,
          paypalOrderId: null,
          paypalStatus: null,
          paidAt: null,
        },
        create: {
          appointmentId,
          suggestedMethod: suggested,
          status: "PENDING_APPROVAL",
        },
      });

      const appointment = await db.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true, patient: true },
      });

      if (appointment) {
        await db.notification.create({
          data: {
            userId: appointment.doctorId,
            type: "PAYMENT_SUGGESTION",
            title: "💡 اقتراح دفع جديد",
            message: `النظام يقترح: ${getPaymentLabel(suggested)} للمريض ${patient.name}`,
            link: `/doctor`,
            metadata: { appointmentId, suggestedMethod: suggested },
          },
        });
      }
    }

    revalidatePath("/patient-dashboard");
    revalidatePath("/doctor");
    return { success: true };
  } catch (error) {
    throw new Error("فشل حفظ البيانات: " + error.message);
  }
}

// ============================================================
// موافقة على الدفع (طبيب أو أدمن)
// ============================================================
export async function approvePayment(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const paymentId = formData.get("paymentId");
  const approvedMethod = formData.get("approvedMethod");
  const amount = formData.get("amount") ? parseFloat(formData.get("amount")) : null;

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user || !["DOCTOR", "ADMIN"].includes(user.role)) throw new Error("غير مصرح لك");

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { appointment: { include: { patient: true, doctor: true } } },
    });
    if (!payment) throw new Error("الدفع غير موجود");

    // حساب العمولة: الشهر الأول مجاني، بعده 10%
    const oneMonthAfterJoin = new Date(payment.appointment.doctor.createdAt);
    oneMonthAfterJoin.setMonth(oneMonthAfterJoin.getMonth() + 1);
    const isAfterFirstMonth = new Date() > oneMonthAfterJoin;
    const commission = isAfterFirstMonth && amount ? amount * 0.1 : 0;

    const finalMethod = approvedMethod || payment.suggestedMethod;

    await db.payment.update({
      where: { id: paymentId },
      data: {
        approvedMethod: finalMethod,
        status: finalMethod === "FREE" ? "PAID" : "APPROVED",
        approvedById: user.id,
        approvedAt: new Date(),
        amount: finalMethod === "FREE" ? 0 : amount,
        adminCommission: finalMethod === "FREE" ? 0 : commission,
        // إذا كانت مجانية تُعتبر مدفوعة فوراً
        paidAt: finalMethod === "FREE" ? new Date() : null,
      },
    });

    await db.notification.create({
      data: {
        userId: payment.appointment.patientId,
        type: "PAYMENT_APPROVED",
        title: "✅ تمت الموافقة على طريقة الدفع",
        message: `طريقة الدفع: ${getPaymentLabel(finalMethod)}${amount && finalMethod !== "FREE" ? ` - المبلغ: $${amount}` : ""}`,
        link: `/patient-dashboard`,
        metadata: { paymentId, approvedMethod: finalMethod },
      },
    });

    revalidatePath("/doctor");
    revalidatePath("/admin");
    revalidatePath("/patient-dashboard");
    return { success: true, commission, approvedMethod: finalMethod };
  } catch (error) {
    throw new Error("فشل الموافقة: " + error.message);
  }
}

// ============================================================
// رفض الدفع
// ============================================================
export async function rejectPayment(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const paymentId = formData.get("paymentId");
  const notes = formData.get("notes") || "";

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user || !["DOCTOR", "ADMIN"].includes(user.role)) throw new Error("غير مصرح لك");

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { appointment: true },
    });
    if (!payment) throw new Error("الدفع غير موجود");

    await db.payment.update({
      where: { id: paymentId },
      data: { status: "REJECTED", approvedById: user.id, notes },
    });

    await db.notification.create({
      data: {
        userId: payment.appointment.patientId,
        type: "PAYMENT_REJECTED",
        title: "❌ تم رفض اقتراح الدفع",
        message: notes || "يرجى مراجعة الطبيب لتحديد طريقة الدفع",
        link: `/patient-dashboard`,
        metadata: { paymentId },
      },
    });

    revalidatePath("/doctor");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    throw new Error("فشل الرفض: " + error.message);
  }
}

// ============================================================
// جلب بيانات دفع موعد معين
// ============================================================
export async function getAppointmentPayment(appointmentId) {
  try {
    const payment = await db.payment.findUnique({
      where: { appointmentId },
      include: { approvedBy: { select: { name: true, role: true } } },
    });
    return { payment };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================
// جلب مواعيد الطبيب مع بيانات الدفع
// ============================================================
export async function getDoctorAppointmentsWithPayments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    
    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("الطبيب غير موجود");
    }

    const appointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: { in: ["SCHEDULED", "COMPLETED", "ONGOING"] },
      },
      include: {
        patient: { 
          include: { 
            patientProfile: true 
          } 
        },
        payment: { 
          include: { 
            approvedBy: { 
              select: { name: true } 
            } 
          } 
        },
        prescription: true,
      },
      orderBy: { startTime: "asc" },
    });

    return { appointments };
  } catch (error) {
    throw new Error("فشل جلب المواعيد: " + error.message);
  }
}

// ============================================================
// جلب ملف المريض
// ============================================================
export async function getPatientProfile() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { patientProfile: true },
    });
    return { profile: user?.patientProfile || null };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================
// جلب مواعيد المريض مع بيانات الدفع
// ============================================================
export async function getPatientAppointmentsWithPayments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const patient = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    
    if (!patient || patient.role !== "PATIENT") {
      throw new Error("المريض غير موجود");
    }

    const appointments = await db.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: { select: { name: true, specialty: true, imageUrl: true } },
        payment: { include: { approvedBy: { select: { name: true, role: true } } } },
      },
      orderBy: { startTime: "desc" },
    });

    return { appointments };
  } catch (error) {
    throw new Error("فشل جلب المواعيد: " + error.message);
  }
}