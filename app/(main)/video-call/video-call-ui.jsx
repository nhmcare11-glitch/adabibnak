"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Script from "next/script";

import {
  Camera, Mic, Volume2, Wifi, Signal, Minimize2, Maximize2,
  PhoneOff, FileText, Heart, Pill, AlertTriangle, Activity,
  Save, ChevronRight, User, Stethoscope
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
      <button onClick={onReady} disabled={running} className="bg-blue-600 hover:bg-blue-700 transition px-8 py-3 rounded-xl disabled:opacity-50">
        الدخول للاستشارة
      </button>
    </div>
  );
}

// ========== MEDICAL SIDEBAR COMPONENT ==========
function MedicalSidebar({ patientId, appointment, isDoctor, currentUserId }) {
  const [record, setRecord] = useState(null);
  const [notes, setNotes] = useState({ symptoms: "", diagnosis: "", recommendations: "", prescriptionNotes: "" });
  const [savedNotes, setSavedNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // info | notes

  useEffect(() => {
    if (patientId) {
      getMedicalRecord(patientId).then((res) => {
        if (res.success) setRecord(res.record);
      });
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

  const InfoRow = ({ icon: Icon, label, value, color = "#0d9488" }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 mb-0.5">{label}</p>
          <p className="text-sm text-white font-medium truncate">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#030d1a] text-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}>
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">ملف المريض الطبي</h3>
            <p className="text-xs text-slate-400">{record ? `${record.firstName} ${record.lastName}` : "جاري التحميل..."}</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("info")}
            className="flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all"
            style={{ background: activeTab === "info" ? "#0d9488" : "transparent", color: activeTab === "info" ? "#fff" : "#94a3b8" }}
          >
            المعلومات
          </button>
          {isDoctor && (
            <button
              onClick={() => setActiveTab("notes")}
              className="flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all"
              style={{ background: activeTab === "notes" ? "#0d9488" : "transparent", color: activeTab === "notes" ? "#fff" : "#94a3b8" }}
            >
              ملاحظات الطبيب
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === "info" && (
          <>
            {/* Basic Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">المعلومات الأساسية</h4>
              <InfoRow icon={User} label="الاسم" value={record ? `${record.firstName} ${record.lastName}` : null} />
              <InfoRow icon={User} label="الجنس" value={record?.gender} />
              <InfoRow icon={Activity} label="العمر" value={record?.age ? `${record.age} سنة` : null} />
              <InfoRow icon={Heart} label="فصيلة الدم" value={record?.bloodType} color="#ef4444" />
              <InfoRow icon={Activity} label="الوزن / الطول" value={record?.weight && record?.height ? `${record.weight}kg / ${record.height}cm` : null} />
            </div>

            {/* Medical History */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">التاريخ الطبي</h4>
              <InfoRow icon={AlertTriangle} label="أمراض مزمنة" value={record?.chronicDiseases} color="#f59e0b" />
              <InfoRow icon={AlertTriangle} label="حساسية" value={record?.allergies} color="#f59e0b" />
              <InfoRow icon={Activity} label="عمليات سابقة" value={record?.previousSurgeries} />
              <InfoRow icon={Pill} label="أدوية حالية" value={record?.currentMedications} color="#8b5cf6" />
              <InfoRow icon={Heart} label="حالة التدخين" value={record?.smokingStatus} color="#ef4444" />
              <InfoRow icon={Heart} label="الأمراض الوراثية" value={record?.familyDiseases} />
            </div>

            {!record && (
              <div className="text-center py-8 text-slate-500 text-sm">
                لا يوجد ملف طبي مسجل لهذا المريض
              </div>
            )}
          </>
        )}

        {activeTab === "notes" && isDoctor && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">الأعراض</label>
              <textarea
                value={notes.symptoms || ""}
                onChange={(e) => setNotes((p) => ({ ...p, symptoms: e.target.value }))}
                placeholder="أعراض المريض..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">التشخيص</label>
              <textarea
                value={notes.diagnosis || ""}
                onChange={(e) => setNotes((p) => ({ ...p, diagnosis: e.target.value }))}
                placeholder="التشخيص الطبي..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">التوصيات</label>
              <textarea
                value={notes.recommendations || ""}
                onChange={(e) => setNotes((p) => ({ ...p, recommendations: e.target.value }))}
                placeholder="التوصيات العلاجية..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">ملاحظات الوصفة</label>
              <textarea
                value={notes.prescriptionNotes || ""}
                onChange={(e) => setNotes((p) => ({ ...p, prescriptionNotes: e.target.value }))}
                placeholder="ملاحظات عن الأدوية..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500 transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{ background: saving ? "#5eaaa4" : "linear-gradient(135deg,#0d9488,#0891b2)" }}
            >
              {saving ? (
                <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />جاري الحفظ...</>
              ) : savedNotes ? (
                <><FileText className="h-4 w-4" />تم الحفظ!</>
              ) : (
                <><Save className="h-4 w-4" />حفظ الملاحظات</>
              )}
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
  const patientId = isDoctor ? appointment?.patientId : appointment?.doctorId;

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
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        لا يوجد Session ID
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
                if (isDoctor && appointment?.id) {
                  await startVideoConsultation(appointment.id);
                }
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
                  LIVE
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCollapsed((p) => !p)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    {collapsed ? "إظهار الملف الطبي" : "إخفاء الملف الطبي"}
                  </button>

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
                    إنهاء
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Medical Sidebar - 30% */}
            {!collapsed && (
              <div className="w-[30%] border-l border-slate-800">
                <MedicalSidebar
                  patientId={patientId}
                  appointment={appointment}
                  isDoctor={isDoctor}
                  currentUserId={currentUserId}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}