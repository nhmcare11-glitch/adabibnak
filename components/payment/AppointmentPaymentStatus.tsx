// ============================================================
// FILE: components/payment/AppointmentPaymentStatus.tsx
// ============================================================
"use client";

import { useEffect, useState } from "react";

interface PaymentInfo {
  canConfirm: boolean;
  paymentStatus: string | null;
  appointmentStatus: string;
  paidAt: string | null;
  amount: number | null;
}

interface Props {
  appointmentId: string;
  onConfirm?: () => void;
}

export function AppointmentPaymentStatus({ appointmentId, onConfirm }: Props) {
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch(`/api/payment/verify?appointmentId=${appointmentId}`)
      .then((r) => r.json())
      .then((data) =>
        setInfo({
          canConfirm: data.isPaid,
          paymentStatus: data.paymentStatus,
          appointmentStatus: data.appointmentStatus,
          paidAt: data.paidAt,
          amount: data.amount,
        })
      )
      .catch(console.error);
  }, [appointmentId]);

  async function handleConfirm() {
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await fetch(
        `/api/appointments/${appointmentId}/confirm`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        setConfirmed(true);
        onConfirm?.();
      } else {
        setConfirmError(data.error ?? "فشل التأكيد");
      }
    } catch {
      setConfirmError("خطأ في الاتصال");
    } finally {
      setConfirming(false);
    }
  }

  if (!info) {
    return (
      <div className="text-sm text-gray-500 animate-pulse">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      {/* حالة الدفع */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">حالة الدفع:</span>
        <PaymentBadge status={info.paymentStatus} />
      </div>

      {info.paidAt && (
        <p className="text-xs text-gray-500">
          تاريخ الدفع: {new Date(info.paidAt).toLocaleString("ar-DZ")}
          {info.amount && ` • ${info.amount.toLocaleString("ar-DZ")} دج`}
        </p>
      )}

      {/* زر التأكيد — يظهر فقط إذا تم الدفع */}
      {info.canConfirm && !confirmed && (
        <div>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {confirming ? "جاري التأكيد..." : "تأكيد الموعد ✓"}
          </button>
          {confirmError && (
            <p className="mt-1 text-xs text-red-600">{confirmError}</p>
          )}
        </div>
      )}

      {/* تحذير إذا لم يتم الدفع */}
      {!info.canConfirm && !confirmed && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
          <p className="text-sm text-amber-800">
            ⚠️ لا يمكن تأكيد الموعد — لم يتم استلام الدفع بعد
          </p>
        </div>
      )}

      {/* تم التأكيد */}
      {confirmed && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-sm text-emerald-800">✅ تم تأكيد الموعد بنجاح</p>
        </div>
      )}
    </div>
  );
}

function PaymentBadge({ status }: { status: string | null }) {
  const config: Record<string, { label: string; className: string }> = {
    PAID:            { label: "مدفوع",      className: "bg-emerald-100 text-emerald-800" },
    PENDING_APPROVAL:{ label: "في الانتظار", className: "bg-amber-100 text-amber-800" },
    FAILED:          { label: "فشل",        className: "bg-red-100 text-red-800" },
    EXPIRED:         { label: "منتهي",      className: "bg-gray-100 text-gray-700" },
    APPROVED:        { label: "موافق عليه", className: "bg-blue-100 text-blue-800" },
    REJECTED:        { label: "مرفوض",      className: "bg-red-100 text-red-800" },
  };

  const { label, className } = config[status ?? ""] ?? {
    label: "غير مدفوع",
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}