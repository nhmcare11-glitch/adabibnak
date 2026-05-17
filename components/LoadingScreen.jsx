"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function LoadingScreen({ children }) {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2.5s (leaving 0.5s for fade animation)
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2500);

    // Remove loading screen after 3s total
    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!loading) return children;

  return (
    <>
      {/* Loading Screen */}
      <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#071312] transition-opacity duration-500 ${
          fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Logo with pulse animation */}
        <div className="relative">
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-[#2DBFB8]/20 animate-ping" />
          </div>

          {/* Logo image */}
          <Image
            src="/logo-s.png"
            alt="Adabibnek"
            width={120}
            height={120}
            className="relative z-10 object-contain drop-shadow-[0_0_30px_rgba(45,191,184,0.6)] animate-pulse"
            priority
          />
        </div>

        {/* Brand name */}
        <h1 className="mt-6 text-xl font-black text-[#2DBFB8] tracking-wide">
          Adabibnek
        </h1>

        {/* Progress bar */}
        <div className="mt-4 w-48 h-1 bg-[#0a1e1d] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#2DBFB8] rounded-full animate-[loadProgress_3s_ease-in-out_forwards]"
            style={{
              animation: "loadProgress 3s ease-in-out forwards"
            }}
          />
        </div>

        {/* Loading text */}
        <p className="mt-3 text-xs text-[#6b7a7a] animate-pulse">
          جاري التحميل...
        </p>
      </div>

      {/* Main content (hidden while loading) */}
      <div className={loading ? "hidden" : ""}>{children}</div>

      {/* Keyframes for progress bar */}
      <style jsx global>{\`
        @keyframes loadProgress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      \`}</style>
    </>
  );
}