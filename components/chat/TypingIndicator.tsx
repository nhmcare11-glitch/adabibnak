"use client";

import { useEffect, useState } from "react";

interface TypingIndicatorProps {
  name?: string;
}

export default function TypingIndicator({ name }: TypingIndicatorProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setStep((prev) => (prev + 1) % 4), 420);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-end gap-2 mb-2">
      <div className="w-6 h-6 rounded-full bg-[#d5eaea] flex items-center justify-center text-[9px] font-bold text-[#0d5c5c] flex-shrink-0">
        {name?.charAt(0)?.toUpperCase() || "د"}
      </div>
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#e0eaea] rounded-2xl rounded-tl-sm shadow-sm">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#0d7377] transition-all duration-200"
            style={{
              opacity: i < step ? 1 : 0.25,
              transform: i < step ? "scale(1)" : "scale(0.75)",
            }}
          />
        ))}
        {name && (
          <span className="text-[9px] text-[#8ab5b5] mr-1">{name} يكتب...</span>
        )}
      </div>
    </div>
  );
}