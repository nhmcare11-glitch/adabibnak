"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, X, Loader2, Phone, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VideoCallNotification({ appointmentId, sessionId, doctorName = "الطبيب" }) {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!appointmentId) return;

    try {
      const response = await fetch(`/api/video-call/check-status?appointmentId=${appointmentId}`);
      const result = await response.json();

      if (result.error) return;

      // ✅ إذا انضم الطبيب ولم يدخل المريض بعد
      if (result.doctorJoined && !result.inProgress && !result.ended) {
        setShowNotification(true);
      }
      // ✅ إخفاء إذا انتهت أو دخل المريض
      else if (result.ended || result.inProgress) {
        setShowNotification(false);
      }
    } catch (error) {
      console.error("خطأ:", error);
    }
  }, [appointmentId]);

  // ✅ فحص كل 2 ثانية
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleJoin = () => {
    setIsLoading(true);
    router.push(`/video-call?appointmentId=${appointmentId}`);
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!appointmentId) return null;

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
        >
          <div className="rounded-2xl p-5 bg-slate-900 border border-blue-500/30 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shrink-0">
                <Video className="w-7 h-7 text-white" />
              </div>

              <div className="flex-1">
                <h3 className="text-white font-bold text-base">مكالمة واردة</h3>
                <p className="text-slate-300 text-sm mt-1">
                  د. <span className="text-white font-semibold">{doctorName}</span> انضم للاستشارة وينتظرك
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-400 text-xs">متصل الآن</span>
                </div>
              </div>

              <button onClick={handleDismiss} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-3 rounded-xl text-sm text-slate-300 border border-white/10 hover:text-white"
              >
                لاحقاً
              </button>

              <button
                onClick={handleJoin}
                disabled={isLoading}
                className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />جاري الانضمام...</>
                ) : (
                  <><Phone className="w-4 h-4" />انضمام للمكالمة</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}