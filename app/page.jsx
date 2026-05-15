'use client'

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "@/components/HeroSection";
import EmergencyButton from "@/components/ui/emergency-button";
import {
  Stethoscope, Baby, Brain, FlaskConical,
  ArrowLeft, Star, HeartPulse, ClipboardList,
} from "lucide-react";

// ─── Tilt Card ───
function TiltCard({ children, className = "", intensity = 8 }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const rx = (((e.clientY - r.top) / r.height) - 0.5) * -intensity * 2;
    const ry = (((e.clientX - r.left) / r.width) - 0.5) * intensity * 2;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ""; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      className={className}
      style={{ transition: "transform 0.15s ease", willChange: "transform" }}>
      {children}
    </div>
  );
}

// ─── Scroll To Top ───
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-8 left-6 z-50 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2DBFB8] text-xl text-white shadow-xl">↑</div>
    </button>
  );
}

// ─── Home Page ───
export default function Home() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role;
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!isLoaded) return; setLoading(false); }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const redirect = async () => {
      if (role === "PATIENT")              { router.replace("/patient-dashboard"); return; }
      if (role === "DOCTOR")               { router.replace("/doctor-dashboard"); return; }
      if (role === "ADMIN")                { router.replace("/admin"); return; }
      if (role === "SECRETARY")            { router.replace("/secretary-dashboard"); return; }
      if (role === "VERIFICATION_MANAGER") { router.replace("/verification-manager"); return; }
      if (!role) {
        try {
          const res = await fetch("/api/check-role");
          const data = await res.json();
          if (data.role === "PATIENT")              router.replace("/patient-dashboard");
          if (data.role === "DOCTOR")               router.replace("/doctor-dashboard");
          if (data.role === "ADMIN")                router.replace("/admin");
          if (data.role === "SECRETARY")            router.replace("/secretary-dashboard");
          if (data.role === "VERIFICATION_MANAGER") router.replace("/verification-manager");
        } catch (e) { console.log(e); }
      }
    };
    redirect();
  }, [isLoaded, role, router]);

  const startHref =
    role === "PATIENT" ? "/patient-dashboard" :
    role === "DOCTOR"  ? "/doctor-dashboard"  :
    role === "ADMIN"   ? "/admin"             : "/onboarding";

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent">
          <Image src="/cf5ee2fa-bcfb-4002-9175-679bd2d85a53.png" alt="logo" width={220} height={220}
            className="object-contain drop-shadow-[0_0_40px_rgba(45,191,184,0.5)]" />
        </div>
      )}

      <div className="relative overflow-hidden bg-[#f5f7f9] dark:bg-[#071312] transition-colors duration-500">
        <ScrollToTopButton />

        {/* ══════════════════════════════════
            زر طوارئ عائم للموبايل فقط
        ══════════════════════════════════ */}
        <div className="fixed bottom-24 right-6 z-50 md:hidden">
          <EmergencyButton />
        </div>

        {/* ══════════════════════════════════
            1. HERO — full-width bg image
        ══════════════════════════════════ */}
        <HeroSection startHref={startHref} />

        {/* ══════════════════════════════════
            2. WHY SECTION — "لماذا تختار أديبيناك؟"
        ══════════════════════════════════ */}
        <section className="py-20" dir="rtl">
          <div className="container mx-auto px-4 md:px-10">
            <div className="mb-10 text-center">
              <h2 className="mb-2 text-2xl font-black text-[#062220] dark:text-white md:text-3xl">
                لماذا تختار أديبيناك؟
              </h2>
              <p className="text-sm text-[#6b7a7a] dark:text-slate-400">
                نجمع بين التكنولوجيا والرعاية الطبية وفق أعلى معايير العالمية
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-5">
                <div className="relative overflow-hidden rounded-3xl bg-[#0f766e] p-7 text-white shadow-xl">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
                  <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5" />
                  <div className="relative z-10">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-3 text-xl font-black">تشخيص عن بعد</h3>
                    <p className="text-sm leading-relaxed text-white/80">
                      فريق طبي متكامل متاح في أوقات الحاجة، تشخيص فوري متكامل مع تتبع حالتك الصحية وإرسال تقارير دقيقة.
                    </p>
                    <button className="mt-5 flex items-center gap-2 text-sm font-semibold text-white/90 transition hover:text-white">
                      <span>إقرأ المزيد</span>
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <TiltCard className="rounded-2xl border border-[#2DBFB8]/20 bg-white p-6 shadow-sm dark:border-[#2DBFB8]/15 dark:bg-[#0a1e1d]">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2DBFB8]/15">
                    <HeartPulse className="h-5 w-5 text-[#2DBFB8]" />
                  </div>
                  <h3 className="mb-2 font-bold text-[#062220] dark:text-white">تحليلات ذكية لصحتك</h3>
                  <p className="text-sm leading-relaxed text-[#6b7a7a] dark:text-slate-400">
                    نظام يعتمد على الذكاء الاصطناعي لتحليل بياناتك وتقديم توصيات صحية استباقية دقيقة.
                  </p>
                </TiltCard>
              </div>

              <div className="flex flex-col gap-5">
                <TiltCard className="rounded-2xl border border-[#2DBFB8]/20 bg-white p-6 shadow-sm dark:border-[#2DBFB8]/15 dark:bg-[#0a1e1d]">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2DBFB8]/15">
                    <Brain className="h-5 w-5 text-[#2DBFB8]" />
                  </div>
                  <h3 className="mb-2 font-bold text-[#062220] dark:text-white">تغطية صحراوية كاملة</h3>
                  <p className="text-sm leading-relaxed text-[#6b7a7a] dark:text-slate-400">
                    شبكتنا تتيح التواصل الطبي في أبعد الأماكن بفضل تقنيات البيانات المتطورة.
                  </p>
                  <button className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#2DBFB8]">
                    <span>إقرأ المزيد</span>
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                </TiltCard>

                <TiltCard className="rounded-2xl border border-[#2DBFB8]/20 bg-white p-6 shadow-sm dark:border-[#2DBFB8]/15 dark:bg-[#0a1e1d]">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2DBFB8]/15">
                    <ClipboardList className="h-5 w-5 text-[#2DBFB8]" />
                  </div>
                  <h3 className="mb-2 font-bold text-[#062220] dark:text-white">نخبة الأطباء</h3>
                  <p className="text-sm leading-relaxed text-[#6b7a7a] dark:text-slate-400">
                    فريق من أفضل الأطباء في مختلف التخصصات متاح لك على مدار الساعة في جميع أنحاء الجزائر.
                  </p>
                </TiltCard>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            3. SERVICES GRID
        ══════════════════════════════════ */}
        <section className="bg-[#f0f2f5] py-20 dark:bg-[#071312]" dir="rtl">
          <div className="container mx-auto px-4 md:px-10">
            <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="mb-1 text-2xl font-black text-[#062220] dark:text-white md:text-3xl">
                  خدمات طبية شاملة
                </h2>
                <p className="text-sm text-[#6b7a7a] dark:text-slate-400">
                  نقدم طيفاً واسعاً من الخدمات الطبية المصممة خصيصاً لتناسب حياتك
                </p>
              </div>
              <Link href="/doctors">
                <button className="rounded-full border border-[#2DBFB8]/40 px-5 py-2 text-sm font-semibold text-teal-700 transition hover:bg-[#2DBFB8]/10 dark:border-[#2DBFB8]/30 dark:text-[#2DBFB8]">
                  عرض كل الخدمات
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: <FlaskConical className="h-6 w-6 text-[#2DBFB8]" />, title: "تحاليل مرضية", desc: "فحوصات سريعة وإرسال النتائج فور الانتهاء مباشرة" },
                { icon: <Baby className="h-6 w-6 text-[#2DBFB8]" />, title: "طب الأطفال", desc: "رعاية متخصصة للأطفال ومتابعة نموهم الصحي" },
                { icon: <Brain className="h-6 w-6 text-[#2DBFB8]" />, title: "الأمراض المزمنة", desc: "برامج متابعة للسكري والضغط والأمراض المزمنة" },
                { icon: <Stethoscope className="h-6 w-6 text-[#2DBFB8]" />, title: "عيادة الطب العام", desc: "استشارات سريعة مع الكوادر الطبية المتخصصة" },
              ].map((s, i) => (
                <TiltCard key={i}>
                  <div className="group h-full cursor-pointer rounded-2xl border border-transparent bg-white p-6 text-right shadow-sm transition-all duration-300 hover:border-[#2DBFB8]/30 hover:shadow-md dark:bg-[#0a1e1d]">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2DBFB8]/12 transition group-hover:bg-[#2DBFB8]/22">
                      {s.icon}
                    </div>
                    <h3 className="mb-2 font-bold text-[#062220] dark:text-white">{s.title}</h3>
                    <p className="text-xs leading-relaxed text-[#6b7a7a] dark:text-slate-400">{s.desc}</p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            4. CTA DARK CARD
        ══════════════════════════════════ */}
        <section className="py-20" dir="rtl">
          <div className="container mx-auto px-4 md:px-10">
            <div className="relative overflow-hidden rounded-3xl bg-[#062220] shadow-2xl dark:bg-[#031410]">
              <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#2DBFB8]/15 blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-16 right-32 h-48 w-48 rounded-full bg-[#2DBFB8]/10 blur-[60px]" />

              <div className="relative z-10 flex flex-col items-center gap-8 p-10 md:flex-row md:items-center md:justify-between md:p-14">
                <div className="max-w-lg text-right">
                  <h2 className="mb-4 text-2xl font-black leading-snug text-white md:text-3xl lg:text-4xl">
                    جاهز لرحلة صحية أكثر ذكاءً؟
                  </h2>
                  <p className="mb-7 text-sm leading-relaxed text-white/70 md:text-base">
                    انضم لآلاف المرضى الذين يثقون بأديبيناك لتوفير الرعاية الطبية المتطورة في أي وقت وأي مكان.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href={startHref}>
                      <button className="rounded-full bg-[#2DBFB8] px-7 py-3 text-sm font-bold text-white shadow-[0_8px_25px_rgba(45,191,184,0.4)] transition hover:-translate-y-0.5 hover:bg-teal-500">
                        ابدأ مع سفاتشار
                      </button>
                    </Link>
                    <Link href="/doctors">
                      <button className="rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white">
                        تواصل معنا
                      </button>
                    </Link>
                  </div>
                </div>

                <div className="relative shrink-0">
                  <div className="relative h-52 w-52 overflow-hidden rounded-full border-4 border-[#2DBFB8]/40 shadow-[0_0_50px_rgba(45,191,184,0.3)] md:h-64 md:w-64">
                    <Image src="/home.png" alt="doctor" fill className="object-cover object-[2%_center]" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-[#2DBFB8]/20 scale-110" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            5. TESTIMONIALS
        ══════════════════════════════════ */}
        <section className="bg-[#f0f2f5] py-20 dark:bg-[#071312]" dir="rtl">
          <div className="container mx-auto px-4 md:px-10">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-black text-[#062220] dark:text-white md:text-3xl">
                ماذا يقول عملاؤنا؟
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                {
                  name: "أحمد المصطفاوي", role: "من سيدي بلعباس",
                  text: "كنت في رحلة عمل وابتعدت عن طبيبي المعتاد رغم ذلك نصحني الطبيب عبر المنصة بسرعة وكفاءة عالية بدون أي عناء. شكراً أديبيناك!",
                },
                {
                  name: "سارة الغريب", role: "من البليدة",
                  text: "سهولة الوصول للأطباء خلال ثوانٍ معدودة وكأنك أمامه مباشرة. أنصح كل من يحتاج رعاية صحية استخدام المنصة بثقة.",
                },
                {
                  name: "إدر الأحمر", role: "من تمنراست",
                  text: "كنت في رحلة عمل وكنت أحتاج طبيباً وكان التواصل سريعاً جداً، الطبيب متميز جداً في تخصصه وكانت الاستشارة مفيدة جداً.",
                },
              ].map((t, i) => (
                <div key={i}
                  className="rounded-2xl border border-[#2DBFB8]/15 bg-white p-6 text-right shadow-sm transition hover:shadow-md dark:border-[#2DBFB8]/15 dark:bg-[#0a1e1d]">
                  <div className="mb-4 flex items-center justify-end gap-3">
                    <div>
                      <div className="text-sm font-bold text-[#062220] dark:text-white">{t.name}</div>
                      <div className="text-xs text-[#6b7a7a] dark:text-slate-400">{t.role}</div>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2DBFB8]/20 text-lg font-bold text-[#2DBFB8]">
                      {t.name[0]}
                    </div>
                  </div>
                  <div className="mb-3 flex justify-end gap-0.5">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="h-3.5 w-3.5 fill-[#2DBFB8] text-[#2DBFB8]" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-[#6b7a7a] dark:text-slate-300">"{t.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}