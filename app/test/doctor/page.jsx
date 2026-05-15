"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Loader2 } from "lucide-react";

export default function TestDoctorPage() {
  const router = useRouter();
  const [appointmentId, setAppointmentId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    if (!appointmentId.trim()) return;
    setLoading(true);
    router.push(`/video-call?appointmentId=${appointmentId.trim()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#030d1a" }}>
      <div className="w-full max-w-md p-8 rounded-3xl" style={{
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(96,165,250,.15)",
      }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{
            background: "linear-gradient(135deg, #2563eb, #0891b2)",
          }}>
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">اختبار - الطبيب</h1>
          <p className="text-slate-400 text-sm">أدخل معرف الموعد لبدء المكالمة</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-2 block">معرف الموعد (Appointment ID)</label>
            <input
              type="text"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
              placeholder="مثال: 550e8400-e29b-41d4-a716-446655440000"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading || !appointmentId.trim()}
            className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #2563eb, #0891b2)",
            }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
            {loading ? "جاري الدخول..." : "بدء المكالمة"}
          </button>
        </div>

        <div className="mt-6 p-4 rounded-xl" style={{
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.2)",
        }}>
          <p className="text-amber-400 text-xs leading-relaxed">
            💡 <strong>تعليمات:</strong><br />
            1. افتح صفحة المريض في نافذة أخرى<br />
            2. أدخل نفس معرف الموعد<br />
            3. اضغط "بدء المكالمة" هنا أولاً<br />
            4. شاهد الإشعار يظهر للمريض
          </p>
        </div>
      </div>
    </div>
  );
}