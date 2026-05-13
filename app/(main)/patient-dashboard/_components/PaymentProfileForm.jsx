"use client";

import { useState, useTransition } from "react";
import { savePatientProfileAndSuggestPayment } from "@/actions/payment";
import { getPaymentLabel } from "@/lib/payment-utils";

// ============================================================
// مكوّن نموذج ملف المريض واقتراح الدفع
// ============================================================
export default function PaymentProfileForm({ appointmentId, existingProfile, onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    incomeLevel: existingProfile?.incomeLevel || "MEDIUM",
    hasInsurance: existingProfile?.hasInsurance ?? false,
    hasChronicDisease: existingProfile?.hasChronicDisease ?? false,
    isEmergency: existingProfile?.isEmergency ?? false,
  });

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.set("incomeLevel", form.incomeLevel);
    formData.set("hasInsurance", String(form.hasInsurance));
    formData.set("hasChronicDisease", String(form.hasChronicDisease));
    formData.set("isEmergency", String(form.isEmergency));
    if (appointmentId) formData.set("appointmentId", appointmentId);

    startTransition(async () => {
      try {
        await savePatientProfileAndSuggestPayment(formData);
        setResult("تم إرسال طلبك! سيتلقى طبيبك إشعاراً للمراجعة والموافقة.");
        onSuccess?.();
      } catch (err) {
        setError(err.message);
      }
    });
  }

  return (
    <div className="payment-profile-wrap">
      <style>{`
        .payment-profile-wrap {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          direction: rtl;
        }
        .ppf-card {
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          border-radius: 20px;
          padding: 2rem;
          color: #fff;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 520px;
          margin: 0 auto;
        }
        .ppf-title {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 0.4rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .ppf-subtitle {
          font-size: 0.85rem;
          color: #94a3b8;
          margin-bottom: 1.8rem;
        }
        .ppf-section {
          margin-bottom: 1.4rem;
        }
        .ppf-label {
          font-size: 0.88rem;
          color: #94a3b8;
          margin-bottom: 0.5rem;
          display: block;
        }
        .ppf-select {
          width: 100%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          color: #fff;
          padding: 0.7rem 1rem;
          font-size: 0.95rem;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .ppf-select:focus { border-color: #38bdf8; }
        .ppf-select option { background: #1e293b; color: #fff; }
        .ppf-toggles {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.8rem;
        }
        .ppf-toggle {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
        }
        .ppf-toggle.active {
          background: rgba(56,189,248,0.15);
          border-color: #38bdf8;
        }
        .ppf-toggle input { display: none; }
        .ppf-toggle-icon { font-size: 1.2rem; }
        .ppf-toggle-text { font-size: 0.85rem; color: #cbd5e1; }
        .ppf-toggle.active .ppf-toggle-text { color: #38bdf8; }
        .ppf-checkmark {
          width: 16px; height: 16px;
          border-radius: 4px;
          border: 1.5px solid rgba(255,255,255,0.3);
          margin-right: auto;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          transition: all 0.2s;
        }
        .ppf-toggle.active .ppf-checkmark {
          background: #38bdf8;
          border-color: #38bdf8;
        }
        .ppf-btn {
          width: 100%;
          background: linear-gradient(90deg, #0ea5e9, #38bdf8);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 0.85rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          margin-top: 1.5rem;
        }
        .ppf-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .ppf-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ppf-success {
          background: rgba(34,197,94,0.15);
          border: 1px solid #22c55e;
          border-radius: 10px;
          padding: 0.9rem 1rem;
          color: #86efac;
          font-size: 0.9rem;
          margin-top: 1rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .ppf-error {
          background: rgba(239,68,68,0.15);
          border: 1px solid #ef4444;
          border-radius: 10px;
          padding: 0.9rem 1rem;
          color: #fca5a5;
          font-size: 0.9rem;
          margin-top: 1rem;
        }
        .ppf-hint {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          background: rgba(251,191,36,0.1);
          border: 1px solid rgba(251,191,36,0.3);
          border-radius: 10px;
          padding: 0.8rem 1rem;
          color: #fde68a;
          font-size: 0.82rem;
          margin-bottom: 1.4rem;
        }
      `}</style>

      <div className="ppf-card">
        <div className="ppf-title">💊 ملفك الطبي</div>
        <p className="ppf-subtitle">
          أدخل معلوماتك ليقترح النظام طريقة الدفع المناسبة لك — ويوافق عليها طبيبك.
        </p>

        <div className="ppf-hint">
          <span>💡</span>
          <span>
            ستُرسل هذه المعلومات للطبيب لمراجعتها والموافقة على طريقة الدفع المناسبة.
            المعلومات سرية تماماً.
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* مستوى الدخل */}
          <div className="ppf-section">
            <label className="ppf-label">📊 مستوى الدخل</label>
            <select
              className="ppf-select"
              value={form.incomeLevel}
              onChange={(e) => handleChange("incomeLevel", e.target.value)}
            >
              <option value="LOW">منخفض</option>
              <option value="MEDIUM">متوسط</option>
              <option value="HIGH">مرتفع</option>
            </select>
          </div>

          {/* الخيارات */}
          <div className="ppf-section">
            <label className="ppf-label">⚙️ حالتي الصحية والتأمينية</label>
            <div className="ppf-toggles">
              {[
                { field: "hasInsurance", icon: "🛡️", label: "لدي تأمين صحي" },
                { field: "hasChronicDisease", icon: "🏥", label: "مرض مزمن" },
                { field: "isEmergency", icon: "🚨", label: "حالة طارئة" },
              ].map(({ field, icon, label }) => (
                <label
                  key={field}
                  className={`ppf-toggle ${form[field] ? "active" : ""}`}
                  onClick={() => handleChange(field, !form[field])}
                >
                  <span className="ppf-toggle-icon">{icon}</span>
                  <span className="ppf-toggle-text">{label}</span>
                  <div className="ppf-checkmark">{form[field] ? "✓" : ""}</div>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="ppf-btn" disabled={isPending}>
            {isPending ? "⏳ جارٍ الإرسال..." : "📤 إرسال للطبيب"}
          </button>
        </form>

        {result && (
          <div className="ppf-success">
            <span>✅</span> {result}
          </div>
        )}
        {error && <div className="ppf-error">❌ {error}</div>}
      </div>
    </div>
  );
}