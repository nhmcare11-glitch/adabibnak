// ============================================================
// FILE: components/payment/PayButton.tsx
// ============================================================
"use client";

import { useState } from "react";

interface PayButtonProps {
  appointmentId: string;
  paymentId: string;
  amount: number;
  className?: string;
}

type Gateway = "chargily" | "paypal";

export function PayButton({ appointmentId, paymentId, amount, className }: PayButtonProps) {
  const [loading, setLoading] = useState<Gateway | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Chargily (EDAHABIA / CIB) ──
  async function handleChargily() {
    setLoading("chargily");
    setError(null);
    try {
      const res = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "فشل إنشاء رابط Chargily"); return; }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("تعذر الاتصال بخادم الدفع.");
    } finally {
      setLoading(null);
    }
  }

  // ── PayPal ──
  async function handlePayPal() {
    setLoading("paypal");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("paymentId", paymentId);
      formData.append("amount", String(amount));

      const res = await fetch("/api/payment/paypal-checkout", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.approvalUrl) { setError(data.error ?? "فشل إنشاء رابط PayPal"); return; }
      window.location.href = data.approvalUrl;
    } catch {
      setError("تعذر الاتصال بخادم الدفع.");
    } finally {
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-center text-gray-500 font-medium">اختر طريقة الدفع</p>

      {/* ── زر Chargily ── */}
      <button
        onClick={handleChargily}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 font-bold text-white transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
      >
        {loading === "chargily" ? (
          <Spinner />
        ) : (
          <>
            <ChargilyIcon />
            <span>ادفع بـ EDAHABIA / CIB</span>
            <span className="mr-auto text-xs opacity-80 font-normal">Chargily Pay</span>
          </>
        )}
      </button>

      {/* ── زر PayPal ── */}
      <button
        onClick={handlePayPal}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 font-bold text-white transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #0070ba, #003087)" }}
      >
        {loading === "paypal" ? (
          <Spinner />
        ) : (
          <>
            <PayPalIcon />
            <span>ادفع بـ PayPal</span>
            <span className="mr-auto text-xs opacity-80 font-normal">دولي</span>
          </>
        )}
      </button>

      {/* المبلغ */}
      <p className="text-center text-xs text-gray-400">
        المبلغ الإجمالي:{" "}
        <span className="font-bold text-gray-700">
          {amount.toLocaleString("ar-DZ")} دج
        </span>
      </p>

      {/* خطأ */}
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 text-center">
          {error}
        </p>
      )}
    </div>
  );
}

// ── أيقونات ──
function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ChargilyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.2" />
      <path d="M8 12h8M12 8l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PayPalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.771.771 0 0 1 .761-.646h6.964c2.463 0 4.238.683 5.277 2.028.488.625.8 1.29.93 1.98.135.72.09 1.56-.138 2.508l-.006.03c-.738 3.106-3.11 4.68-6.952 4.68H9.47a.77.77 0 0 0-.76.645l-.85 5.33a.641.641 0 0 1-.633.54l-.151.022z" />
    </svg>
  );
}