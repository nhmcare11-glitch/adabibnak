"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { approvePayment, rejectPayment } from "@/actions/payment";
import { getPaymentLabel } from "@/lib/payment-utils";

// ============================================================
// Types
// ============================================================
type MethodKey = "CASH" | "CARD" | "FREE" | "DEFERRED";
type StatusKey = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PAID";

type MethodConfig = {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
};

type Props = {
  payment: any;
  appointmentId: string;
  patientProfile: any;
  onUpdate?: () => void;
};

type ProfileBadgeProps = {
  label: string;
  value: string;
};

// ============================================================
// Config
// ============================================================
const METHOD_CONFIG: Record<MethodKey, MethodConfig> = {
  CASH:     { label: "نقدي",           emoji: "💵", color: "#22c55e", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)"   },
  CARD:     { label: "PayPal / بطاقة", emoji: "💳", color: "#4c82fa", bg: "rgba(76,130,250,0.12)",  border: "rgba(76,130,250,0.3)"  },
  FREE:     { label: "مجاني",          emoji: "🆓", color: "#a855f7", bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.3)"  },
  DEFERRED: { label: "مؤجل",           emoji: "⏳", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)"  },
};

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string }> = {
  PENDING_APPROVAL: { label: "انتظار الموافقة", color: "#f59e0b" },
  APPROVED:         { label: "موافق عليه",      color: "#22c55e" },
  REJECTED:         { label: "مرفوض",           color: "#ef4444" },
  PAID:             { label: "تم الدفع",        color: "#4c82fa" },
};

// ============================================================
// Component
// ============================================================
export default function PaymentSuggestion({ payment, appointmentId, patientProfile, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [overrideMethod, setOverrideMethod] = useState<MethodKey | "">("");
  const [amount, setAmount] = useState("");

  if (!patientProfile) {
    return (
      <div style={cardStyle("#f59e0b")}>
        <span style={{ fontSize: "1.1rem" }}>⚠️</span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>
          المريض لم يكمل ملفه الشخصي بعد
        </span>
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={cardStyle("#f59e0b")}>
        <Clock size={14} color="#f59e0b" />
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>
          لم يُقترح دفع لهذا الموعد بعد
        </span>
      </div>
    );
  }

  const suggested = METHOD_CONFIG[payment.suggestedMethod as MethodKey];
  const status = STATUS_CONFIG[payment.status as StatusKey];
  const currentMethod = (overrideMethod || payment.suggestedMethod) as MethodKey;

  async function handleApprove() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("paymentId", payment.id);
      fd.append("approvedMethod", overrideMethod || payment.suggestedMethod);
      if (amount) fd.append("amount", amount);
      await approvePayment(fd);
      onUpdate?.();
    } catch (e: any) {
      alert("خطأ: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("paymentId", payment.id);
      fd.append("notes", rejectNotes);
      await rejectPayment(fd);
      onUpdate?.();
    } catch (e: any) {
      alert("خطأ: " + e.message);
    } finally {
      setLoading(false);
      setShowRejectForm(false);
    }
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "14px",
      padding: "14px",
      marginTop: "8px",
      direction: "rtl",
    }}>

      {/* ملف المريض */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
        <ProfileBadge label="الدخل"      value={incomeLabel(patientProfile.incomeLevel)} />
        <ProfileBadge label="مرض مزمن"  value={patientProfile.hasChronicDisease ? "نعم" : "لا"} />
        <ProfileBadge label="تأمين"      value={patientProfile.hasInsurance ? "نعم" : "لا"} />
        <ProfileBadge label="استعجالي"   value={patientProfile.isEmergency ? "نعم" : "لا"} />
      </div>

      {/* اقتراح النظام */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: suggested.bg,
        border: `1px solid ${suggested.border}`,
        borderRadius: "10px",
        padding: "10px 12px",
        marginBottom: "10px",
      }}>
        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>اقتراح النظام</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "1rem" }}>{suggested.emoji}</span>
          <span style={{ color: suggested.color, fontWeight: 700, fontSize: "0.9rem" }}>
            {suggested.label}
          </span>
        </div>
      </div>

      {/* الحالة */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>الحالة:</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: status.color }}>{status.label}</span>
      </div>

      {/* أزرار الموافقة */}
      {payment.status === "PENDING_APPROVAL" && (
        <>
          {/* تغيير الطريقة */}
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>
              تغيير الطريقة (اختياري)
            </label>
            <select
              value={overrideMethod}
              onChange={e => setOverrideMethod(e.target.value as MethodKey | "")}
              style={selectStyle}
            >
              <option value="">الاقتراح الافتراضي ({suggested.label})</option>
              {(Object.entries(METHOD_CONFIG) as [MethodKey, MethodConfig][]).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
              ))}
            </select>
          </div>

          {/* المبلغ */}
          {currentMethod !== "FREE" && (
            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>
                المبلغ (دج) — اختياري
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="مثال: 2000"
                style={inputStyle}
              />
            </div>
          )}

          {!showRejectForm ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleApprove} disabled={loading} style={btnStyle("#22c55e", "rgba(34,197,94,0.15)")}>
                <CheckCircle size={14} /> موافقة
              </button>
              <button onClick={() => setShowRejectForm(true)} style={btnStyle("#ef4444", "rgba(239,68,68,0.1)")}>
                <XCircle size={14} /> رفض
              </button>
            </div>
          ) : (
            <div style={{ marginTop: "6px" }}>
              <textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                placeholder="سبب الرفض (اختياري)..."
                rows={2}
                style={{ ...inputStyle, resize: "none" as const }}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button onClick={handleReject} disabled={loading} style={btnStyle("#ef4444", "rgba(239,68,68,0.15)")}>
                  تأكيد الرفض
                </button>
                <button onClick={() => setShowRejectForm(false)} style={btnStyle("#666", "rgba(255,255,255,0.05)")}>
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* عرض الموافقة النهائية */}
      {payment.status === "APPROVED" && payment.approvedMethod && (
        <div style={{
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "0.82rem",
          color: "#22c55e",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <CheckCircle size={13} />
          تمت الموافقة: {METHOD_CONFIG[payment.approvedMethod as MethodKey]?.emoji}{" "}
          {METHOD_CONFIG[payment.approvedMethod as MethodKey]?.label}
          {payment.amount ? ` — ${payment.amount} دج` : ""}
          {payment.adminCommission > 0 ? ` (عمولة الأدمن: ${payment.adminCommission.toFixed(0)} دج)` : ""}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-components & helpers
// ============================================================
function ProfileBadge({ label, value }: ProfileBadgeProps) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "6px",
      padding: "3px 8px",
      fontSize: "0.72rem",
      color: "rgba(255,255,255,0.6)",
      display: "flex", gap: "4px",
    }}>
      <span style={{ color: "rgba(255,255,255,0.35)" }}>{label}:</span>
      <span style={{ color: "white", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function incomeLabel(level: string): string {
  const map: Record<string, string> = { LOW: "منخفض", MEDIUM: "متوسط", HIGH: "مرتفع" };
  return map[level] || level;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function cardStyle(color: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 12px",
    background: `rgba(${hexToRgb(color)},0.06)`,
    border: `1px solid rgba(${hexToRgb(color)},0.2)`,
    borderRadius: "10px",
    marginTop: "6px",
  };
}

function btnStyle(color: string, bg: string): React.CSSProperties {
  return {
    flex: 1,
    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
    padding: "7px 0",
    borderRadius: "8px",
    background: bg,
    border: `1px solid ${color}40`,
    color,
    fontWeight: 600,
    fontSize: "0.82rem",
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "white",
  padding: "6px 10px",
  fontSize: "0.8rem",
  outline: "none",
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "white",
  padding: "6px 10px",
  fontSize: "0.8rem",
  outline: "none",
  boxSizing: "border-box",
};