"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FileText, PhoneOff, ChevronLeft, ChevronRight,
  Minimize2, Maximize2, AlertCircle, Video, Loader2,
  User, Heart, Pill, AlertTriangle, Activity, Save,
  Stethoscope, Calendar, Mail, Droplets, Ruler, Weight,
  Cigarette, Baby, Dna, X, ChevronDown, ChevronUp,
  FileUp, ClipboardList, Sparkles, FolderHeart
} from "lucide-react";

import { getMedicalRecord } from "@/actions/medical-record";
import { saveConsultationNotes, getConsultationNotes } from "@/actions/consultation-notes";

/* ============================================================
   MEDICAL SIDEBAR — Dossier Médical Professionnel
   ============================================================ */
function MedicalSidebar({ patientId, appointment, isDoctor, currentUserId }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({
    symptoms: "", diagnosis: "", recommendations: "", prescriptionNotes: ""
  });
  const [savedNotes, setSavedNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dossier");
  const [expandedSections, setExpandedSections] = useState({
    info: true, history: true, allergies: true, medications: true, files: true
  });

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

  const toggleSection = (key) => {
    setExpandedSections((p) => ({ ...p, [key]: !p[key] }));
  };

  const SectionHeader = ({ icon: Icon, title, sectionKey, color = "#0d9488" }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between py-3 px-1 group"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-sm font-semibold text-slate-200">{title}</span>
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronUp className="h-4 w-4 text-slate-500" />
      ) : (
        <ChevronDown className="h-4 w-4 text-slate-500" />
      )}
    </button>
  );

  const InfoCard = ({ icon: Icon, label, value, color = "#0d9488", badge }) => {
    if (!value && !badge) return null;
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-400 mb-0.5 uppercase tracking-wide">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-100 font-medium truncate">{value || "—"}</p>
            {badge && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{ background: `${color}25`, color }}
              >
                {badge}
              </span>
            )}
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
          <span
            key={i}
            className="px-2 py-1 rounded-md text-[11px] font-medium"
            style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  // ---------- EMPTY STATE ----------
  if (!loading && !record) {
    return (
      <div className="h-full flex flex-col bg-[#030d1a] text-white overflow-hidden">
        <div className="p-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}
            >
              <FolderHeart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">الملف الطبي</h3>
              <p className="text-xs text-slate-400">{appointment?.patient?.name || "المريض"}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.12)" }}
          >
            <FileText className="h-7 w-7 text-slate-500" />
          </div>
          <p className="text-slate-300 text-sm font-medium mb-1">لم يقم المريض بملء الملف الطبي بعد</p>
          <p className="text-slate-500 text-xs leading-relaxed max-w-[200px]">
            سيتم عرض المعلومات الصحية هنا بمجرد قيام المريض بإكمال ملفه الطبي
          </p>
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

  // ---------- LOADING ----------
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
      {/* ===== HEADER ===== */}
      <div className="p-4 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}
          >
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-white truncate">ملف المريض الطبي</h3>
            <p className="text-xs text-slate-400 truncate">
              {record ? `${record.firstName || ""} ${record.lastName || ""}`.trim() : appointment?.patient?.name}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/40 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("dossier")}
            className="flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all"
            style={{
              background: activeTab === "dossier" ? "linear-gradient(135deg,#0d9488,#0891b2)" : "transparent",
              color: activeTab === "dossier" ? "#fff" : "#94a3b8",
            }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <FolderHeart className="h-3.5 w-3.5" />
              الدوسي
            </div>
          </button>
          {isDoctor && (
            <button
              onClick={() => setActiveTab("notes")}
              className="flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all"
              style={{
                background: activeTab === "notes" ? "linear-gradient(135deg,#0d9488,#0891b2)" : "transparent",
                color: activeTab === "notes" ? "#fff" : "#94a3b8",
              }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                ملاحظات
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === "dossier" && (
          <>
            {/* ── Informations Personnelles ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <SectionHeader icon={User} title="المعلومات الشخصية" sectionKey="info" color="#60a5fa" />
              <AnimatePresence>
                {expandedSections.info && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-2 pb-3 space-y-2 overflow-hidden"
                  >
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

            {/* ── Antécédents Médicaux ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <SectionHeader icon={Activity} title="التاريخ المرضي" sectionKey="history" color="#8b5cf6" />
              <AnimatePresence>
                {expandedSections.history && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-2 pb-3 space-y-2 overflow-hidden"
                  >
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-300">الأمراض المزمنة</span>
                      </div>
                      <TagList items={record?.chronicDiseases} color="#f59e0b" />
                      {!record?.chronicDiseases && <p className="text-xs text-slate-500 mt-1">لا يوجد أمراض مزمنة مسجلة</p>}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-violet-400" />
                        <span className="text-xs font-semibold text-slate-300">العمليات الجراحية السابقة</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{record?.previousSurgeries || "لا توجد عمليات مسجلة"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Dna className="h-4 w-4 text-rose-400" />
                        <span className="text-xs font-semibold text-slate-300">الأمراض الوراثية</span>
                      </div>
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

            {/* ── Allergies ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <SectionHeader icon={AlertTriangle} title="الحساسية" sectionKey="allergies" color="#f59e0b" />
              <AnimatePresence>
                {expandedSections.allergies && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-2 pb-3 overflow-hidden"
                  >
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <TagList items={record?.allergies} color="#f59e0b" />
                      {!record?.allergies && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span className="text-xs">لا توجد حساسية مسجلة</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Médicaments ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <SectionHeader icon={Pill} title="الأدوية الحالية" sectionKey="medications" color="#8b5cf6" />
              <AnimatePresence>
                {expandedSections.medications && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-2 pb-3 overflow-hidden"
                  >
                    <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
                      <TagList items={record?.currentMedications} color="#8b5cf6" />
                      {!record?.currentMedications && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Pill className="h-3.5 w-3.5" />
                          <span className="text-xs">لا توجد أدوية حالية</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Notes Patient / Appointment ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <SectionHeader icon={FileText} title="وصف الحالة" sectionKey="files" color="#10b981" />
              <AnimatePresence>
                {expandedSections.files && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-2 pb-3 overflow-hidden"
                  >
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {appointment?.patientDescription || "لا يوجد وصف للحالة"}
                      </p>
                    </div>
                    <div className="mt-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[11px] text-slate-400">تاريخ الموعد</span>
                      </div>
                      <p className="text-sm text-slate-200">
                        {appointment?.startTime ? new Date(appointment.startTime).toLocaleDateString("ar-DZ", {
                          weekday: "long", year: "numeric", month: "long", day: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        }) : "—"}
                      </p>
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
              <label className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Activity className="h-3.5 w-3.5" />
                الأعراض
              </label>
              <textarea
                value={notes.symptoms || ""}
                onChange={(e) => setNotes((p) => ({ ...p, symptoms: e.target.value }))}
                placeholder="أعراض المريض..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500/60 transition-colors resize-none"
              />
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <label className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Stethoscope className="h-3.5 w-3.5" />
                التشخيص
              </label>
              <textarea
                value={notes.diagnosis || ""}
                onChange={(e) => setNotes((p) => ({ ...p, diagnosis: e.target.value }))}
                placeholder="التشخيص الطبي..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500/60 transition-colors resize-none"
              />
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <label className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Heart className="h-3.5 w-3.5" />
                التوصيات
              </label>
              <textarea
                value={notes.recommendations || ""}
                onChange={(e) => setNotes((p) => ({ ...p, recommendations: e.target.value }))}
                placeholder="التوصيات العلاجية..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500/60 transition-colors resize-none"
              />
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(96,165,250,0.08)" }}>
              <label className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Pill className="h-3.5 w-3.5" />
                ملاحظات الوصفة
              </label>
              <textarea
                value={notes.prescriptionNotes || ""}
                onChange={(e) => setNotes((p) => ({ ...p, prescriptionNotes: e.target.value }))}
                placeholder="ملاحظات عن الأدوية..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500/60 transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
              style={{
                background: saving
                  ? "#5eaaa4"
                  : savedNotes
                  ? "linear-gradient(135deg,#10b981,#059669)"
                  : "linear-gradient(135deg,#0d9488,#0891b2)",
                boxShadow: saving
                  ? "none"
                  : "0 4px 20px rgba(13,148,136,0.3)",
              }}
            >
              {saving ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />جاري الحفظ...</>
              ) : savedNotes ? (
                <><FileText className="h-4 w-4" />تم الحفظ بنجاح!</>
              ) : (
                <><Save className="h-4 w-4" />حفظ الملاحظات الطبية</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN VIDEO CALL LAYOUT
   ============================================================ */
export default function VideoCallLayout({
  sessionId,
  appointment,
  currentUserId,
}) {
  const router = useRouter();
  const [phase, setPhase] = useState("pre-check");
  const [collapsed, setCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const containerRef = useRef(null);

  const isDoctor =
    appointment?.doctor?.clerkUserId === currentUserId ||
    appointment?.doctorId === currentUserId;

  // ✅ FIXED: Use DB patient.id for medical record lookup
  const patientDbId = isDoctor ? appointment?.patient?.id : null;

  useEffect(() => {
    if (phase !== "calling") return;

    let api = null;

    const startMeeting = () => {
      if (!document.getElementById("jitsi-container")) return;
      const domain = "meet.jit.si";

      api = new window.JitsiMeetExternalAPI(domain, {
        roomName: sessionId,
        parentNode: document.getElementById("jitsi-container"),
        width: "100%",
        height: "100%",
        userInfo: {
          displayName: isDoctor
            ? appointment?.doctor?.name || "Doctor"
            : appointment?.patient?.name || "Patient",
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          disableModeratorIndicator: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          MOBILE_APP_PROMO: false,
        },
      });
    };

    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        startMeeting();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => startMeeting();
      document.body.appendChild(script);
    };

    loadJitsi();

    return () => {
      if (api) api.dispose();
    };
  }, [phase, sessionId, isDoctor, appointment]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleJoinCall = async () => {
    setIsJoining(true);
    try {
      if (isDoctor && appointment?.id) {
        const response = await fetch("/api/video-call/doctor-joined", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: appointment.id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "فشل بدء المكالمة");
      } else if (!isDoctor && appointment?.id) {
        await fetch("/api/video-call/patient-joined", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: appointment.id }),
        });
      }
      setPhase("calling");
    } catch (error) {
      console.error("Join error:", error);
      alert("فشل بدء المكالمة: " + error.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleEnd = async () => {
    try {
      if (appointment?.id) {
        await fetch("/api/video-call/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: appointment.id }),
        });
      }
    } catch (error) {
      console.error("End call error:", error);
    }
    router.push(isDoctor ? "/doctor-dashboard" : "/patient-dashboard");
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030d1a" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)" }}>
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">مكالمة غير صالحة</h1>
          <p className="text-slate-400 text-sm mb-6">لم يتم العثور على بيانات المكالمة</p>
          <button
            onClick={() => router.push(isDoctor ? "/doctor-dashboard" : "/patient-dashboard")}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)" }}
          >
            العودة للداشبورد
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {phase === "pre-check" && (
        <motion.div
          key="pre-check"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#03101f 0%,#061627 50%,#03101f 100%)" }}
        >
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)" }}>
              <Video className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-5">
              {isDoctor ? "بدء الاستشارة" : "الانضمام للاستشارة"}
            </h1>
            <p className="text-slate-400 mb-8 text-lg">
              {isDoctor
                ? `مع ${appointment?.patient?.name || "المريض"}`
                : `مع د. ${appointment?.doctor?.name || "الطبيب"}`}
            </p>
            <button
              onClick={handleJoinCall}
              disabled={isJoining}
              className="px-10 py-4 rounded-2xl text-white font-bold text-lg flex items-center gap-3 mx-auto disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg,#2563eb,#0891b2)",
                boxShadow: "0 10px 40px rgba(37,99,235,.35)",
              }}
            >
              {isJoining ? (
                <><Loader2 className="w-5 h-5 animate-spin" />جاري الانضمام...</>
              ) : (
                <><Video className="w-5 h-5" />{isDoctor ? "بدء المكالمة" : "الانضمام للمكالمة"}</>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {phase === "calling" && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-screen overflow-hidden relative"
          style={{ background: "#030d1a" }}
        >
          {/* VIDEO AREA */}
          <motion.div
            animate={{ width: collapsed ? "100%" : "70%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="relative flex flex-col bg-black overflow-hidden"
          >
            <div id="jitsi-container" className="w-full h-full" />

            <div
              className="absolute bottom-0 inset-x-0 px-5 py-4 flex items-center justify-between"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 100%)" }}
            >
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                مكالمة حية
              </div>

              <div className="flex items-center gap-2">
                {/* Medical File Toggle — Doctor Only */}
                {isDoctor && (
                  <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2 transition-all hover:scale-105"
                    style={{ background: "rgba(255,255,255,.12)", backdropFilter: "blur(10px)" }}
                  >
                    <FileText className="w-4 h-4" />
                    {collapsed ? "إظهار الملف الطبي" : "إخفاء الملف الطبي"}
                  </button>
                )}

                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105"
                  style={{ background: "rgba(255,255,255,.12)", backdropFilter: "blur(10px)" }}
                >
                  {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleEnd}
                  className="px-5 py-2 rounded-xl text-white font-semibold flex items-center gap-2 transition-all hover:scale-105"
                  style={{ background: "#dc2626", boxShadow: "0 4px 20px rgba(220,38,38,0.3)" }}
                >
                  <PhoneOff className="w-4 h-4" />
                  إنهاء المكالمة
                </button>
              </div>
            </div>
          </motion.div>

          {/* MEDICAL SIDEBAR — Doctor Only */}
          <AnimatePresence>
            {!collapsed && isDoctor && (
              <motion.div
                initial={{ width: 0, opacity: 0, x: 30 }}
                animate={{ width: "30%", opacity: 1, x: 0 }}
                exit={{ width: 0, opacity: 0, x: 30 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="overflow-hidden shrink-0"
                style={{
                  background: "linear-gradient(180deg,#04101f 0%,#030d1a 100%)",
                  borderLeft: "1px solid rgba(96,165,250,.1)",
                }}
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

          {/* Collapsed Toggle Button — Doctor Only */}
          {collapsed && isDoctor && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setCollapsed(false)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 z-50 transition-all hover:scale-110"
              style={{
                background: "rgba(6,14,28,.9)",
                border: "1px solid rgba(96,165,250,.15)",
                backdropFilter: "blur(10px)",
              }}
            >
              <FileText className="w-5 h-5 text-blue-400" />
              <ChevronRight className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}