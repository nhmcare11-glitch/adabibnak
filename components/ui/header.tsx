"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Button } from "./button";
import {
  ShieldCheck, Stethoscope, Calendar,
  User, Menu, X,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsBell } from "./NotificationsBell";
import { getMyNotifications } from "@/actions/notifications";
import { NavLinks } from "./NavLinks";

const Header = () => {
  const { user: clerkUser, isSignedIn } = useUser();
  const role = clerkUser?.publicMetadata?.role as string | undefined;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    const fetch_ = async () => {
      try {
        const d = await getMyNotifications();
        setNotifications(d.notifications);
        setUnreadCount(d.unreadCount);
      } catch (e) { console.log(e); }
    };
    fetch_();
  }, [isSignedIn]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      dir="rtl"
      className={`fixed top-0 right-0 w-full z-50 transition-all duration-300
        ${scrolled
          ? "bg-white/95 dark:bg-[#071312]/95 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] border-b border-[#2DBFB8]/10"
          : "bg-white/90 dark:bg-[#071312]/80 backdrop-blur-md border-b border-gray-100/80 dark:border-white/5"
        }`}
    >
      <nav className="container mx-auto flex h-[68px] items-center justify-between px-4 md:px-8">

        {/* ── RIGHT: Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/logo.png"
            alt="Adabibanek"
            width={140}
            height={40}
            priority
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* ── CENTER: Nav Links (desktop) ── */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2">
          <NavLinks />
        </div>

        {/* ── LEFT: Actions ── */}
        <div className="flex items-center gap-2">

          {/* Signed In role buttons */}
          <SignedIn>
            {role === "ADMIN" && (
              <Link href="/admin" className="hidden md:block">
                <Button size="sm" className="rounded-full bg-[#2DBFB8] hover:bg-teal-600 text-white text-xs px-4 gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> لوحة الإدارة
                </Button>
              </Link>
            )}
            {role === "DOCTOR" && (
              <Link href="/doctor-dashboard" className="hidden md:block">
                <Button size="sm" className="rounded-full bg-[#2DBFB8] hover:bg-teal-600 text-white text-xs px-4 gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" /> لوحتي
                </Button>
              </Link>
            )}
            {role === "PATIENT" && (
              <Link href="/patient-dashboard" className="hidden md:block">
                <Button size="sm" className="rounded-full bg-[#2DBFB8] hover:bg-teal-600 text-white text-xs px-4 gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> مواعيدي
                </Button>
              </Link>
            )}
            {role === "UNASSIGNED" && (
              <Link href="/onboarding" className="hidden md:block">
                <Button size="sm" className="rounded-full bg-[#2DBFB8] hover:bg-teal-600 text-white text-xs px-4 gap-1.5">
                  <User className="w-3.5 h-3.5" /> أكمل ملفك
                </Button>
              </Link>
            )}
          </SignedIn>

          {/* Signed Out buttons */}
          <SignedOut>
            <SignInButton>
              <button className="hidden md:flex items-center rounded-full border border-gray-200 dark:border-white/10 px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                تسجيل الدخول
              </button>
            </SignInButton>
            <Link href="/sign-up" className="hidden md:block">
              <button className="flex items-center rounded-full bg-[#2DBFB8] px-5 py-1.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(45,191,184,0.4)] hover:bg-teal-500 transition">
                ابدأ الآن
              </button>
            </Link>
          </SignedOut>

          {/* Notifications */}
          {isSignedIn && (
            <div className="rounded-full border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-1">
              <NotificationsBell
                initialNotifications={notifications}
                initialUnreadCount={unreadCount}
              />
            </div>
          )}

          {/* Theme Toggle */}
          <div className="rounded-full border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-1">
            <ThemeToggle />
          </div>

          {/* User Avatar */}
          <SignedIn>
            <div className="rounded-full border-2 border-[#2DBFB8]/30 p-[2px] hover:border-[#2DBFB8]/60 transition">
              <UserButton
                appearance={{ elements: { avatarBox: "w-8 h-8" } }}
                afterSignOutUrl="/"
              />
            </div>
          </SignedIn>

          {/* Mobile Hamburger */}
          <button
            className="flex lg:hidden items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-96 border-t border-gray-100 dark:border-white/5" : "max-h-0"}`}>
        <div className="bg-white/95 dark:bg-[#071312]/95 backdrop-blur-xl px-6 py-5 flex flex-col gap-4" dir="rtl">
          <NavLinks mobile onClose={() => setMobileOpen(false)} />
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
            <SignedOut>
              <SignInButton>
                <button className="flex-1 rounded-full border border-gray-200 dark:border-white/10 py-2 text-sm font-medium text-gray-700 dark:text-white/80">
                  تسجيل الدخول
                </button>
              </SignInButton>
              <Link href="/sign-up" className="flex-1">
                <button className="w-full rounded-full bg-[#2DBFB8] py-2 text-sm font-bold text-white">
                  ابدأ الآن
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