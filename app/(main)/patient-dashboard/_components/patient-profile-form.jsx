"use client";

import { useState } from "react";
import { savePatientProfileAndSuggestPayment } from "@/actions/payment";
import { User, ShieldCheck, Heart, AlertTriangle, Banknote, CheckCircle } from "lucide-react";

export default function PatientProfileForm({ appointmentId, existingProfile, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    incomeLevel: existingProfile?.incomeLevel || "MEDIUM",
    hasInsurance: existingProfile?.hasInsurance ?? false,
    hasChronicDisease: existingProfile?.hasChronicDisease ?? false,
    isEmergency: existingProfile?.isEmergency ?? false,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("incomeLevel", form.incomeLevel);
      fd.append("hasInsurance", String(form.hasInsurance));
      fd.append("hasChronicDisease", String(form.hasChronicDisease));
      fd.append("isEmergency", String(form.isEmergency));
      if (appointmentId) fd.append("appointmentId", appointmentId);

      await savePatientProfileAndSuggestPayment(fd);
      setDone(true);
      onSuccess?.();
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
        padding: "24px", textAlign: "center",
        background: "rgba(34,197,94,0.08)",
        border: "1px solid rgba(34,197,94,0.2)",
        borderRadius: "16px",
      }}>
        <CheckCircle size={32} color="#22c55e" />
        <p style={{ color: "#22c55e", fontWeight: "700", margin: 0 }}>تم حفظ البيانات!</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", margin: 0 }}>
          تم إرسال اقتراح الدفع للطبيب للمراجعة
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "20px",
      padding: "24px",
      direction: "rtl",
      fontFamily: "'Cairo','Tajawal',sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "10px",
          background: "rgba(76,130,250,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <User size={18} color="#4c82fa" />
        </div>
        <h3 style={{ margin: 0, color: "white", fontSize: "1rem", fontWeight: "700" }}>
          ملف المريض
        </h3>
      </div>

      {/* مستوى الدخل */}
      <div style={fieldStyle}>
        <label style={labelStyle}>
          <Banknote size={14} color="rgba(255,255,255,0.4)" />
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
                fontWeight: "600", fontSize: "0.82rem", cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle fields */}
      {[
        { key: "hasChronicDisease", label: "مرض مزمن", icon: Heart, color: "#ef4444" },
        { key: "hasInsurance", label: "يوجد تأمين صحي", icon: ShieldCheck, color: "#22c55e" },
        { key: "isEmergency", label: "حالة استعجالية", icon: AlertTriangle, color: "#f59e0b" },
      ].map(({ key, label, icon: Icon, color }) => (
        <div key={key} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Icon size={15} color={color} />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.88rem" }}>{label}</span>
          </div>
          <Toggle
            value={form[key]}
            onChange={val => setForm(f => ({ ...f, [key]: val }))}
            color={color}
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%", marginTop: "18px",
          padding: "12px 0",
          borderRadius: "10px",
          background: loading ? "rgba(76,130,250,0.3)" : "rgba(76,130,250,0.85)",
          border: "none", color: "white",
          fontWeight: "700", fontSize: "0.9rem",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          transition: "all 0.15s",
        }}
      >
        {loading ? "جارٍ الحفظ..." : "حفظ واقتراح طريقة الدفع"}
      </button>
    </form>
  );
}

function Toggle({ value, onChange, color }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: "44px", height: "24px",
        borderRadius: "12px",
        background: value ? color : "rgba(255,255,255,0.1)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute",
        top: "3px",
        right: value ? "3px" : "21px",
        width: "18px", height: "18px",
        borderRadius: "50%",
        background: "white",
        transition: "right 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </div>
  );
}

const fieldStyle = { marginBottom: "16px" };
const labelStyle = {
  display: "flex", alignItems: "center", gap: "6px",
  color: "rgba(255,255,255,0.4)",
  fontSize: "0.78rem",
  marginBottom: "8px",
};