"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/mobile-login");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const quickActions = [
    { icon: "🩺", label: "استشارة طبية", path: "/doctors", color: "bg-blue-50 dark:bg-blue-900/20" },
    { icon: "📅", label: "مواعيدي", path: "/appointments", color: "bg-green-50 dark:bg-green-900/20" },
    { icon: "💊", label: "وصفاتي", path: "/prescriptions", color: "bg-purple-50 dark:bg-purple-900/20" },
    { icon: "📋", label: "سجلي الطبي", path: "/records", color: "bg-orange-50 dark:bg-orange-900/20" },
  ];

  const stats = [
    { label: "مواعيد قادمة", value: "2", icon: "📅" },
    { label: "استشارات مكتملة", value: "8", icon: "✅" },
    { label: "أطباء متابعين", value: "3", icon: "👨‍⚕️" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* Header */}
      <div className="bg-blue-600 pt-14 pb-6 px-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">مرحباً بك 👋</p>
            <h1 className="text-white text-xl font-bold font-cairo mt-0.5">
              {user.firstName || user.emailAddresses[0]?.emailAddress?.split("@")[0]}
            </h1>
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="w-11 h-11 rounded-full bg-white/20 overflow-hidden flex items-center justify-center"
          >
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-lg">
                {(user.firstName?.[0] || "U").toUpperCase()}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-6 -mt-1">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center shadow-sm"
            >
              <span className="text-2xl">{s.icon}</span>
              <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-slate-700 dark:text-slate-300 font-semibold mb-3 font-cairo">
            الخدمات السريعة
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.path)}
                className={`${action.color} rounded-2xl p-4 flex flex-col items-start gap-3 active:scale-95 transition-transform shadow-sm`}
              >
                <span className="text-3xl">{action.icon}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 font-cairo">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Next Appointment */}
        <div>
          <h2 className="text-slate-700 dark:text-slate-300 font-semibold mb-3 font-cairo">
            الموعد القادم
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-2xl flex-shrink-0">
              👨‍⚕️
            </div>
            <div className="flex-1 text-right">
              <p className="font-semibold text-slate-800 dark:text-white text-sm font-cairo">
                د. محمد العلوي
              </p>
              <p className="text-xs text-slate-500 mt-0.5">طب عام • غداً 10:00 ص</p>
            </div>
            <button
              onClick={() => router.push("/appointments")}
              className="text-xs text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg"
            >
              تفاصيل
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}