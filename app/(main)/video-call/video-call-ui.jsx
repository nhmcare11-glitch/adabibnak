"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Script from "next/script";

import {
  Camera, Mic, Volume2, Wifi, Signal, Minimize2, Maximize2,
  PhoneOff, FileText, Heart, Pill, AlertTriangle, Activity,
  Save, ChevronRight, User, Stethoscope, Calendar, Mail,
  Droplets, Ruler, Weight, Cigarette, Baby, Dna, X,
  ChevronDown, ChevronUp, Sparkles, FolderHeart, ClipboardList,
  Loader2, Video
} from "lucide-react";

import {
  completeAppointment,
  startVideoConsultation,
} from "@/actions/video-call";
import { getMedicalRecord } from "@/actions/medical-record";
import { saveConsultationNotes, getConsultationNotes } from "@/actions/consultation-notes";

const CHECK_ITEMS = [
  { id: "camera", label: "الكاميرا", icon: Camera, desc: "التحقق من كاميرا الويب" },
  { id: "microphone", label: "الميكروفون", icon: Mic, desc: "التحقق من الميكروفون" },
  { id: "speakers", label: "السماعات", icon: Volume2, desc: "اختبار الصوت" },
  { id: "internet", label: "سرعة الإنترنت", icon: Wifi, desc: "قياس سرعة الاتصال" },
  { id: "connection", label: "استقرار الاتصال", icon: Signal, desc: "فحص جودة الشبكة" },
];

const IDLE = "idle";
const CHECKING = "checking";
const SUCCESS = "success";
const ERROR = "error";

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function PreCallCheck({ onReady }) {
  const [status, setStatus] = useState(
    Object.fromEntries(CHECK_ITEMS.map((c) => [c.id, IDLE]))
  );
  const [details, setDetails] = useState({});
  const [stream, setStream] = useState(null);
  const [running, setRunning] = useState(false);
  const videoRef = useRef(null);

  const upd = (id, s, d = "") => {
    setStatus((p) => ({ ...p, [id]: s }));
    if (d) setDetails((p) => ({ ...p, [id]: d }));
  };

  const run = useCallback(async () => {
    setRunning(true);
    setStatus(Object.fromEntries(CHECK_ITEMS.map((c) => [c.id, IDLE])));
    setDetails({});

    upd("camera", CHECKING);
    await delay(350);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      upd("camera", SUCCESS, "تعمل بشكل طبيعي");
    } catch (e) {
      upd("camera", ERROR, e?.name === "NotAllowedError" ? "يرجى منح إذن الكاميرا" : "الكاميرا غير متاحة");
    }

    upd("microphone", CHECKING);
    await delay(300);
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(ms);
      src.connect(ctx.createAnalyser());
      await delay(250);
      ctx.close();
      upd("microphone", SUCCESS, "الميكروفون يعمل");
    } catch {
      upd("microphone", ERROR, "خطأ في الميكروفون");
    }

    upd("speakers", CHECKING);
    await delay(300);
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.06;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 520;
      osc.start();
      await delay(350);
      osc.stop();
      ctx.close();
      upd("speakers", SUCCESS, "السماعات تعمل");
    } catch {
      upd("speakers", ERROR, "تعذر اختبار السماعات");
    }

    upd("internet", CHECKING);
    await delay(250);
    try {
      const t0 = performance.now();
      await fetch("https://www.cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
      const rtt = performance.now() - t0;
      upd("internet", rtt > 800 ? ERROR : SUCCESS, `${Math.round(rtt)} ms`);
    } catch {
      upd("internet", SUCCESS, "متصل");
    }

    upd("connection", CHECKING);
    await delay(250);
    try {
      if (!navigator.onLine) throw new Error("offline");
      upd("connection", SUCCESS, "الاتصال مستقر");
    } catch {
      upd("connection", ERROR, "لا يوجد اتصال");
    }

    setRunning(false);
  }, []);

  useEffect(() => {
    run();
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-6">
      <video ref={videoRef} autoPlay muted playsInline className="w-96 rounded-2xl border border-slate-700" />
      <div className="grid grid-cols-1 gap-3 w-96">
        {CHECK_ITEMS.map((item) => {
          const Icon = item.icon;
          const st = status[item.id];
          return (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <Icon className={`w-5 h-5 ${st === SUCCESS ? "text-green-400" : st === ERROR ? "text-red-400" : st === CHECKING ? "text-blue-400 animate-pulse" : "text-slate-500"}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-slate-400">{details[item.id] || item.desc}</p>
              </div>
              {st === SUCCESS && <span className="text-green-400 text-xs">✓</span>}
              {st === ERROR && <span className="text-red-400 text-xs">✗</span>}
              {st === CHECKING && <span className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />}
            </div>
          );
        })}
      </div>
      <button
        onClick={onReady}
        disabled={running}
        className="bg-blue-600 hover:bg-blue-700 transition px-8 py-3 rounded-xl disabled:opacity-50 text-white font-semibold"
      >
        {running ? "جاري الفحص..." : "الدخول للاستشارة"}
      </button>
    </div>
  );
}

// ========== MEDICAL SIDEBAR COMPONENT ==========
function MedicalSidebar({ patientId, appointment, isDoctor, currentUserId }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({ symptoms: "", diagnosis: "", recommendations: "", prescriptionNotes: "" });
  const [savedNotes, setSavedNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dossier");
  const [expandedSections, setExpandedSections] = useState({ info: true, history: true, allergies: true, medications: true, files: true });

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      getMedicalRecord(patientId).then((res) => {
        if (res.success) setRecord(res.record);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (appointment?.id) {
      getConsultationNotes(appointment.id).then((res) => {
        if (res.success && res.notes) setNotes(res.notes);
      });
    }
  }, [appointment?.id]);

  const handleSaveNotes = async () => {
    if (!appointment?.id || !isDoctor) return;
    setSaving(true);
    const result = await saveConsultationNotes({
      appointmentId: appointment.id,
      doctorId: currentUserId,
      patientId: patientId,
      ...notes,
    });
    setSaving(false);
    if (result.success) {
      setSavedNotes(true);
      setTimeout(() => setSavedNotes(false), 2000);
    }
  };

  const toggleSection = (key) => setExpandedSections((p) => ({ ...p, [key]: !p[key] }));

  const SectionHeader = ({ icon: Icon, title, sectionKey, color = "#0d9488" }) => (
    <button onClick={() => toggleSection(sectionKey)} className="w-full flex items-center justify-between py-3 px-1 group">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-sm font-semibold text-slate-200">{title}</span>
      </div>
      {expandedSections[sectionKey] ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
    </button>
  );

  const InfoCard = ({ icon: Icon, label, value, color = "#0d9488", badge }) => {
    if (!value && !badge) return null;
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-400 mb-0.5 uppercase tracking-wide">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-100 font-medium truncate">{value || "—"}</p>
            {badge && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: `${color}25`, color }}>{badge}</span>}
          </div>
        </div>
      </div>
    );
  };

  const TagList = ({ items, color = "#0d9488" }) => {
    if (!items) return null;
    const list = items.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {list.map((item, i) => (
          <span key={i} className="px-2 py-1 rounded-md text-[11px] font-medium" style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}>
            {item}
          </span>
        ))}
      </div>
    );
  };

  if (!loading && !record) {
    return (
      <div className="h-full flex flex-col bg-[#030d1a] text-white overflow-hidden">
        <div className="p-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}>
              <FolderHeart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">الملف الطبي</h3>
              <p className="text-xs text-slate-400">{appointment?.patient?.name || "المريض"}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.12)" }}>
            <FileText className="h-7 w-7 text-slate-500" />
          </div>
          <p className="text-slate-300 text-sm font-medium mb-1">لم يقم المريض بملء الملف الطبي بعد</p>
          <p className="text-slate-500 text-xs leading-relaxed max-w-[200px]">سيتم عرض المعلومات الصحية هنا بمجرد قيام المريض بإكمال ملفه الطبي</p>
        </div>
        {isDoctor && (
          <div className="p-4 border-t border-slate-800/60">
            <button
              onClick={() => setActiveTab("notes")}
              className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}
            >
              <ClipboardList className="h-4 w-4" />
              إضافة ملاحظات طبية
            </button>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-[#030d1a] text-white items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mb-3" />
        <p className="text-slate-400 text-sm">جاري تحميل الملف الطبي...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#030d1a] text-white overflow-hidden">
      <div className="p-4 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}>
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-white truncate">ملف المريض الطبي</h3>
            <p className="text-xs text-slate-400 truncate">{record ? `${record.firstName || ""} ${record.lastName || ""}`.trim() : appointment?.patient?.name}</p>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-800/40 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("dossier")}
            className="flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all"
            style={{ background: activeTab === "dossier" ? "linear-gradient(135deg,#0d9488,#0891b2)" : "transparent", color: activeTab === "dossier" ? "#fff" : "#94a3b8" }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <FolderHeart className="h-3.5 w-3.5" />الدوسي
            </div>
          </button>
          {isDoctor && (
            <button
              onClick={() => setActiveTab("notes")}
              className="flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all"
              style={{ background: activeTab === "notes" ? "linear-gradient(135deg,#0d9488,#0891b2)" : "transparent", color: activeTab === "notes" ? "#fff" : "#94a3b8" }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />ملاحظات
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === "dossier" && (
          <>
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <SectionHeader icon={User} title="المعلومات الشخصية" sectionKey="info" color="#60a5fa" />
              <AnimatePresence>
                {expandedSections.info && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="px-2 pb-3 space-y-2 overflow-hidden">
                    <InfoCard icon={User} label="الاسم الكامل" value={`${record?.firstName || ""} ${record?.lastName || ""}`.trim()} color="#60a5fa" />
                    <InfoCard icon={User} label="الجنس" value={record?.gender} color="#60a5fa" />
                    <InfoCard icon={Calendar} label="تاريخ الميلاد" value={record?.dateOfBirth ? new Date(record.dateOfBirth).toLocaleDateString("ar-DZ") : null} color="#60a5fa" />
                    <InfoCard icon={Activity} label="العمر" value={record?.age ? `${record.age} سنة` : null} color="#60a5fa" />
                    <InfoCard icon={Mail} label="البريد الإلكتروني" value={record?.email || appointment?.patient?.email} color="#60a5fa" />
                    <InfoCard icon={Droplets} label="فصيلة الدم" value={record?.bloodType} color="#ef4444" badge={record?.bloodType} />
                    <div className="grid grid-cols-2 gap-2">
                      <InfoCard icon={Weight} label="الوزن" value={record?.weight ? `${record.weight} كغ` : null} color="#f59e0b" />
                      <InfoCard icon={Ruler} label="الطول" value={record?.height ? `${record.height} سم` : null} color="#f59e0b" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <SectionHeader icon={Activity} title="التاريخ المرضي" sectionKey="history" color="#8b5cf6" />
              <AnimatePresence>
                {expandedSections.history && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="px-2 pb-3 space-y-2 overflow-hidden">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-amber-400" /><span className="text-xs font-semibold text-slate-300">الأمراض المزمنة</span></div>
                      <TagList items={record?.chronicDiseases} color="#f59e0b" />
                      {!record?.chronicDiseases && <p className="text-xs text-slate-500 mt-1">لا يوجد أمراض مزمنة مسجلة</p>}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-2 mb-2"><Activity className="h-4 w-4 text-violet-400" /><span className="text-xs font-semibold text-slate-300">العمليات الجراحية السابقة</span></div>
                      <p className="text-xs text-slate-300 leading-relaxed">{record?.previousSurgeries || "لا توجد عمليات مسجلة"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-2 mb-2"><Dna className="h-4 w-4 text-rose-400" /><span className="text-xs font-semibold text-slate-300">الأمراض الوراثية</span></div>
                      <TagList items={record?.familyDiseases} color="#f43f5e" />
                      {!record?.familyDiseases && <p className="text-xs text-slate-500 mt-1">لا توجد أمراض وراثية مسجلة</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InfoCard icon={Cigarette} label="التدخين" value={record?.smokingStatus} color="#64748b" />
                      <InfoCard icon={Baby} label="الحمل" value={record?.pregnancyStatus} color="#ec4899" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <SectionHeader icon={AlertTriangle} title="الحساسية" sectionKey="allergies" color="#f59e0b" />
              <AnimatePresence>
                {expandedSections.allergies && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="px-2 pb-3 overflow-hidden">
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <TagList items={record?.allergies} color="#f59e0b" />
                      {!record?.allergies && <div className="flex items-center gap-2 text-slate-500"><Sparkles className="h-3.5 w-3.5" /><span className="text-xs">لا توجد حساسية مسجلة</span></div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <SectionHeader icon={Pill} title="الأدوية الحالية" sectionKey="medications" color="#8b5cf6" />
              <AnimatePresence>
                {expandedSections.medications && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="px-2 pb-3 overflow-hidden">
                    <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
                      <TagList items={record?.currentMedications} color="#8b5cf6" />
                      {!record?.currentMedications && <div className="flex items-center gap-2 text-slate-500"><Pill className="h-3.5 w-3.5" /><span className="text-xs">لا توجد أدوية حالية</span></div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <SectionHeader icon={FileText} title="وصف الحالة" sectionKey="files" color="#10b981" />
              <AnimatePresence>
                {expandedSections.files && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="px-2 pb-3 overflow-hidden">
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                      <p className="text-xs text-slate-300 leading-relaxed">{appointment?.patientDescription || "لا يوجد وصف للحالة"}</p>
                    </div>
                    <div className="mt-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-2 mb-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /><span className="text-[11px] text-slate-400">تاريخ الموعد</span></div>
                      <p className="text-sm text-slate-200">{appointment?.startTime ? new Date(appointment.startTime).toLocaleDateString("ar-DZ", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {activeTab === "notes" && isDoctor && (
          <div className="space-y-4">
            <div className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <label className="flex items-center gap-2 text-xs text-slate-400 mb-2"><Activity className="h-3.5 w-3.5" />الأعراض</label>
              <textarea value={notes.symptoms || ""} onChange={(e) => setNotes((p) => ({ ...p, symptoms: e.target.value }))} placeholder="أعراض المريض..." rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500/60 transition-colors resize-none" />
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <label className="flex items-center gap-2 text-xs text-slate-400 mb-2"><Stethoscope className="h-3.5 w-3.5" />التشخيص</label>
              <textarea value={notes.diagnosis || ""} onChange={(e) => setNotes((p) => ({ ...p, diagnosis: e.target.value }))} placeholder="التشخيص الطبي..." rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500/60 transition-colors resize-none" />
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <label className="flex items-center gap-2 text-xs text-slate-400 mb-2"><Heart className="h-3.5 w-3.5" />التوصيات</label>
              <textarea value={notes.recommendations || ""} onChange={(e) => setNotes((p) => ({ ...p, recommendations: e.target.value }))} placeholder="التوصيات العلاجية..." rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500/60 transition-colors resize-none" />
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <label className="flex items-center gap-2 text-xs text-slate-400 mb-2"><Pill className="h-3.5 w-3.5" />ملاحظات الوصفة</label>
              <textarea value={notes.prescriptionNotes || ""} onChange={(e) => setNotes((p) => ({ ...p, prescriptionNotes: e.target.value }))} placeholder="ملاحظات عن الأدوية..." rows={2}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500/60 transition-colors resize-none" />
            </div>
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
              style={{ background: saving ? "#5eaaa4" : savedNotes ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#0d9488,#0891b2)", boxShadow: saving ? "none" : "0 4px 20px rgba(13,148,136,0.3)" }}
            >
              {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />جاري الحفظ...</>
                : savedNotes ? <><FileText className="h-4 w-4" />تم الحفظ بنجاح!</>
                  : <><Save className="h-4 w-4" />حفظ الملاحظات الطبية</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== MAIN VIDEO CALL LAYOUT ==========
export default function VideoCallLayout({
  sessionId,
  appointment,
  currentUserId,
}) {
  const router = useRouter();
  const [phase, setPhase] = useState("pre-check");
  const [collapsed, setCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef(null);
  const jitsiRef = useRef(null);

  const isDoctor = appointment?.doctorId === currentUserId;
  const patientDbId = isDoctor ? appointment?.patientId : null;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (phase !== "calling") return;

    const startJitsi = () => {
      if (!window.JitsiMeetExternalAPI) return;
      if (jitsiRef.current) jitsiRef.current.dispose();

      jitsiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: sessionId,
        parentNode: document.getElementById("jitsi-container"),
        width: "100%",
        height: "100%",
        userInfo: { displayName: isDoctor ? "Doctor" : "Patient" },
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
        },
      });
    };

    if (window.JitsiMeetExternalAPI) {
      startJitsi();
    } else {
      const interval = setInterval(() => {
        if (window.JitsiMeetExternalAPI) {
          clearInterval(interval);
          startJitsi();
        }
      }, 500);
      return () => clearInterval(interval);
    }

    return () => { if (jitsiRef.current) jitsiRef.current.dispose(); };
  }, [phase, sessionId, isDoctor]);

  const handleEnd = async () => {
    try {
      if (appointment?.id) await completeAppointment(appointment.id);
      router.push("/appointments");
    } catch (error) {
      console.error(error);
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <p className="text-xl">❌ لا يوجد Session ID</p>
        <p className="text-slate-400 text-sm">معرف الموعد: غير موجود</p>
        <a href="/doctor-dashboard" className="text-blue-400 underline">العودة للداشبورد</a>
      </div>
    );
  }

  return (
    <>
      <Script src="https://meet.jit.si/external_api.js" strategy="lazyOnload" />
      <AnimatePresence mode="wait">
        {phase === "pre-check" && (
          <motion.div key="pre-check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PreCallCheck
              onReady={async () => {
                setPhase("calling");
                if (isDoctor && appointment?.id) await startVideoConsultation(appointment.id);
              }}
            />
          </motion.div>
        )}

        {phase === "calling" && (
          <motion.div
            key="calling"
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen bg-black"
          >
            {/* Video Area - 70% */}
            <motion.div
              animate={{ width: collapsed ? "100%" : "70%" }}
              transition={{ duration: 0.4 }}
              className="relative flex flex-col bg-black"
            >
              <div id="jitsi-container" className="w-full h-full" />

              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-black/60 backdrop-blur">
                <div className="text-white text-sm font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                  مكالمة حية
                </div>

                <div className="flex items-center gap-2">
                  {isDoctor && (
                    <button
                      onClick={() => setCollapsed((p) => !p)}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      {collapsed ? "إظهار الملف الطبي" : "إخفاء الملف الطبي"}
                    </button>
                  )}

                  <button
                    onClick={toggleFullscreen}
                    className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors"
                  >
                    {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleEnd}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <PhoneOff className="w-4 h-4" />
                    إنهاء المكالمة
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Medical Sidebar - 30% — Doctor Only */}
            <AnimatePresence>
              {!collapsed && isDoctor && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "30%", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden"
                  style={{ borderLeft: "1px solid rgba(96,165,250,.1)" }}
                >
                  <MedicalSidebar
                    patientId={patientDbId}
                    appointment={appointment}
                    isDoctor={isDoctor}
                    currentUserId={currentUserId}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed Toggle */}
            {collapsed && isDoctor && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setCollapsed(false)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 z-50"
                style={{ background: "rgba(6,14,28,.9)", border: "1px solid rgba(96,165,250,.15)" }}
              >
                <FileText className="w-5 h-5 text-blue-400" />
                <ChevronRight className="w-4 h-4 text-white" />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}