'use client'

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Video } from "lucide-react";
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

      {/* ── Overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.05) 100%)",
        }}
      />

      {/* ── المحتوى ── */}
      <div
        className="absolute inset-0 flex flex-col justify-end px-6 pb-24 md:px-16 lg:px-24"
        style={{ zIndex: 2 }}
      >
        <div
          className="max-w-xl"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {/* العنوان */}
          <h1
            className="mb-5 font-black leading-[1.1] text-white drop-shadow-lg"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.6rem)" }}
          >
            طبيبك بين يديك
            <br />
            <span className="text-[#2DBFB8]">حق في عمق الصحراء</span>
          </h1>

          {/* الوصف */}
          <p className="mb-8 max-w-md text-sm leading-relaxed text-white/85 drop-shadow md:text-base">
            نحن نربط سكان المناطق النائية بأفضل أطباء التشخيص عن بعد من خلال
            حجوزات آمنة وسريعة واستشارات متطورة.
          </p>

          {/* الأزرار */}
          <div className="flex flex-wrap gap-3 items-center">
            <Link href={startHref}>
              <button className="flex items-center gap-2 rounded-full bg-[#2DBFB8] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_25px_rgba(45,191,184,0.5)] transition-all hover:-translate-y-0.5 hover:bg-teal-500">
                <Calendar className="h-4 w-4" />
                احجز موعد الآن
              </button>
            </Link>
            <Link href="/doctors">
              <button className="flex items-center gap-2 rounded-full border-2 border-white/60 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20">
                <Video className="h-4 w-4" />
                استشارة فورية
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