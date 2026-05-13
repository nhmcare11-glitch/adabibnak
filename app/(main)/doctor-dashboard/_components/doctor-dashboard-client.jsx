"use client";

/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  DOCTOR DASHBOARD  — نسخة Premium المحسّنة                  │
 * │  التحسينات الجوهرية:                                         │
 * │  ✅ Sidebar ثابت على Desktop (240px) + Collapse (64px)       │
 * │  ✅ Hero Welcome Section مع greeting ومؤشر الموعد القادم     │
 * │  ✅ Quick Actions bar                                         │
 * │  ✅ Date Separators في قائمة المواعيد (اليوم/غداً/الأسبوع)   │
 * │  ✅ 8px Grid System موحّد للـ Spacing                         │
 * │  ✅ Typography Scale واضح (32/20/16/14/12)                    │
 * │  ✅ Active Sidebar State محسّن بـ background + accent bar     │
 * │  ✅ Animated notification dropdown                            │
 * │  ✅ Responsive: Desktop static sidebar / Mobile drawer        │
 * └─────────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useTransition, useRef } from "react";
import {
  Calendar, Clock, MessageCircle, Star, CheckCircle,
  Stethoscope, Shield, Bell, Search, ChevronLeft,
  Activity, CreditCard, AlertCircle,
  LogOut, Settings, Home, Users, Video, X, Sun, Moon,
  ArrowUpRight, ArrowDownRight, Heart,
  Pill, ClipboardList, AlertTriangle,
  BarChart2, DollarSign, Check, Timer, Zap,
  Menu, TrendingUp, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { approvePayment, rejectPayment } from "@/actions/payment";
import dynamic from "next/dynamic";

const ConversationsList = dynamic(
  () => import("@/components/conversations-list"),
  { ssr: false }
);

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const TOKENS = {
  dark: {
    bg:           "#050e0e",
    surface:      "#071515",
    card:         "#0b1c1c",
    cardHover:    "#0e2424",
    sidebar:      "#060f0f",
    border:       "rgba(20,184,166,0.10)",
    borderStrong: "rgba(20,184,166,0.22)",
    borderHover:  "rgba(20,184,166,0.32)",
    text:         "#e8f5f3",
    textSub:      "#6ba8a2",
    textMuted:    "#2e5a56",
    teal:         "#14b8a6",
    tealLight:    "#2dd4bf",
    tealDim:      "rgba(20,184,166,0.12)",
    tealGlow:     "rgba(20,184,166,0.06)",
    green:        "#22c55e",
    greenDim:     "rgba(34,197,94,0.12)",
    amber:        "#f59e0b",
    amberDim:     "rgba(245,158,11,0.12)",
    red:          "#ef4444",
    redDim:       "rgba(239,68,68,0.12)",
    blue:         "#38bdf8",
    blueDim:      "rgba(56,189,248,0.12)",
    purple:       "#a78bfa",
    purpleDim:    "rgba(167,139,250,0.12)",
    shadow:       "0 24px 48px rgba(0,0,0,0.6)",
    shadowCard:   "0 2px 16px rgba(0,0,0,0.3)",
    shadowSm:     "0 1px 6px rgba(0,0,0,0.2)",
    input:        "rgba(255,255,255,0.04)",
  },
  light: {
    bg:           "#eef7f6",
    surface:      "#ffffff",
    card:         "#ffffff",
    cardHover:    "#f0fdfa",
    sidebar:      "#f8fffe",
    border:       "rgba(13,115,119,0.12)",
    borderStrong: "rgba(13,115,119,0.24)",
    borderHover:  "rgba(13,115,119,0.36)",
    text:         "#082220",
    textSub:      "#2a6460",
    textMuted:    "#83b8b3",
    teal:         "#0d7377",
    tealLight:    "#14a085",
    tealDim:      "rgba(13,115,119,0.10)",
    tealGlow:     "rgba(13,115,119,0.05)",
    green:        "#16a34a",
    greenDim:     "rgba(22,163,74,0.10)",
    amber:        "#d97706",
    amberDim:     "rgba(217,119,6,0.10)",
    red:          "#dc2626",
    redDim:       "rgba(220,38,38,0.10)",
    blue:         "#0369a1",
    blueDim:      "rgba(3,105,161,0.10)",
    purple:       "#7c3aed",
    purpleDim:    "rgba(124,58,237,0.10)",
    shadow:       "0 24px 48px rgba(13,115,119,0.14)",
    shadowCard:   "0 2px 16px rgba(13,115,119,0.07)",
    shadowSm:     "0 1px 6px rgba(13,115,119,0.06)",
    input:        "rgba(13,115,119,0.04)",
  },
};

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function greetAr() {
  const h = new Date().getHours();
  if (h < 5)  return "مساء الخير";
  if (h < 12) return "صباح الخير";
  if (h < 17) return "مرحباً";
  if (h < 20) return "مساء الخير";
  return "مساء النور";
}

function cm(t) {
  return {
    teal:   [t.teal,   t.tealDim],
    green:  [t.green,  t.greenDim],
    amber:  [t.amber,  t.amberDim],
    red:    [t.red,    t.redDim],
    blue:   [t.blue,   t.blueDim],
    purple: [t.purple, t.purpleDim],
  };
}

const PAY_LABELS = { CASH: "💵 نقدي", CARD: "💳 بطاقة", FREE: "🆓 مجاني", DEFERRED: "⏳ مؤجل" };

function groupByDate(appointments) {
  const todayStr    = new Date().toDateString();
  const tomorrowStr = new Date(Date.now() + 86400000).toDateString();
  const groups = [];
  const map    = {};
  appointments.forEach(a => {
    const d = new Date(a.startTime).toDateString();
    let label;
    if (d === todayStr)    label = "اليوم";
    else if (d === tomorrowStr) label = "غداً";
    else label = new Date(a.startTime).toLocaleDateString("ar", { weekday: "long", month: "long", day: "numeric" });
    if (!map[d]) { map[d] = { label, items: [] }; groups.push(map[d]); }
    map[d].items.push(a);
  });
  return groups;
}

// ═══════════════════════════════════════════════════════════════
// MICRO COMPONENTS
// ═══════════════════════════════════════════════════════════════
function Badge({ label, colorKey = "teal", size = "sm", t }) {
  const [ac, dim] = cm(t)[colorKey] || [t.teal, t.tealDim];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: size === "sm" ? "2px 8px" : "4px 12px",
      borderRadius: "20px", fontWeight: 700,
      fontSize: size === "sm" ? "11px" : "13px",
      background: dim, color: ac, border: `1px solid ${ac}30`,
    }}>{label}</span>
  );
}

function Avatar({ name, size = 40, colorKey, t }) {
  const bg = colorKey
    ? `linear-gradient(135deg,${cm(t)[colorKey]?.[0] || t.red},${t.tealLight})`
    : `linear-gradient(135deg,${t.teal},${t.tealLight})`;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: bg, display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff",
      fontWeight: 700, fontSize: size * 0.4,
    }}>
      {(name || "م").charAt(0)}
    </div>
  );
}

function IconBox({ icon: Icon, colorKey = "teal", size = 36, t }) {
  const [ac, dim] = cm(t)[colorKey] || [t.teal, t.tealDim];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: dim, border: `1px solid ${ac}25`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={size * 0.45} color={ac} />
    </div>
  );
}

function Card({ children, t, style = {} }) {
  return (
    <div style={{
      background: t.card, border: `1px solid ${t.border}`,
      borderRadius: "20px", boxShadow: t.shadowCard, overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, icon: Icon, action, actionLabel, badge, badgeColorKey, t }) {
  return (
    <div style={{
      padding: "16px 20px", borderBottom: `1px solid ${t.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between", direction: "rtl",
    }}>
      {action && (
        <button onClick={action} style={{
          fontSize: "13px", color: t.teal, background: "none", border: "none",
          cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center",
          gap: "4px", fontFamily: "inherit",
        }}>
          {actionLabel}<ChevronLeft size={13} />
        </button>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {badge > 0 && <Badge label={badge} colorKey={badgeColorKey || "amber"} t={t} />}
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: t.text, margin: 0 }}>{title}</h3>
        {Icon && <IconBox icon={Icon} size={30} t={t} />}
      </div>
    </div>
  );
}

function DateSeparator({ label, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0 12px", direction: "rtl" }}>
      <div style={{ flex: 1, height: "1px", background: t.border }} />
      <span style={{
        fontSize: "12px", fontWeight: 700, color: t.textMuted,
        padding: "3px 12px", borderRadius: "20px",
        background: t.tealGlow, border: `1px solid ${t.border}`, whiteSpace: "nowrap",
      }}>{label}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, message, sub, action, actionLabel, t }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: t.textMuted }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: t.tealGlow, border: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
      }}>
        <Icon size={28} color={t.textMuted} />
      </div>
      <p style={{ fontSize: "16px", margin: "0 0 6px", color: t.textSub, fontWeight: 600 }}>{message}</p>
      {sub && <p style={{ fontSize: "13px", margin: "0 0 16px", color: t.textMuted }}>{sub}</p>}
      {action && (
        <button onClick={action} style={{
          padding: "9px 20px", borderRadius: "12px",
          background: `linear-gradient(135deg,${t.teal},${t.tealLight})`,
          color: "#fff", border: "none", cursor: "pointer",
          fontSize: "14px", fontWeight: 700, fontFamily: "inherit",
        }}>{actionLabel}</button>
      )}
    </div>
  );
}

function InfoRow({ label, value, t }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 0", borderBottom: `1px solid ${t.border}`,
    }}>
      <span style={{ fontSize: "14px", color: t.text, fontWeight: 500 }}>{value}</span>
      <span style={{ fontSize: "12px", color: t.textMuted }}>{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COUNTDOWN TIMER
// ═══════════════════════════════════════════════════════════════
function CountdownTimer({ startTime, t }) {
  const [rem, setRem]     = useState("");
  const [canJoin, setCJ]  = useState(false);
  useEffect(() => {
    function calc() {
      const d = new Date(startTime) - new Date();
      setCJ(d > 0 && d <= 30 * 60 * 1000);
      if (d <= 0) { setRem("الآن"); return; }
      const h = Math.floor(d / 3600000), m = Math.floor((d % 3600000) / 60000), s = Math.floor((d % 60000) / 1000);
      setRem(h > 0 ? `${h}س ${m}د` : m > 0 ? `${m}د ${s}ث` : `${s}ث`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "12px", fontWeight: 700,
      color: canJoin ? t.green : t.textSub,
      background: canJoin ? t.greenDim : t.tealGlow,
      padding: "3px 10px", borderRadius: "20px",
      border: `1px solid ${canJoin ? t.green + "40" : t.border}`,
    }}>
      <Timer size={11} />{rem}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// INLINE PAYMENT APPROVAL
// ═══════════════════════════════════════════════════════════════
function PaymentApprovalInline({ payment, onDone, t }) {
  const [mode, setMode]     = useState(null);
  const [method, setMethod] = useState(payment?.suggestedMethod || "CASH");
  const [amount, setAmount] = useState(payment?.amount || "");
  const [notes, setNotes]   = useState("");
  const [pending, start]    = useTransition();
  const [done, setDone]     = useState(false);
  const [err, setErr]       = useState(null);

  if (!payment || payment.status !== "PENDING_APPROVAL" || done) return null;

  const METHODS = [
    { value: "CASH", label: "💵 نقدي" }, { value: "CARD", label: "💳 بطاقة" },
    { value: "FREE", label: "🆓 مجاني" }, { value: "DEFERRED", label: "⏳ مؤجل" },
  ];
  const inp = {
    padding: "10px 14px", borderRadius: "12px", background: t.input,
    border: `1px solid ${t.border}`, color: t.text, fontSize: "14px",
    outline: "none", direction: "rtl", width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  };

  function approve() {
    setErr(null);
    if (method === "CARD" && (!amount || parseFloat(amount) <= 0)) { setErr("أدخل المبلغ للدفع بالبطاقة"); return; }
    const fd = new FormData();
    fd.set("paymentId", payment.id); fd.set("approvedMethod", method);
    if (amount) fd.set("amount", String(parseFloat(amount)));
    start(async () => { try { await approvePayment(fd); setDone(true); onDone?.(); } catch (e) { setErr(e.message); } });
  }
  function reject() {
    setErr(null);
    const fd = new FormData();
    fd.set("paymentId", payment.id); fd.set("notes", notes);
    start(async () => { try { await rejectPayment(fd); setDone(true); onDone?.(); } catch (e) { setErr(e.message); } });
  }

  return (
    <div style={{ marginTop: "12px", padding: "16px", borderRadius: "14px", background: t.amberDim, border: `1px solid ${t.amber}35`, direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: mode ? "14px" : 0 }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {mode === null && (
            <>
              <button onClick={() => setMode("approve")} style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: `1px solid ${t.green}40`, background: t.greenDim, color: t.green, fontFamily: "inherit" }}>✅ موافقة</button>
              <button onClick={() => setMode("reject")}  style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: `1px solid ${t.red}40`,   background: t.redDim,   color: t.red,   fontFamily: "inherit" }}>❌ رفض</button>
            </>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "2px" }}>اقتراح طريقة الدفع</div>
          <div style={{ fontSize: "13px", color: t.amber, fontWeight: 700 }}>{PAY_LABELS[payment.suggestedMethod]}</div>
        </div>
      </div>
      {mode === "approve" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {METHODS.map(m => (
              <button key={m.value} onClick={() => setMethod(m.value)} style={{ padding: "9px", borderRadius: "10px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", border: `1px solid ${method === m.value ? t.teal : t.border}`, background: method === m.value ? t.tealDim : t.input, color: method === m.value ? t.teal : t.textSub, transition: "all 0.15s" }}>{m.label}</button>
            ))}
          </div>
          {method !== "FREE" && <input type="number" placeholder="المبلغ (USD)" value={amount} onChange={e => setAmount(e.target.value)} style={inp} />}
          {err && <p style={{ color: t.red, fontSize: "13px", margin: 0 }}>{err}</p>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={approve} disabled={pending} style={{ flex: 1, padding: "9px", borderRadius: "10px", fontFamily: "inherit", fontSize: "13px", fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg,${t.teal},${t.tealLight})`, color: "#fff", border: "none" }}>{pending ? "..." : "تأكيد الموافقة"}</button>
            <button onClick={() => { setMode(null); setErr(null); }} style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", background: t.input, border: `1px solid ${t.border}`, color: t.textSub }}>إلغاء</button>
          </div>
        </div>
      )}
      {mode === "reject" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <textarea rows={2} placeholder="سبب الرفض (اختياري)" value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inp, resize: "none" }} />
          {err && <p style={{ color: t.red, fontSize: "13px", margin: 0 }}>{err}</p>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={reject} disabled={pending} style={{ flex: 1, padding: "9px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: t.redDim, color: t.red, border: `1px solid ${t.red}40` }}>{pending ? "..." : "تأكيد الرفض"}</button>
            <button onClick={() => { setMode(null); setErr(null); }} style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", background: t.input, border: `1px solid ${t.border}`, color: t.textSub }}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════
function StatCard({ icon: Icon, label, value, sub, colorKey = "teal", trend, onClick, t }) {
  const [ac, dim] = cm(t)[colorKey] || [t.teal, t.tealDim];
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: t.card, border: `1px solid ${hov && onClick ? t.borderStrong : t.border}`,
        borderRadius: "20px", padding: "20px", cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease", boxShadow: hov && onClick ? `0 8px 32px ${ac}18` : t.shadowCard,
        transform: hov && onClick ? "translateY(-3px)" : "none",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", bottom: -24, left: -16, width: 100, height: 100, borderRadius: "50%", background: dim, filter: "blur(28px)", pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          {trend !== undefined && (
            <span style={{ fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px", color: trend >= 0 ? t.green : t.red }}>
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(trend)}%
            </span>
          )}
        </div>
        <IconBox icon={Icon} colorKey={colorKey} size={40} t={t} />
      </div>
      <div style={{ fontSize: "32px", fontWeight: 800, color: t.text, marginBottom: "4px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: "13px", color: t.textMuted, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: "12px", color: ac, marginTop: "6px", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NAV ITEM
// ═══════════════════════════════════════════════════════════════
function NavItem({ icon: Icon, label, active, badge, onClick, t, collapsed }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={collapsed ? label : undefined}
      style={{
        width: "100%", display: "flex", alignItems: "center",
        gap: collapsed ? 0 : "11px", justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "11px" : "11px 12px",
        borderRadius: "12px", border: "none", cursor: "pointer",
        background: active
          ? `linear-gradient(135deg,${t.teal}22,${t.tealLight}12)`
          : hov ? t.tealGlow : "transparent",
        color: active ? t.teal : hov ? t.text : t.textSub,
        fontSize: "14px", fontWeight: active ? 700 : 500,
        transition: "all 0.18s ease", textAlign: "right", direction: "rtl",
        boxShadow: active ? `inset 3px 0 0 ${t.teal}` : "none",
        fontFamily: "inherit", position: "relative",
      }}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
      {!collapsed && badge > 0 && (
        <span style={{ fontSize: "10px", fontWeight: 700, minWidth: "18px", height: "18px", borderRadius: "9px", background: active ? t.teal : t.amberDim, color: active ? "#fff" : t.amber, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{badge}</span>
      )}
      {collapsed && badge > 0 && (
        <span style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", borderRadius: "50%", background: t.amber }} />
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// APPOINTMENT ROW
// ═══════════════════════════════════════════════════════════════
function AppointmentRow({ appointment, onClick, t, showPay, onRefetch }) {
  const [hov, setHov] = useState(false);
  const scMap = { SCHEDULED: { label: "مجدول", key: "teal" }, COMPLETED: { label: "مكتمل", key: "green" }, CANCELLED: { label: "ملغى", key: "red" } };
  const sc = scMap[appointment.status] || { label: "—", key: "teal" };
  const emergency  = appointment.patient?.patientProfile?.isEmergency;
  const pendingPay = appointment.payment?.status === "PENDING_APPROVAL";
  const start      = new Date(appointment.startTime);
  const canJoin    = start - new Date() <= 30 * 60 * 1000 && start > new Date();

  return (
    <div style={{ borderRadius: "16px", overflow: "hidden", border: `1px solid ${emergency ? t.red + "50" : hov ? t.borderStrong : t.border}`, marginBottom: "10px", transition: "border-color 0.18s" }}>
      <div
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: emergency ? `${t.red}0d` : hov ? t.cardHover : t.card, cursor: "pointer", transition: "background 0.18s", direction: "rtl" }}
      >
        <Avatar name={appointment.patient?.name} colorKey={emergency ? "red" : undefined} size={44} t={t} />
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginBottom: "4px", flexWrap: "wrap" }}>
            {emergency  && <Badge label="🚨 طارئ" colorKey="red"   t={t} />}
            {pendingPay && <Badge label="⏳ دفع"  colorKey="amber" t={t} />}
            <span style={{ fontSize: "15px", fontWeight: 700, color: t.text }}>{appointment.patient?.name || "مريض"}</span>
          </div>
          <div style={{ fontSize: "13px", color: t.textSub }}>
            {start.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
            {appointment.patientDescription && <span style={{ marginRight: "8px", color: t.textMuted }}>— {appointment.patientDescription.slice(0, 40)}{appointment.patientDescription.length > 40 ? "..." : ""}</span>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", flexShrink: 0 }}>
          <Badge label={sc.label} colorKey={sc.key} t={t} />
          {appointment.status === "SCHEDULED" && <CountdownTimer startTime={appointment.startTime} t={t} />}
        </div>
        {canJoin && (
          <a href={`/video-call?appointmentId=${appointment.id}`} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", borderRadius: "10px", flexShrink: 0, background: `linear-gradient(135deg,${t.teal},${t.tealLight})`, color: "#fff", fontWeight: 700, fontSize: "13px", textDecoration: "none", boxShadow: `0 4px 12px ${t.teal}40` }}>
            <Video size={13} />انضم
          </a>
        )}
        <ChevronLeft size={16} color={t.textMuted} style={{ flexShrink: 0 }} />
      </div>
      {showPay && pendingPay && (
        <div style={{ padding: "0 16px 14px", background: t.card }}>
          <PaymentApprovalInline payment={appointment.payment} onDone={onRefetch} t={t} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PATIENT DRAWER
// ═══════════════════════════════════════════════════════════════
function DrawerSection({ title, icon: Icon, children, t }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "12px", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "15px", fontWeight: 700, color: t.text }}>{title}</span>
        <IconBox icon={Icon} size={28} t={t} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{children}</div>
    </div>
  );
}

function PatientDrawer({ appointment, onClose, onRefetch, t }) {
  const profile = appointment.patient?.patientProfile;
  const rx = appointment.prescription;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 101, width: "min(460px,100vw)", background: t.card, borderLeft: `1px solid ${t.border}`, boxShadow: t.shadow, display: "flex", flexDirection: "column", direction: "rtl", overflowY: "auto", animation: "slideIn 0.25s ease" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: t.card, zIndex: 10 }}>
          <button onClick={onClose} style={{ background: t.tealGlow, border: `1px solid ${t.border}`, borderRadius: "10px", cursor: "pointer", color: t.textSub, padding: "8px", display: "flex", alignItems: "center" }}><X size={18} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "17px", fontWeight: 700, color: t.text }}>{appointment.patient?.name}</div>
              <div style={{ fontSize: "13px", color: t.textSub }}>{appointment.patient?.email}</div>
            </div>
            <Avatar name={appointment.patient?.name} size={46} t={t} />
          </div>
        </div>
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <DrawerSection title="تفاصيل الموعد" icon={Calendar} t={t}>
            <InfoRow label="الوقت" value={new Date(appointment.startTime).toLocaleString("ar", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} t={t} />
            <InfoRow label="الحالة" value={{ SCHEDULED: "🔵 مجدول", COMPLETED: "✅ مكتمل", CANCELLED: "❌ ملغى" }[appointment.status]} t={t} />
            {appointment.patientDescription && <div style={{ padding: "12px", borderRadius: "12px", background: t.tealGlow, border: `1px solid ${t.border}`, fontSize: "14px", color: t.textSub, lineHeight: 1.7, marginTop: "4px" }}>{appointment.patientDescription}</div>}
          </DrawerSection>
          {profile && (
            <DrawerSection title="الملف الطبي" icon={ClipboardList} t={t}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  ["مستوى الدخل", { LOW: "منخفض", MEDIUM: "متوسط", HIGH: "مرتفع" }[profile.incomeLevel] || "—"],
                  ["تأمين صحي",   profile.hasInsurance      ? "✓ نعم" : "لا"],
                  ["مرض مزمن",    profile.hasChronicDisease ? "⚠️ نعم" : "لا"],
                  ["حالة طارئة",  profile.isEmergency        ? "🚨 نعم" : "لا"],
                  ["المدينة",      profile.city  || "—"],
                  ["الهاتف",       profile.phone || "—"],
                ].map(([label, value], i) => (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: "12px", background: t.tealGlow, border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "3px" }}>{label}</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: t.text }}>{value}</div>
                  </div>
                ))}
              </div>
            </DrawerSection>
          )}
          {appointment.payment && (
            <DrawerSection title="بيانات الدفع" icon={CreditCard} t={t}>
              <InfoRow label="الحالة" value={{ PENDING_APPROVAL: "⏳ بانتظار موافقة", APPROVED: "✅ موافق عليه", PAID: "💰 مدفوع", REJECTED: "❌ مرفوض" }[appointment.payment.status]} t={t} />
              <InfoRow label="الطريقة المقترحة" value={PAY_LABELS[appointment.payment.suggestedMethod]} t={t} />
              {appointment.payment.amount > 0 && <InfoRow label="المبلغ" value={`$${appointment.payment.amount}`} t={t} />}
              {appointment.payment.adminCommission > 0 && <InfoRow label="عمولة الأدمن (10%)" value={`$${appointment.payment.adminCommission?.toFixed(2)}`} t={t} />}
              <PaymentApprovalInline payment={appointment.payment} onDone={onRefetch} t={t} />
            </DrawerSection>
          )}
          {rx && (
            <DrawerSection title="الوصفة الطبية" icon={Pill} t={t}>
              {rx.diagnosis && <InfoRow label="التشخيص" value={rx.diagnosis} t={t} />}
              {rx.instructions && <div style={{ fontSize: "14px", color: t.textSub, lineHeight: 1.7, padding: "10px", borderRadius: "10px", background: t.tealGlow, border: `1px solid ${t.border}` }}>{rx.instructions}</div>}
              {rx.followUpDate && <InfoRow label="موعد المتابعة" value={new Date(rx.followUpDate).toLocaleDateString("ar")} t={t} />}
            </DrawerSection>
          )}
          {appointment.status === "SCHEDULED" && (
            <a href={`/video-call?appointmentId=${appointment.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "15px", borderRadius: "16px", background: `linear-gradient(135deg,${t.teal},${t.tealLight})`, color: "#fff", fontWeight: 700, fontSize: "15px", textDecoration: "none", boxShadow: `0 8px 24px ${t.teal}40` }}>
              <Video size={18} />انضم للمكالمة الآن
            </a>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// MINI BAR CHART
// ═══════════════════════════════════════════════════════════════
function MiniBarChart({ appointments, t }) {
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const data = days.map(day => ({ label: day.toLocaleDateString("ar", { weekday: "short" }), count: appointments.filter(a => new Date(a.startTime).toDateString() === day.toDateString()).length }));
  const maxC = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "80px", padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", borderRadius: "5px 5px 0 0", height: `${(d.count / maxC) * 100}%`, minHeight: d.count > 0 ? "6px" : "2px", background: i === 6 ? `linear-gradient(to top,${t.teal},${t.tealLight})` : t.tealDim, transition: "height 0.5s ease" }} />
          </div>
          <span style={{ fontSize: "11px", color: t.textMuted }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUICK ACTIONS BAR  ✨ جديد
// ═══════════════════════════════════════════════════════════════
function QuickActions({ nextAppt, onTabChange, t }) {
  const actions = [
    { icon: Video,        label: "ابدأ مكالمة",  desc: "اتصل بمريض الآن",    colorKey: "teal",   href: nextAppt ? `/video-call?appointmentId=${nextAppt.id}` : null },
    { icon: Calendar,     label: "المواعيد",      desc: "عرض وإدارة المواعيد", colorKey: "blue",   tab: "appointments" },
    { icon: CreditCard,   label: "المدفوعات",     desc: "موافقة واستعراض",    colorKey: "amber",  tab: "payments" },
    { icon: MessageCircle,label: "المحادثات",     desc: "تواصل مع مرضاك",     colorKey: "purple", tab: "conversations" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "12px" }}>
      {actions.map((a, i) => {
        const [ac, dim] = cm(t)[a.colorKey] || [t.teal, t.tealDim];
        const [hov, setHov] = useState(false);
        const Tag = a.href ? "a" : "button";
        return (
          <Tag key={i} href={a.href} onClick={a.tab ? () => onTabChange(a.tab) : undefined}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", borderRadius: "16px", border: `1px solid ${hov ? ac + "50" : t.border}`, background: hov ? dim : t.card, cursor: "pointer", transition: "all 0.2s ease", transform: hov ? "translateY(-2px)" : "none", boxShadow: hov ? `0 8px 24px ${ac}20` : t.shadowSm, textDecoration: "none", direction: "rtl", textAlign: "right", fontFamily: "inherit" }}
          >
            <IconBox icon={a.icon} colorKey={a.colorKey} size={38} t={t} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: t.text }}>{a.label}</div>
              <div style={{ fontSize: "12px", color: t.textMuted, marginTop: "2px" }}>{a.desc}</div>
            </div>
          </Tag>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DoctorDashboardClient({
  user,
  appointments  = [],
  availabilitySlots = [],
  conversations = [],
  notifications: serverNotifs = [],
}) {
  const [dark, setDark]               = useState(true);
  const [tab, setTab]                 = useState("overview");
  const [mobileSidebar, setMobile]    = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [search, setSearch]           = useState("");
  const [apptFilter, setApptFilter]   = useState("ALL");
  const [notifOpen, setNotifOpen]     = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [appts, setAppts]             = useState(appointments);
  const notifRef                      = useRef(null);
  const t = dark ? TOKENS.dark : TOKENS.light;
  const SIDEBAR_W = collapsed ? 72 : 248;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
  }, []);

  useEffect(() => {
    function h(e) { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Stats ──
  const todayStr  = new Date().toDateString();
  const scheduled = appts.filter(a => a.status === "SCHEDULED");
  const completed = appts.filter(a => a.status === "COMPLETED");
  const todayA    = appts.filter(a => new Date(a.startTime).toDateString() === todayStr);
  const pendingP  = appts.filter(a => a.payment?.status === "PENDING_APPROVAL");
  const emergency = appts.filter(a => a.patient?.patientProfile?.isEmergency);
  const uniquePat = new Set(appts.map(a => a.patientId)).size;
  const ratings   = appts.filter(a => a.rating != null).map(a => a.rating);
  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : "—";
  const revenue   = appts.filter(a => a.payment?.status === "PAID").reduce((s, a) => s + (a.payment?.amount || 0), 0);
  const adminCut  = appts.reduce((s, a) => s + (a.payment?.adminCommission || 0), 0);
  const compPct   = appts.length ? Math.round((completed.length / appts.length) * 100) : 0;
  const nextAppt  = [...scheduled].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];

  const filtered = appts
    .filter(a => (apptFilter === "ALL" || a.status === apptFilter) && (!search || a.patient?.name?.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => { const ea = a.patient?.patientProfile?.isEmergency ? -1 : 0, eb = b.patient?.patientProfile?.isEmergency ? -1 : 0; return ea !== eb ? ea - eb : new Date(a.startTime) - new Date(b.startTime); });

  const navItems = [
    { id: "overview",      icon: Home,          label: "الرئيسية",     badge: 0 },
    { id: "appointments",  icon: Calendar,      label: "المواعيد",     badge: scheduled.length },
    { id: "payments",      icon: CreditCard,    label: "المدفوعات",    badge: pendingP.length },
    { id: "patients",      icon: Users,         label: "مرضاي",        badge: 0 },
    { id: "conversations", icon: MessageCircle, label: "المحادثات",    badge: 0 },
    { id: "availability",  icon: Clock,         label: "جدول التوافر", badge: 0 },
    { id: "stats",         icon: BarChart2,     label: "الإحصائيات",   badge: 0 },
  ];

  const TAB_LABELS = { overview: "الرئيسية", appointments: "المواعيد", payments: "المدفوعات", patients: "مرضاي", conversations: "المحادثات", availability: "جدول التوافر", stats: "الإحصائيات" };

  const mockNotifs = [
    { title: "موعد جديد",  msg: "لديك موعد جديد مع المريض أحمد بكر غداً الساعة 10 صباحاً", time: "5 دقائق",  unread: true },
    { title: "اقتراح دفع", msg: "النظام يقترح دفعاً مؤجلاً للمريض فاطمة علي",               time: "20 دقيقة", unread: true },
    { title: "موعد مكتمل", msg: "تم تسجيل جلستك مع سارة كمكتملة بنجاح",                    time: "ساعة",     unread: false },
  ];

  // ─────────────── TAB: OVERVIEW ───────────────
  const Overview = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Hero */}
      <div style={{ padding: "28px 32px", borderRadius: "24px", background: `linear-gradient(135deg,${t.teal}20 0%,${t.tealLight}08 100%)`, border: `1px solid ${t.teal}30`, direction: "rtl", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle,${t.teal}15,transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {nextAppt && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <a href={`/video-call?appointmentId=${nextAppt.id}`} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 20px", borderRadius: "12px", background: `linear-gradient(135deg,${t.teal},${t.tealLight})`, color: "#fff", fontWeight: 700, fontSize: "14px", textDecoration: "none", boxShadow: `0 6px 20px ${t.teal}40` }}>
                  <Video size={16} />انضم للموعد القادم
                </a>
                <CountdownTimer startTime={nextAppt.startTime} t={t} />
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { label: "مواعيد اليوم", value: todayA.length,    colorKey: "teal"  },
                { label: "مجدولة",        value: scheduled.length, colorKey: "blue"  },
                { label: "دفعات معلقة",  value: pendingP.length,  colorKey: "amber" },
              ].map((s, i) => {
                const [ac, dim] = cm(t)[s.colorKey];
                return (
                  <div key={i} style={{ padding: "8px 16px", borderRadius: "12px", background: dim, border: `1px solid ${ac}25`, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: ac }}>{s.value}</span>
                    <span style={{ fontSize: "13px", color: t.textSub }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "22px", fontWeight: 800, color: t.text, lineHeight: 1.2 }}>{greetAr()}،</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: t.teal, lineHeight: 1.2 }}>د. {user?.name?.split(" ")[0]}</div>
            <div style={{ fontSize: "13px", color: t.textMuted, marginTop: "6px" }}>{new Date().toLocaleDateString("ar", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
        </div>
      </div>

      {/* Emergency alert */}
      {emergency.length > 0 && (
        <div style={{ padding: "16px 20px", borderRadius: "16px", background: t.redDim, border: `1px solid ${t.red}45`, display: "flex", alignItems: "center", gap: "12px", direction: "rtl" }}>
          <AlertTriangle size={22} color={t.red} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: t.red }}>{emergency.length} حالة طارئة تستوجب الانتباه</div>
            <div style={{ fontSize: "13px", color: t.textSub, marginTop: "3px" }}>{emergency.map(a => a.patient?.name).join("، ")}</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", direction: "rtl" }}>
          <IconBox icon={Zap} size={24} t={t} />
          <span style={{ fontSize: "15px", fontWeight: 700, color: t.text }}>إجراءات سريعة</span>
        </div>
        <QuickActions nextAppt={nextAppt} onTabChange={setTab} t={t} />
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "14px" }}>
        <StatCard icon={Calendar}    label="مواعيد اليوم"   value={todayA.length}             colorKey="teal"   trend={12} sub={`${scheduled.length} مجدول`} t={t} onClick={() => setTab("appointments")} />
        <StatCard icon={Users}       label="إجمالي المرضى"  value={uniquePat}                 colorKey="blue"   trend={5}  t={t} onClick={() => setTab("patients")} />
        <StatCard icon={Star}        label="متوسط التقييم"  value={avgRating}                 colorKey="amber"  sub={ratings.length ? `من ${ratings.length} تقييم` : null} t={t} />
        <StatCard icon={CheckCircle} label="جلسات مكتملة"   value={completed.length}           colorKey="green"  sub={`${compPct}% نسبة إتمام`} t={t} />
        <StatCard icon={CreditCard}  label="دفعات معلقة"    value={pendingP.length}            colorKey="amber"  t={t} onClick={() => setTab("payments")} />
        <StatCard icon={DollarSign}  label="إجمالي الدخل"   value={`$${revenue.toFixed(0)}`}  colorKey="teal"   sub={adminCut > 0 ? `عمولة: $${adminCut.toFixed(0)}` : null} t={t} onClick={() => setTab("stats")} />
        <StatCard icon={Activity}    label="نسبة الإتمام"   value={`${compPct}%`}             colorKey="green"  t={t} />
        <StatCard icon={AlertCircle} label="حالات طارئة"    value={emergency.length}           colorKey="red"    t={t} />
      </div>

      {/* Upcoming appointments grouped */}
      <Card t={t}>
        <SectionHeader title="المواعيد القادمة" icon={Calendar} action={() => setTab("appointments")} actionLabel="عرض الكل" t={t} />
        <div style={{ padding: "16px" }}>
          {scheduled.length > 0 ? (() => {
            const grps = groupByDate(scheduled.slice(0, 6));
            return grps.map((g, gi) => (
              <div key={gi}>
                <DateSeparator label={g.label} t={t} />
                {g.items.map(a => <AppointmentRow key={a.id} appointment={a} onClick={() => setSelectedAppt(a)} t={t} showPay onRefetch={() => setAppts(p => [...p])} />)}
              </div>
            ));
          })()
          : <EmptyState icon={Calendar} message="لا توجد مواعيد قادمة" t={t} />}
        </div>
      </Card>

      {/* Pending payments */}
      {pendingP.length > 0 && (
        <Card t={t}>
          <SectionHeader title="دفعات بانتظار موافقتك" icon={CreditCard} action={() => setTab("payments")} actionLabel="عرض الكل" badge={pendingP.length} t={t} />
          <div style={{ padding: "16px" }}>
            {pendingP.slice(0, 3).map(a => <AppointmentRow key={a.id} appointment={a} onClick={() => setSelectedAppt(a)} t={t} showPay onRefetch={() => setAppts(p => [...p])} />)}
          </div>
        </Card>
      )}
    </div>
  );

  // ─────────────── TAB: APPOINTMENTS ───────────────
  const Appointments = () => {
    const groups = groupByDate(filtered);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", direction: "rtl", padding: "16px 20px", background: t.card, borderRadius: "16px", border: `1px solid ${t.border}` }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={15} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: t.textMuted, pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم المريض..." style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: "12px", color: t.text, padding: "10px 40px 10px 14px", fontSize: "14px", outline: "none", direction: "rtl", width: "100%", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["ALL", "SCHEDULED", "COMPLETED", "CANCELLED"].map(f => (
              <button key={f} onClick={() => setApptFilter(f)} style={{ padding: "9px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: apptFilter === f ? `linear-gradient(135deg,${t.teal},${t.tealLight})` : t.input, border: `1px solid ${apptFilter === f ? t.teal : t.border}`, color: apptFilter === f ? "#fff" : t.textSub, transition: "all 0.15s" }}>
                {{ ALL: "الكل", SCHEDULED: "مجدول", COMPLETED: "مكتمل", CANCELLED: "ملغى" }[f]}
              </button>
            ))}
          </div>
        </div>
        <Card t={t}>
          <div style={{ padding: "16px" }}>
            {groups.length > 0
              ? groups.map((g, gi) => (
                <div key={gi}>
                  <DateSeparator label={g.label} t={t} />
                  {g.items.map(a => <AppointmentRow key={a.id} appointment={a} onClick={() => setSelectedAppt(a)} t={t} showPay onRefetch={() => setAppts(p => [...p])} />)}
                </div>
              ))
              : <EmptyState icon={Calendar} message="لا توجد مواعيد" sub="جرّب تغيير الفلتر" t={t} />}
          </div>
        </Card>
      </div>
    );
  };

  // ─────────────── TAB: PAYMENTS ───────────────
  const Payments = () => {
    const groups = [
      { key: "PENDING_APPROVAL", label: "بانتظار موافقتك", colorKey: "amber" },
      { key: "APPROVED",         label: "موافق عليه",       colorKey: "teal"  },
      { key: "PAID",             label: "مدفوع",            colorKey: "green" },
      { key: "REJECTED",         label: "مرفوض",            colorKey: "red"   },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "12px" }}>
          <StatCard icon={DollarSign} label="إجمالي الدخل"  value={`$${revenue.toFixed(0)}`}           colorKey="teal"  t={t} />
          <StatCard icon={CreditCard} label="عمولة الأدمن"  value={`$${adminCut.toFixed(0)}`}          colorKey="amber" t={t} />
          <StatCard icon={TrendingUp} label="صافي الدخل"    value={`$${(revenue - adminCut).toFixed(0)}`} colorKey="green" t={t} />
          <StatCard icon={Clock}      label="معلق"           value={pendingP.length}                    colorKey="amber" t={t} />
        </div>
        {groups.map(g => {
          const items = appts.filter(a => a.payment?.status === g.key);
          if (!items.length) return null;
          return (
            <Card key={g.key} t={t}>
              <SectionHeader title={g.label} badge={items.length} badgeColorKey={g.colorKey} t={t} />
              <div style={{ padding: "16px" }}>
                {items.map(a => <AppointmentRow key={a.id} appointment={a} onClick={() => setSelectedAppt(a)} t={t} showPay={g.key === "PENDING_APPROVAL"} onRefetch={() => setAppts(p => [...p])} />)}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  // ─────────────── TAB: PATIENTS ───────────────
  const Patients = () => {
    const pm = {};
    appts.forEach(a => { if (!a.patientId) return; if (!pm[a.patientId]) pm[a.patientId] = { patient: a.patient, appointments: [] }; pm[a.patientId].appointments.push(a); });
    const patients = Object.values(pm);
    return (
      <Card t={t}>
        <SectionHeader title={`مرضاي (${patients.length})`} icon={Users} t={t} />
        <div style={{ padding: "16px" }}>
          {patients.length > 0 ? patients.map(({ patient, appointments: pA }, i) => {
            const last = [...pA].sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0];
            const pr = patient?.patientProfile;
            const [hov, setHov] = useState(false);
            return (
              <div key={i} onClick={() => setSelectedAppt(last)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: "16px", cursor: "pointer", marginBottom: "8px", border: `1px solid ${hov ? t.borderStrong : t.border}`, background: hov ? t.cardHover : t.card, direction: "rtl", transition: "all 0.18s" }}
              >
                <ChevronLeft size={16} color={t.textMuted} />
                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ fontSize: "13px", color: t.textSub }}>{pA.length} موعد — آخرها {new Date(last.startTime).toLocaleDateString("ar", { month: "short", day: "numeric" })}</div>
                  <div style={{ display: "flex", gap: "5px", justifyContent: "flex-end", marginTop: "5px", flexWrap: "wrap" }}>
                    {pr?.hasInsurance      && <Badge label="تأمين" colorKey="blue"  t={t} />}
                    {pr?.hasChronicDisease && <Badge label="مزمن"  colorKey="amber" t={t} />}
                    {pr?.isEmergency       && <Badge label="طارئ"  colorKey="red"   t={t} />}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: t.text }}>{patient?.name || "مريض"}</div>
                  <div style={{ fontSize: "12px", color: t.textMuted }}>{patient?.email}</div>
                </div>
                <Avatar name={patient?.name} size={44} t={t} />
              </div>
            );
          }) : <EmptyState icon={Users} message="لا يوجد مرضى بعد" t={t} />}
        </div>
      </Card>
    );
  };

  // ─────────────── TAB: STATS ───────────────
  const Stats = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card t={t}>
        <SectionHeader title="المواعيد — آخر 7 أيام" icon={BarChart2} t={t} />
        <div style={{ padding: "24px" }}><MiniBarChart appointments={appts} t={t} /></div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px" }}>
        {[
          { label: "نقدي",  value: appts.filter(a => a.payment?.approvedMethod === "CASH").length,     icon: DollarSign, colorKey: "green"  },
          { label: "بطاقة", value: appts.filter(a => a.payment?.approvedMethod === "CARD").length,     icon: CreditCard, colorKey: "blue"   },
          { label: "مجاني", value: appts.filter(a => a.payment?.approvedMethod === "FREE").length,     icon: Heart,      colorKey: "purple" },
          { label: "مؤجل",  value: appts.filter(a => a.payment?.approvedMethod === "DEFERRED").length, icon: Clock,      colorKey: "amber"  },
        ].map((s, i) => <StatCard key={i} {...s} t={t} />)}
      </div>
      <Card t={t}>
        <SectionHeader title="ملخص مالي" icon={DollarSign} t={t} />
        <div style={{ padding: "20px 24px", direction: "rtl" }}>
          {[
            ["إجمالي الدخل",      `$${revenue.toFixed(2)}`,              "teal"],
            ["عمولة الأدمن",       `$${adminCut.toFixed(2)}`,            "amber"],
            ["صافي الدخل",         `$${(revenue - adminCut).toFixed(2)}`, "green"],
            ["نسبة إتمام الجلسات", `${compPct}%`,                        "blue"],
          ].map(([label, value, colorKey], i, arr) => {
            const [ac] = cm(t)[colorKey];
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : "none" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: ac }}>{value}</span>
                <span style={{ fontSize: "14px", color: t.textSub }}>{label}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  // ─────────────── TAB: AVAILABILITY ───────────────
  const Availability = () => (
    <Card t={t}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}`, direction: "rtl", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Badge label="📋 يحدده الأدمن فقط" colorKey="amber" size="md" t={t} />
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: t.text, margin: 0 }}>جدول التوافر</h3>
      </div>
      <div style={{ padding: "16px" }}>
        {availabilitySlots.length > 0
          ? availabilitySlots.map(slot => {
            const cfg = { AVAILABLE: { colorKey: "green", label: "متاح" }, BOOKED: { colorKey: "teal", label: "محجوز" }, BLOCKED: { colorKey: "red", label: "محظور" } }[slot.status] || { colorKey: "teal", label: "—" };
            const s = new Date(slot.startTime), e = new Date(slot.endTime);
            return (
              <div key={slot.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "14px", marginBottom: "8px", border: `1px solid ${t.border}`, direction: "rtl", background: t.card }}>
                <Badge label={cfg.label} colorKey={cfg.colorKey} t={t} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: t.text }}>{s.toLocaleDateString("ar", { weekday: "long", month: "short", day: "numeric" })}</div>
                  <div style={{ fontSize: "13px", color: t.textSub }}>{s.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })} — {e.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            );
          })
          : <EmptyState icon={Clock} message="لا توجد مواعيد توافر" sub="سيتم إضافتها من قبل الإدارة" t={t} />}
      </div>
    </Card>
  );

  const tabContent = {
    overview:      <Overview />,
    appointments:  <Appointments />,
    payments:      <Payments />,
    patients:      <Patients />,
    conversations: <ConversationsList userRole="DOCTOR" />,
    availability:  <Availability />,
    stats:         <Stats />,
  };

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════
  return (
    <>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }

        /* Desktop: sidebar is sticky in flow */
        @media (min-width: 769px) {
          .sidebar-el {
            position: sticky !important;
            top: 0 !important;
            align-self: flex-start !important;
            height: 100vh !important;
            transform: none !important;
          }
          .mob-overlay { display: none !important; }
          .hamburger   { display: none !important; }
        }

        /* Mobile: sidebar is a fixed drawer */
        @media (max-width: 768px) {
          .sidebar-el {
            position: fixed !important;
            top: 0; right: 0; bottom: 0; z-index: 60;
          }
          .collapse-btn { display: none !important; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'Cairo','Tajawal',system-ui,sans-serif", direction: "rtl" }}>

        {/* Mobile overlay */}
        {mobileSidebar && (
          <div className="mob-overlay" onClick={() => setMobile(false)}
            style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }} />
        )}

        {/* ════ SIDEBAR ════ */}
        <aside
          className="sidebar-el"
          style={{
            width: `${SIDEBAR_W}px`, flexShrink: 0,
            background: t.sidebar, borderLeft: `1px solid ${t.border}`,
            display: "flex", flexDirection: "column",
            transition: "width 0.25s ease, transform 0.28s ease",
            overflowX: "hidden", overflowY: "auto",
            transform: mobileSidebar ? "translateX(0)" : "translateX(100%)",
          }}
        >
          {/* Logo */}
          <div style={{ padding: "20px 14px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: "8px", flexShrink: 0 }}>
            {!collapsed
              ? <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: t.text }}>طبيبي</span>
                  <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: `linear-gradient(135deg,${t.teal},${t.tealLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}><Stethoscope size={16} color="#fff" /></div>
                </div>
              : <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `linear-gradient(135deg,${t.teal},${t.tealLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}><Stethoscope size={18} color="#fff" /></div>
            }
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, padding: "4px", display: "flex", alignItems: "center" }}>
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <button className="hamburger" onClick={() => setMobile(false)} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, padding: "4px", display: "flex", alignItems: "center" }}>
              <X size={18} />
            </button>
          </div>

          {/* Doctor card */}
          {!collapsed && (
            <div style={{ margin: "12px 10px", padding: "14px", borderRadius: "16px", background: `${t.teal}18`, border: `1px solid ${t.teal}28`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: t.text }}>د. {user?.name}</div>
                  <div style={{ fontSize: "12px", color: t.textSub }}>{user?.specialty || "طبيب عام"}</div>
                </div>
                <Avatar name={user?.name} size={40} t={t} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px", background: user?.verificationStatus === "VERIFIED" ? t.greenDim : t.amberDim, color: user?.verificationStatus === "VERIFIED" ? t.green : t.amber, justifyContent: "flex-end" }}>
                {user?.verificationStatus === "VERIFIED" ? <Shield size={11} /> : <Clock size={11} />}
                {user?.verificationStatus === "VERIFIED" ? "حساب موثّق" : "قيد المراجعة"}
              </div>
            </div>
          )}

          {/* Nav */}
          <nav style={{ flex: 1, padding: "8px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
            {navItems.map(item => (
              <NavItem key={item.id} {...item} active={tab === item.id} collapsed={collapsed} t={t}
                onClick={() => { setTab(item.id); setMobile(false); }} />
            ))}
          </nav>

          {/* Bottom */}
          <div style={{ padding: "10px 8px", borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: "2px", flexShrink: 0 }}>
            <NavItem icon={Settings} label="الإعدادات"     collapsed={collapsed} t={t} onClick={() => {}} />
            <NavItem icon={LogOut}   label="تسجيل الخروج" collapsed={collapsed} t={t} onClick={() => {}} />
          </div>
        </aside>

        {/* ════ MAIN AREA ════ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", minWidth: 0 }}>

          {/* TOP BAR */}
          <header style={{ padding: "0 24px", height: "64px", background: t.surface, borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(16px)" }}>
            {/* Left */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button onClick={() => setDark(!dark)} style={{ width: "38px", height: "38px", borderRadius: "11px", background: t.tealGlow, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.teal }}>
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <div ref={notifRef} style={{ position: "relative" }}>
                <button onClick={() => setNotifOpen(!notifOpen)} style={{ width: "38px", height: "38px", borderRadius: "11px", background: t.tealGlow, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.textSub, position: "relative" }}>
                  <Bell size={17} />
                  <span style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", borderRadius: "50%", background: t.amber, border: `2px solid ${t.surface}` }} />
                </button>
                {notifOpen && (
                  <div style={{ position: "absolute", left: 0, top: "48px", width: "320px", background: t.card, border: `1px solid ${t.border}`, borderRadius: "18px", boxShadow: t.shadow, zIndex: 100, overflow: "hidden", animation: "fadeIn 0.18s ease" }}>
                    <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", direction: "rtl" }}>
                      <button style={{ fontSize: "12px", color: t.teal, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>تحديد الكل كمقروء</button>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: t.text }}>الإشعارات</span>
                    </div>
                    {mockNotifs.map((n, i) => (
                      <div key={i} style={{ padding: "13px 18px", borderBottom: `1px solid ${t.border}`, background: n.unread ? t.tealGlow : "transparent", direction: "rtl", display: "flex", gap: "10px", cursor: "pointer" }}>
                        {n.unread && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: t.teal, marginTop: "5px", flexShrink: 0 }} />}
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: t.text }}>{n.title}</div>
                          <div style={{ fontSize: "12px", color: t.textSub, marginTop: "3px", lineHeight: 1.6 }}>{n.msg}</div>
                          <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "4px" }}>منذ {n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Avatar name={user?.name} size={38} t={t} />
            </div>

            {/* Center */}
            <div style={{ textAlign: "right" }}>
              <h1 style={{ fontSize: "18px", fontWeight: 800, color: t.text, margin: 0, lineHeight: 1.2 }}>{TAB_LABELS[tab]}</h1>
              <p style={{ fontSize: "12px", color: t.textMuted, margin: 0 }}>{new Date().toLocaleDateString("ar", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>

            {/* Right: hamburger (mobile) */}
            <button className="hamburger" onClick={() => setMobile(true)} style={{ width: "38px", height: "38px", borderRadius: "11px", background: t.tealGlow, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.textSub }}>
              <Menu size={18} />
            </button>
            {/* Desktop spacer */}
            <div className="hamburger" style={{ width: "38px" }} aria-hidden />
          </header>

          {/* CONTENT */}
          <main style={{ flex: 1, padding: "24px", maxWidth: "1100px", width: "100%", margin: "0 auto" }}>
            {tabContent[tab]}
          </main>
        </div>

        {/* PATIENT DRAWER */}
        {selectedAppt && (
          <PatientDrawer appointment={selectedAppt} onClose={() => setSelectedAppt(null)} onRefetch={() => setAppts(p => [...p])} t={t} />
        )}
      </div>
    </>
  );
}