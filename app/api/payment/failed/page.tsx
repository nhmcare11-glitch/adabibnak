// ============================================================
// FILE: app/payment/failed/page.tsx
// ============================================================
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const [loading, setLoading] = useState(false);

  async function handleRetry() {
    if (!appointmentId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
        <svg
          className="h-12 w-12 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-red-700">فشلت عملية الدفع</h1>
        <p className="text-gray-600">
          لم يتم خصم أي مبلغ من حسابك. يمكنك المحاولة مرة أخرى.
        </p>
        {appointmentId && (
          <p className="text-sm text-gray-500">
            رقم الموعد:{" "}
            <code className="rounded bg-gray-100 px-1 font-mono text-xs">
              {appointmentId}
            </code>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {appointmentId && (
          <button
            onClick={handleRetry}
            disabled={loading}
            className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "جاري التحضير..." : "إعادة المحاولة"}
          </button>
        )}
        <Link
          href="/appointments"
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          عرض مواعيدي
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          الصفحة الرئيسية
        </Link>
      </div>

      <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600 max-w-sm">
        <p className="font-medium mb-2">أسباب محتملة لفشل الدفع:</p>
        <ul className="list-inside list-disc text-right space-y-1">
          <li>رصيد غير كافٍ في الحساب</li>
          <li>معلومات البطاقة غير صحيحة</li>
          <li>انتهت مدة الجلسة</li>
          <li>رفض البنك للمعاملة</li>
        </ul>
      </div>
    </div>
  );
}