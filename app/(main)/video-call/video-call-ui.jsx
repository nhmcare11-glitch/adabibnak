"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Script from "next/script";

import {
  Camera,
  Mic,
  Volume2,
  Wifi,
  Signal,
  Minimize2,
  Maximize2,
  PhoneOff,
} from "lucide-react";

import {
  completeAppointment,
  startVideoConsultation,
} from "@/actions/video-call";

const CHECK_ITEMS = [
  {
    id: "camera",
    label: "الكاميرا",
    icon: Camera,
    desc: "التحقق من كاميرا الويب",
  },
  {
    id: "microphone",
    label: "الميكروفون",
    icon: Mic,
    desc: "التحقق من الميكروفون",
  },
  {
    id: "speakers",
    label: "السماعات",
    icon: Volume2,
    desc: "اختبار الصوت",
  },
  {
    id: "internet",
    label: "سرعة الإنترنت",
    icon: Wifi,
    desc: "قياس سرعة الاتصال",
  },
  {
    id: "connection",
    label: "استقرار الاتصال",
    icon: Signal,
    desc: "فحص جودة الشبكة",
  },
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

    if (d) {
      setDetails((p) => ({ ...p, [id]: d }));
    }
  };

  const run = useCallback(async () => {
    setRunning(true);

    setStatus(
      Object.fromEntries(CHECK_ITEMS.map((c) => [c.id, IDLE]))
    );

    setDetails({});

    upd("camera", CHECKING);

    await delay(350);

    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(s);

      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }

      upd("camera", SUCCESS, "تعمل بشكل طبيعي");
    } catch (e) {
      upd(
        "camera",
        ERROR,
        e?.name === "NotAllowedError"
          ? "يرجى منح إذن الكاميرا"
          : "الكاميرا غير متاحة"
      );
    }

    upd("microphone", CHECKING);

    await delay(300);

    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const ctx = new (window.AudioContext ||
        window.webkitAudioContext)();

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
      const ctx = new (window.AudioContext ||
        window.webkitAudioContext)();

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

      await fetch("https://www.cloudflare.com/cdn-cgi/trace", {
        cache: "no-store",
      });

      const rtt = performance.now() - t0;

      upd(
        "internet",
        rtt > 800 ? ERROR : SUCCESS,
        `${Math.round(rtt)} ms`
      );
    } catch {
      upd("internet", SUCCESS, "متصل");
    }

    upd("connection", CHECKING);

    await delay(250);

    try {
      if (!navigator.onLine) {
        throw new Error("offline");
      }

      upd("connection", SUCCESS, "الاتصال مستقر");
    } catch {
      upd("connection", ERROR, "لا يوجد اتصال");
    }

    setRunning(false);
  }, []);

  useEffect(() => {
    run();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-6">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-96 rounded-2xl border border-slate-700"
      />

      <button
        onClick={onReady}
        disabled={running}
        className="bg-blue-600 hover:bg-blue-700 transition px-8 py-3 rounded-xl disabled:opacity-50"
      >
        الدخول للاستشارة
      </button>
    </div>
  );
}

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

  const isDoctor =
    appointment?.doctorId === currentUserId;

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
    const onFsChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener(
      "fullscreenchange",
      onFsChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        onFsChange
      );
    };
  }, []);

  useEffect(() => {
    if (phase !== "calling") return;

    const startJitsi = () => {
      if (!window.JitsiMeetExternalAPI) return;

      if (jitsiRef.current) {
        jitsiRef.current.dispose();
      }

      jitsiRef.current =
        new window.JitsiMeetExternalAPI(
          "meet.jit.si",
          {
            roomName: sessionId,

            parentNode:
              document.getElementById(
                "jitsi-container"
              ),

            width: "100%",

            height: "100%",

            userInfo: {
              displayName: isDoctor
                ? "Doctor"
                : "Patient",
            },

            configOverwrite: {
              prejoinPageEnabled: false,
              startWithAudioMuted: false,
              startWithVideoMuted: false,
            },

            interfaceConfigOverwrite: {
              SHOW_JITSI_WATERMARK: false,
              SHOW_BRAND_WATERMARK: false,
            },
          }
        );
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

    return () => {
      if (jitsiRef.current) {
        jitsiRef.current.dispose();
      }
    };
  }, [phase, sessionId, isDoctor]);

  const handleEnd = async () => {
    try {
      if (appointment?.id) {
        await completeAppointment(
          appointment.id
        );
      }

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
      <Script
        src="https://meet.jit.si/external_api.js"
        strategy="lazyOnload"
      />

      <AnimatePresence mode="wait">
        {phase === "pre-check" && (
          <motion.div
            key="pre-check"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PreCallCheck
              onReady={async () => {
                setPhase("calling");

                if (
                  isDoctor &&
                  appointment?.id
                ) {
                  await startVideoConsultation(
                    appointment.id
                  );
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
            <motion.div
              animate={{
                width: collapsed
                  ? "100%"
                  : "60%",
              }}
              transition={{
                duration: 0.4,
              }}
              className="relative flex flex-col bg-black"
            >
              <div
                id="jitsi-container"
                className="w-full h-full"
              />

              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-black/60 backdrop-blur">
                <div className="text-white text-sm">
                  LIVE
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCollapsed((p) => !p)
                    }
                    className="bg-slate-800 text-white px-3 py-2 rounded-lg"
                  >
                    الملف الطبي
                  </button>

                  <button
                    onClick={
                      toggleFullscreen
                    }
                    className="bg-slate-800 text-white p-2 rounded-lg"
                  >
                    {fullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={handleEnd}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    إنهاء
                  </button>
                </div>
              </div>
            </motion.div>

            {!collapsed && (
              <div className="w-[40%] border-l border-slate-800 bg-[#030d1a] text-white p-5 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                  الملف الطبي
                </h2>

                <p className="text-slate-400">
                  هنا يمكنك إضافة Medical Panel.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}