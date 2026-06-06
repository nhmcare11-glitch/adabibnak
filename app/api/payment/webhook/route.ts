// ============================================================
// FILE: app/api/payment/webhook/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@chargily/chargily-pay";
import { db } from "@/lib/prisma";

// قراءة الـ raw body للتحقق من التوقيع
async function getRawBody(req: NextRequest): Promise<Buffer> {
  const reader = req.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  // ── 1. قراءة الـ body والتوقيع ───────────────────────────
  const rawBody = await getRawBody(req);
  const signature = req.headers.get("signature") ?? "";

  if (!signature) {
    console.warn("[webhook] التوقيع مفقود");
    return NextResponse.json({ error: "التوقيع مفقود" }, { status: 400 });
  }

  // ── 2. التحقق من صحة التوقيع ─────────────────────────────
  let isValid: boolean;
  try {
    isValid = verifySignature(
      rawBody,
      signature,
      process.env.CHARGILY_SECRET_KEY!
    );
  } catch (err) {
    console.error("[webhook] خطأ في التحقق:", err);
    return NextResponse.json({ error: "خطأ في التوقيع" }, { status: 403 });
  }

  if (!isValid) {
    console.warn("[webhook] توقيع غير صالح");
    return NextResponse.json({ error: "توقيع غير صالح" }, { status: 403 });
  }

  // ── 3. تحليل البيانات ────────────────────────────────────
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody.toString("utf-8"));
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  const eventType = event.type as string;
  const eventData = event.data as Record<string, unknown>;

  console.log(`[webhook] الحدث المستلم: ${eventType}`);

  // ── 4. معالجة أنواع الأحداث ──────────────────────────────
  try {
    switch (eventType) {
      case "checkout.paid":
        await handleCheckoutPaid(eventData, rawBody);
        break;
      case "checkout.failed":
        await handleCheckoutFailed(eventData);
        break;
      case "checkout.expired":
        await handleCheckoutExpired(eventData);
        break;
      default:
        console.log(`[webhook] حدث غير معالج: ${eventType}`);
    }
  } catch (err) {
    console.error(`[webhook] خطأ في معالجة ${eventType}:`, err);
  }

  // ── 5. الرد دائماً بـ 200 ────────────────────────────────
  return NextResponse.json({ received: true });
}

// ──────────────────────────────────────────────────────────────
// تم الدفع بنجاح
// ──────────────────────────────────────────────────────────────
async function handleCheckoutPaid(
  data: Record<string, unknown>,
  rawPayload: Buffer
) {
  const checkoutId = data.id as string;
  const metadata = (data.metadata as Record<string, string>) ?? {};
  const appointmentId = metadata.appointmentId;

  if (!appointmentId) {
    console.error("[webhook] لا يوجد appointmentId في الـ metadata");
    return;
  }

  await db.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { chargilyCheckoutId: checkoutId },
    });

    if (!payment) {
      console.error(`[webhook] لا يوجد سجل دفع للـ checkoutId: ${checkoutId}`);
      return;
    }

    // تجنب المعالجة المزدوجة
    if (payment.status === "PAID") {
      console.log(`[webhook] مدفوع بالفعل: ${checkoutId}`);
      return;
    }

    // تحديث حالة الدفع
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        approvedMethod: "CHARGILY",
        chargilyWebhookData: JSON.parse(rawPayload.toString("utf-8")),
        paidAt: new Date(),
        paidConfirmedAt: new Date(),
      },
    });

    // تحديث حالة الموعد
    await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "SCHEDULED" },
    });

    console.log(`[webhook] ✅ دفع مؤكد - الموعد: ${appointmentId}`);
  });
}

// ──────────────────────────────────────────────────────────────
// فشل الدفع
// ──────────────────────────────────────────────────────────────
async function handleCheckoutFailed(data: Record<string, unknown>) {
  const checkoutId = data.id as string;

  const payment = await db.payment.findFirst({
    where: { chargilyCheckoutId: checkoutId },
  });

  if (!payment) return;

  await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        chargilyWebhookData: data as never,
      },
    }),
    db.appointment.update({
      where: { id: payment.appointmentId },
      data: { status: "PENDING_PAYMENT" },
    }),
  ]);

  console.log(`[webhook] ❌ فشل الدفع - checkoutId: ${checkoutId}`);
}

// ──────────────────────────────────────────────────────────────
// انتهت صلاحية الـ checkout
// ──────────────────────────────────────────────────────────────
async function handleCheckoutExpired(data: Record<string, unknown>) {
  const checkoutId = data.id as string;

  const payment = await db.payment.findFirst({
    where: { chargilyCheckoutId: checkoutId },
  });

  if (!payment) return;

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "EXPIRED",
      chargilyWebhookData: data as never,
    },
  });

  console.log(`[webhook] ⏰ انتهت الصلاحية - checkoutId: ${checkoutId}`);
}