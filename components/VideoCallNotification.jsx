"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, X, Loader2, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VideoCallNotification({
  appointmentId,
  sessionId,
  doctorName = "الطبيب",
}) {
  const router = useRouter();

  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ فحص حالة المكالمة
  const checkStatus = useCallback(async () => {
    if (!appointmentId) return;

    try {
      const response = await fetch(
        `/api/video-call/check-status?appointmentId=${appointmentId}`
      );

      const result = await response.json();

      if (result.error) return;

      // ✅ إذا دخل الطبيب ولم يدخل المريض بعد
      if (result.doctorJoined && !result.inProgress && !result.ended) {
        setShowNotification(true);
      }
      // ✅ إخفاء الإشعار إذا انتهت المكالمة أو دخل المريض
      else if (result.ended || result.inProgress) {
        setShowNotification(false);
      }
    } catch (error) {
      console.error("خطأ أثناء فحص حالة المكالمة:", error);
    }
  }, [appointmentId]);

  // ✅ فحص كل ثانيتين
  useEffect(() => {
    checkStatus();

    const interval = setInterval(() => {
      checkStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  // ✅ الانضمام للمكالمة
  const handleJoin = async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);

      router.push(`/video-call/${sessionId}`);
    } catch (error) {
      console.error("خطأ أثناء الانضمام:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ إخفاء الإشعار
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
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
        >
          <div className="rounded-2xl p-5 bg-slate-900 border border-blue-500/30 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-4">
              {/* أيقونة المكالمة */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shrink-0">
                <Video className="w-7 h-7 text-white" />
              </div>

              {/* النص */}
              <div className="flex-1">
                <h3 className="text-white font-bold text-base">
                  مكالمة واردة
                </h3>

                <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                  د.{" "}
                  <span className="text-white font-semibold">
                    {doctorName}
                  </span>{" "}
                  انضم للاستشارة وينتظرك الآن
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

                  <span className="text-green-400 text-xs">
                    الطبيب متصل الآن
                  </span>
                </div>
              </div>

              {/* زر الإغلاق */}
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* الأزرار */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-3 rounded-xl text-sm text-slate-300 border border-white/10 hover:text-white hover:border-white/20 transition-all"
              >
                لاحقاً
              </button>

              <button
                onClick={handleJoin}
                disabled={isLoading}
                className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الانضمام...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    انضمام للمكالمة
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}