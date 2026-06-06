// ============================================================
// FILE: app/api/payment/verify/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // ── 1. التحقق من تسجيل الدخول ────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const appointmentId = searchParams.get("appointmentId");

  if (!appointmentId) {
    return NextResponse.json(
      { error: "appointmentId مطلوب" },
      { status: 400 }
    );
  }

  // ── 2. جلب المستخدم الحالي ───────────────────────────────
  const currentUser = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!currentUser) {
    return NextResponse.json(
      { error: "المستخدم غير موجود" },
      { status: 404 }
    );
  }

  // ── 3. جلب سجل الدفع مع الموعد ──────────────────────────
  const payment = await db.payment.findUnique({
    where: { appointmentId },
    include: {
      appointment: {
        select: {
          id: true,
          status: true,
          patientId: true,
          doctorId: true,
          startTime: true,
        },
      },
    },
  });

  if (!payment) {
    return NextResponse.json(
      { error: "سجل الدفع غير موجود" },
      { status: 404 }
    );
  }

  // ── 4. التأكد أن المريض هو صاحب الموعد ──────────────────
  if (payment.appointment.patientId !== currentUser.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  // ── 5. إرجاع حالة الدفع من قاعدة البيانات ───────────────
  return NextResponse.json({
    isPaid: payment.status === "PAID",
    paymentStatus: payment.status,
    appointmentStatus: payment.appointment.status,
    amount: payment.amount,
    currency: "dzd",
    paidAt: payment.paidAt,
    paidConfirmedAt: payment.paidConfirmedAt,
  });
}