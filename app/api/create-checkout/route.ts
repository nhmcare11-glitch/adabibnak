// ============================================================
// FILE: app/api/payment/create-checkout/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { createConsultationCheckout } from "@/lib/chargily";

export async function POST(req: NextRequest) {
  try {
    // ── 1. التحقق من تسجيل الدخول عبر Clerk ──────────────
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { appointmentId } = body;

    if (!appointmentId || typeof appointmentId !== "string") {
      return NextResponse.json(
        { error: "appointmentId مطلوب" },
        { status: 400 }
      );
    }

    // ── 2. جلب المستخدم من قاعدة البيانات ────────────────
    const currentUser = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // ── 3. جلب الموعد مع بيانات الطبيب والمريض ───────────
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        payment: true,
        doctor: true,
        patient: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "الموعد غير موجود" },
        { status: 404 }
      );
    }

    // ── 4. التأكد أن المريض هو من يدفع ───────────────────
    if (appointment.patientId !== currentUser.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    // ── 5. إذا كان مدفوعاً بالفعل ────────────────────────
    if (appointment.payment?.status === "PAID") {
      return NextResponse.json(
        { error: "هذا الموعد مدفوع بالفعل" },
        { status: 400 }
      );
    }

    // ── 6. إذا كان هناك checkout معلق لا يزال صالحاً ─────
    if (
      appointment.payment?.status === "PENDING_APPROVAL" &&
      appointment.payment.chargilyCheckoutId
    ) {
      try {
        const { chargilyClient } = await import("@/lib/chargily");
        const existing = await chargilyClient.getCheckout(
          appointment.payment.chargilyCheckoutId
        );
        if (
          existing.status === "pending" ||
          existing.status === "processing"
        ) {
          return NextResponse.json({
            checkoutUrl: existing.checkout_url,
            checkoutId: existing.id,
            reused: true,
          });
        }
      } catch {
        // إنشاء checkout جديد إذا فشل الجلب
      }
    }

    // ── 7. تحديد المبلغ ───────────────────────────────────
    const amount = appointment.payment?.amount ?? 2000; // دج

    // ── 8. إنشاء checkout في Chargily ────────────────────
    const { checkoutId, checkoutUrl } = await createConsultationCheckout({
      appointmentId,
      doctorName: appointment.doctor.name ?? "الطبيب",
      specialty: appointment.doctor.specialty ?? "طب عام",
      amount,
      patientName: appointment.patient.name ?? "المريض",
      patientEmail: appointment.patient.email,
      locale: "ar",
    });

    // ── 9. حفظ أو تحديث سجل الدفع في قاعدة البيانات ─────
    await db.payment.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        suggestedMethod: "CHARGILY",
        approvedMethod: "CHARGILY",
        status: "PENDING_APPROVAL",
        amount,
        chargilyCheckoutId: checkoutId,
      },
      update: {
        chargilyCheckoutId: checkoutId,
        status: "PENDING_APPROVAL",
        updatedAt: new Date(),
      },
    });

    // ── 10. تحديث حالة الموعد ────────────────────────────
    await db.appointment.update({
      where: { id: appointmentId },
      data: { status: "PENDING_PAYMENT" },
    });

    return NextResponse.json({ checkoutUrl, checkoutId });
  } catch (err) {
    console.error("[create-checkout] خطأ:", err);
    return NextResponse.json(
      { error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}