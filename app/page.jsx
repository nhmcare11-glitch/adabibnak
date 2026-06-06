'use client'

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import HeroSection from "@/components/HeroSection";
import {
  Stethoscope, Baby, Brain, Heart,
  Star, HeartPulse, ClipboardList,
  X, Phone, Send, MessageCircle,
  CheckCircle, AlertCircle
} from "lucide-react";

// ─── Contact Modal ───
function ContactModal({ isOpen, onClose }) {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("access_key", "YOUR_WEB3FORMS_KEY");
      formData.append("name", name.trim() || "زائر");
      formData.append("email", email.trim() || "no-reply@adabibnek.com");
      formData.append("message", message);
      formData.append("to", "nhm.care11@gmail.com");
      formData.append("subject", "رسالة جديدة من موقع Adabibnek");

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setMessage("");
          setName("");
          setEmail("");
          onClose();
        }, 2000);
      } else {
        setError("فشل الإرسال. حاول مرة أخرى.");
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ. تأكد من اتصالك.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={() => !sending && onClose()}
    >
      <div 
        className="relative w-full max-w-[320px] rounded-xl bg-white p-3 shadow-2xl dark:bg-[#0a1e1d]"
        style={{ 
          maxHeight: "70vh",
          overflowY: "auto",
          opacity: 1, transform: "scale(1) translateY(0)", transition: "all 0.25s ease"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={() => !sending && onClose()}
          disabled={sending}
          className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 disabled:opacity-50"
        >
          <X className="h-3 w-3" />
        </button>

        <div className="mb-2 text-center">
          <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#2DBFB8]/15">
            <MessageCircle className="h-4 w-4 text-[#2DBFB8]" />
          </div>
          <h3 className="text-sm font-bold text-[#062220] dark:text-white">تواصل معنا</h3>
        </div>

        <div className="mb-2 rounded-lg bg-[#2DBFB8]/10 p-2 text-center">
          <p className="text-[10px] text-[#6b7a7a] dark:text-slate-400">السكرتيرة</p>
          <a 
            href="tel:0696771006" 
            className="flex items-center justify-center gap-1 text-sm font-bold text-[#2DBFB8] hover:scale-105"
          >
            <Phone className="h-3 w-3" />
             0696 77 10 06
             0696 46 53 11
             0654 23 18 08
        
          </a>
        </div>

        {sent && (
          <div className="mb-2 rounded-md bg-green-50 p-2 text-center dark:bg-green-900/20">
            <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
            <p className="text-xs font-bold text-green-700 dark:text-green-400">تم الإرسال!</p>
          </div>
        )}

        {error && (
          <div className="mb-2 rounded-md bg-red-50 p-2 text-center dark:bg-red-900/20">
            <AlertCircle className="mx-auto h-3 w-3 text-red-500" />
            <p className="text-[10px] text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold text-[#062220] dark:text-white">
                الاسم <span className="text-[#6b7a7a] font-normal">(اختياري)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسمك"
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-right text-xs text-[#062220] outline-none focus:border-[#2DBFB8] dark:border-gray-700 dark:bg-[#071312] dark:text-white"
              />
            </div>

            <div>
              <label className="mb-0.5 block text-[10px] font-semibold text-[#062220] dark:text-white">
                البريد <span className="text-[#6b7a7a] font-normal">(اختياري)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك"
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-right text-xs text-[#062220] outline-none focus:border-[#2DBFB8] dark:border-gray-700 dark:bg-[#071312] dark:text-white"
              />
            </div>

            <div>
              <label className="mb-0.5 block text-[10px] font-semibold text-[#062220] dark:text-white">
                الرسالة <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب..."
                rows={2}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-right text-xs text-[#062220] outline-none focus:border-[#2DBFB8] resize-none dark:border-gray-700 dark:bg-[#071312] dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="flex w-full items-center justify-center gap-1 rounded-full bg-[#2DBFB8] px-3 py-1.5 text-xs font-bold text-white shadow-[0_2px_8px_rgba(45,191,184,0.4)] transition-all hover:-translate-y-0.5 hover:bg-teal-500 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  جاري...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  إرسال
                </>
              )}
            </button>
          </form>
        )}

        <p className="mt-1 text-center text-[8px] text-[#6b7a7a] dark:text-slate-500">
          إلى: nhm.care11@gmail.com
        </p>
      </div>
    </div>
  );
}

// ─── Scroll Reveal Hook ───
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);

  return { ref, isVisible };
}

// ─── Scroll Reveal Wrapper ───
function ScrollReveal({ children, className = "", delay = 0 }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transition: `all 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

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
  const [contactModalOpen, setContactModalOpen] = useState(false);

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

      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />

      <div className="relative overflow-hidden bg-[#f5f7f9] dark:bg-[#071312] transition-colors duration-500">
        <ScrollToTopButton />

        {/* HERO */}
        <div id="hero"><HeroSection startHref={startHref} /></div>

        {/* WHY SECTION */}
        <section id="why" className="py-20" dir="rtl">
          <div className="container mx-auto px-4 md:px-10">
            <ScrollReveal>
              <div className="mb-10 text-center">
                <h2 className="mb-2 text-2xl font-black text-[#2DBFB8] dark:text-[#2DBFB8] md:text-3xl">
                  لماذا تختار "Adabibnek"؟
                </h2>
                <p className="text-sm text-[#6b7a7a] dark:text-slate-400">
                  نجمع بين التكنولوجيا والرعاية الطبية وفق أعلى معايير العالمية
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-5">
                <ScrollReveal delay={0}>
                  <div className="relative overflow-hidden rounded-3xl bg-[#0f766e] p-7 text-white shadow-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(45,191,184,0.4)] hover:scale-[1.02]">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5" />
                    <div className="relative z-10">
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                        <Stethoscope className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="mb-3 text-xl font-black text-[#2DBFB8]">تشخيص عن بعد</h3>
                      <p className="text-sm leading-relaxed  text-[#080909] dark:text-slate-400"> 
                        فريق طبي متكامل متاح في أوقات الحاجة، تشخيص فوري متكامل مع تتبع حالتك الصحية وإرسال تقارير دقيقة.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <TiltCard className="rounded-2xl border border-[#2DBFB8]/20 bg-white p-6 shadow-sm dark:border-[#2DBFB8]/15 dark:bg-[#0a1e1d] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(45,191,184,0.25)] hover:scale-[1.02]">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2DBFB8]/15">
                      <HeartPulse className="h-5 w-5 text-[#2DBFB8]" />
                    </div>
                    <h3 className="mb-2 font-bold text-[#2DBFB8]">تحليلات ذكية لصحتك</h3>
                    <p className="text-sm leading-relaxed text-[#6b7a7a] dark:text-slate-400">
                      نظام يعتمد على الذكاء الاصطناعي لتحليل بياناتك وتقديم توصيات صحية استباقية دقيقة.
                    </p>
                  </TiltCard>
                </ScrollReveal>
              </div>

              <div className="flex flex-col gap-5">
                <ScrollReveal delay={0.05}>
                  <TiltCard className="rounded-2xl border border-[#2DBFB8]/20 bg-white p-6 shadow-sm dark:border-[#2DBFB8]/15 dark:bg-[#0a1e1d] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(45,191,184,0.25)] hover:scale-[1.02]">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2DBFB8]/15">
                      <Brain className="h-5 w-5 text-[#2DBFB8]" />
                    </div>
                    <h3 className="mb-2 font-bold text-[#2DBFB8]">تغطية صحراوية كاملة</h3>
                    <p className="text-sm leading-relaxed text-[#6b7a7a] dark:text-slate-400">
                      شبكتنا تتيح التواصل الطبي في أبعد الأماكن بفضل تقنيات البيانات المتطورة.
                    </p>
                  </TiltCard>
                </ScrollReveal>

                <ScrollReveal delay={0.15}>
                  <TiltCard className="rounded-2xl border border-[#2DBFB8]/20 bg-white p-6 shadow-sm dark:border-[#2DBFB8]/15 dark:bg-[#0a1e1d] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(45,191,184,0.25)] hover:scale-[1.02]">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2DBFB8]/15">
                      <ClipboardList className="h-5 w-5 text-[#2DBFB8]" />
                    </div>
                    <h3 className="mb-2 font-bold text-[#2DBFB8]">نخبة الأطباء</h3>
                    <p className="text-sm leading-relaxed text-white md:text-3xl lg:text-4xl">
                      فريق من أفضل الأطباء في مختلف التخصصات متاح لك على مدار الساعة في جميع أنحاء الجزائر.
                    </p>
                  </TiltCard>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="bg-[#f0f2f5] py-20 dark:bg-[#071312]" dir="rtl">
          <div className="container mx-auto px-4 md:px-10">
            <ScrollReveal>
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
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: <Heart className="h-6 w-6 text-[#2DBFB8]" />, title: "طب القلب", desc: "فحوصات وتشخيص متخصص لأمراض القلب والأوعية الدموية" },
                { icon: <Baby className="h-6 w-6 text-[#2DBFB8]" />, title: "طب الأطفال", desc: "رعاية متخصصة للأطفال ومتابعة نموهم الصحي" },
                { icon: <Brain className="h-6 w-6 text-[#2DBFB8]" />, title: "الأمراض المزمنة", desc: "برامج متابعة للسكري والضغط والأمراض المزمنة" },
                { icon: <Stethoscope className="h-6 w-6 text-[#2DBFB8]" />, title: "عيادة الطب العام", desc: "استشارات سريعة مع الكوادر الطبية المتخصصة" },
              ].map((s, i) => (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <TiltCard>
                    <div className="group h-full cursor-pointer rounded-2xl border border-transparent bg-white p-6 text-right shadow-sm transition-all duration-300 hover:border-[#2DBFB8]/30 hover:shadow-[0_8px_30px_rgba(45,191,184,0.25)] hover:scale-[1.03] dark:bg-[#0a1e1d]">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2DBFB8]/12 transition group-hover:bg-[#2DBFB8]/22">
                        {s.icon}
                      </div>
                      <h3 className="mb-2 font-bold text-[#2DBFB8]">{s.title}</h3>
                      <p className="text-xs leading-relaxed text-[#6b7a7a] dark:text-slate-400">{s.desc}</p>
                    </div>
                  </TiltCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20" dir="rtl">
          <div className="container mx-auto px-4 md:px-10">
            <ScrollReveal>
              <div className="relative overflow-hidden rounded-3xl bg-[#062220] shadow-2xl dark:bg-[#031410]">
                <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#2DBFB8]/15 blur-[80px]" />
                <div className="pointer-events-none absolute -bottom-16 right-32 h-48 w-48 rounded-full bg-[#2DBFB8]/10 blur-[60px]" />
                <div className="relative z-10 flex flex-col items-center gap-8 p-10 md:flex-row md:justify-between md:p-14">
                  <div className="max-w-lg text-right">
                    <h2 className="mb-4 text-2xl font-black leading-snug text-white md:text-3xl lg:text-4xl">
                      جاهز لرحلة صحية أكثر ذكاءً؟
                    </h2>
                    <p className="mb-7 text-sm leading-relaxed text-white/70 md:text-base">
                      انضم لآلاف المرضى الذين يثقون بـ Adabibnak للرعاية الطبية المتطورة في أي وقت وأي مكان.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link href={startHref}>
                        <button className="rounded-full bg-[#2DBFB8] px-7 py-3 text-sm font-bold text-white shadow-[0_8px_25px_rgba(45,191,184,0.4)] transition hover:-translate-y-0.5 hover:bg-teal-500">
                          ابدأ مع Adabibnak
                        </button>
                      </Link>
                      <button
                        onClick={() => setContactModalOpen(true)}
                        className="rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                      >
                        تواصل معنا
                      </button>
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
            </ScrollReveal>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="bg-[#f0f2f5] py-20 dark:bg-[#071312]" dir="rtl">
          <div className="container mx-auto px-4 md:px-10">
            <ScrollReveal>
              <div className="mb-12 text-center">
                <h2 className="text-2xl font-black text-[#062220] dark:text-white md:text-3xl">
                  ماذا يقول عملاؤنا؟
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                { name: "أحمد المصطفاوي", role: "من سيدي بلعباس", text: "كنت في رحلة عمل وابتعدت عن طبيبي المعتاد رغم ذلك نصحني الطبيب عبر المنصة بسرعة وكفاءة عالية بدون أي عناء. شكراً أديبيناك!" },
                { name: "سارة الغريب", role: "من البليدة", text: "سهولة الوصول للأطباء خلال ثوانٍ معدودة وكأنك أمامه مباشرة. أنصح كل من يحتاج رعاية صحية استخدام المنصة بثقة." },
                { name: "إدر الأحمر", role: "من تمنراست", text: "كنت في رحلة عمل وكنت أحتاج طبيباً وكان التواصل سريعاً جداً، الطبيب متميز جداً في تخصصه وكانت الاستشارة مفيدة جداً." },
              ].map((t, i) => (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <div className="rounded-2xl border border-[#2DBFB8]/15 bg-white p-6 text-right shadow-sm transition-all duration-300 hover:shadow-[0_8px_30px_rgba(45,191,184,0.2)] hover:scale-[1.02] dark:border-[#2DBFB8]/15 dark:bg-[#0a1e1d]">
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
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}