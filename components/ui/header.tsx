"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { Button } from './button';
import { ShieldCheck, Stethoscope, Calendar, User } from 'lucide-react';
import { ThemeToggle } from "./theme-toggle";
import { NotificationsBell } from "./NotificationsBell";
import { getMyNotifications } from "@/actions/notifications";
import { NavLinks } from "./NavLinks";

const btn3D = `
  transition-all duration-200
  hover:[transform:perspective(400px)_translateZ(8px)_translateY(-3px)]
  hover:shadow-[0_10px_28px_rgba(59,130,246,0.35)]
  active:[transform:perspective(400px)_translateZ(-4px)_translateY(2px)]
  active:shadow-[0_2px_6px_rgba(59,130,246,0.15)]
` as const;

const btn3DGhost = `
  transition-all duration-200
  hover:[transform:perspective(400px)_translateZ(6px)_translateY(-2px)]
  hover:shadow-[0_6px_18px_rgba(59,130,246,0.25)]
  active:[transform:perspective(400px)_translateZ(-3px)_translateY(1px)]
` as const;

const Header = () => {
  const { user: clerkUser, isSignedIn } = useUser();
  const role = clerkUser?.publicMetadata?.role as string | undefined;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // جلب الإشعارات
  useEffect(() => {
    if (!isSignedIn) return;

    const fetchNotifications = async () => {
      try {
        const notifData = await getMyNotifications();
        setNotifications(notifData.notifications);
        setUnreadCount(notifData.unreadCount);
      } catch (e) {
        console.log("Failed to fetch notifications:", e);
      }
    };

    fetchNotifications();
  }, [isSignedIn]);

  // مراقبة التمرير
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`
      fixed top-0 w-full z-50 transition-all duration-500 ease-out
      ${scrolled
        ? 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg border-b border-white/20 dark:border-gray-700/30 shadow-lg'
        : 'bg-blue-100 backdrop-blur-md border-b-0 border-blue-700'
      }
    `}>
      <nav className={`
        container mx-auto px-4 flex items-center justify-between
        transition-all duration-500 ease-out
        ${scrolled ? 'h-14' : 'h-22'}
      `} style={{ height: scrolled ? "3.5rem" : "5.5rem" }}>

        {/* Logo - Left side */}
        <Link
          href="/"
          className={`
            flex items-center gap-2 cursor-pointer flex-shrink-0
            transition-all duration-500
            hover:[transform:perspective(400px)_translateZ(6px)_translateY(-2px)]
          `}
          style={{ willChange: "transform" }}
        >
          <Image
            src="/logo-s.png"
            alt="Adabibanek Logo"
            width={800}
            height={200}
            className={`
              object-contain transition-all duration-500
              ${scrolled ? 'h-8 w-auto' : 'h-12 w-auto'}
            `}
          />
          <div className={`flex flex-col transition-all duration-500 ${scrolled ? 'hidden md:flex' : 'flex'}`}>
            <span className={`text-blue-200 dark:text-blue-300 font-bold font-serif transition-all duration-500 ${scrolled ? 'text-sm' : 'text-xl'}`}>
              Adabibanek
            </span>
            <span className={`text-amber-200 dark:text-amber-400 text-sm transition-opacity duration-500 ${scrolled ? 'opacity-0 hidden' : 'opacity-100'}`}>
              ⵜⴰⵎⵏⵔⴰⵙⵜ - تمنراست
            </span>
          </div>
        </Link>

        {/* NavLinks في المنتصف */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <NavLinks />
        </div>

        {/* Buttons group - Right side */}
        <div className="flex items-center space-x-2 flex-shrink-0">

          <SignedIn>
            {role === "ADMIN" && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  className={`hidden md:inline-flex items-center gap-2 ${btn3D}`}
                  style={{ willChange: "transform" }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className={`md:hidden w-10 h-10 p-0 ${btn3DGhost}`}
                  style={{ willChange: "transform" }}
                >
                  <ShieldCheck className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {role === "DOCTOR" && (
              <Link href="/doctor">
                <Button
                  variant="outline"
                  className={`hidden md:inline-flex items-center gap-2 ${btn3D}`}
                  style={{ willChange: "transform" }}
                >
                  <Stethoscope className="h-4 w-4" />
                  Doctor Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className={`md:hidden w-10 h-10 p-0 ${btn3DGhost}`}
                  style={{ willChange: "transform" }}
                >
                  <Stethoscope className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {role === "PATIENT" && (
              <Link href="/appointments">
                <Button
                  variant="outline"
                  className={`hidden md:inline-flex items-center gap-2 ${btn3D}`}
                  style={{ willChange: "transform" }}
                >
                  <Calendar className="h-4 w-4" />
                  My Appointments
                </Button>
                <Button
                  variant="ghost"
                  className={`md:hidden w-10 h-10 p-0 ${btn3DGhost}`}
                  style={{ willChange: "transform" }}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {role === "UNASSIGNED" && (
              <Link href="/onboarding">
                <Button
                  variant="outline"
                  className={`hidden md:inline-flex items-center gap-2 ${btn3D}`}
                  style={{ willChange: "transform" }}
                >
                  <User className="h-4 w-4" />
                  اكمل الملف الشخصي
                </Button>
                <Button
                  variant="ghost"
                  className={`md:hidden w-10 h-10 p-0 ${btn3DGhost}`}
                  style={{ willChange: "transform" }}
                >
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </SignedIn>

          {/* Notifications Bell */}
          {isSignedIn && (
            <NotificationsBell
              initialNotifications={notifications}
              initialUnreadCount={unreadCount}
            />
          )}

          {/* Theme Toggle مع الغيوم والنجوم */}
          <ThemeToggle />

          <SignedOut>
            <SignInButton>
              <Button
                variant="secondary"
                className={`bg-blue-200 text-gray-900 hover:bg-blue-300 ${btn3D}`}
                style={{ willChange: "transform" }}
              >
                تسجيل الدخول
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div
              className="transition-all duration-200
                hover:[transform:perspective(400px)_translateZ(6px)_translateY(-2px)]
                hover:shadow-[0_8px_20px_rgba(59,130,246,0.3)]
                rounded-full"
              style={{ willChange: "transform" }}
            >
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonPopoverCard: "shadow-xl",
                    userPreviewMainIdentifier: "font-semibold",
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>
          </SignedIn>

        </div>
      </nav>
    </header>
  );
};

export default Header;