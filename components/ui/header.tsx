"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  ShieldCheck, Stethoscope, Calendar,
  User, Menu, X, LogIn, Pill
} from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle";

const navItems = [
  { label: "الرئيسية", href: "#hero", id: "hero" },
  { label: "لماذا أديبيبنك", href: "#why", id: "why" },
  { label: "خدماتنا", href: "#services", id: "services" },
  { label: "آراء العملاء", href: "#testimonials", id: "testimonials" },
];

const Header = () => {
  const { user: clerkUser, isSignedIn } = useUser();
  const role = clerkUser?.publicMetadata?.role as string | undefined;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = navItems.map(item => item.id);
      for (const section of sections.reverse()) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e, href) => {
    e.preventDefault();
    const id = href.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setMobileOpen(false);
  };

  const isHomePage = pathname === "/";

  return (
    <header
      dir="rtl"
      className={`fixed top-0 right-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? "bg-white/95 dark:bg-[#0a1e1d]/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border-b border-gray-100/50 dark:border-[#2DBFB8]/10" 
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 md:px-8">

        {/* ── RIGHT: Logo (bigger, no box) ── */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <Image
            src="/logo-s.png"
            alt="Adabibnek"
            width={48}
            height={48}
            priority
            className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
          />
          <div className="flex flex-col">
            <span className={`text-xl font-black tracking-tight transition-colors duration-300 ${
              scrolled ? "text-[#062220] dark:text-white" : "text-white"
            } group-hover:text-[#2DBFB8]`}>
              Adabibnek
            </span>
            <span className={`text-[9px] font-medium -mt-1 tracking-wider transition-colors duration-300 ${
              scrolled ? "text-[#2DBFB8]" : "text-white/80"
            }`}>
              رعاية صحية عن بعد
            </span>
          </div>
        </Link>

        {/* ── CENTER: Nav Links (desktop) ── */}
        <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => isHomePage && scrollToSection(e, item.href)}
              className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeSection === item.id && isHomePage
                  ? "text-[#2DBFB8] bg-[#2DBFB8]/10"
                  : scrolled 
                    ? "text-gray-600 dark:text-slate-400 hover:text-[#2DBFB8] hover:bg-[#2DBFB8]/5"
                    : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
              {activeSection === item.id && isHomePage && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2DBFB8]" />
              )}
            </a>
          ))}
        </div>

        {/* ── LEFT: Actions ── */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Signed In - Role Buttons Only (NO logout button) */}
          <SignedIn>
            <div className="hidden md:flex items-center gap-2">
              {role === "ADMIN" && (
                <Link href="/admin">
                  <button className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2DBFB8] to-[#0f766e] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#2DBFB8]/25 hover:shadow-[#2DBFB8]/40 hover:-translate-y-0.5 transition-all duration-300">
                    <ShieldCheck className="w-3.5 h-3.5" /> لوحة الإدارة
                  </button>
                </Link>
              )}
              {role === "DOCTOR" && (
                <Link href="/doctor-dashboard">
                  <button className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2DBFB8] to-[#0f766e] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#2DBFB8]/25 hover:shadow-[#2DBFB8]/40 hover:-translate-y-0.5 transition-all duration-300">
                    <Stethoscope className="w-3.5 h-3.5" /> لوحتي
                  </button>
                </Link>
              )}
              {role === "PATIENT" && (
                <Link href="/pharmacy">
                  <button className="flex items-center gap-1.5 rounded-full border border-[#2DBFB8]/40 px-4 py-2.5 text-xs font-bold text-[#2DBFB8] hover:bg-[#2DBFB8]/10 hover:-translate-y-0.5 transition-all duration-300">
                    <Pill className="w-3.5 h-3.5" /> الصيدلية
                  </button>
                </Link>
              )}
              {role === "PATIENT" && (
                <Link href="/patient-dashboard">
                  <button className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2DBFB8] to-[#0f766e] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#2DBFB8]/25 hover:shadow-[#2DBFB8]/40 hover:-translate-y-0.5 transition-all duration-300">
                    <Calendar className="w-3.5 h-3.5" /> مواعيدي
                  </button>
                </Link>
              )}
              {role === "UNASSIGNED" && (
                <Link href="/onboarding">
                  <button className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2DBFB8] to-[#0f766e] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#2DBFB8]/25 hover:shadow-[#2DBFB8]/40 hover:-translate-y-0.5 transition-all duration-300">
                    <User className="w-3.5 h-3.5" /> أكمل ملفك
                  </button>
                </Link>
              )}
            </div>
          </SignedIn>

          {/* Signed Out - Login + Sign Up */}
          <SignedOut>
            <div className="hidden md:flex items-center gap-3">
              <SignInButton>
                <button className={`group relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium overflow-hidden rounded-full transition-all duration-300 ${
                  scrolled 
                    ? "text-gray-700 dark:text-slate-300 hover:text-[#2DBFB8]" 
                    : "text-white/90 hover:text-white"
                }`}>
                  <span className={`absolute inset-0 w-full h-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right rounded-full ${
                    scrolled ? "bg-[#2DBFB8]/10" : "bg-white/10"
                  }`} />
                  <LogIn className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10">تسجيل الدخول</span>
                </button>
              </SignInButton>

              <Link href="/sign-up">
                <button className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2DBFB8] to-[#0f766e] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#2DBFB8]/30 hover:shadow-[#2DBFB8]/50 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                  <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <User className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform" />
                  <span className="relative z-10">إنشاء حساب</span>
                </button>
              </Link>
            </div>
          </SignedOut>

          {/* Mobile Hamburger */}
          <button
            className={`flex lg:hidden items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 ${
              scrolled 
                ? "border-gray-200 dark:border-[#2DBFB8]/20 text-gray-500 dark:text-slate-400 hover:bg-[#2DBFB8]/10 hover:text-[#2DBFB8]" 
                : "border-white/20 text-white hover:bg-white/10"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <div className="relative w-4 h-4">
              <span className={`absolute left-0 block w-4 h-0.5 bg-current transition-all duration-300 ${mobileOpen ? "top-1.5 rotate-45" : "top-0.5"}`} />
              <span className={`absolute left-0 block w-4 h-0.5 bg-current transition-all duration-300 top-1.5 ${mobileOpen ? "opacity-0" : "opacity-100"}`} />
              <span className={`absolute left-0 block w-4 h-0.5 bg-current transition-all duration-300 ${mobileOpen ? "top-1.5 -rotate-45" : "top-2.5"}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      <div 
        className={`lg:hidden overflow-hidden transition-all duration-500 ${
          mobileOpen 
            ? "max-h-[500px] opacity-100" 
            : "max-h-0 opacity-0"
        }`}
      >
        <div className={`border-t px-6 py-6 flex flex-col gap-2 ${
          scrolled 
            ? "bg-white dark:bg-[#0a1e1d] border-gray-100 dark:border-[#2DBFB8]/10" 
            : "bg-[#0a1e1d]/95 backdrop-blur-xl border-white/10"
        }`} dir="rtl">
          {navItems.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => isHomePage && scrollToSection(e, item.href)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeSection === item.id && isHomePage
                  ? "text-[#2DBFB8] bg-[#2DBFB8]/10"
                  : scrolled
                    ? "text-gray-600 dark:text-slate-400 hover:text-[#2DBFB8] hover:bg-[#2DBFB8]/5"
                    : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              style={{ 
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? "translateX(0)" : "translateX(20px)",
                transition: `all 0.3s ease ${index * 50}ms`
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
              {item.label}
            </a>
          ))}

          <div className="flex gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-[#2DBFB8]/10">
            <SignedOut>
              <SignInButton>
                <button className="flex-1 rounded-xl border border-gray-300 dark:border-[#2DBFB8]/20 py-3 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-[#2DBFB8]/5 transition-all">
                  تسجيل الدخول
                </button>
              </SignInButton>
              <Link href="/sign-up" className="flex-1">
                <button className="w-full rounded-xl bg-gradient-to-r from-[#2DBFB8] to-[#0f766e] py-3 text-sm font-bold text-white shadow-lg shadow-[#2DBFB8]/25">
                  إنشاء حساب
                </button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;