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

      {/* ─────────── DESKTOP ─────────── */}
      <div className="hidden md:block relative w-full overflow-hidden" style={{ minHeight: "100vh" }}>

        <img
          src="/home.png"
          alt="hero background"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to left, rgba(0,0,0,0.85), rgba(0,0,0,0.55), rgba(0,0,0,0.2))",
          }}
        />

        <div className="absolute inset-0 flex flex-col justify-end px-16 pb-24 lg:px-24">
          <div
            className="max-w-2xl"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.7s ease",
            }}
          >
            <span className="block mb-3 text-sm font-medium" style={{ color: "rgba(255,255,255,0.60)" }}>
              حتى في عمق الصحراء
            </span>

            <h1
              className="mb-4 font-black leading-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)", color: "#2DBFB8" }}
            >
              طبيبك بين يديك
            </h1>

            <p
              className="mb-8 max-w-lg leading-relaxed"
              style={{
                fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)",
                color: "#cbd5d5",
                textShadow: "0 1px 8px rgba(0,0,0,0.6)",
              }}
            >
              نحن نربط سكان المناطق النائية بأفضل أطباء التشخيص عن بعد من خلال
              حجوزات آمنة وسريعة واستشارات متطورة.
            </p>

            <div className="flex gap-3 flex-wrap items-center">
              <Link href={startHref}>
                <button className="flex items-center gap-2 rounded-full bg-[#2DBFB8] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-teal-500 transition">
                  <Calendar className="h-4 w-4" />
                  اكمل تسجيلك
                </button>
              </Link>
              <EmergencyButton />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── MOBILE ─────────── */}
      <div className="md:hidden relative overflow-hidden" style={{ minHeight: "100svh" }}>

        <img
          src="/home-mobile.png"
          alt="hero"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(7,19,18,0.96) 0%, rgba(7,19,18,0.75) 50%, rgba(7,19,18,0.2) 100%)",
          }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 px-6 pb-10 z-10"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s ease",
          }}
        >
          <span className="block mb-2 text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>
            حتى في عمق الصحراء
          </span>

          <h1 className="mb-3 text-4xl font-extrabold" style={{ color: "#2DBFB8" }}>
            طبيبك بين يديك
          </h1>

          <p
            className="mb-6 leading-7 text-sm"
            style={{
              color: "#cbd5d5",
              textShadow: "0 1px 8px rgba(0,0,0,0.6)",
            }}
          >
            نحن نربط سكان المناطق النائية بأفضل أطباء التشخيص عن بعد من خلال
            حجوزات آمنة وسريعة واستشارات متطورة.
          </p>

          <div className="flex gap-3 flex-wrap">
            <Link href={startHref}>
              <button className="flex items-center gap-2 rounded-full bg-[#2DBFB8] px-6 py-3 text-sm font-bold text-white">
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