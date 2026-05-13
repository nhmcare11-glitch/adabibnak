"use client";

import { useState, useTransition, useEffect } from "react";
import { getAllPaymentsWithCommissions, getAllSecretaries, setSecretarySalary, paySecretarySalary, getCommissionsStats, getSalariesStats } from "@/actions/admin";
import { getPaymentLabel } from "@/lib/payment-utils";

const MONTH_NAMES = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

// ============================================================
// لوحة العمولات والرواتب للأدمن
// ============================================================
export default function CommissionsPanel() {
  const [tab, setTab] = useState("commissions");
  const [payments, setPayments] = useState([]);
  const [secretaries, setSecretaries] = useState([]);
  const [commStats, setCommStats] = useState(null);
  const [salaryStats, setSalaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // نموذج الراتب
  const [salaryForm, setSalaryForm] = useState({
    secretaryId: "",
    amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: "",
  });
  const [salaryMsg, setSalaryMsg] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [p, s, cs, ss] = await Promise.all([
          getAllPaymentsWithCommissions(),
          getAllSecretaries(),
          getCommissionsStats(),
          getSalariesStats(),
        ]);
        setPayments(p.payments || []);
        setSecretaries(s.secretaries || []);
        setCommStats(cs);
        setSalaryStats(ss);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  function handleSetSalary(e) {
    e.preventDefault();
    setSalaryMsg(null);
    const fd = new FormData();
    Object.entries(salaryForm).forEach(([k, v]) => fd.set(k, String(v)));
    startTransition(async () => {
      try {
        await setSecretarySalary(fd);
        setSalaryMsg({ type: "success", text: "✅ تم تحديد الراتب بنجاح" });
        // إعادة جلب السكرتيرات
        const s = await getAllSecretaries();
        setSecretaries(s.secretaries || []);
      } catch (err) {
        setSalaryMsg({ type: "error", text: "❌ " + err.message });
      }
    });
  }

  function handlePaySalary(salaryId) {
    const fd = new FormData();
    fd.set("salaryId", salaryId);
    startTransition(async () => {
      try {
        await paySecretarySalary(fd);
        const s = await getAllSecretaries();
        setSecretaries(s.secretaries || []);
        const ss = await getSalariesStats();
        setSalaryStats(ss);
      } catch (err) { alert(err.message); }
    });
  }

  return (
    <div style={s.wrap}>
      {/* Tabs */}
      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(tab === "commissions" ? s.tabActive : {}) }} onClick={() => setTab("commissions")}>
          💰 العمولات
        </button>
        <button style={{ ...s.tab, ...(tab === "salaries" ? s.tabActive : {}) }} onClick={() => setTab("salaries")}>
          👩‍💼 رواتب السكرتيرات
        </button>
      </div>

      {loading ? (
        <div style={s.loading}>⏳ جارٍ التحميل...</div>
      ) : (
        <>
          {/* ─── تبويب العمولات ─── */}
          {tab === "commissions" && (
            <div>
              {/* إحصاءات */}
              {commStats && (
                <div style={s.statsGrid}>
                  <StatCard icon="💰" label="إجمالي العمولات" value={`$${commStats.totalCommissions?.toFixed(2)}`} color="#f59e0b" />
                  <StatCard icon="📅" label="عمولات هذا الشهر" value={`$${commStats.thisMonthCommissions?.toFixed(2)}`} color="#22c55e" />
                  <StatCard icon="✅" label="مدفوعات مكتملة" value={commStats.paidPayments} color="#38bdf8" />
                </div>
              )}

              {/* جدول المدفوعات */}
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["المريض", "الطبيب", "طريقة الدفع", "المبلغ", "العمولة", "الحالة"].map((h) => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.filter(p => p.status === "PAID" || p.status === "APPROVED").map((p) => (
                      <tr key={p.id} style={s.tr}>
                        <td style={s.td}>{p.appointment?.patient?.name || "—"}</td>
                        <td style={s.td}>{p.appointment?.doctor?.name || "—"}</td>
                        <td style={s.td}>{getPaymentLabel(p.approvedMethod || p.suggestedMethod)}</td>
                        <td style={s.td}>{p.amount ? `$${p.amount?.toFixed(2)}` : "—"}</td>
                        <td style={{ ...s.td, color: p.adminCommission > 0 ? "#fbbf24" : "#64748b" }}>
                          {p.adminCommission > 0 ? `$${p.adminCommission?.toFixed(2)}` : p.isInFreeMonth ? "🆓 شهر مجاني" : "—"}
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, ...(p.status === "PAID" ? s.badgePaid : s.badgeApproved) }}>
                            {p.status === "PAID" ? "مدفوع" : "موافق"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {payments.filter(p => p.status === "PAID" || p.status === "APPROVED").length === 0 && (
                      <tr><td colSpan={6} style={{ ...s.td, textAlign: "center", color: "#475569" }}>لا توجد مدفوعات بعد</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── تبويب الرواتب ─── */}
          {tab === "salaries" && (
            <div>
              {/* إحصاءات */}
              {salaryStats && (
                <div style={s.statsGrid}>
                  <StatCard icon="💸" label="إجمالي الرواتب المدفوعة" value={`$${salaryStats.totalPaid?.toFixed(2)}`} color="#a78bfa" />
                  <StatCard icon="⏳" label="رواتب معلقة هذا الشهر" value={salaryStats.pendingThisMonth} color="#f59e0b" />
                  <StatCard icon="✅" label="رواتب مدفوعة هذا الشهر" value={salaryStats.paidThisMonth} color="#22c55e" />
                </div>
              )}

              {/* نموذج تحديد الراتب */}
              <div style={s.formCard}>
                <h3 style={s.formTitle}>➕ تحديد راتب سكرتيرة</h3>
                <form onSubmit={handleSetSalary} style={s.form}>
                  <div style={s.formRow}>
                    <div style={s.field}>
                      <label style={s.label}>السكرتيرة</label>
                      <select style={s.select} value={salaryForm.secretaryId} onChange={e => setSalaryForm(f => ({ ...f, secretaryId: e.target.value }))} required>
                        <option value="">اختر سكرتيرة</option>
                        {secretaries.map(sec => (
                          <option key={sec.id} value={sec.id}>{sec.name} ({sec.role})</option>
                        ))}
                      </select>
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>المبلغ (USD)</label>
                      <input type="number" min="1" step="0.01" style={s.input} placeholder="0.00" value={salaryForm.amount} onChange={e => setSalaryForm(f => ({ ...f, amount: e.target.value }))} required />
                    </div>
                  </div>
                  <div style={s.formRow}>
                    <div style={s.field}>
                      <label style={s.label}>الشهر</label>
                      <select style={s.select} value={salaryForm.month} onChange={e => setSalaryForm(f => ({ ...f, month: parseInt(e.target.value) }))}>
                        {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>السنة</label>
                      <input type="number" style={s.input} value={salaryForm.year} onChange={e => setSalaryForm(f => ({ ...f, year: parseInt(e.target.value) }))} />
                    </div>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>ملاحظات (اختياري)</label>
                    <input type="text" style={s.input} placeholder="أي ملاحظات..." value={salaryForm.notes} onChange={e => setSalaryForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <button type="submit" style={s.submitBtn} disabled={isPending}>
                    {isPending ? "⏳ جارٍ الحفظ..." : "💾 حفظ الراتب"}
                  </button>
                  {salaryMsg && (
                    <div style={{ marginTop: "0.5rem", color: salaryMsg.type === "success" ? "#86efac" : "#fca5a5", fontSize: "0.88rem" }}>
                      {salaryMsg.text}
                    </div>
                  )}
                </form>
              </div>

              {/* قائمة السكرتيرات ورواتبهن */}
              {secretaries.map((sec) => (
                <div key={sec.id} style={s.secCard}>
                  <div style={s.secHeader}>
                    <div>
                      <div style={s.secName}>{sec.name}</div>
                      <div style={s.secRole}>{sec.role}</div>
                    </div>
                  </div>
                  {sec.salariesAsSecretary?.length > 0 ? (
                    <div style={s.salaryList}>
                      {sec.salariesAsSecretary.map((sal) => (
                        <div key={sal.id} style={s.salaryRow}>
                          <span style={s.salaryMonth}>{MONTH_NAMES[sal.month - 1]} {sal.year}</span>
                          <span style={s.salaryAmount}>${sal.amount?.toFixed(2)}</span>
                          <span style={{ ...s.badge, ...(sal.status === "PAID" ? s.badgePaid : s.badgePending) }}>
                            {sal.status === "PAID" ? `✅ مدفوع ${sal.paidAt ? new Date(sal.paidAt).toLocaleDateString("ar-DZ") : ""}` : "⏳ معلق"}
                          </span>
                          {sal.status === "PENDING" && (
                            <button style={s.payBtn} disabled={isPending} onClick={() => handlePaySalary(sal.id)}>
                              💸 دفع
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#475569", fontSize: "0.82rem", margin: "0.5rem 0 0" }}>لم يتم تحديد راتب بعد</p>
                  )}
                </div>
              ))}

              {secretaries.length === 0 && (
                <div style={{ textAlign: "center", color: "#475569", padding: "2rem" }}>
                  لا توجد سكرتيرات مسجّلات في النظام
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "1rem 1.2rem", direction: "rtl" }}>
      <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "0.3rem" }}>{icon} {label}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

const s = {
  wrap: { direction: "rtl", fontFamily: "'Segoe UI', Tahoma, sans-serif", color: "#e2e8f0" },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0.5rem" },
  tab: { background: "none", border: "none", color: "#64748b", padding: "0.5rem 1.2rem", cursor: "pointer", fontSize: "0.9rem", borderRadius: "8px 8px 0 0", transition: "all 0.2s" },
  tabActive: { background: "rgba(14,165,233,0.15)", color: "#38bdf8", fontWeight: 600 },
  loading: { textAlign: "center", color: "#64748b", padding: "2rem" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" },
  tableWrap: { overflowX: "auto", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "rgba(255,255,255,0.05)", padding: "0.7rem 1rem", fontSize: "0.8rem", color: "#94a3b8", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.04)" },
  td: { padding: "0.7rem 1rem", fontSize: "0.88rem", color: "#cbd5e1" },
  badge: { display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600 },
  badgePaid: { background: "rgba(34,197,94,0.15)", color: "#86efac" },
  badgeApproved: { background: "rgba(56,189,248,0.15)", color: "#7dd3fc" },
  badgePending: { background: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  formCard: { background: "#0f172a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "1.2rem", marginBottom: "1.5rem" },
  formTitle: { fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", color: "#f1f5f9" },
  form: {},
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  label: { color: "#94a3b8", fontSize: "0.8rem" },
  input: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", padding: "0.6rem 0.8rem", fontSize: "0.88rem", outline: "none" },
  select: { background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", padding: "0.6rem 0.8rem", fontSize: "0.88rem", outline: "none", cursor: "pointer" },
  submitBtn: { background: "linear-gradient(135deg, #0ea5e9, #38bdf8)", color: "#fff", border: "none", borderRadius: "10px", padding: "0.65rem 1.5rem", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", marginTop: "0.5rem" },
  secCard: { background: "#0f172a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "1rem 1.2rem", marginBottom: "0.8rem" },
  secHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" },
  secName: { fontWeight: 700, fontSize: "1rem", color: "#f1f5f9" },
  secRole: { color: "#64748b", fontSize: "0.78rem", marginTop: "0.2rem" },
  salaryList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  salaryRow: { display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" },
  salaryMonth: { color: "#94a3b8", fontSize: "0.85rem", minWidth: "100px" },
  salaryAmount: { fontWeight: 700, color: "#a78bfa", fontSize: "1rem" },
  payBtn: { background: "rgba(168,85,247,0.15)", color: "#a78bfa", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "8px", padding: "0.3rem 0.8rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 },
};