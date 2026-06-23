"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";

export default function SplashPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(() => {
      if (isSignedIn) {
        router.replace("/dashboard");
      } else {
        router.replace("/mobile-login");
      }
    }, 2000); // 2 ثانية

    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-950 z-50">
      
      {/* اللوغو */}
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl">
          {/* ضع لوغو مشروعك هنا */}
          <svg
            viewBox="0 0 48 48"
            className="w-14 h-14 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4z"/>
            <path d="M24 14v20M14 24h20" strokeLinecap="round"/>
          </svg>
        </div>

        {/* اسم التطبيق */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600 font-cairo">
            أدابيبنك
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            منصة الرعاية الصحية
          </p>
        </div>
      </div>

      {/* Loading dots في الأسفل */}
      <div className="absolute bottom-16 flex gap-2">
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