// ============================================================
// FILE: lib/chargily.ts
// PURPOSE: Chargily Pay V2 client — SERVER SIDE ONLY
// ============================================================
import { ChargilyClient } from "@chargily/chargily-pay";

if (!process.env.CHARGILY_SECRET_KEY) {
  throw new Error("[Chargily] CHARGILY_SECRET_KEY غير موجود في متغيرات البيئة");
}

const mode = (process.env.CHARGILY_MODE as "test" | "live") ?? "test";

export const chargilyClient = new ChargilyClient({
  api_key: process.env.CHARGILY_SECRET_KEY,
  mode,
});

// ============================================================
// الخيارات المطلوبة لإنشاء checkout استشارة طبية
// ============================================================
export interface ConsultationCheckoutOptions {
  appointmentId: string;
  doctorName: string;
  specialty: string;
  amount: number;       // بالدينار الجزائري DZD
  patientName: string;
  patientEmail: string;
  locale?: "ar" | "fr" | "en";
}

// ============================================================
// دالة إنشاء checkout لاستشارة طبية
// ============================================================
export async function createConsultationCheckout(
  opts: ConsultationCheckoutOptions
) {
  const {
    appointmentId,
    doctorName,
    specialty,
    amount,
    patientName,
    patientEmail,
    locale = "ar",
  } = opts;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_APP_URL غير موجود في متغيرات البيئة");

  // 1. إنشاء المريض كعميل في Chargily
  const customer = await chargilyClient.createCustomer({
    name: patientName,
    email: patientEmail,
    metadata: { appointmentId },
  });

  // 2. إنشاء منتج يمثل الاستشارة
  const product = await chargilyClient.createProduct({
    name: `استشارة طبية - د. ${doctorName}`,
    description: `التخصص: ${specialty}`,
    metadata: { appointmentId, doctorName, specialty },
  });

  // 3. إنشاء سعر للمنتج
  const price = await chargilyClient.createPrice({
    amount: amount * 100, // Chargily تستخدم أصغر وحدة (سنتيم)
    currency: "dzd",
    product_id: product.id,
    metadata: { appointmentId },
  });

  // 4. إنشاء جلسة الدفع
  const checkout = await chargilyClient.createCheckout({
    items: [{ price: price.id, quantity: 1 }],
    customer_id: customer.id,
    success_url: `${baseUrl}/payment/success?appointmentId=${appointmentId}`,
    failure_url: `${baseUrl}/payment/failed?appointmentId=${appointmentId}`,
    payment_method: "edahabia",
    locale,
    pass_fees_to_customer: false,
    metadata: {
      appointmentId,
      doctorName,
      patientName,
      type: "consultation",
    },
  });

  return {
    checkoutId: checkout.id,
    checkoutUrl: checkout.checkout_url,
  };
}