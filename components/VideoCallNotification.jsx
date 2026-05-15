"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, X, Loader2, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { checkVideoCallStatus } from "@/actions/video-call";

export default function VideoCallNotification({ appointmentId, sessionId }) {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [doctorName, setDoctorName] = useState("الطبيب");

  const checkStatus = useCallback(async () => {
    if (!appointmentId) return;

    try {
      const result = await checkVideoCallStatus(appointmentId);
      console.log("Video call status check:", result);

      if (result.doctorJoined && !result.inProgress) {
        setShowNotification(true);
      } else if (result.inProgress || result.status === "COMPLETED") {
        setShowNotification(false);
      }
    } catch (error) {
      console.error("Check status error:", error);
    }
  }, [appointmentId]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleJoin = async () => {
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
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
        >
          <div
            className="rounded-2xl p-4 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              border: "1px solid rgba(37, 99, 235, 0.3)",
              boxShadow: "0 20px 60px rgba(37, 99, 235, 0.3), 0 0 0 1px rgba(37, 99, 235, 0.1)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #0891b2)",
                }}
              >
                <Video className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base mb-1">
                  📹 الطبيب في الاستشارة
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  د. {doctorName} دخل غرفة الاستشارة وينتظرك. انقر للانضمام الآن.
                </p>
              </div>

              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                لاحقاً
              </button>

              <button
                onClick={handleJoin}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #0891b2)",
                  boxShadow: "0 4px 20px rgba(37, 99, 235, 0.4)",
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                {isLoading ? "جاري الدخول..." : "انضم الآن"}
              </button>
            </div>

            <motion.div
              className="h-0.5 rounded-full mt-4"
              style={{
                background: "linear-gradient(90deg, #2563eb, #0891b2)",
              }}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 30, ease: "linear" }}
              onAnimationComplete={() => setShowNotification(false)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}