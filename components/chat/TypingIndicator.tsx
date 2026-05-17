
"use client";

import { motion } from "framer-motion";

export default function TypingIndicator({ name }) {
  return (
    <div className="flex items-end gap-3 mb-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Avatar Placeholder */}

      <div
        className="
          w-9 h-9 rounded-2xl
          bg-gradient-to-br
          from-[#dff7f7]
          to-[#c8eded]
          shadow-lg
          border border-white/30
          flex-shrink-0
        "
      />

      {/* Bubble */}

      <div
        className="
          relative overflow-hidden
          px-5 py-4 rounded-[28px] rounded-tl-md
          bg-white/75 dark:bg-white/5
          backdrop-blur-2xl
          border border-[#dceeee]
          shadow-[0_10px_35px_rgba(0,0,0,0.07)]
        "
      >
        {/* Glow */}

        <div
          className="
            absolute inset-0
            bg-gradient-to-r
            from-white/10
            via-transparent
            to-white/5
            pointer-events-none
          "
        />

        <div className="relative flex items-center gap-3">
          {/* Animated Dots */}

          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -4, 0],
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
                className="
                  w-2 h-2 rounded-full
                  bg-gradient-to-br
                  from-[#14b8a6]
                  to-[#0d7377]
                  shadow-[0_0_10px_rgba(20,184,166,0.4)]
                "
              />
            ))}
          </div>

          {/* Text */}

          {name && (
            <span className="text-xs text-[#6b9e9e] font-medium">
              {name} يكتب...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

