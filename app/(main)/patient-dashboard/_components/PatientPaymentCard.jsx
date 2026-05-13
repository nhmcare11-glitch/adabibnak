"use client";

import { useState, useTransition } from "react";
import { createPayPalOrder, capturePayPalOrder } from "@/actions/paypal";
import { getPaymentLabel } from "@/lib/payment-utils";

// ============================================================
// مكوّن دفع المريض — يشمل جميع طرق الدفع
// ============================================================
export default function PatientPaymentCard({ payment, appointment }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(payment?.amount || "");

  if (!payment) {
    return (
      <div className="ppc-wrap">
        <style>{cardStyles}</style>
        <div className="ppc-card ppc-waiting">
          <div className="ppc-icon">⏳</div>
          <h3>في انتظار اقتراح الدفع</h3>
          <p>أكمل ملفك الطبي لاقتراح طريقة الدفع</p>
        </div>
      </div>
    );
  }

  const { status, suggestedMethod, approvedMethod, approvedBy, amount: paidAmount } = payment;

  // ─── حالة: بانتظار الموافقة ───
  if (status === "PENDING_APPROVAL") {
    return (
      <div className="ppc-wrap">
        <style>{cardStyles}</style>
        <div className="ppc-card">
          <div className="ppc-badge pending">⏳ بانتظار الموافقة</div>
          <div className="ppc-suggestion">
            <span className="ppc-label">اقتراح النظام:</span>
            <span className="ppc-method">{getPaymentLabel(suggestedMethod)}</span>
          </div>
          <p className="ppc-desc">
            سيراجع طبيبك هذا الاقتراح ويوافق على طريقة الدفع المناسبة لحالتك.
          </p>
        </div>
      </div>
    );
  }

  // ─── حالة: مرفوض ───
  if (status === "REJECTED") {
    return (
      <div className="ppc-wrap">
        <style>{cardStyles}</style>
        <div className="ppc-card ppc-rejected">
          <div className="ppc-badge rejected">❌ تم الرفض</div>
          <p className="ppc-desc">{payment.notes || "يرجى التواصل مع طبيبك لمراجعة وضعك."}</p>
        </div>
      </div>
    );
  }

  // ─── حالة: مدفوع ───
  if (status === "PAID") {
    return (
      <div className="ppc-wrap">
        <style>{cardStyles}</style>
        <div className="ppc-card ppc-paid">
          <div className="ppc-icon">✅</div>
          <div className="ppc-badge paid">مكتمل</div>
          <div className="ppc-suggestion">
            <span className="ppc-label">طريقة الدفع:</span>
            <span className="ppc-method">{getPaymentLabel(approvedMethod)}</span>
          </div>
          {paidAmount > 0 && (
            <div className="ppc-amount-display">${paidAmount?.toFixed(2)}</div>
          )}
          <p className="ppc-desc muted">
            وافق عليه: {approvedBy?.name || "الطبيب"}
          </p>
        </div>
      </div>
    );
  }

  // ─── حالة: موافق عليه — ينتظر الدفع الفعلي ───
  if (status === "APPROVED") {
    // مجاني — يُعرض فقط
    if (approvedMethod === "FREE") {
      return (
        <div className="ppc-wrap">
          <style>{cardStyles}</style>
          <div className="ppc-card ppc-free">
            <div className="ppc-icon">🆓</div>
            <div className="ppc-badge free">معفى من الدفع</div>
            <p className="ppc-desc">تمت الموافقة على إعفائك من رسوم هذه الاستشارة.</p>
          </div>
        </div>
      );
    }

    // نقدي
    if (approvedMethod === "CASH") {
      return (
        <div className="ppc-wrap">
          <style>{cardStyles}</style>
          <div className="ppc-card">
            <div className="ppc-badge approved">✅ موافق عليه</div>
            <div className="ppc-suggestion">
              <span className="ppc-label">طريقة الدفع:</span>
              <span className="ppc-method">💵 نقدي</span>
            </div>
            {paidAmount > 0 && (
              <div className="ppc-amount-display">${paidAmount?.toFixed(2)}</div>
            )}
            <p className="ppc-desc">
              يرجى دفع المبلغ نقداً عند الاستشارة أو وفق تعليمات الطبيب.
            </p>
          </div>
        </div>
      );
    }

    // مؤجل
    if (approvedMethod === "DEFERRED") {
      return (
        <div className="ppc-wrap">
          <style>{cardStyles}</style>
          <div className="ppc-card">
            <div className="ppc-badge deferred">⏳ مؤجل</div>
            <div className="ppc-suggestion">
              <span className="ppc-label">طريقة الدفع:</span>
              <span className="ppc-method">⏳ دفع مؤجل</span>
            </div>
            {paidAmount > 0 && (
              <div className="ppc-amount-display">${paidAmount?.toFixed(2)}</div>
            )}
            <p className="ppc-desc">
              سيتم تحديد موعد وطريقة الدفع لاحقاً بالتنسيق مع الطبيب.
            </p>
          </div>
        </div>
      );
    }

    // بطاقة / PayPal
    if (approvedMethod === "CARD") {
      function handlePayPal() {
        setError(null);
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
          setError("أدخل المبلغ بشكل صحيح");
          return;
        }
        const fd = new FormData();
        fd.set("paymentId", payment.id);
        fd.set("amount", String(parseFloat(amount)));

        startTransition(async () => {
          try {
            const result = await createPayPalOrder(fd);
            if (result.success && result.approvalUrl) {
              window.location.href = result.approvalUrl;
            }
          } catch (err) {
            setError(err.message);
          }
        });
      }

      return (
        <div className="ppc-wrap">
          <style>{cardStyles}</style>
          <div className="ppc-card">
            <div className="ppc-badge approved">✅ موافق عليه</div>
            <div className="ppc-suggestion">
              <span className="ppc-label">طريقة الدفع:</span>
              <span className="ppc-method">💳 PayPal / بطاقة</span>
            </div>

            {!paidAmount && (
              <div className="ppc-amount-input-wrap">
                <label className="ppc-input-label">المبلغ (USD)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="ppc-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            )}

            {paidAmount > 0 && (
              <div className="ppc-amount-display">${paidAmount?.toFixed(2)}</div>
            )}

            <button
              className="ppc-paypal-btn"
              onClick={handlePayPal}
              disabled={isPending}
            >
              {isPending ? (
                "⏳ جارٍ التوجيه..."
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.59 3.025-2.6 4.8-5.7 4.8H12.6c-.42 0-.77.3-.837.714l-1.11 7.01c-.07.44.25.852.69.852h2.9a.89.89 0 0 0 .88-.757l.036-.18.7-4.44.045-.24a.89.89 0 0 1 .88-.757h.55c3.58 0 6.38-1.455 7.2-5.663.34-1.76.165-3.23-.61-4.258l-.003.01z"/>
                  </svg>
                  الدفع عبر PayPal
                </>
              )}
            </button>

            {error && <div className="ppc-error">❌ {error}</div>}
          </div>
        </div>
      );
    }
  }

  return null;
}

// ─────────────── الأنماط ───────────────
const cardStyles = `
  .ppc-wrap { direction: rtl; font-family: 'Segoe UI', Tahoma, sans-serif; }
  .ppc-card {
    background: #0f172a;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 1.5rem;
    color: #e2e8f0;
    position: relative;
    overflow: hidden;
  }
  .ppc-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc);
  }
  .ppc-waiting { text-align: center; padding: 2rem; }
  .ppc-waiting h3 { font-size: 1.1rem; margin: 0.5rem 0 0.3rem; }
  .ppc-waiting p { color: #64748b; font-size: 0.85rem; margin: 0; }
  .ppc-free::before { background: linear-gradient(90deg, #22c55e, #4ade80); }
  .ppc-paid::before { background: linear-gradient(90deg, #22c55e, #86efac); }
  .ppc-rejected::before { background: linear-gradient(90deg, #ef4444, #fca5a5); }
  .ppc-icon { font-size: 2rem; text-align: center; margin-bottom: 0.5rem; }
  .ppc-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.78rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
  .ppc-badge.pending { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }
  .ppc-badge.approved { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
  .ppc-badge.rejected { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
  .ppc-badge.paid { background: rgba(34,197,94,0.2); color: #86efac; border: 1px solid #22c55e; }
  .ppc-badge.free { background: rgba(34,197,94,0.1); color: #4ade80; }
  .ppc-badge.deferred { background: rgba(251,191,36,0.1); color: #fbbf24; }
  .ppc-suggestion { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.8rem; }
  .ppc-label { color: #64748b; font-size: 0.85rem; }
  .ppc-method { font-size: 1rem; font-weight: 600; color: #e2e8f0; }
  .ppc-desc { color: #94a3b8; font-size: 0.85rem; margin: 0.5rem 0 0; line-height: 1.6; }
  .ppc-desc.muted { color: #475569; }
  .ppc-amount-display { font-size: 2rem; font-weight: 700; color: #38bdf8; margin: 0.5rem 0; }
  .ppc-amount-input-wrap { margin: 1rem 0; }
  .ppc-input-label { display: block; color: #94a3b8; font-size: 0.82rem; margin-bottom: 0.4rem; }
  .ppc-input {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    color: #fff;
    padding: 0.65rem 1rem;
    font-size: 1rem;
    outline: none;
    box-sizing: border-box;
  }
  .ppc-input:focus { border-color: #0070ba; }
  .ppc-paypal-btn {
    width: 100%;
    background: linear-gradient(135deg, #003087, #0070ba, #009cde);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.85rem;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 1rem;
    transition: opacity 0.2s, transform 0.1s;
    letter-spacing: 0.02em;
  }
  .ppc-paypal-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .ppc-paypal-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ppc-error {
    background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 8px;
    padding: 0.65rem 0.9rem;
    color: #fca5a5;
    font-size: 0.85rem;
    margin-top: 0.8rem;
  }
`;