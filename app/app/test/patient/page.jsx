"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import VideoCallNotification from "@/components/VideoCallNotification";

export default function TestPatientPage() {
  const [appointmentId, setAppointmentId] = useState("");
  const [activeAppointmentId, setActiveAppointmentId] = useState(null);

  const handleStartMonitoring = () => {
    if (!appointmentId.trim()) return;
    setActiveAppointmentId(appointmentId.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#030d1a" }}>
      <div className="w-full max-w-md p-8 rounded-3xl" style={{
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(96,165,250,.15)",
      }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{
            background: "linear-gradient(135deg, #10b981, #0891b2)",
          }}>
            <Bell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">اختبار - المريض</h1>
          <p className="text-slate-400 text-sm">أدخل معرف الموعد وانتظر إشعار الطبيب</p>
        </div>

        {!activeAppointmentId ? (
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm mb-2 block">معرف الموعد (Appointment ID)</label>
              <input
                type="text"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder="نفس معرف الموعد الذي أدخله الطبيب"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>

            <button
              onClick={handleStartMonitoring}
              disabled={!appointmentId.trim()}
              className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #10b981, #0891b2)",
              }}
            >
              <Bell className="w-5 h-5" />
              بدء المراقبة
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" style={{
              background: "rgba(16,185,129,0.2)",
              border: "2px solid #10b981",
            }}>
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <p className="text-white font-medium mb-2">جاري المراقبة...</p>
            <p className="text-slate-400 text-sm mb-4">سيتم إعلامك عند دخول الطبيب</p>
            <p className="text-xs text-slate-500 font-mono">{activeAppointmentId}</p>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl" style={{
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(16,185,129,0.2)",
        }}>
          <p className="text-emerald-400 text-xs leading-relaxed">
            💡 <strong>تعليمات:</strong><br />
            1. تأكد من أن الطبيب فتح صفحته أولاً<br />
            2. أدخل نفس معرف الموعد هنا<br />
            3. اضغط "بدء المراقبة"<br />
            4. عندما يدخل الطبيب، سيظهر إشعار منبثق
          </p>
        </div>
      </div>

      {/* ✅ Video Call Notification - يعمل فوراً */}
      {activeAppointmentId && (
        <VideoCallNotification
          appointmentId={activeAppointmentId}
          sessionId={null}
        />
      )}
    </div>
  );
}