'use client'

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import EmergencyButton from "@/components/ui/emergency-button";

export default function HeroSection({ startHref = "/onboarding" }: { startHref?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      dir="rtl"
      className="relative w-full overflow-hidden"
      style={{ minHeight: "100vh" }}
    >
      {/* ── الصورة كاملة بدون قطع ── */}
      <img
        src="/home.png"
        alt="hero background"
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit: "cover",
          objectPosition: "center center",
          zIndex: 0,
        }}
      />

      {/* ── Overlay من اليمين فقط (حيث الكتابة) ── */}
      <div
        className="absolute top-0 bottom-0 right-0"
        style={{
          zIndex: 1,
          width: "70%",
          background:
            "linear-gradient(to left, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* ── المحتوى ── */}
      <div
        className="absolute inset-0 flex flex-col justify-end px-6 pb-20 md:px-16 lg:px-24"
        style={{ zIndex: 2 }}
      >
        <div
          className="max-w-2xl"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {/* العنوان الرئيسي */}
          <h1
            className="mb-3 font-black leading-[1.15] text-white drop-shadow-lg"
            style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
          >
            <span className="text-[#2DBFB8] block mb-1" style={{ fontSize: "clamp(1rem, 2.2vw, 1.6rem)", fontWeight: 600 }}>
              حق في عمق الصحراء
            </span>
            طبيبك بين يديك
          </h1>

          {/* النص الأمازيغي - بالأبيض */}
          <p 
            className="mb-6 text-white font-semibold drop-shadow-md"
            style={{ fontSize: "clamp(1rem, 1.8vw, 1.3rem)", letterSpacing: "0.02em" }}
          >
            ⵜⴰⴱⵉⴱⴰⴽ ⴷⴰⴳ ⵉⴼⴰⵙⵙⴻⵏ ⵏⴰⴽ
          </p>

          {/* الوصف - بلون #2DBFB8 */}
          <p 
            className="mb-8 max-w-lg leading-relaxed text-[#2DBFB8] drop-shadow"
            style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.15rem)", fontWeight: 400 }}
          >
            نحن نربط سكان المناطق النائية بأفضل أطباء التشخيص عن بعد من خلال
            حجوزات آمنة وسريعة واستشارات متطورة.
          </p>

          {/* الأزرار */}
          <div className="flex flex-wrap gap-3 items-center">
            <Link href={startHref}>
              <button className="flex items-center gap-2 rounded-full bg-[#2DBFB8] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_25px_rgba(45,191,184,0.5)] transition-all hover:-translate-y-0.5 hover:bg-teal-500">
                <Calendar className="h-4 w-4" />
                اكمل تسجيلك
              </button>
            </Link>

            {/* ── زر الطوارئ ── */}
            <EmergencyButton />
          </div>
        </div>
      </div>
    </section>
  );
}