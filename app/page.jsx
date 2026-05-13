'use client'

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import HeroSection from "@/components/HeroSection";

import {
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
} from "lucide-react";

const Scene = dynamic(() => import("@/components/Scene"), {
  ssr: false,
});

// ─────────────────────────────────────────────
// Tilt Card
// ─────────────────────────────────────────────
function TiltCard({
  children,
  className = "",
  style = {},
  intensity = 12,
}) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const card = ref.current;

    if (!card) return;

    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX =
      ((y - centerY) / centerY) * -intensity;

    const rotateY =
      ((x - centerX) / centerX) * intensity;

    card.style.transform = `
      perspective(800px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      translateZ(10px)
    `;

    card.style.boxShadow = `
      ${-rotateY * 2}px ${rotateX * 2}px 40px rgba(45,191,184,0.2),
      0 20px 60px rgba(0,0,0,0.15)
    `;
  };

  const handleMouseLeave = () => {
    const card = ref.current;

    if (!card) return;

    card.style.transform = `
      perspective(800px)
      rotateX(0deg)
      rotateY(0deg)
      translateZ(0px)
    `;

    card.style.boxShadow = "";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transition:
          "transform 0.15s ease, box-shadow 0.15s ease",
        willChange: "transform",
        ...style,
      }}
    >
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
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  return (
    <button
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        })
      }
      className={`fixed bottom-8 left-6 z-50 transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-[#2DBFB8] flex items-center justify-center shadow-xl text-white text-xl">
        ↑
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  const { user, isLoaded } = useUser();

  const role = user?.publicMetadata?.role;

  const [loading, setLoading] = useState(true);

  // Loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Redirect حسب الدور
  useEffect(() => {
    if (!isLoaded) return;

    if (role === "PATIENT") {
      router.replace("/patient-dashboard");
    }

    if (role === "DOCTOR") {
      router.replace("/doctor");
    }

    if (role === "ADMIN") {
      router.replace("/admin");
    }
  }, [isLoaded, role, router]);

  return (
    <>
      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#2DBFB8]/10 blur-[120px]" />
          </div>

          <Image
            src="/logo-s.png"
            alt="logo"
            width={220}
            height={220}
            priority
            className="object-contain drop-shadow-[0_0_40px_rgba(45,191,184,0.5)]"
          />
        </div>
      )}

      <div className="bg-background">

        <ScrollToTopButton />

        {/* Hero */}
        <HeroSection />

        {/* 3D Scene */}
        <div className="relative h-[400px] w-full overflow-hidden">
          <Scene />
        </div>

        {/* Why Section */}
        <section
          className="py-24 bg-[#061a18] relative overflow-hidden"
          dir="rtl"
        >
          <div className="container mx-auto px-4">

            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="bg-[#2DBFB8]/20 border-[#2DBFB8]/30 px-4 py-1.5 text-blue-400 text-sm font-medium mb-5"
              >
                مميزاتنا
              </Badge>

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                لماذا
                <span className="text-[#3dd6cf]">
                  {" "}Adabibanek؟
                </span>
              </h2>

              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                منصة صحية متكاملة للأطباء والمرضى
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {[
                {
                  icon: (
                    <MessageCircle className="w-7 h-7 text-[#3dd6cf]" />
                  ),
                  title: "استشارات مباشرة",
                  desc: "تواصل مع الأطباء بسهولة",
                },
                {
                  icon: (
                    <ShieldCheck className="w-7 h-7 text-[#3dd6cf]" />
                  ),
                  title: "حماية وأمان",
                  desc: "بياناتك الطبية مشفرة وآمنة",
                },
                {
                  icon: (
                    <Stethoscope className="w-7 h-7 text-[#3dd6cf]" />
                  ),
                  title: "أطباء معتمدون",
                  desc: "أفضل الأطباء المتخصصين",
                },
                {
                  icon: (
                    <ClipboardList className="w-7 h-7 text-[#3dd6cf]" />
                  ),
                  title: "إدارة الملفات",
                  desc: "كل ملفاتك الصحية بمكان واحد",
                },
              ].map((item, idx) => (
                <TiltCard
                  key={idx}
                  intensity={6}
                >
                  <div className="rounded-xl bg-[#0a1e1d] border border-[#2DBFB8]/15 p-8 h-full hover:border-[#2DBFB8]/40 transition-all duration-300">

                    <div className="w-14 h-14 rounded-lg bg-[#2DBFB8]/15 border border-[#2DBFB8]/25 flex items-center justify-center mb-5">
                      {item.icon}
                    </div>

                    <h3 className="text-lg font-bold text-[#3dd6cf] mb-3">
                      {item.title}
                    </h3>

                    <p className="text-sm text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </TiltCard>
              ))}

            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">

            <Card className="bg-gradient-to-r from-[#2DBFB8]/25 to-[#0d4a47]/20 border-[#2DBFB8]/20">

              <CardContent className="p-8 md:p-12 lg:p-16 relative overflow-hidden">

                <div className="max-w-2xl relative z-10">

                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                    هل أنت مستعد؟
                  </h2>

                  <p className="text-lg text-muted-foreground mb-8">
                    انضم الآن إلى منصتنا الطبية الحديثة
                  </p>

                  <Button
                    asChild
                    size="lg"
                    className="bg-[#2DBFB8] hover:bg-[#1A9E99] text-white"
                  >
                    <Link href="/sign-up">
                      سجّل الآن
                    </Link>
                  </Button>

                </div>

              </CardContent>
            </Card>

          </div>
        </section>
      </div>
    </>
  );
}