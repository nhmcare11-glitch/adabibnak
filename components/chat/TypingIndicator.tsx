"use client";

import { useEffect, useState } from "react";

interface TypingIndicatorProps {
  name?: string;
  isDark?: boolean;
}

export default function TypingIndicator({ name, isDark = false }: TypingIndicatorProps) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex items-end gap-1 px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full bg-teal-400 transition-all duration-200 ${
                i < dots ? "opacity-100 scale-100" : "opacity-30 scale-75"
              }`}
              style={{
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
        {name && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mr-1">
            {name} يكتب
          </span>
        )}
      </div>
    </div>
  );
}