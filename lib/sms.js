"use server";

import { Vonage } from "@vonage/server-sdk";

// ============================================================
// Vonage Client
// ============================================================
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

const SENDER_NAME = process.env.VONAGE_SENDER_NAME || "AdaBibnak";

// ============================================================
// sendSMS — الدالة الرئيسية
// @param {string} to   - رقم الهاتف بصيغة دولية مثل: 213xxxxxxxxx
// @param {string} text - نص الرسالة
// ============================================================
export async function sendSMS(to, text) {
  // إذا SMS معطل من البيئة — لا نرسل ولا نرمي error
  if (process.env.SMS_ENABLED !== "true") {
    console.log(`[SMS DISABLED] To: ${to} | Msg: ${text}`);
    return { success: true };
  }

  // تنظيف الرقم — نشيل المسافات والـ +
  const cleaned = to.replace(/\s+/g, "").replace(/^\+/, "");

  if (!cleaned || cleaned.length < 8) {
    console.warn(`[SMS] رقم غير صالح: ${to}`);
    return { success: false, error: "رقم الهاتف غير صالح" };
  }

  try {
    const response = await vonage.sms.send({
      to: cleaned,
      from: SENDER_NAME,
      text,
    });

    const status = response.messages?.[0]?.status;

    if (status === "0") {
      console.log(`[SMS] ✅ أُرسلت بنجاح إلى ${cleaned}`);
      return { success: true };
    } else {
      const errText = response.messages?.[0]?.["error-text"] || "خطأ غير معروف";
      console.error(`[SMS] ❌ فشل الإرسال: ${errText}`);
      return { success: false, error: errText };
    }
  } catch (err) {
    const message = err?.message || "استثناء غير متوقع";
    console.error(`[SMS] ❌ استثناء:`, message);
    return { success: false, error: message };
  }
}

// ============================================================
// sendBulkSMS — إرسال لعدة أرقام دفعة واحدة
// @param {{ to: string, text: string }[]} recipients
// ============================================================
export async function sendBulkSMS(recipients) {
  await Promise.allSettled(
    recipients.map(({ to, text }) => sendSMS(to, text))
  );
}