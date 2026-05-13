"use client";

import { useState, useEffect } from "react";
import { getPatientProfile, savePatientProfileAndSuggestPayment } from "@/actions/payment";
import { CheckCircle, Clock, XCircle, CreditCard, Banknote, Gift, AlertCircle } from "lucide-react";

const METHOD_CONFIG = {
  CASH:     { label: "نقدي",           emoji: "💵", color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)"  },
  CARD:     { label: "PayPal / بطاقة", emoji: "💳", color: "#4c82fa", bg: "rgba(76,130,250,0.12)", border: "rgba(76,130,250,0.3)" },
  FREE:     { label: "مجاني",          emoji: "🆓", color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)" },
  DEFERRED: { label: "مؤجل",           emoji: "⏳", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
};

const STATUS_CONFIG = {
  PENDING_APPROVAL: { label: "في انتظار موافقة الطبيب", color: "#f59e0b", icon: Clock },
  APPROVED:         { label: "تمت الموافقة",            color: "#22c55e", icon: CheckCircle },
  REJECTED:         { label: "مرفوض — راجع طبيبك",     color: "#ef4444", icon: XCircle },
  PAID:             { label: "تم الدفع",                color: "#4c82fa", icon: CheckCircle },
};

export default function PatientPaymentSection({ appointments = [] }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    incomeLevel: "MEDIUM",
    hasInsurance: false,
    hasChronicDisease: false,
    isEmergency: false,
  });

  useEffect(() => {
    getPatientProfile().then(({ profile }) => {
      if (profile) {
        setProfile(profile);
        setForm({
          incomeLevel: profile.incomeLevel,
          hasInsurance: profile.hasInsurance,
          hasChronicDisease: profile.hasChronicDisease,
          isEmergency: profile.isEmergency,
        });
      }
      setLoading(false);
    });
  }, []);

  // أول موعد مجدول
  const scheduledAppointment = appointments.find(a => a.status === "SCHEDULED");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("incomeLevel", form.incomeLevel);
      fd.append("hasInsurance", String(form.hasInsurance));
      fd.append("hasChronicDisease", String(form.hasChronicDisease));
      fd.append("isEmergency", String(form.isEmergency));
      if (scheduledAppointment) fd.append("appointmentId", scheduledAppointment.id);
      await savePatientProfileAndSuggestPayment(fd);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      alert("خطأ: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
      جارٍ التحميل...
    </div>
  );

  return (
    <div style={{ direction: "rtl", fontFamily: "'Cairo','Tajawal',sans-serif" }}>

      {/* ===== حالة الدفع للمواعيد ===== */}
      {appointments.filter(a => a.payment).length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "white", fontWeight: 700, marginBottom: "12px", fontSize: "0.95rem" }}>
            💳 حالة الدفع لمواعيدك
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {appointments.filter(a => a.payment).map(apt => {
              const payment = apt.payment;
              const statusCfg = STATUS_CONFIG[payment.status];
              const StatusIcon = statusCfg?.icon || Clock;
              const methodCfg = payment.approvedMethod
                ? METHOD_CONFIG[payment.approvedMethod]
                : METHOD_CONFIG[payment.suggestedMethod];

              return (
                <div key={apt.id} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ color: "white", fontWeight: 600, fontSize: "0.85rem" }}>
                        د. {apt.doctor?.name}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                        {new Date(apt.startTime).toLocaleDateString("ar-DZ")}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {/* طريقة الدفع */}
                      <div style={{
                        padding: "4px 10px", borderRadius: "8px",
                        background: methodCfg?.bg,
                        border: `1px solid ${methodCfg?.border}`,
                        color: methodCfg?.color,
                        fontSize: "0.78rem", fontWeight: 600,
                        display: "flex", alignItems: "center", gap: "4px",
                      }}>
                        {methodCfg?.emoji} {methodCfg?.label}
                        {payment.amount ? ` — ${payment.amount} دج` : ""}
                      </div>

                      {/* الحالة */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: "4px",
                        color: statusCfg?.color, fontSize: "0.78rem", fontWeight: 600,
                      }}>
                        <StatusIcon size={13} />
                        {statusCfg?.label}
                      </div>
                    </div>
                  </div>

                  {/* إذا تمت الموافقة — تعليمات الدفع */}
                  {payment.status === "APPROVED" && (
                    <div style={{
                      marginTop: "10px", padding: "8px 12px",
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: "8px", fontSize: "0.8rem", color: "#22c55e",
                    }}>
                      ✅ وافق طبيبك على طريقة الدفع:{" "}
                      <strong>{methodCfg?.emoji} {methodCfg?.label}</strong>
                      {payment.amount ? ` بمبلغ ${payment.amount} دج` : ""}
                      {payment.approvedMethod === "CASH" && " — يرجى الدفع عند الوصول"}
                      {payment.approvedMethod === "DEFERRED" && " — سيتم الاتفاق على موعد الدفع لاحقاً"}
                      {payment.approvedMethod === "FREE" && " — أنت معفى من الدفع"}
                      {payment.approvedMethod === "CARD" && " — يمكنك الدفع عبر PayPal أو البطاقة"}
                    </div>
                  )}

                  {/* إذا مرفوض */}
                  {payment.status === "REJECTED" && payment.notes && (
                    <div style={{
                      marginTop: "10px", padding: "8px 12px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "8px", fontSize: "0.8rem", color: "#ef4444",
                    }}>
                      ❌ {payment.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== نموذج ملف المريض ===== */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "20px",
      }}>
        <h3 style={{ color: "white", fontWeight: 700, marginBottom: "4px", fontSize: "0.95rem" }}>
          📋 بياناتك الطبية
        </h3>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", marginBottom: "16px" }}>
          تساعد هذه البيانات النظام على اقتراح طريقة الدفع المناسبة لك
        </p>

        {done && (
          <div style={{
            padding: "10px 14px", borderRadius: "10px",
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
            color: "#22c55e", fontSize: "0.82rem", marginBottom: "12px",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <CheckCircle size={14} /> تم حفظ بياناتك وإرسال اقتراح الدفع للطبيب
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* مستوى الدخل */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", display: "block", marginBottom: "6px" }}>
              مستوى الدخل
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { value: "LOW", label: "منخفض" },
                { value: "MEDIUM", label: "متوسط" },
                { value: "HIGH", label: "مرتفع" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, incomeLevel: opt.value }))}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: "8px",
                    background: form.incomeLevel === opt.value ? "rgba(76,130,250,0.2)" : "rgba(255,255,255,0.05)",
                    border: form.incomeLevel === opt.value ? "1px solid rgba(76,130,250,0.5)" : "1px solid rgba(255,255,255,0.1)",
                    color: form.incomeLevel === opt.value ? "#4c82fa" : "rgba(255,255,255,0.5)",
                    fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* toggles */}
          {[
            { key: "hasChronicDisease", label: "أعاني من مرض مزمن", color: "#ef4444" },
            { key: "hasInsurance",      label: "لدي تأمين صحي",    color: "#22c55e" },
            { key: "isEmergency",       label: "حالة استعجالية",    color: "#f59e0b" },
          ].map(({ key, label, color }) => (
            <div key={key} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>{label}</span>
              <div
                onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                style={{
                  width: "44px", height: "24px", borderRadius: "12px",
                  background: form[key] ? color : "rgba(255,255,255,0.1)",
                  position: "relative", cursor: "pointer", transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: "3px",
                  right: form[key] ? "3px" : "21px",
                  width: "18px", height: "18px",
                  borderRadius: "50%", background: "white",
                  transition: "right 0.2s",
                }} />
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%", marginTop: "16px", padding: "11px 0",
              borderRadius: "10px",
              background: saving ? "rgba(76,130,250,0.3)" : "rgba(76,130,250,0.85)",
              border: "none", color: "white",
              fontWeight: 700, fontSize: "0.88rem",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {saving ? "جارٍ الحفظ..." : profile ? "تحديث البيانات" : "حفظ وطلب اقتراح دفع"}
          </button>
        </form>
      </div>
    </div>
  );
}