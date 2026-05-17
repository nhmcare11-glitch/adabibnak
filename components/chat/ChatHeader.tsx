
"use client";

import {
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Circle,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";

export default function ChatHeader({
  otherPerson,
  isOnline = true,
  lastSeen,
  onBack,
  showBackButton = false,
}) {
  return (
    <div
      className="
        sticky top-0 z-30
        border-b border-white/10
        bg-white/70 dark:bg-[#071919]/70
        backdrop-blur-2xl
        shadow-[0_8px_30px_rgba(0,0,0,0.05)]
      "
    >
      {/* TOP GLOW */}

      <div
        className="
          absolute inset-0
          bg-gradient-to-r
          from-[#14b8a6]/5
          via-transparent
          to-[#14b8a6]/5
          pointer-events-none
        "
      />

      <div className="relative px-5 py-4 flex items-center justify-between">
        {/* LEFT SECTION */}

        <div className="flex items-center gap-4 min-w-0">
          {/* BACK BUTTON */}

          {showBackButton && (
            <button
              onClick={onBack}
              className="
                lg:hidden
                w-11 h-11 rounded-2xl
                flex items-center justify-center
                bg-white/60 dark:bg-white/5
                border border-white/10
                backdrop-blur-xl
                hover:scale-105
                hover:bg-[#14b8a6]/10
                transition-all duration-300
                shadow-lg
              "
            >
              <ArrowLeft
                size={18}
                className="text-[#0d5c5c] dark:text-[#4dd0d0]"
              />
            </button>
          )}

          {/* AVATAR */}

          <div className="relative flex-shrink-0">
            {/* Glow */}

            <div
              className="
                absolute inset-0 rounded-[28px]
                bg-[#14b8a6]/20
                blur-xl
                scale-110
              "
            />

            {otherPerson?.imageUrl ? (
              <img
                src={otherPerson.imageUrl}
                alt={otherPerson.name}
                className="
                  relative
                  w-14 h-14 rounded-[24px]
                  object-cover
                  border border-white/20
                  shadow-[0_10px_30px_rgba(0,0,0,0.12)]
                "
              />
            ) : (
              <div
                className="
                  relative
                  w-14 h-14 rounded-[24px]
                  bg-gradient-to-br
                  from-[#14b8a6]
                  via-[#0d7377]
                  to-[#0a5c5f]
                  flex items-center justify-center
                  text-white font-bold text-lg
                  shadow-[0_10px_30px_rgba(13,115,119,0.35)]
                "
              >
                {otherPerson?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}

            {/* ONLINE STATUS */}

            <div
              className={`
                absolute -bottom-1 -right-1
                w-5 h-5 rounded-full
                border-[3px]
                border-white dark:border-[#071919]
                flex items-center justify-center
                ${
                  isOnline
                    ? "bg-emerald-500"
                    : "bg-[#8ab5b5]"
                }
              `}
            >
              {isOnline && (
                <div className="w-full h-full rounded-full bg-emerald-400 animate-ping absolute" />
              )}
            </div>
          </div>

          {/* INFO */}

          <div className="min-w-0">
            {/* NAME */}

            <div className="flex items-center gap-2">
              <h3
                className="
                  text-[15px] font-bold
                  text-[#0d5c5c]
                  dark:text-white
                  truncate
                "
              >
                {otherPerson?.name || "مستخدم"}
              </h3>

              <div
                className="
                  px-2 py-1 rounded-xl
                  bg-emerald-500/10
                  border border-emerald-500/20
                  flex items-center gap-1
                "
              >
                <ShieldCheck
                  size={12}
                  className="text-emerald-500"
                />

                <span className="text-[10px] font-semibold text-emerald-600">
                  Verified
                </span>
              </div>
            </div>

            {/* STATUS */}

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {otherPerson?.specialty && (
                <div
                  className="
                    flex items-center gap-1.5
                    px-2.5 py-1 rounded-xl
                    bg-[#14b8a6]/10
                    border border-[#14b8a6]/15
                    backdrop-blur-md
                  "
                >
                  <Stethoscope
                    size={11}
                    className="text-[#14b8a6]"
                  />

                  <span className="text-[11px] font-medium text-[#14b8a6]">
                    {otherPerson.specialty}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Circle
                  size={7}
                  className={`
                    ${
                      isOnline
                        ? "fill-emerald-500 text-emerald-500"
                        : "fill-[#8ab5b5] text-[#8ab5b5]"
                    }
                  `}
                />

                <span className="text-[11px] text-[#7ba1a1] font-medium">
                  {isOnline
                    ? "متصل الآن"
                    : lastSeen || "غير متصل"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex items-center gap-2">
          {/* PHONE */}

          <button
            className="
              group
              w-11 h-11 rounded-2xl
              flex items-center justify-center
              bg-white/60 dark:bg-white/5
              border border-white/10
              backdrop-blur-xl
              hover:scale-105
              hover:bg-[#14b8a6]/10
              transition-all duration-300
              shadow-lg
            "
          >
            <Phone
              size={18}
              className="
                text-[#6b9e9e]
                group-hover:text-[#14b8a6]
                transition-colors
              "
            />
          </button>

          {/* VIDEO */}

          <button
            className="
              group
              w-11 h-11 rounded-2xl
              flex items-center justify-center
              bg-white/60 dark:bg-white/5
              border border-white/10
              backdrop-blur-xl
              hover:scale-105
              hover:bg-[#14b8a6]/10
              transition-all duration-300
              shadow-lg
            "
          >
            <Video
              size={18}
              className="
                text-[#6b9e9e]
                group-hover:text-[#14b8a6]
                transition-colors
              "
            />
          </button>

          {/* MENU */}

          <button
            className="
              group
              w-11 h-11 rounded-2xl
              flex items-center justify-center
              bg-white/60 dark:bg-white/5
              border border-white/10
              backdrop-blur-xl
              hover:scale-105
              hover:bg-[#14b8a6]/10
              transition-all duration-300
              shadow-lg
            "
          >
            <MoreVertical
              size={18}
              className="
                text-[#6b9e9e]
                group-hover:text-[#14b8a6]
                transition-colors
              "
            />
          </button>
        </div>
      </div>
    </div>
  );
}

