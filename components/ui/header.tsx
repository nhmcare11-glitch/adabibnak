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
  ShieldCheck,
  Stethoscope,
  Calendar,
  User,
  Sparkles,
} from "lucide-react";

import { ThemeToggle } from "./theme-toggle";
import { NotificationsBell } from "./NotificationsBell";
import { getMyNotifications } from "@/actions/notifications";
import { NavLinks } from "./NavLinks";

const Header = () => {
  const { user: clerkUser, isSignedIn } = useUser();

  const role = clerkUser?.publicMetadata?.role as
    | string
    | undefined;

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [scrolled, setScrolled] =
    useState(false);

  // Notifications
  useEffect(() => {
    if (!isSignedIn) return;

    const fetchNotifications = async () => {
      try {
        const notifData =
          await getMyNotifications();

        setNotifications(
          notifData.notifications
        );

        setUnreadCount(
          notifData.unreadCount
        );
      } catch (e) {
        console.log(e);
      }
    };

    fetchNotifications();
  }, [isSignedIn]);

  // Scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, []);

  return (
    <header
      className={`
        fixed top-0 left-0 w-full z-50
        transition-all duration-500
        border-b
        ${
          scrolled
            ? `
              bg-[#071312]/80
              backdrop-blur-2xl
              border-[#2DBFB8]/10
              shadow-[0_8px_40px_rgba(0,0,0,0.35)]
            `
            : `
              bg-transparent
              border-transparent
            `
        }
      `}
    >
      {/* Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="
            absolute
            top-[-120px]
            left-1/2
            -translate-x-1/2
            w-[700px]
            h-[300px]
            bg-[#2DBFB8]/10
            blur-[120px]
            rounded-full
          "
        />
      </div>

      <nav
        className={`
          relative
          container
          mx-auto
          px-5
          flex
          items-center
          justify-between
          transition-all
          duration-500
          ${
            scrolled
              ? "h-[78px]"
              : "h-[95px]"
          }
        `}
      >
        {/* LEFT */}
        <Link
          href="/"
          className="
            flex
            items-center
            gap-3
            group
          "
        >
          <div
            className="
              relative
              flex
              items-center
              justify-center
            "
          >
            <div
              className="
                absolute
                inset-0
                bg-[#2DBFB8]/30
                blur-2xl
                rounded-full
                opacity-70
                group-hover:opacity-100
                transition
              "
            />

            <Image
              src="/logo-s.png"
              alt="logo"
              width={220}
              height={220}
              priority
              className={`
                relative
                object-contain
                transition-all
                duration-500
                drop-shadow-[0_0_25px_rgba(45,191,184,0.5)]
                ${
                  scrolled
                    ? "h-10 w-auto"
                    : "h-14 w-auto"
                }
              `}
            />
          </div>

          <div className="hidden md:flex flex-col">
            <h1
              className={`
                font-black
                tracking-wide
                text-white
                transition-all
                duration-500
                ${
                  scrolled
                    ? "text-lg"
                    : "text-2xl"
                }
              `}
            >
              Adabibanek
            </h1>

            <span
              className="
                text-[#7EE7E1]
                text-xs
                tracking-[0.25em]
                uppercase
              "
            >
              ⵜⴰⵎⵏⵔⴰⵙⵜ - تمنراست
            </span>
          </div>
        </Link>

        {/* CENTER NAV */}
        <div
          className="
            hidden
            lg:flex
            absolute
            left-1/2
            -translate-x-1/2
          "
        >
          <div
            className="
              px-6
              py-3
              rounded-full
              bg-white/5
              backdrop-blur-xl
              border
              border-white/10
              shadow-[0_8px_30px_rgba(0,0,0,0.2)]
            "
          >
            <NavLinks />
          </div>
        </div>

        {/* RIGHT */}
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <SignedIn>
            {role === "ADMIN" && (
              <Link href="/admin">
                <Button
                  className="
                    hidden
                    md:flex
                    items-center
                    gap-2
                    rounded-full
                    bg-[#2DBFB8]
                    hover:bg-[#27a8a2]
                    text-white
                    shadow-[0_0_25px_rgba(45,191,184,0.4)]
                    transition-all
                    duration-300
                    hover:scale-105
                  "
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}

            {role === "DOCTOR" && (
              <Link href="/doctor">
                <Button
                  className="
                    hidden
                    md:flex
                    items-center
                    gap-2
                    rounded-full
                    bg-[#2DBFB8]
                    hover:bg-[#27a8a2]
                    text-white
                    shadow-[0_0_25px_rgba(45,191,184,0.4)]
                    transition-all
                    duration-300
                    hover:scale-105
                  "
                >
                  <Stethoscope className="w-4 h-4" />
                  Doctor
                </Button>
              </Link>
            )}

            {role === "PATIENT" && (
              <Link href="/appointments">
                <Button
                  className="
                    hidden
                    md:flex
                    items-center
                    gap-2
                    rounded-full
                    bg-[#2DBFB8]
                    hover:bg-[#27a8a2]
                    text-white
                    shadow-[0_0_25px_rgba(45,191,184,0.4)]
                    transition-all
                    duration-300
                    hover:scale-105
                  "
                >
                  <Calendar className="w-4 h-4" />
                  Appointments
                </Button>
              </Link>
            )}

            {role === "UNASSIGNED" && (
              <Link href="/onboarding">
                <Button
                  className="
                    hidden
                    md:flex
                    items-center
                    gap-2
                    rounded-full
                    bg-[#2DBFB8]
                    hover:bg-[#27a8a2]
                    text-white
                    shadow-[0_0_25px_rgba(45,191,184,0.4)]
                    transition-all
                    duration-300
                    hover:scale-105
                  "
                >
                  <User className="w-4 h-4" />
                  Complete Profile
                </Button>
              </Link>
            )}
          </SignedIn>

          {/* Notifications */}
          {isSignedIn && (
            <div
              className="
                bg-white/5
                border
                border-white/10
                rounded-full
                backdrop-blur-xl
                p-1
              "
            >
              <NotificationsBell
                initialNotifications={
                  notifications
                }
                initialUnreadCount={
                  unreadCount
                }
              />
            </div>
          )}

          {/* Theme */}
          <div
            className="
              bg-white/5
              border
              border-white/10
              rounded-full
              backdrop-blur-xl
              p-1
            "
          >
            <ThemeToggle />
          </div>

          {/* Signed Out */}
          <SignedOut>
            <SignInButton>
              <Button
                className="
                  rounded-full
                  px-6
                  bg-gradient-to-r
                  from-[#2DBFB8]
                  to-[#1E8E89]
                  hover:scale-105
                  text-white
                  shadow-[0_0_30px_rgba(45,191,184,0.45)]
                  transition-all
                  duration-300
                  border
                  border-[#7EE7E1]/20
                "
              >
                <Sparkles className="w-4 h-4 mr-2" />
                تسجيل الدخول
              </Button>
            </SignInButton>
          </SignedOut>

          {/* User */}
          <SignedIn>
            <div
              className="
                rounded-full
                border
                border-[#2DBFB8]/20
                bg-white/5
                backdrop-blur-xl
                p-[2px]
                hover:scale-105
                transition-all
                duration-300
              "
            >
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "w-10 h-10",
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