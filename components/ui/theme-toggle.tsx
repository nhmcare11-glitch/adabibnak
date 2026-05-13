"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-14 h-7 rounded-full bg-muted" />
    );
  }

  const isLight = theme === "light";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className={`
        relative w-14 h-7 rounded-full transition-all duration-500 ease-in-out
        ${isLight ? 'bg-sky-300' : 'bg-indigo-950'}
        border ${isLight ? 'border-sky-400' : 'border-indigo-800'}
        shadow-inner overflow-visible
      `}
    >
      {/* ☁️☁️☁️ غيوم - خارج حدود الزر */}
      {isLight && (
        <>
          {/* غيمة 1 - كبيرة */}
          <div className="absolute -top-1 -left-2 animate-cloud-1">
            <svg width="16" height="8" viewBox="0 0 24 12" fill="white" opacity="0.8">
              <path d="M6 12C2.5 12 0 9.5 0 6C0 3 2.5 1 5.5 0.5C6.5 -0.5 9 -0.5 11 0.5C13.5 0.5 16 2 17.5 4.5C20 5 22 7.5 22 10C22 12 19.5 12 17 12H6Z" />
            </svg>
          </div>
          
          {/* غيمة 2 */}
          <div className="absolute -bottom-1 -right-1 animate-cloud-2">
            <svg width="14" height="7" viewBox="0 0 20 10" fill="white" opacity="0.6">
              <path d="M4 10C1.5 10 0 8 0 5.5C0 3.5 1.5 1.5 4 1C4.5 -0.5 7 -0.5 9 0.5C11.5 0.5 14 2 15 4C17.5 4.5 19 6.5 19 9C19 10.5 17 10 15 10H4Z" />
            </svg>
          </div>
          
          {/* غيمة 3 */}
          <div className="absolute -top-2 right-0 animate-cloud-3">
            <svg width="10" height="5" viewBox="0 0 16 8" fill="white" opacity="0.5">
              <path d="M3 8C1 8 0 6.5 0 5C0 3.5 1 2 3 1.5C3.5 0.5 5.5 0 7 0C9.5 0 11.5 1.5 12 3C14 3.5 15 5 15 6.5C15 8 13.5 8 12 8H3Z" />
            </svg>
          </div>
          
          {/* غيمة 4 */}
          <div className="absolute -bottom-2 left-1 animate-cloud-4">
            <svg width="12" height="6" viewBox="0 0 18 9" fill="white" opacity="0.45">
              <path d="M3.5 9C1.5 9 0 7.5 0 5.5C0 3.5 1.5 2 3.5 1.5C4 0 6.5 -0.5 8 0.5C10.5 0.5 13 2 14 4C16 4.5 17.5 6.5 17.5 8C17.5 9 15.5 9 13.5 9H3.5Z" />
            </svg>
          </div>
        </>
      )}

      {/* ⭐⭐⭐ نجوم - خارج حدود الزر */}
      {!isLight && (
        <>
          {/* نجمة 1 - كبيرة */}
          <div className="absolute -top-1 -left-1 animate-star-1">
            <svg width="8" height="8" viewBox="0 0 12 12" fill="#fde047">
              <polygon points="6,0 7.5,4.5 12,6 7.5,7.5 6,12 4.5,7.5 0,6 4.5,4.5" />
            </svg>
          </div>
          
          {/* نجمة 2 */}
          <div className="absolute -bottom-1 -right-1 animate-star-2">
            <svg width="7" height="7" viewBox="0 0 10 10" fill="#bfdbfe">
              <polygon points="5,0 6,3.5 10,5 6,6.5 5,10 3.5,6.5 0,5 3.5,3.5" />
            </svg>
          </div>
          
          {/* نجمة 3 */}
          <div className="absolute -top-2 right-1 animate-star-3">
            <svg width="6" height="6" viewBox="0 0 8 8" fill="#fde047">
              <polygon points="4,0 5,3 8,4 5,5 4,8 3,5 0,4 3,3" />
            </svg>
          </div>
          
          {/* نجمة 4 */}
          <div className="absolute -bottom-2 left-2 animate-star-4">
            <svg width="5" height="5" viewBox="0 0 8 8" fill="#93c5fd">
              <polygon points="4,0 5,3 8,4 5,5 4,8 3,5 0,4 3,3" />
            </svg>
          </div>
        </>
      )}

      {/* الدائرة المنزلقة - صغيرة */}
      <div
        className={`
          absolute top-0.5 w-6 h-6 rounded-full 
          ${isLight ? 'left-0.5 bg-amber-400' : 'left-7 bg-indigo-400'}
          shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          flex items-center justify-center
        `}
      >
        {isLight ? (
          /* ☀️ أيقونة الشمس */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fef3c7">
            <circle cx="12" cy="12" r="4" fill="#fef3c7" />
            <g stroke="#fef3c7" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </g>
          </svg>
        ) : (
          /* 🌙 أيقونة القمر */
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#e0e7ff">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </div>

      <span className="sr-only">تبديل الثيم</span>
    </button>
  );
}