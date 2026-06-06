// ============================================================
// FILE: components/payment/PayButton.tsx
// ============================================================
"use client";

import { useState } from "react";

interface PayButtonProps {
  appointmentId: string;
  amount: number;
  className?: string;
  children?: React.ReactNode;
}

export function PayButton({
  appointmentId,
  amount,
  className,
  children,
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ أثناء إنشاء الدفع");
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("تعذر الاتصال بخادم الدفع. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className={className}
        aria-busy={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            جاري التحضير...
          </span>
        ) : (
          children ?? `ادفع الآن • ${amount.toLocaleString("ar-DZ")} دج`
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}