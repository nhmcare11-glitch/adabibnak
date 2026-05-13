"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { capturePayPalOrder } from "@/actions/paypal";

// ============================================================
// صفحة العودة من PayPal
// ضعها في: app/(main)/patient-dashboard/paypal-return/page.jsx
// ============================================================

function PayPalReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | success | error | cancelled
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const payment = searchParams.get("payment");
    const paymentId = searchParams.get("paymentId");
    const token = searchParams.get("token"); // معرّف طلب PayPal (يأتي تلقائياً)

    if (payment === "cancelled") {
      setStatus("cancelled");
      return;
    }

    if (payment === "success" && paymentId && token) {
      const fd = new FormData();
      fd.set("orderId", token);
      fd.set("paymentId", paymentId);

      startTransition(async () => {
        try {
          await capturePayPalOrder(fd);
          setStatus("success");
          // إعادة توجيه بعد 3 ثوانٍ
          setTimeout(() => router.push("/patient-dashboard"), 3000);
        } catch (err) {
          setStatus("error");
          setError(err.message);
        }
      });
    } else {
      setStatus("error");
      setError("معلومات الدفع غير مكتملة");
    }
  }, [searchParams]);

  return (
    <div style={st.page}>
      <div style={st.card}>
        {status === "loading" && (
          <>
            <div style={st.spinner} />
            <h2 style={st.title}>⏳ جارٍ تأكيد الدفع...</h2>
            <p style={st.desc}>يرجى الانتظار، نتحقق من دفعتك مع PayPal.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={st.successIcon}>✅</div>
            <h2 style={{ ...st.title, color: "#22c55e" }}>تم الدفع بنجاح!</h2>
            <p style={st.desc}>تم تأكيد دفعتك عبر PayPal. سيتم توجيهك للوحة التحكم...</p>
            <div style={st.progressBar}>
              <div style={st.progressFill} />
            </div>
          </>
        )}

        {status === "cancelled" && (
          <>
            <div style={st.cancelIcon}>🚫</div>
            <h2 style={{ ...st.title, color: "#f59e0b" }}>تم إلغاء الدفع</h2>
            <p style={st.desc}>ألغيت عملية الدفع. يمكنك المحاولة مرة أخرى من لوحة التحكم.</p>
            <button style={st.btn} onClick={() => router.push("/patient-dashboard")}>
              العودة للوحة التحكم
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={st.errorIcon}>❌</div>
            <h2 style={{ ...st.title, color: "#ef4444" }}>فشل تأكيد الدفع</h2>
            <p style={st.desc}>{error || "حدث خطأ أثناء التحقق من الدفع."}</p>
            <div style={st.actions}>
              <button style={st.btn} onClick={() => router.push("/patient-dashboard")}>
                العودة للوحة التحكم
              </button>
              <button style={st.btnOutline} onClick={() => window.location.reload()}>
                إعادة المحاولة
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function PayPalReturnPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020817" }}>
        <div style={{ color: "#64748b" }}>⏳ جارٍ التحميل...</div>
      </div>
    }>
      <PayPalReturnContent />
    </Suspense>
  );
}

const st = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #020817 0%, #0c1426 50%, #020817 100%)",
    padding: "1rem",
    direction: "rtl",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
  },
  card: {
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "3rem 2.5rem",
    textAlign: "center",
    maxWidth: "420px",
    width: "100%",
    boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
  },
  spinner: {
    width: "56px",
    height: "56px",
    border: "4px solid rgba(56,189,248,0.2)",
    borderTop: "4px solid #38bdf8",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 1.5rem",
  },
  successIcon: { fontSize: "3.5rem", marginBottom: "1rem" },
  cancelIcon:  { fontSize: "3.5rem", marginBottom: "1rem" },
  errorIcon:   { fontSize: "3.5rem", marginBottom: "1rem" },
  title: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#f1f5f9",
    marginBottom: "0.7rem",
  },
  desc: {
    color: "#64748b",
    fontSize: "0.9rem",
    lineHeight: 1.6,
    marginBottom: "1.5rem",
  },
  progressBar: {
    background: "rgba(34,197,94,0.15)",
    borderRadius: "10px",
    height: "6px",
    overflow: "hidden",
    marginTop: "0.5rem",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #16a34a, #22c55e)",
    borderRadius: "10px",
    animation: "progress 3s linear forwards",
  },
  actions: { display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap" },
  btn: {
    background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "0.7rem 1.4rem",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  btnOutline: {
    background: "rgba(255,255,255,0.06)",
    color: "#94a3b8",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    padding: "0.7rem 1.4rem",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};