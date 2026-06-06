// ============================================================
// FILE: app/api/payment/paypal-checkout/route.ts
// هذا الـ route يستقبل طلب PayPal من الكليينت
// ويستدعي createPayPalOrder من actions/paypal.js
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder } from "@/actions/paypal";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await createPayPalOrder(formData);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "فشل إنشاء طلب PayPal" },
      { status: 500 }
    );
  }
}