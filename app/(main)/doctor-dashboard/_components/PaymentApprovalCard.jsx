"use client";

import { useState, useTransition } from "react";
import { approvePayment, rejectPayment } from "@/actions/payment";
import { getPaymentLabel } from "@/lib/payment-utils";

const PAYMENT_METHODS = [
  { value: "CASH", label: "💵 نقدي" },
  { value: "CARD", label: "💳 PayPal / بطاقة" },
  { value: "FREE", label: "🆓 مجاني" },
  { value: "DEFERRED", label: "⏳ مؤجل" },
];

const STATUS_CONFIG = {
  PENDING_APPROVAL: { label: "⏳ بانتظار موافقتك", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  APPROVED:         { label: "✅ تمت الموافقة",     color: "#22c55e", bg: "rgba(34,197,94,0.1)"  },
  REJECTED:         { label: "❌ مرفوض",            color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
  PAID:             { label: "💰 مدفوع",            color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
};

// ============================================================
// مكوّن موافقة الطبيب على الدفع
// ============================================================
export default function PaymentApprovalCard({ payment, patientName, appointmentId, isAfterFirstMonth }) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState(null); // "approve" | "reject"
  const [selectedMethod, setSelectedMethod] = useState(payment?.suggestedMethod || "CASH");
  const [amount, setAmount] = useState(payment?.amount || "");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  if (!payment) {
    return (
      <div style={styles.noPayment}>
        <span>📋</span>
        <span>لم يُكمل المريض ملفه الطبي بعد</span>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.PENDING_APPROVAL;

  function handleApprove() {
    setError(null);
    if (selectedMethod === "CARD" && (!amount || parseFloat(amount) <= 0)) {
      setError("أدخل المبلغ للدفع بالبطاقة");
      return;
    }

    const fd = new FormData();
    fd.set("paymentId", payment.id);
    fd.set("approvedMethod", selectedMethod);
    if (amount) fd.set("amount", String(parseFloat(amount)));

    startTransition(async () => {
      try {
        const res = await approvePayment(fd);
        setDone({ type: "approved", method: selectedMethod, commission: res.commission });
        setMode(null);
      } catch (err) {
        setError(err.message);
      }
    });
  }

  function handleReject() {
    setError(null);
    const fd = new FormData();
    fd.set("paymentId", payment.id);
    fd.set("notes", notes);

    startTransition(async () => {
      try {
        await rejectPayment(fd);
        setDone({ type: "rejected" });
        setMode(null);
      } catch (err) {
        setError(err.message);
      }
    });
  }

  return (
    <div style={styles.card}>
      {/* رأس البطاقة */}
      <div style={styles.header}>
        <div>
          <div style={styles.patientName}>{patientName}</div>
          <div style={{ ...styles.statusBadge, color: statusCfg.color, background: statusCfg.bg }}>
            {statusCfg.label}
          </div>
        </div>
        {isAfterFirstMonth && (
          <div style={styles.commissionNote}>
            <span>💰</span>
            <span>عمولة الأدمن: 10%</span>
          </div>
        )}
      </div>

      {/* اقتراح النظام */}
      <div style={styles.suggestion}>
        <span style={styles.suggestionLabel}>اقتراح النظام:</span>
        <span style={styles.suggestionMethod}>{getPaymentLabel(payment.suggestedMethod)}</span>
      </div>

      {/* بيانات الملف الطبي */}
      {payment.appointment?.patient?.patientProfile && (
        <div style={styles.profileTags}>
          {payment.appointment.patient.patientProfile.hasInsurance && <span style={styles.tag}>🛡️ تأمين</span>}
          {payment.appointment.patient.patientProfile.hasChronicDisease && <span style={styles.tag}>🏥 مزمن</span>}
          {payment.appointment.patient.patientProfile.isEmergency && <span style={{ ...styles.tag, background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>🚨 طارئ</span>}
          <span style={styles.tag}>
            📊 {payment.appointment.patient.patientProfile.incomeLevel === "LOW" ? "دخل منخفض" : payment.appointment.patient.patientProfile.incomeLevel === "HIGH" ? "دخل مرتفع" : "دخل متوسط"}
          </span>
        </div>
      )}

      {/* نتيجة بعد الإجراء */}
      {done && (
        <div style={{ ...styles.doneBox, background: done.type === "approved" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", borderColor: done.type === "approved" ? "#22c55e" : "#ef4444" }}>
          {done.type === "approved" ? (
            <>
              ✅ وافقت على: {getPaymentLabel(done.method)}
              {done.commission > 0 && <span style={{ color: "#fbbf24", marginRight: "0.5rem" }}>| عمولة الأدمن: ${done.commission?.toFixed(2)}</span>}
            </>
          ) : (
            "❌ تم رفض الاقتراح وإشعار المريض"
          )}
        </div>
      )}

      {/* أزرار الإجراء */}
      {payment.status === "PENDING_APPROVAL" && !done && (
        <>
          {mode === null && (
            <div style={styles.actions}>
              <button style={styles.btnApprove} onClick={() => setMode("approve")}>
                ✅ موافقة
              </button>
              <button style={styles.btnReject} onClick={() => setMode("reject")}>
                ❌ رفض
              </button>
            </div>
          )}

          {/* نموذج الموافقة */}
          {mode === "approve" && (
            <div style={styles.form}>
              <label style={styles.formLabel}>اختر طريقة الدفع:</label>
              <div style={styles.methodGrid}>
                {PAYMENT_METHODS.map((m) => (
                  <div
                    key={m.value}
                    style={{ ...styles.methodBtn, ...(selectedMethod === m.value ? styles.methodBtnActive : {}) }}
                    onClick={() => setSelectedMethod(m.value)}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {(selectedMethod === "CASH" || selectedMethod === "CARD" || selectedMethod === "DEFERRED") && (
                <div style={{ marginTop: "0.8rem" }}>
                  <label style={styles.formLabel}>المبلغ (USD){selectedMethod === "FREE" ? " — مجاني" : ""}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={styles.input}
                  />
                  {isAfterFirstMonth && amount && parseFloat(amount) > 0 && (
                    <div style={styles.commissionCalc}>
                      عمولة الأدمن: ${(parseFloat(amount) * 0.1).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {error && <div style={styles.error}>{error}</div>}

              <div style={styles.formActions}>
                <button style={styles.btnConfirm} onClick={handleApprove} disabled={isPending}>
                  {isPending ? "⏳..." : "تأكيد الموافقة"}
                </button>
                <button style={styles.btnCancel} onClick={() => { setMode(null); setError(null); }}>
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* نموذج الرفض */}
          {mode === "reject" && (
            <div style={styles.form}>
              <label style={styles.formLabel}>سبب الرفض (اختياري):</label>
              <textarea
                rows={3}
                placeholder="اكتب سبب الرفض أو تعليمات للمريض..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ ...styles.input, resize: "vertical" }}
              />
              {error && <div style={styles.error}>{error}</div>}
              <div style={styles.formActions}>
                <button style={styles.btnReject} onClick={handleReject} disabled={isPending}>
                  {isPending ? "⏳..." : "تأكيد الرفض"}
                </button>
                <button style={styles.btnCancel} onClick={() => { setMode(null); setError(null); }}>
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* إذا كان مدفوعاً */}
      {payment.status === "PAID" && (
        <div style={styles.paidInfo}>
          <span>💰 مدفوع: {getPaymentLabel(payment.approvedMethod)}</span>
          {payment.amount > 0 && <span> — ${payment.amount?.toFixed(2)}</span>}
          {payment.adminCommission > 0 && <span style={{ color: "#fbbf24" }}> | عمولة: ${payment.adminCommission?.toFixed(2)}</span>}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "1.2rem",
    color: "#e2e8f0",
    direction: "rtl",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" },
  patientName: { fontWeight: 700, fontSize: "1rem", color: "#f1f5f9", marginBottom: "0.3rem" },
  statusBadge: { display: "inline-block", padding: "0.2rem 0.7rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600 },
  commissionNote: { display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", padding: "0.3rem 0.7rem", fontSize: "0.78rem", color: "#fbbf24" },
  suggestion: { display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.5rem 0 0.8rem" },
  suggestionLabel: { color: "#64748b", fontSize: "0.82rem" },
  suggestionMethod: { fontWeight: 600, color: "#38bdf8" },
  profileTags: { display: "flex", flexWrap: "wrap", gap: "0.4rem", margin: "0.5rem 0 1rem" },
  tag: { background: "rgba(56,189,248,0.1)", color: "#7dd3fc", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "20px", padding: "0.2rem 0.6rem", fontSize: "0.75rem" },
  actions: { display: "flex", gap: "0.6rem", marginTop: "0.8rem" },
  btnApprove: { flex: 1, background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#fff", border: "none", borderRadius: "10px", padding: "0.65rem", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" },
  btnReject:  { flex: 1, background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "0.65rem", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" },
  form: { marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.07)" },
  formLabel: { display: "block", color: "#94a3b8", fontSize: "0.82rem", marginBottom: "0.5rem" },
  methodGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" },
  methodBtn: { padding: "0.6rem 0.8rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", textAlign: "center", color: "#94a3b8", background: "rgba(255,255,255,0.04)", transition: "all 0.15s" },
  methodBtnActive: { border: "1px solid #0ea5e9", background: "rgba(14,165,233,0.15)", color: "#38bdf8" },
  input: { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#fff", padding: "0.6rem 0.8rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" },
  commissionCalc: { color: "#fbbf24", fontSize: "0.8rem", marginTop: "0.4rem" },
  formActions: { display: "flex", gap: "0.5rem", marginTop: "0.8rem" },
  btnConfirm: { flex: 1, background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem", fontWeight: 600, cursor: "pointer" },
  btnCancel: { padding: "0.6rem 1rem", background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "none", borderRadius: "8px", cursor: "pointer" },
  doneBox: { border: "1px solid", borderRadius: "8px", padding: "0.7rem 0.9rem", fontSize: "0.88rem", marginTop: "0.8rem" },
  error: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "0.5rem 0.8rem", color: "#fca5a5", fontSize: "0.82rem", marginTop: "0.5rem" },
  noPayment: { display: "flex", alignItems: "center", gap: "0.5rem", color: "#475569", fontSize: "0.85rem", padding: "0.5rem", direction: "rtl" },
  paidInfo: { marginTop: "0.8rem", fontSize: "0.88rem", color: "#86efac", background: "rgba(34,197,94,0.1)", borderRadius: "8px", padding: "0.6rem 0.9rem" },
};