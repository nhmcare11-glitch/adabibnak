"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, X, Loader2, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VideoCallNotification({ appointmentId, sessionId, doctorName = "Doctor" }) {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("Initializing...");

  const checkStatus = useCallback(async () => {
    if (!appointmentId) {
      setDebugInfo("No appointmentId");
      return;
    }

    try {
      const response = await fetch(`/api/video-call/check-status?appointmentId=${appointmentId}`);
      const result = await response.json();

      console.log("Polling result:", result);

      if (result.error) {
        setDebugInfo(`Error: ${result.error}`);
        return;
      }

      setDebugInfo(`Status: ${result.videoCallStatus}, DoctorJoined: ${result.doctorJoined}`);

      // Show notification when doctor joined
      if (result.doctorJoined && !result.inProgress && !result.ended) {
        console.log("Doctor joined! Showing notification");
        setShowNotification(true);
      }
      // Hide only if call ended
      else if (result.ended) {
        console.log("Call ended, hiding notification");
        setShowNotification(false);
      }
    } catch (error) {
      console.error("Polling error:", error);
      setDebugInfo(`Exception: ${error.message}`);
    }
  }, [appointmentId]);

  // Polling every 2 seconds
  useEffect(() => {
    console.log("VideoCallNotification mounted:", appointmentId);
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
    <>
      {/* Debug Panel - Remove in production */}
      <div className="fixed bottom-4 right-4 z-[200] bg-black/90 text-green-400 p-3 rounded-lg text-xs font-mono border border-green-500/30">
        <div>VideoCallNotification</div>
        <div>Debug: {debugInfo}</div>
        <div>Appointment: {appointmentId}</div>
        <div>Show: {showNotification ? "YES" : "NO"}</div>
      </div>

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
                boxShadow: "0 20px 60px rgba(37, 99, 235, 0.3)",
              }}
            >
              <div className="flex items-start gap-4">
                <motion.div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)" }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Video className="w-6 h-6 text-white" />
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-white font-bold">Doctor is in the consultation</h3>
                  <p className="text-slate-300 text-sm mt-1">
                    Dr. {doctorName} entered the room and is waiting for you
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-400 text-xs">Online now</span>
                  </div>
                </div>

                <button onClick={handleDismiss} className="text-slate-400 hover:text-white">
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
                  Later
                </button>

                <button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className="flex-[2] px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #0891b2)",
                    boxShadow: "0 4px 20px rgba(37, 99, 235, 0.4)",
                  }}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                  {isLoading ? "Joining..." : "Join Call Now"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}