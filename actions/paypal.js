"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ============================================================
// الحصول على PayPal Access Token
// ============================================================
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayPal auth error: ${error.error_description}`);
  }

  const data = await response.json();
  return data.access_token;
}

// ============================================================
// إنشاء طلب دفع PayPal
// ============================================================
export async function createPayPalOrder(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const paymentId = formData.get("paymentId");
  const amount = parseFloat(formData.get("amount"));

  if (!paymentId || !amount || isNaN(amount) || amount <= 0) {
    throw new Error("معرّف الدفع والمبلغ مطلوبان");
  }

  try {
    const patient = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!patient) throw new Error("المستخدم غير موجود");

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { appointment: { include: { doctor: true } } },
    });
    if (!payment) throw new Error("الدفع غير موجود");
    if (payment.status !== "APPROVED") throw new Error("يجب الموافقة على الدفع أولاً");
    if (payment.approvedMethod !== "CARD") throw new Error("طريقة الدفع ليست بطاقة");

    const baseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
    const accessToken = await getPayPalAccessToken();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: paymentId,
            description: `استشارة طبية - دكتور ${payment.appointment.doctor.name}`,
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "Adabibnak",
          locale: "ar-AR",
          landing_page: "BILLING",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: `${appUrl}/patient-dashboard?payment=success&paymentId=${paymentId}`,
          cancel_url: `${appUrl}/patient-dashboard?payment=cancelled`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json();
      throw new Error(`PayPal order error: ${JSON.stringify(error)}`);
    }

    const order = await orderResponse.json();

    // حفظ معرّف الطلب في قاعدة البيانات
    await db.payment.update({
      where: { id: paymentId },
      data: {
        paypalOrderId: order.id,
        paypalStatus: "CREATED",
        amount,
      },
    });

    // رابط الموافقة للمريض
    const approvalUrl = order.links.find((l) => l.rel === "approve")?.href;
    if (!approvalUrl) throw new Error("لم يتم الحصول على رابط PayPal");

    return { success: true, orderId: order.id, approvalUrl };
  } catch (error) {
    throw new Error("فشل إنشاء طلب PayPal: " + error.message);
  }
}

// ============================================================
// تأكيد الدفع بعد عودة المريض من PayPal
// ============================================================
export async function capturePayPalOrder(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const orderId = formData.get("orderId");
  const paymentId = formData.get("paymentId");

  if (!orderId || !paymentId) throw new Error("معلومات الطلب مطلوبة");

  try {
    const baseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
    const accessToken = await getPayPalAccessToken();

    const captureResponse = await fetch(
      `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!captureResponse.ok) {
      const error = await captureResponse.json();
      throw new Error(`PayPal capture error: ${JSON.stringify(error)}`);
    }

    const capture = await captureResponse.json();
    const captureStatus = capture.status; // COMPLETED | VOIDED | ...

    if (captureStatus !== "COMPLETED") {
      throw new Error(`الدفع لم يكتمل. الحالة: ${captureStatus}`);
    }

    // تحديث قاعدة البيانات
    const payment = await db.payment.update({
      where: { id: paymentId },
      data: {
        paypalStatus: "COMPLETED",
        status: "PAID",
        paidAt: new Date(),
      },
      include: {
        appointment: {
          include: { doctor: true, patient: true },
        },
      },
    });

    // إشعار للطبيب
    await db.notification.create({
      data: {
        userId: payment.appointment.doctorId,
        type: "PAYMENT_COMPLETED",
        title: "💳 تم استلام الدفع",
        message: `أتم المريض ${payment.appointment.patient.name} الدفع عبر PayPal`,
        link: "/doctor",
        metadata: { paymentId, orderId },
      },
    });

    // إشعار للأدمن - العمولة
    const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
    if (admin && payment.adminCommission && payment.adminCommission > 0) {
      await db.notification.create({
        data: {
          userId: admin.id,
          type: "COMMISSION_EARNED",
          title: "💰 عمولة جديدة",
          message: `عمولة بقيمة $${payment.adminCommission?.toFixed(2)} من موعد الدكتور ${payment.appointment.doctor.name}`,
          link: "/admin",
          metadata: { paymentId, commission: payment.adminCommission },
        },
      });
    }

    revalidatePath("/patient-dashboard");
    revalidatePath("/doctor");
    revalidatePath("/admin");

    return { success: true, status: captureStatus };
  } catch (error) {
    // تسجيل الفشل
    await db.payment.update({
      where: { id: paymentId },
      data: { paypalStatus: "FAILED" },
    });
    throw new Error("فشل تأكيد الدفع: " + error.message);
  }
}

// ============================================================
// جلب حالة طلب PayPal
// ============================================================
export async function getPayPalOrderStatus(orderId) {
  try {
    const baseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error("فشل جلب حالة الطلب");

    const order = await response.json();
    return { success: true, status: order.status, order };
  } catch (error) {
    return { success: false, error: error.message };
  }
}