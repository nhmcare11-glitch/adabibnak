"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, ChevronDown } from "lucide-react";
import { useUser } from "@clerk/nextjs";

// ─────────────────────────────────────────────────────────────
// Blob Shape
// ─────────────────────────────────────────────────────────────
function BlobShape({
  className = "",
  color = "#7EDEC8",
  opacity = 0.2,
}: {
  className?: string;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fill={color}
        fillOpacity={opacity}
        d="M47.1,-62.3C60.3,-52.4,70,-37.2,74.4,-20.4C78.8,-3.6,77.8,14.7,70.4,29.7C63,44.7,49.2,56.4,34.1,63.4C19,70.4,2.5,72.7,-14.6,70.5C-31.7,68.3,-49.3,61.5,-60.5,49.2C-71.7,36.9,-76.4,19.1,-75.4,2C-74.4,-15.1,-67.7,-31.5,-56.7,-43.2C-45.7,-54.9,-30.4,-61.8,-14.5,-65.3C1.4,-68.8,17.9,-68.9,33.9,-65.5C34,-65.5,34,-65.5,47.1,-62.3Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Hero Section
// ─────────────────────────────────────────────────────────────
export default function HeroSection() {
  const { user } = useUser();

  const role = user?.publicMetadata?.role as string | undefined;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const startHref =
    role === "PATIENT"
      ? "/patient-dashboard"
      : role === "DOCTOR"
      ? "/doctor"
      : role === "ADMIN"
      ? "/admin"
      : "/onboarding";

  return (
    <section
      dir="rtl"
      className="relative overflow-hidden min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #E0F8F2 0%, #C8F3EA 40%, #B0EEE2 70%, #98E9DA 100%)",
      }}
    >
      {/* Background blobs */}
      <BlobShape
        className="absolute -top-24 -left-24 w-[450px] h-[450px] pointer-events-none"
        color="#7EDEC8"
        opacity={0.25}
      />

      <BlobShape
        className="absolute bottom-0 right-0 w-[350px] h-[350px] pointer-events-none"
        color="#A8F0E0"
        opacity={0.2}
      />

      {/* Main Shape */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main background shape */}
        <div
          className="
            absolute
            right-0
            top-1/2
            -translate-y-1/2
            w-[48%]
            h-[85%]
            bg-teal-500/90
            rounded-l-[180px]
            rounded-r-[60px]
            hidden lg:block
          "
        />

        {/* Inner shape */}
        <div
          className="
            absolute
            right-[4%]
            top-1/2
            -translate-y-1/2
            w-[38%]
            h-[72%]
            bg-teal-200/70
            rounded-l-[160px]
            rounded-r-[50px]
            backdrop-blur-sm
            hidden lg:block
          "
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[90vh]">

          {/* ───────────────── TEXT SIDE ───────────────── */}
          <div
            className="flex flex-col gap-7 text-right lg:pr-10"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateX(0)" : "translateX(40px)",
              transition:
                "all 0.7s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {/* Small badge */}
            <div className="flex justify-start">
              <div
                className="
                  px-5
                  py-2
                  rounded-full
                  bg-white/40
                  backdrop-blur-md
                  border
                  border-white/50
                  text-teal-800
                  text-sm
                  font-semibold
                  shadow-md
                  w-fit
                "
              >
                منصة الرعاية الصحية الذكية
              </div>
            </div>

            {/* Main Heading */}
            <div>
              <h1
                className="
                  text-5xl
                  md:text-6xl
                  lg:text-7xl
                  font-black
                  leading-[1.1]
                  tracking-tight
                  text-teal-900
                "
              >
                حتى في عمق الصحراء
                <br />

                <span className="text-teal-700">
                  طبيبك بين يديك
                </span>
              </h1>
            </div>

            {/* Description */}
            <p
              className="
                text-lg
                md:text-xl
                leading-relaxed
                text-teal-800
                max-w-xl
              "
            >
              احجز المواعيد بسهولة، واستشر أفضل الأطباء عبر
              الفيديو، وأدر رحلتك الصحية كاملة داخل منصة
              حديثة وآمنة مصممة خصيصاً لتوفير الرعاية أينما كنت.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">

              {/* Primary Button */}
              <Link href={startHref}>
                <button
                  className="
                    group
                    flex
                    items-center
                    justify-center
                    gap-3
                    px-8
                    py-4
                    rounded-full
                    bg-teal-600
                    hover:bg-teal-700
                    text-white
                    font-semibold
                    text-base
                    shadow-[0_10px_30px_rgba(13,148,136,0.35)]
                    transition-all
                    duration-300
                    hover:-translate-y-1
                  "
                >
                  <span>احجز موعداً</span>

                  <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                </button>
              </Link>

              {/* Secondary Button */}
              <Link href="/doctors">
                <button
                  className="
                    flex
                    items-center
                    justify-center
                    gap-3
                    px-8
                    py-4
                    rounded-full
                    border-2
                    border-teal-600
                    text-teal-700
                    hover:bg-white/40
                    font-semibold
                    text-base
                    transition-all
                    duration-300
                    hover:-translate-y-1
                  "
                >
                  <span>ابحث عن طبيب</span>

                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
            </div>

           
            
          </div>

          {/* ───────────────── IMAGE SIDE ───────────────── */}
          <div
            className="relative flex items-center justify-center"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "scale(1)" : "scale(0.92)",
              transition:
                "all 0.8s 0.2s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div className="relative w-full max-w-[650px] mx-auto">

              {/* IMAGE */}
              <Image
                src="/home.png"
                alt="طبيب"
                width={700}
                height={700}
                priority
                className="
                  relative
                  z-10
                  w-full
                  h-auto
                  object-contain
                  drop-shadow-[0_20px_60px_rgba(0,0,0,0.18)]
                "
              />

              {/* Decorative elements */}
              <span className="absolute top-10 left-4 text-5xl text-teal-300/40 font-light">
                +
              </span>

              <span className="absolute bottom-10 right-4 text-4xl text-teal-300/30 font-light">
                +
              </span>

              <svg
                className="absolute top-16 right-10 w-24 opacity-40"
                viewBox="0 0 80 20"
                fill="none"
              >
                <path
                  d="M2 10 Q12 2, 22 10 Q32 18, 42 10 Q52 2, 62 10 Q72 18, 78 10"
                  stroke="#0F766E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 opacity-70">
        <span className="text-xs text-teal-800 font-medium">
          اكتشف المزيد
        </span>

        <ChevronDown className="w-5 h-5 text-teal-800 animate-bounce" />
      </div>
    </section>
  );
}