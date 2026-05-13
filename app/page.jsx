'use client'

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "@/components/HeroSection";
import { MessageCircle, ShieldCheck, Stethoscope, ClipboardList } from "lucide-react";

// ─────────────────────────────────────────────
// Tilt Card
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Scroll To Top
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Home Page
// ─────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    setLoading(false);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (role === "PATIENT")              router.replace("/patient-dashboard");
    if (role === "DOCTOR")               router.replace("/doctor");
    if (role === "ADMIN")                router.replace("/admin");
    if (role === "SECRETARY")            router.replace("/secretary-dashboard");
    if (role === "VERIFICATION_MANAGER") router.replace("/verification-manager"); // ← جديد
  }, [isLoaded, role, router]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent">
          <Image src="/cf5ee2fa-bcfb-4002-9175-679bd2d85a53.png" alt="logo" width={220} height={220} className="object-contain drop-shadow-[0_0_40px_rgba(45,191,184,0.5)]" />
        </div>
      )}

      <div className="bg-[#eefdff] dark:bg-[#071312] overflow-hidden relative transition-colors duration-500">
        <ScrollToTopButton />
        <HeroSection />

        {/* Why Section */}
        <section className="py-24 relative overflow-hidden" dir="rtl">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-150px] left-[-100px] w-[400px] h-[400px] bg-[#2DBFB8]/10 dark:bg-[#0a4f49]/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-180px] right-[-120px] w-[450px] h-[450px] bg-cyan-300/10 dark:bg-[#2dd4bf]/20 blur-[140px] rounded-full" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <Badge variant="outline" className="bg-[#2DBFB8]/20 dark:bg-[#2DBFB8]/40 border-[#2DBFB8]/30 px-4 py-1.5 text-[#062220] dark:text-[#2DBFB8] text-sm font-medium mb-5">
                مميزاتنا
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-[#062220] dark:text-[#2DBFB8] mb-4">
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
                    <div className="w-14 h-14 rounded-lg bg-[#2DBFB8]/15 border border-[#2DBFB8]/25 flex items-center justify-center mb-5">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-[#3dd6cf] mb-3">{item.title}</h3>
                    <p className="text-sm text-[#54706d] dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border border-[#2DBFB8]/20 bg-white/40 dark:bg-[#071817]/80 backdrop-blur-2xl shadow-[0_20px_80px_rgba(45,191,184,0.12)] rounded-[34px]">
              <CardContent className="p-0 relative">
                <div className="relative h-[420px] w-full overflow-hidden">
                  <Image src="/are-you-ready.jpg" alt="medical" fill priority className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#dffcfb]/95 via-[#dffcfb]/40 to-transparent dark:hidden" />
                  <div className="hidden dark:block absolute inset-0 bg-gradient-to-t from-[#071312]/95 via-[#071312]/50 to-transparent" />
                  <div className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#2DBFB8]/20 blur-[120px] rounded-full" />
                </div>
                <div className="absolute inset-0 z-10 flex items-center">
                  <div className="p-10 md:p-16 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2DBFB8]/10 border border-[#2DBFB8]/20 text-[#2DBFB8] dark:text-[#7EE7E1] mb-6 backdrop-blur-xl">
                      مستقبل الطب الرقمي
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black leading-tight text-[#062220] dark:text-white mb-6">
                      هل أنت مستعد <br />
                      لتجربة طبية <span className="text-[#2DBFB8]">ذكية؟</span>
                    </h2>
                    <p className="text-lg md:text-xl text-[#1b4d49] dark:text-slate-300 leading-relaxed mb-8">
                      انضم إلى منصتنا الطبية الحديثة واستمتع بتجربة علاجية رقمية آمنة، سريعة، ومتطورة.
                    </p>
                    <Button asChild size="lg" className="h-14 px-8 rounded-2xl text-lg bg-gradient-to-r from-[#2DBFB8] to-[#1A9E99] hover:scale-105 transition-all duration-300 text-white shadow-[0_10px_40px_rgba(45,191,184,0.4)]">
                      <Link href="/sign-up">سجّل الآن</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

      </div>
    </>
  );
}