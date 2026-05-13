"use client";

import { useEffect, useState } from "react";
import { getMySecretarySalaries, getCurrentMonthSalary } from "@/actions/secretary";

const MONTH_NAMES = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

// ============================================================
// مكوّن راتب السكرتيرة
// ============================================================
export default function SalaryCard() {
  const [salaries, setSalaries] = useState([]);
  const [currentSalary, setCurrentSalary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [all, current] = await Promise.all([
        getMySecretarySalaries(),
        getCurrentMonthSalary(),
      ]);
      setSalaries(all.salaries || []);
      setCurrentSalary(current.salary || null);
      setLoading(false);
    }
    load();
  }, []);

  const totalEarned = salaries.filter(s => s.status === "PAID").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div style={st.wrap}>
      <h2 style={st.title}>💼 راتبي الشهري</h2>

      {/* راتب الشهر الحالي */}
      <div style={st.currentCard}>
        <div style={st.currentLabel}>
          📅 {MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()}
        </div>
        {loading ? (
          <div style={st.loadingText}>⏳ جارٍ التحميل...</div>
        ) : currentSalary ? (
          <>
            <div style={st.currentAmount}>${currentSalary.amount?.toFixed(2)}</div>
            <div style={{
              ...st.statusBadge,
              ...(currentSalary.status === "PAID" ? st.badgePaid : st.badgePending)
            }}>
              {currentSalary.status === "PAID"
                ? `✅ تم الدفع — ${currentSalary.paidAt ? new Date(currentSalary.paidAt).toLocaleDateString("ar-DZ") : ""}`
                : "⏳ في انتظار الدفع"}
            </div>
          </>
        ) : (
          <div style={st.noSalary}>لم يتم تحديد راتب هذا الشهر بعد</div>
        )}
      </div>

      {/* إجمالي ما تم دفعه */}
      {!loading && salaries.length > 0 && (
        <div style={st.totalCard}>
          <span style={st.totalLabel}>💰 إجمالي ما استلمته:</span>
          <span style={st.totalValue}>${totalEarned?.toFixed(2)}</span>
        </div>
      )}

      {/* سجل الرواتب */}
      <div style={st.historyTitle}>📋 سجل الرواتب</div>
      {loading ? (
        <div style={st.loadingText}>⏳ جارٍ التحميل...</div>
      ) : salaries.length === 0 ? (
        <div style={st.empty}>لا يوجد سجل رواتب بعد</div>
      ) : (
        <div style={st.list}>
          {salaries.map((sal) => (
            <div key={sal.id} style={st.salaryRow}>
              <div style={st.rowLeft}>
                <div style={st.rowMonth}>{sal.monthName} {sal.year}</div>
                {sal.notes && <div style={st.rowNotes}>{sal.notes}</div>}
              </div>
              <div style={st.rowRight}>
                <div style={st.rowAmount}>${sal.amount?.toFixed(2)}</div>
                <div style={{ ...st.statusBadge, ...(sal.status === "PAID" ? st.badgePaid : st.badgePending), fontSize: "0.72rem" }}>
                  {sal.status === "PAID"
                    ? `✅ ${sal.paidAt ? new Date(sal.paidAt).toLocaleDateString("ar-DZ") : "مدفوع"}`
                    : "⏳ معلق"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const st = {
  wrap: {
    direction: "rtl",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
    color: "#e2e8f0",
    maxWidth: "480px",
  },
  title: {
    fontSize: "1.2rem",
    fontWeight: 700,
    marginBottom: "1rem",
    color: "#f1f5f9",
  },
  currentCard: {
    background: "linear-gradient(135deg, #1e1b4b, #312e81)",
    border: "1px solid rgba(167,139,250,0.3)",
    borderRadius: "16px",
    padding: "1.5rem",
    marginBottom: "1rem",
    textAlign: "center",
  },
  currentLabel: {
    color: "#a78bfa",
    fontSize: "0.85rem",
    marginBottom: "0.5rem",
    fontWeight: 600,
  },
  currentAmount: {
    fontSize: "2.8rem",
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1,
    margin: "0.5rem 0",
  },
  statusBadge: {
    display: "inline-block",
    padding: "0.25rem 0.9rem",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginTop: "0.5rem",
  },
  badgePaid: {
    background: "rgba(34,197,94,0.2)",
    color: "#86efac",
    border: "1px solid rgba(34,197,94,0.3)",
  },
  badgePending: {
    background: "rgba(251,191,36,0.15)",
    color: "#fbbf24",
    border: "1px solid rgba(251,191,36,0.2)",
  },
  noSalary: {
    color: "#64748b",
    fontSize: "0.88rem",
    marginTop: "0.5rem",
  },
  totalCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(167,139,250,0.08)",
    border: "1px solid rgba(167,139,250,0.2)",
    borderRadius: "10px",
    padding: "0.75rem 1.2rem",
    marginBottom: "1.2rem",
  },
  totalLabel: { color: "#94a3b8", fontSize: "0.88rem" },
  totalValue: { fontWeight: 700, fontSize: "1.2rem", color: "#a78bfa" },
  historyTitle: {
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "#64748b",
    marginBottom: "0.7rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  list: { display: "flex", flexDirection: "column", gap: "0.6rem" },
  salaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
  },
  rowLeft: {},
  rowRight: { textAlign: "left" },
  rowMonth: { fontWeight: 600, fontSize: "0.9rem", color: "#e2e8f0" },
  rowNotes: { color: "#64748b", fontSize: "0.75rem", marginTop: "0.2rem" },
  rowAmount: { fontWeight: 700, color: "#a78bfa", fontSize: "1rem", textAlign: "left" },
  loadingText: { color: "#64748b", fontSize: "0.88rem", textAlign: "center", padding: "1rem" },
  empty: { color: "#475569", textAlign: "center", padding: "1.5rem", fontSize: "0.88rem" },
};