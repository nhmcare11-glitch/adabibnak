"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  ShieldCheck, Stethoscope, Calendar,
  User, Menu, X,
} from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle"; // ← تعديل المسار

const navItems = [
  { label: "من نحن", href: "/about" },
  { label: "الأطباء", href: "/doctors" },
  { label: "التخصصات", href: "/specialties" },
  { label: "الرئيسية", href: "/", active: true },
];

const Header = () => {
  const { user: clerkUser, isSignedIn } = useUser();
  const role = clerkUser?.publicMetadata?.role as string | undefined;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      dir="rtl"
      className="fixed top-0 right-0 w-full z-50 bg-white dark:bg-[#0a1e1d] border-b border-gray-100 dark:border-[#2DBFB8]/10 transition-colors duration-500"
    >
      <nav className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-4 md:px-6">

        {/* ── RIGHT: Logo ── */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.png"
            alt="أدبيباك"
            width={120}
            height={36}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* ── CENTER: Nav Links (desktop) ── */}
        <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition hover:text-[#2DBFB8] ${
                item.active
                  ? "text-[#2DBFB8] border-b-2 border-[#2DBFB8] pb-1"
                  : "text-gray-600 dark:text-slate-400"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* ── LEFT: Actions ── */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Signed In */}
          <SignedIn>
            {role === "ADMIN" && (
              <Link href="/admin" className="hidden md:block">
                <button className="flex items-center gap-1.5 rounded-full bg-[#2DBFB8] px-4 py-2 text-xs font-bold text-white hover:bg-[#25a8a2] transition">
                  <ShieldCheck className="w-3.5 h-3.5" /> لوحة الإدارة
                </button>
              </Link>
            )}
            {role === "DOCTOR" && (
              <Link href="/doctor-dashboard" className="hidden md:block">
                <button className="flex items-center gap-1.5 rounded-full bg-[#2DBFB8] px-4 py-2 text-xs font-bold text-white hover:bg-[#25a8a2] transition">
                  <Stethoscope className="w-3.5 h-3.5" /> لوحتي
                </button>
              </Link>
            )}
            {role === "PATIENT" && (
              <Link href="/patient-dashboard" className="hidden md:block">
                <button className="flex items-center gap-1.5 rounded-full bg-[#2DBFB8] px-4 py-2 text-xs font-bold text-white hover:bg-[#25a8a2] transition">
                  <Calendar className="w-3.5 h-3.5" /> مواعيدي
                </button>
              </Link>
            )}
            {role === "UNASSIGNED" && (
              <Link href="/onboarding" className="hidden md:block">
                <button className="flex items-center gap-1.5 rounded-full bg-[#2DBFB8] px-4 py-2 text-xs font-bold text-white hover:bg-[#25a8a2] transition">
                  <User className="w-3.5 h-3.5" /> أكمل ملفك
                </button>
              </Link>
            )}
            <div className="rounded-full border-2 border-[#2DBFB8]/30 p-[2px] hover:border-[#2DBFB8]/60 transition">
              <UserButton
                appearance={{ elements: { avatarBox: "w-8 h-8" } }}
                afterSignOutUrl="/"
              />
            </div>
          </SignedIn>

          {/* Signed Out */}
          <SignedOut>
            <SignInButton>
              <button className="hidden md:flex items-center text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition">
                تسجيل الدخول
              </button>
            </SignInButton>
            <Link href="/sign-up" className="hidden md:block">
              <button className="flex items-center rounded-full bg-[#2DBFB8] px-5 py-2 text-sm font-bold text-white hover:bg-[#25a8a2] transition">
                إنشاء حساب
              </button>
            </Link>
          </SignedOut>

          {/* Mobile Hamburger */}
          <button
            className="flex lg:hidden items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-[#2DBFB8]/20 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#2DBFB8]/10 transition"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-96 border-t border-gray-100 dark:border-[#2DBFB8]/10" : "max-h-0"}`}>
        <div className="bg-white dark:bg-[#0a1e1d] px-6 py-5 flex flex-col gap-4 transition-colors duration-500" dir="rtl">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`text-sm font-medium ${
                item.active ? "text-[#2DBFB8]" : "text-gray-600 dark:text-slate-400"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-[#2DBFB8]/10">
            <SignedOut>
              <SignInButton>
                <button className="flex-1 rounded-full border border-gray-300 dark:border-[#2DBFB8]/20 py-2 text-sm font-medium text-gray-600 dark:text-slate-300">
                  تسجيل الدخول
                </button>
              </SignInButton>
              <Link href="/sign-up" className="flex-1">
                <button className="w-full rounded-full bg-[#2DBFB8] py-2 text-sm font-bold text-white">
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