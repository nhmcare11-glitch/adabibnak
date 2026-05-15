"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FileText,
  PhoneOff,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  AlertCircle,
  Video,
  Loader2,
} from "lucide-react";
import {
  doctorJoinedVideoCall,
  patientJoinedVideoCall,
  endVideoCall,
} from "@/actions/video-call";

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

  const isPatient = !isDoctor;

  // ─────────────────────────────
  // JITSI
  // ─────────────────────────────

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

      script.onload = () => {
        startMeeting();
      };

      document.body.appendChild(script);
    };

    loadJitsi();

    return () => {
      if (api) api.dispose();
    };
  }, [phase, sessionId]);

  // ─────────────────────────────
  // FULLSCREEN
  // ─────────────────────────────

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
    const onFsChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, []);

  // ─────────────────────────────
  // HANDLE JOIN (with notification)
  // ─────────────────────────────

  const handleJoinCall = async () => {
    setIsJoining(true);

    try {
      if (isDoctor && appointment?.id) {
        // ✅ Doctor joined → notify patient
        await doctorJoinedVideoCall(appointment.id);
      } else if (isPatient && appointment?.id) {
        // ✅ Patient joined → update status
        await patientJoinedVideoCall(appointment.id);
      }

      setPhase("calling");
    } catch (error) {
      console.error("Join error:", error);
      // Still enter the call even if notification fails
      setPhase("calling");
    } finally {
      setIsJoining(false);
    }
  };

  // ─────────────────────────────
  // END CALL
  // ─────────────────────────────

  const handleEnd = async () => {
    try {
      if (appointment?.id) {
        await endVideoCall(appointment.id);
      }
    } catch (error) {
      console.error("End call error:", error);
    }

    router.push(isDoctor ? "/doctor-dashboard" : "/patient-dashboard");
  };

  // ─────────────────────────────
  // INVALID SESSION
  // ─────────────────────────────

  if (!sessionId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#030d1a" }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "rgba(239,68,68,.1)",
              border: "1px solid rgba(239,68,68,.2)",
            }}
          >
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            مكالمة غير صالحة
          </h1>

          <p className="text-slate-400 text-sm mb-6">
            بيانات المكالمة غير موجودة
          </p>

          <button
            onClick={() => router.push(isDoctor ? "/doctor-dashboard" : "/patient-dashboard")}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg,#2563eb,#0891b2)",
            }}
          >
            العودة للداشبورد
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────
  // UI
  // ─────────────────────────────

  return (
    <AnimatePresence mode="wait">
      {/* PRE CHECK */}
      {phase === "pre-check" && (
        <motion.div
          key="pre-check"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg,#03101f 0%,#061627 50%,#03101f 100%)",
          }}
        >
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: "linear-gradient(135deg, #2563eb, #0891b2)",
              }}
            >
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
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  {isDoctor ? "بدء المكالمة" : "الدخول إلى الاستشارة"}
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* CALL */}
      {phase === "calling" && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-screen overflow-hidden relative"
          style={{ background: "#030d1a" }}
        >
          {/* VIDEO SIDE */}
          <motion.div
            animate={{ width: collapsed ? "100%" : "70%" }}
            transition={{ duration: 0.4 }}
            className="relative flex flex-col bg-black overflow-hidden"
          >
            <div
              id="jitsi-container"
              className="w-full h-full"
            />

            {/* CONTROLS */}
            <div
              className="absolute bottom-0 inset-x-0 px-5 py-4 flex items-center justify-between"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 100%)",
              }}
            >
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </div>

              <div className="flex items-center gap-2">
                {/* PANEL */}
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="px-4 py-2 rounded-xl text-white text-sm"
                  style={{
                    background: "rgba(255,255,255,.1)",
                  }}
                >
                  {collapsed ? "إظهار الملف" : "إخفاء الملف"}
                </button>

                {/* FULLSCREEN */}
                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{
                    background: "rgba(255,255,255,.1)",
                  }}
                >
                  {fullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                {/* END */}
                <button
                  onClick={handleEnd}
                  className="px-5 py-2 rounded-xl text-white font-semibold flex items-center gap-2"
                  style={{
                    background: "#dc2626",
                  }}
                >
                  <PhoneOff className="w-4 h-4" />
                  إنهاء المكالمة
                </button>
              </div>
            </div>
          </motion.div>

          {/* MEDICAL PANEL */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "30%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
                style={{
                  background:
                    "linear-gradient(180deg,#04101f 0%,#030d1a 100%)",
                  borderLeft: "1px solid rgba(96,165,250,.1)",
                }}
              >
                {/* HEADER */}
                <div
                  className="flex items-center justify-between px-4 py-4"
                  style={{
                    borderBottom: "1px solid rgba(96,165,250,.1)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(96,165,250,.1)",
                      }}
                    >
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>

                    <div>
                      <h2 className="text-white font-bold">
                        الملف الطبي
                      </h2>

                      <p className="text-slate-400 text-sm">
                        {appointment?.patient?.name}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setCollapsed(true)}
                    className="text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* BODY */}
                <div className="p-5 space-y-5 overflow-y-auto h-full">
                  {/* PATIENT */}
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: "rgba(15,23,42,.6)",
                      border: "1px solid rgba(96,165,250,.1)",
                    }}
                  >
                    <h3 className="text-white font-semibold mb-4">
                      معلومات المريض
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-slate-500">الاسم:</span>

                        <p className="text-white">
                          {appointment?.patient?.name}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500">
                          البريد:
                        </span>

                        <p className="text-white">
                          {appointment?.patient?.email}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500">
                          التاريخ:
                        </span>

                        <p className="text-white">
                          {new Date(
                            appointment?.startTime
                          ).toLocaleDateString("ar-DZ")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: "rgba(15,23,42,.6)",
                      border: "1px solid rgba(96,165,250,.1)",
                    }}
                  >
                    <h3 className="text-white font-semibold mb-4">
                      وصف الحالة
                    </h3>

                    <p className="text-slate-300 text-sm leading-relaxed">
                      {appointment?.patientDescription ||
                        "لا يوجد وصف للحالة"}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FLOATING BUTTON */}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 z-50"
              style={{
                background: "rgba(6,14,28,.9)",
                border: "1px solid rgba(96,165,250,.15)",
              }}
            >
              <FileText className="w-5 h-5 text-blue-400" />

              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}