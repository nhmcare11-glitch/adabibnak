"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, Save, User,
  Check, X, Loader2, Calendar, Search, AlertCircle,
  ChevronRight, Trash2, Plus,
} from "lucide-react";

// ─── أيام الأسبوع ──────────────────────────────────────────
const DAYS = [
  { key: "SUNDAY",    label: "الأحد"    , short: "أح" },
  { key: "MONDAY",    label: "الاثنين"  , short: "اث" },
  { key: "TUESDAY",   label: "الثلاثاء" , short: "ثل" },
  { key: "WEDNESDAY", label: "الأربعاء" , short: "أر" },
  { key: "THURSDAY",  label: "الخميس"   , short: "خم" },
  { key: "FRIDAY",    label: "الجمعة"   , short: "جم" },
  { key: "SATURDAY",  label: "السبت"    , short: "سب" },
];

const DAY_JS_INDEX = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

// خيارات الوقت كل 30 دقيقة
const TIME_OPTIONS = [];
for (let h = 0; h <= 23; h++) {
  ["00", "30"].forEach((m) => {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${m}`);
  });
}

// ─── توليد تواريخ بين تاريخين ──────────────────────────────
function generateDateRange(from, to, selectedDays) {
  const result = [];
  const cur = new Date(from);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    const dayKey = Object.keys(DAY_JS_INDEX).find(
      (k) => DAY_JS_INDEX[k] === cur.getDay()
    );
    if (selectedDays.includes(dayKey)) {
      result.push(new Date(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

// ─── تنسيق التاريخ للعرض ───────────────────────────────────
function formatDate(d) {
  return new Date(d).toLocaleDateString("ar-DZ", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}

function formatDateShort(d) {
  return new Date(d).toLocaleDateString("ar-DZ", {
    month: "short", day: "numeric",
  });
}

// ─── المكوّن الرئيسي ────────────────────────────────────────
export default function AdminAvailabilityManager({
  verifiedDoctors,
  getAvailabilityFn,
  setAvailabilityFn,
}) {
  const [searchTerm,    setSearchTerm]    = useState("");
  const [selectedDoc,   setSelectedDoc]   = useState(null);
  const [loadingSlots,  setLoadingSlots]  = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState(null);
  const [successMsg,    setSuccessMsg]    = useState(null);
  const [existingSlots, setExistingSlots] = useState([]); // slots من الـ DB
  const [statusMap,     setStatusMap]     = useState({});
  const [loadingStats,  setLoadingStats]  = useState(true);

  // ─── نموذج التوافر الجديد ──────────────────────────────
  const [form, setForm] = useState({
    dateFrom:     "",   // تاريخ البداية
    dateTo:       "",   // تاريخ النهاية
    selectedDays: [],   // الأيام المختارة
    startTime:    "09:00",
    endTime:      "17:00",
  });

  const doctors  = verifiedDoctors || [];
  const filtered = doctors.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.specialty?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q)
    );
  });

  // ─── جلب status كل طبيب ───────────────────────────────
  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      const map = {};
      await Promise.all(
        doctors.map(async (d) => {
          try {
            const ex = await getAvailabilityFn(d.id);
            map[d.id] = Array.isArray(ex) && ex.length > 0;
          } catch { map[d.id] = false; }
        })
      );
      setStatusMap(map);
      setLoadingStats(false);
    }
    if (doctors.length) loadStats();
    else setLoadingStats(false);
  }, [doctors]);

  // ─── جلب slots الطبيب المختار ──────────────────────────
  const loadDoctor = useCallback(async (doc) => {
    setLoadingSlots(true);
    setError(null);
    try {
      const ex = await getAvailabilityFn(doc.id);
      setExistingSlots(Array.isArray(ex) ? ex : []);
    } catch (e) {
      setError("تعذّر تحميل الجدول: " + (e?.message || ""));
      setExistingSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [getAvailabilityFn]);

  const handleSelectDoctor = async (doc) => {
    if (selectedDoc?.id === doc.id) {
      setSelectedDoc(null);
      setExistingSlots([]);
      return;
    }
    setSelectedDoc(doc);
    setForm({ dateFrom: "", dateTo: "", selectedDays: [], startTime: "09:00", endTime: "17:00" });
    setError(null);
    setSuccessMsg(null);
    await loadDoctor(doc);
  };

  // ─── تبديل يوم ────────────────────────────────────────
  const toggleDay = (key) =>
    setForm((p) => ({
      ...p,
      selectedDays: p.selectedDays.includes(key)
        ? p.selectedDays.filter((d) => d !== key)
        : [...p.selectedDays, key],
    }));

  // ─── اختيار سريع ──────────────────────────────────────
  const selectWorkdays = () =>
    setForm((p) => ({ ...p, selectedDays: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","SUNDAY"] }));
  const selectAll = () =>
    setForm((p) => ({ ...p, selectedDays: DAYS.map((d) => d.key) }));
  const clearDays = () => setForm((p) => ({ ...p, selectedDays: [] }));

  // ─── معاينة التواريخ التي ستُنشأ ──────────────────────
  const previewDates = form.dateFrom && form.dateTo && form.selectedDays.length
    ? generateDateRange(form.dateFrom, form.dateTo, form.selectedDays)
    : [];

  // ─── التحقق من الوقت ──────────────────────────────────
  const timeValid = (() => {
    if (!form.startTime || !form.endTime) return false;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    return eh * 60 + em > sh * 60 + sm;
  })();

  const durationMin = (() => {
    if (!timeValid) return 0;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  })();

  // ─── بناء الـ slots للإرسال ────────────────────────────
  // نبني slots بصيغة { day, isAvailable, startTime, endTime }
  // لكن الـ availability.js الحالي يعمل على أيام الأسبوع + 4 أسابيع
  // نحن نبدّل المنطق: نرسل التواريخ الحقيقية مباشرة عبر دالة جديدة

  const handleSave = async () => {
    if (!selectedDoc || saving) return;
    setError(null);
    setSuccessMsg(null);

    // تحقق
    if (!form.dateFrom || !form.dateTo) {
      setError("حدد تاريخ البداية والنهاية"); return;
    }
    if (new Date(form.dateTo) < new Date(form.dateFrom)) {
      setError("تاريخ النهاية يجب أن يكون بعد البداية"); return;
    }
    if (!form.selectedDays.length) {
      setError("اختر يوماً واحداً على الأقل"); return;
    }
    if (!timeValid) {
      setError("وقت النهاية يجب أن يكون بعد وقت البداية"); return;
    }
    if (previewDates.length === 0) {
      setError("لا توجد أيام متطابقة في هذا النطاق"); return;
    }

    setSaving(true);
    try {
      // نحوّل التواريخ الحقيقية إلى slots بصيغة { day, isAvailable, startTime, endTime }
      // ثم نستخدم setAvailabilityFn الموجودة — لكنها تعمل على أيام أسبوع
      // لذا نستدعي دالة جديدة setDoctorAvailabilityByDates إذا وُجدت
      // وإلا نرسل للـ availability.js القديم كـ fallback

      const slotsPayload = previewDates.map((date) => ({
        date:      date.toISOString().split("T")[0], // "2026-06-03"
        startTime: form.startTime,
        endTime:   form.endTime,
      }));

      // نستخدم setAvailabilityFn الجديدة التي ستقبل { dates: [...] }
      const result = await setAvailabilityFn(selectedDoc.id, slotsPayload, "DATES");

      if (result?.success) {
        const count = result.createdSlots ?? previewDates.length;
        setSuccessMsg(`✅ تم الحفظ — أُنشئ ${count} slot لـ ${previewDates.length} يوم`);
        setStatusMap((p) => ({ ...p, [selectedDoc.id]: true }));
        await loadDoctor(selectedDoc);
        // reset form
        setForm({ dateFrom: "", dateTo: "", selectedDays: [], startTime: "09:00", endTime: "17:00" });
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setError(result?.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (e) {
      setError("خطأ: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  // ─── stats ────────────────────────────────────────────
  const total       = doctors.length;
  const withSched   = Object.values(statusMap).filter(Boolean).length;
  const withoutSched = total - withSched;

  // ─── حساب الـ slots القادمة من الـ DB ─────────────────
  const now = new Date();
  const futureSlots = existingSlots
    .filter((s) => new Date(s.startTime) >= now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // تجميع الـ slots حسب اليوم للعرض
  const slotsByDay = {};
  futureSlots.forEach((s) => {
    const dk = new Date(s.startTime).toISOString().split("T")[0];
    if (!slotsByDay[dk]) slotsByDay[dk] = [];
    slotsByDay[dk].push(s);
  });

  return (
    <div>
      {/* ─── إحصائيات ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { val: total,       label: "إجمالي الأطباء", color: "#4c82fa", bg: "rgba(76,130,250,0.08)" },
          { val: withSched,   label: "لديهم جدول",      color: "#10b981", bg: "rgba(16,185,129,0.08)" },
          { val: withoutSched,label: "بدون جدول",       color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
        ].map(({ val, label, color, bg }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${color}30`, borderRadius: 16, padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color }}>
              {loadingStats ? <Loader2 size={24} style={{ animation: "spin 1s linear infinite", display: "inline-block" }} /> : val}
            </div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>

        {/* ─── قائمة الأطباء ─────────────────────────── */}
        <div className="chart-card" style={{ padding: "16px 0" }}>
          <div style={{ padding: "0 16px 12px", borderBottom: "1px solid var(--glass-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 12px" }}>
              <Search size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
              <input
                type="text"
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: "none", border: "none", outline: "none", color: "white", fontSize: "0.8rem", width: "100%", fontFamily: "inherit" }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 520, overflowY: "auto", padding: "8px 0" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: "0.8rem" }}>لا يوجد أطباء</div>
            ) : filtered.map((doc) => {
              const hasSched = statusMap[doc.id];
              const isSel    = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoctor(doc)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", transition: "all 0.15s", background: isSel ? "rgba(76,130,250,0.12)" : "transparent", borderLeft: `3px solid ${isSel ? "#4c82fa" : "transparent"}` }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#4c82fa,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>
                    {doc.name?.charAt(0) || "د"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.82rem", color: isSel ? "white" : "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      د. {doc.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {doc.specialty || doc.email}
                    </div>
                  </div>
                  {!loadingStats && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: hasSched ? "#10b981" : "#f59e0b" }} title={hasSched ? "لديه جدول" : "بدون جدول"} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── محرر الجدول ───────────────────────────── */}
        <div>
          {!selectedDoc ? (
            <div className="chart-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, color: "var(--text-muted)", gap: 16 }}>
              <Calendar size={48} style={{ opacity: 0.2 }} />
              <p style={{ fontSize: "0.9rem" }}>اختر طبيباً من القائمة</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* ─── فورم إضافة توافر جديد ─────────────── */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div style={{ fontWeight: 700 }}>➕ إضافة توافر — د. {selectedDoc.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                      {selectedDoc.specialty} • حدد النطاق الزمني والأيام
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "10px 16px", marginBottom: 16, fontSize: "0.8rem", color: "#ef4444", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                {successMsg && (
                  <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, padding: "10px 16px", marginBottom: 16, fontSize: "0.8rem", color: "#10b981", display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={14} /> {successMsg}
                  </div>
                )}

                {/* نطاق التاريخ */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>📅 من تاريخ</label>
                    <input
                      type="date"
                      value={form.dateFrom}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setForm((p) => ({ ...p, dateFrom: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(76,130,250,0.3)", borderRadius: 10, padding: "9px 12px", color: "white", fontFamily: "inherit", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>📅 إلى تاريخ</label>
                    <input
                      type="date"
                      value={form.dateTo}
                      min={form.dateFrom || new Date().toISOString().split("T")[0]}
                      onChange={(e) => setForm((p) => ({ ...p, dateTo: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(76,130,250,0.3)", borderRadius: 10, padding: "9px 12px", color: "white", fontFamily: "inherit", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {/* اختيار الأيام */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={selectWorkdays} style={{ fontSize: "0.7rem", padding: "4px 10px", borderRadius: 20, background: "rgba(76,130,250,0.15)", border: "1px solid rgba(76,130,250,0.3)", color: "#4c82fa", cursor: "pointer", fontFamily: "inherit" }}>أيام العمل</button>
                      <button onClick={selectAll}      style={{ fontSize: "0.7rem", padding: "4px 10px", borderRadius: 20, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", cursor: "pointer", fontFamily: "inherit" }}>الكل</button>
                      <button onClick={clearDays}      style={{ fontSize: "0.7rem", padding: "4px 10px", borderRadius: 20, background: "rgba(239,68,68,0.1)",   border: "1px solid rgba(239,68,68,0.25)",  color: "#ef4444", cursor: "pointer", fontFamily: "inherit" }}>مسح</button>
                    </div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>اختر أيام الأسبوع</label>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {DAYS.map((d) => {
                      const active = form.selectedDays.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          onClick={() => toggleDay(d.key)}
                          style={{ padding: "8px 14px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", background: active ? "#4c82fa" : "rgba(255,255,255,0.05)", border: `1px solid ${active ? "#4c82fa" : "rgba(255,255,255,0.1)"}`, color: active ? "white" : "var(--text-muted)" }}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* وقت البداية والنهاية */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end", marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>⏰ وقت البداية</label>
                    <select
                      value={form.startTime}
                      onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(76,130,250,0.3)", borderRadius: 10, padding: "9px 12px", color: "white", fontFamily: "inherit", fontSize: "0.85rem", cursor: "pointer" }}
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t} style={{ background: "#1e293b" }}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>⏰ وقت النهاية</label>
                    <select
                      value={form.endTime}
                      onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(76,130,250,0.3)", borderRadius: 10, padding: "9px 12px", color: "white", fontFamily: "inherit", fontSize: "0.85rem", cursor: "pointer" }}
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t} style={{ background: "#1e293b" }}>{t}</option>)}
                    </select>
                  </div>
                  {timeValid && (
                    <div style={{ padding: "9px 14px", borderRadius: 10, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {Math.floor(durationMin / 60) > 0 ? `${Math.floor(durationMin / 60)}س ` : ""}{durationMin % 60 > 0 ? `${durationMin % 60}د` : ""}
                    </div>
                  )}
                </div>

                {/* معاينة الأيام */}
                {previewDates.length > 0 && (
                  <div style={{ marginBottom: 18, padding: 14, background: "rgba(76,130,250,0.06)", border: "1px solid rgba(76,130,250,0.2)", borderRadius: 14 }}>
                    <div style={{ fontSize: "0.8rem", color: "#4c82fa", fontWeight: 700, marginBottom: 10 }}>
                      📋 سيتم إنشاء {previewDates.length} يوم:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {previewDates.slice(0, 12).map((d, i) => (
                        <span key={i} style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: 20, background: "rgba(76,130,250,0.15)", color: "#93c5fd", border: "1px solid rgba(76,130,250,0.25)" }}>
                          {formatDateShort(d)}
                        </span>
                      ))}
                      {previewDates.length > 12 && (
                        <span style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: 20, background: "rgba(76,130,250,0.1)", color: "var(--text-muted)" }}>
                          +{previewDates.length - 12} أخرى
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      من {form.startTime} إلى {form.endTime} • كل يوم مخصص لـ {durationMin} دقيقة
                    </div>
                  </div>
                )}

                {/* زر الحفظ */}
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving || loadingSlots || !previewDates.length || !timeValid}
                  style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.9rem" }}
                >
                  {saving
                    ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> جاري الحفظ...</>
                    : <><Save size={16} /> حفظ التوافر ({previewDates.length} يوم)</>
                  }
                </button>
              </div>

              {/* ─── الـ slots الموجودة ─────────────────────── */}
              <div className="chart-card">
                <div className="chart-header">
                  <div style={{ fontWeight: 700 }}>📅 التوافر الحالي لد. {selectedDoc.name}</div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {futureSlots.length} slot قادم
                  </span>
                </div>

                {loadingSlots ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                    <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#4c82fa" }} />
                  </div>
                ) : futureSlots.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    <Calendar size={36} style={{ opacity: 0.2, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
                    <p style={{ fontSize: "0.85rem" }}>لا يوجد توافر مضاف بعد</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(slotsByDay).map(([dateKey, daySlots]) => {
                      const firstSlot   = daySlots[0];
                      const lastSlot    = daySlots[daySlots.length - 1];
                      const statusColor = {
                        AVAILABLE: "#10b981", BOOKED: "#4c82fa", BLOCKED: "rgba(255,255,255,0.3)"
                      };
                      return (
                        <div key={dateKey} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", direction: "rtl" }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {daySlots.map((s) => (
                              <span key={s.id} style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 20, background: (statusColor[s.status] || "#aaa") + "20", color: statusColor[s.status] || "#aaa", border: `1px solid ${statusColor[s.status] || "#aaa"}30` }}>
                                {{ AVAILABLE: "متاح", BOOKED: "محجوز", BLOCKED: "محظور" }[s.status]}
                              </span>
                            ))}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "white" }}>
                              {formatDate(firstSlot.startTime)}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {new Date(firstSlot.startTime).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                              {" — "}
                              {new Date(lastSlot.endTime).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}