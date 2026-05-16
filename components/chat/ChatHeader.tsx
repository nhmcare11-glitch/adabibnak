"use client";

import { Phone, Video, MoreVertical, ArrowLeft, Circle } from "lucide-react";
import Link from "next/link";
import type { ChatUser } from "@/lib/chat-types";

interface ChatHeaderProps {
  otherPerson: ChatUser;
  isOnline?: boolean;
  lastSeen?: string | null;
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function ChatHeader({
  otherPerson,
  isOnline = true,
  lastSeen,
  onBack,
  showBackButton = false,
}: ChatHeaderProps) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
          >
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative">
          {otherPerson.imageUrl ? (
            <img
              src={otherPerson.imageUrl}
              alt={otherPerson.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
              {otherPerson.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          {/* Online Status */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
              isOnline
                ? "bg-emerald-500"
                : "bg-slate-400"
            }`}
          >
            {isOnline && (
              <div className="w-full h-full rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {otherPerson.name || "مجهول"}
          </h3>
          <div className="flex items-center gap-1.5">
            {otherPerson.specialty && (
              <span className="text-[11px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-1.5 py-0.5 rounded-md">
                {otherPerson.specialty}
              </span>
            )}
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Circle
                size={6}
                className={isOnline ? "fill-emerald-500 text-emerald-500" : "fill-slate-400 text-slate-400"}
              />
              {isOnline ? "متصل الآن" : lastSeen || "غير متصل"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="p-2.5 rounded-full hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors group">
          <Phone size={18} className="text-slate-500 group-hover:text-teal-600 dark:text-slate-400 dark:group-hover:text-teal-400" />
        </button>
        <button className="p-2.5 rounded-full hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors group">
          <Video size={18} className="text-slate-500 group-hover:text-teal-600 dark:text-slate-400 dark:group-hover:text-teal-400" />
        </button>
        <button className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <MoreVertical size={18} className="text-slate-500 dark:text-slate-400" />
        </button>
      </div>
    </div>
  );
}