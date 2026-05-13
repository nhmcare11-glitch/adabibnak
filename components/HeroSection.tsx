'use client'

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, ShieldCheck, Stethoscope, ClipboardList, ArrowLeft, Calendar } from "lucide-react";

// ───────────── Tilt Card ─────────────
function TiltCard({ children, className = "", style = {}, intensity = 12 }) {
  const ref = useRef(null);
  const handleMouseMove = (e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    card.style.boxShadow = `${-rotateY*2}px ${rotateX*2}px 40px rgba(45,191,184,0.2), 0 20px 60px rgba(0,0,0,0.15)`;
  };
  const handleMouseLeave = () => {
    const card = ref.current;
    if (!card) return;
    card.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
    card.style.boxShadow = "";
  };
  return (
    <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={className} style={{ transition: "transform 0.15s ease, box-shadow 0.15s ease", willChange: "transform", ...style }}>
      {children}
    </div>
  );
}

// ───────────── Scroll To Top ─────────────
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={`fixed bottom-8 left-6 z-50 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
      <div className="w-12 h-12 rounded-full bg-[#2DBFB8] flex items-center justify-center shadow-xl text-white text-xl">↑</div>
    </button>
  );
}

// ───────────── Hero Section ─────────────
function HeroSection({ mounted, startHref }) {
  return (
    <section dir="rtl" className="relative overflow-hidden min-h-screen transition-colors duration-500">
      {/* Background floating shapes */}
      <div className="absolute -top-24 -left-24 w-[450px] h-[450px] rounded-full bg-[#7EDEC8]/25 dark:bg-[#2dd4bf]/20 pointer-events-none animate-float-slow" />
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-[#A8F0E0]/20 dark:bg-[#0a4f49]/20 pointer-events-none animate-float-slower" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border-2 border-[#2DBFB8]/25 animate-spin-slow pointer-events-none" />
      <div className="absolute top-5 right-20 w-2 h-2 rounded-full bg-[#2DBFB8]/40 animate-pulse-slow" />
      <div className="absolute bottom-16 left-10 w-1.5 h-1.5 rounded-full bg-[#3dd6cf]/40 animate-pulse-slower" />

      <div className="relative z-10 container mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[90vh]">
          {/* Text */}
          <div className="flex flex-col gap-7 text-right lg:pr-10"
               style={{
                 opacity: mounted ? 1 : 0,
                 transform: mounted ? "translateX(0)" : "translateX(40px)",
                 transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)"
               }}>
            <div className="flex justify-start">
              <div className="px-5 py-2 rounded-full bg-white/40 dark:bg-[#2DBFB8]/30 backdrop-blur-md border border-white/50 text-teal-800 dark:text-white text-sm font-semibold shadow-md w-fit">
                منصة الرعاية الصحية الذكية
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-teal-900 dark:text-[#2DBFB8]">
              حتى في عمق الصحراء
              <br />
              <span className="text-teal-700 dark:text-white">طبيبك بين يديك</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-teal-800 dark:text-slate-200 max-w-xl">
              احجز المواعيد بسهولة، واستشر أفضل الأطباء عبر الفيديو، وأدر رحلتك الصحية كاملة داخل منصة حديثة وآمنة مصممة خصيصاً لتوفير الرعاية أينما كنت.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={startHref}>
                <button className="group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base shadow-[0_10px_30px_rgba(13,148,136,0.35)] transition-all duration-300 hover:-translate-y-1">
                  <span>احجز موعداً</span>
                  <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                </button>
              </Link>
              <Link href="/doctors">
                <button className="flex items-center justify-center gap-3 px-8 py-4 rounded-full border-2 border-teal-600 text-teal-700 hover:bg-white/40 font-semibold text-base transition-all duration-300 hover:-translate-y-1">
                  <span>ابحث عن طبيب</span>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="relative flex items-center justify-center"
               style={{
                 opacity: mounted ? 1 : 0,
                 transform: mounted ? "scale(1)" : "scale(0.92)",
                 transition: "all 0.8s 0.2s cubic-bezier(0.22,1,0.36,1)"
               }}>
            <div className="relative w-full max-w-[650px] mx-auto">
              <Image src="/home.png" alt="طبيب" width={700} height={700} priority className="relative z-10 w-full h-auto object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.18)]" />

              {/* Overlay under text */}
              <div className="absolute inset-0 z-0 flex justify-center items-end pointer-events-none">
                <div className="w-full h-40 bg-gradient-to-t from-[#2DBFB8]/30 via-transparent rounded-t-[60%] blur-[120px]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────── Home Page ─────────────
export default function Home() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role;
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (role === "PATIENT") router.replace("/patient-dashboard");
    if (role === "DOCTOR") router.replace("/doctor");
    if (role === "ADMIN") router.replace("/admin");
  }, [isLoaded, role, router]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent">
          <Image src="/a1fa8872-3571-4554-b9a6-04aad69e4567.png" alt="logo" width={220} height={220} className="object-contain drop-shadow-[0_0_40px_rgba(45,191,184,0.5)]" />
        </div>
      )}

      <div className="bg-[#eefdff] dark:bg-[#071312] overflow-hidden relative transition-colors duration-500">
        <ScrollToTopButton />
        <HeroSection mounted={mounted} startHref={role === "PATIENT" ? "/patient-dashboard" : role === "DOCTOR" ? "/doctor" : role === "ADMIN" ? "/admin" : "/onboarding"} />

        {/* لماذا Adabibanek؟ */}
        <section className="py-24 relative overflow-hidden" dir="rtl">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-150px] left-[-100px] w-[400px] h-[400px] bg-[#2DBFB8]/10 dark:bg-[#2dd4bf]/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-180px] right-[-120px] w-[450px] h-[450px] bg-cyan-300/10 dark:bg-[#0a4f49]/20 blur-[140px] rounded-full" />
          </div>
          <div className="container mx-auto px-4 relative z-10 text-center mb-16">
            <Badge variant="outline" className="bg-[#2DBFB8]/20 dark:bg-[#2DBFB8]/40 border-[#2DBFB8]/30 px-4 py-1.5 text-[#062220] dark:text-[#2DBFB8] text-sm font-medium mb-5">
              مميزاتنا
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-[#062220] dark:text-[#2dd4bf] mb-4">
              لماذا <span className="text-[#3dd6cf] dark:text-[#7EE7E1]">Adabibanek؟</span>
            </h2>
            <p className="text-[#4b6b68] dark:text-slate-200 text-lg max-w-xl mx-auto">
              منصة صحية متكاملة للأطباء والمرضى
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <MessageCircle className="w-7 h-7 text-[#3dd6cf]" />, title: "استشارات مباشرة", desc: "تواصل مع الأطباء بسهولة" },
              { icon: <ShieldCheck className="w-7 h-7 text-[#3dd6cf]" />, title: "حماية وأمان", desc: "بياناتك الطبية مشفرة وآمنة" },
              { icon: <Stethoscope className="w-7 h-7 text-[#3dd6cf]" />, title: "أطباء معتمدون", desc: "أفضل الأطباء المتخصصين" },
              { icon: <ClipboardList className="w-7 h-7 text-[#3dd6cf]" />, title: "إدارة الملفات", desc: "كل ملفاتك الصحية بمكان واحد" },
            ].map((item, idx) => (
              <TiltCard key={idx} intensity={6}>
                <div className="rounded-xl bg-white/80 dark:bg-[#0a1e1d] border border-[#2DBFB8]/15 dark:border-[#2DBFB8]/30 p-8 h-full hover:border-[#2DBFB8]/40 transition-all duration-300">
                  <div className="w-14 h-14 rounded-lg bg-[#2DBFB8]/15 border border-[#2DBFB8]/25 flex items-center justify-center mb-5">{item.icon}</div>
                  <h3 className="text-lg font-bold text-[#3dd6cf] mb-3">{item.title}</h3>
                  <p className="text-sm text-[#54706d] dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

      </div>
    </>
  );
}