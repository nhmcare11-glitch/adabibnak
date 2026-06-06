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
    <section dir="rtl" className="relative w-full">

      {/* ── الصورة كاملة على الموبايل، مع نص فوقها على الكمبيوتر ── */}

      {/* الكمبيوتر: صورة خلفية مع نص فوقها */}
      <div className="hidden md:block relative w-full overflow-hidden" style={{ minHeight: "100vh" }}>
        <img
          src="/home.png"
          alt="hero background"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center center", zIndex: 0 }}
        />
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background: "linear-gradient(to left, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.2) 100%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-end px-16 pb-24 lg:px-24" style={{ zIndex: 2 }}>
          <div
            className="max-w-2xl"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <h1 className="mb-3 font-black leading-[1.15] text-white drop-shadow-lg"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
              <span className="text-[#2DBFB8] block mb-1"
                style={{ fontSize: "clamp(0.95rem, 2.2vw, 1.6rem)", fontWeight: 600 }}>
                حق في عمق الصحراء
              </span>
              طبيبك بين يديك
            </h1>
            <p className="mb-8 max-w-lg leading-relaxed text-[#e4eaea] drop-shadow"
              style={{ fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)", fontWeight: 400 }}>
              نحن نربط سكان المناطق النائية بأفضل أطباء التشخيص عن بعد من خلال
              حجوزات آمنة وسريعة واستشارات متطورة.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Link href={startHref}>
                <button className="flex items-center gap-2 rounded-full bg-[#2DBFB8] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_25px_rgba(45,191,184,0.5)] transition-all hover:-translate-y-0.5 hover:bg-teal-500">
                  <Calendar className="h-4 w-4" />
                  اكمل تسجيلك
                </button>
              </Link>
              <EmergencyButton />
            </div>
          </div>
        </div>
      </div>

      {/* الموبايل: صورة كاملة ثم نص تحتها */}
      <div className="md:hidden">
        {/* الصورة كاملة */}
        <img
          src="/home.png"
          alt="hero"
          className="w-full"
          style={{ height: "60vw", objectFit: "cover", objectPosition: "center center" }}
        />

        {/* النص تحت الصورة */}
        <div
          className="bg-[#071312] px-5 py-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <span className="text-[#2DBFB8] block mb-1 text-sm font-semibold">
            حق في عمق الصحراء
          </span>
          <h1 className="mb-3 text-3xl font-black leading-tight text-white">
            طبيبك بين يديك
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-[#e4eaea]">
            نحن نربط سكان المناطق النائية بأفضل أطباء التشخيص عن بعد من خلال
            حجوزات آمنة وسريعة واستشارات متطورة.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href={startHref}>
              <button className="flex items-center gap-2 rounded-full bg-[#2DBFB8] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_25px_rgba(45,191,184,0.5)]">
                <Calendar className="h-4 w-4" />
                اكمل تسجيلك
              </button>
            </Link>
            <EmergencyButton />
          </div>
        </div>
      </div>

    </section>
  );
}