// ============================================================
// FILE: app/payment/success/page.tsx
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type VerifyState = "loading" | "paid" | "pending" | "failed";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  const [state, setState] = useState<VerifyState>("loading");
  const [attempts, setAttempts] = useState(0);
  const [paymentData, setPaymentData] = useState<{
    paidAt?: string;
    amount?: number;
  } | null>(null);

  useEffect(() => {
    if (!appointmentId) {
      setState("failed");
      return;
    }

    let timeoutId: NodeJS.Timeout;

    async function checkPayment() {
      try {
        const res = await fetch(
          `/api/payment/verify?appointmentId=${appointmentId}`
        );
        const data = await res.json();

        if (data.isPaid) {
          setState("paid");
          setPaymentData({ paidAt: data.paidAt, amount: data.amount });
          return;
        }

        setAttempts((prev) => {
          const next = prev + 1;
          if (next >= 10) {
            setState("pending");
          } else {
            timeoutId = setTimeout(checkPayment, 3000);
          }
          return next;
        });
      } catch {
        setState("failed");
      }
    }

    checkPayment();
    return () => clearTimeout(timeoutId);
  }, [appointmentId]);

  // ── حالة التحميل ─────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <h2 className="text-xl font-semibold text-gray-800">
          جاري التحقق من الدفع...
        </h2>
        <p className="text-gray-500">يرجى الانتظار لحظة</p>
      </div>
    );
  }

  // ── تم الدفع بنجاح ────────────────────────────────────────
  if (state === "paid") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-12 w-12 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-emerald-700">
            تم الدفع بنجاح ✓
          </h1>
          <p className="text-gray-600">
            تم تأكيد دفعتك وسيقوم الطبيب بتأكيد موعدك قريباً
          </p>
          {paymentData?.amount && (
            <p className="text-sm text-gray-500">
              المبلغ المدفوع:{" "}
              <strong className="text-gray-700">
                {paymentData.amount.toLocaleString("ar-DZ")} دج
              </strong>
            </p>
          )}
          {paymentData?.paidAt && (
            <p className="text-sm text-gray-500">
              {new Date(paymentData.paidAt).toLocaleString("ar-DZ")}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Link
            href="/appointments"
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
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
      </div>
    );
  }

  // ── الدفع قيد المعالجة ────────────────────────────────────
  if (state === "pending") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-12 w-12 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-amber-700">
            جاري معالجة الدفع
          </h1>
          <p className="text-gray-600">
            يتم التحقق من دفعتك. ستتلقى إشعاراً عند التأكيد.
          </p>
          <p className="text-sm text-gray-500">
            رقم الموعد:{" "}
            <code className="rounded bg-gray-100 px-1 font-mono text-xs">
              {appointmentId}
            </code>
          </p>
        </div>

        <Link
          href="/appointments"
          className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
        >
          عرض مواعيدي
        </Link>
      </div>
    );
  }

  // ── فشل التحقق ───────────────────────────────────────────
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
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-red-700">
          تعذر التحقق من الدفع
        </h1>
        <p className="text-gray-600">
          إذا تمت عملية الدفع، سيتم تأكيد موعدك تلقائياً خلال دقائق.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/appointments"
          className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          عرض مواعيدي
        </Link>
      </div>
    </div>
  );
}