"use client";

import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Check, CheckCheck, Loader2, Clock } from "lucide-react";
import FileAttachment from "./FileAttachment";
import type { ChatMessage } from "@/lib/chat-types";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderImage?: string | null;
}

function MessageStatus({ status, read }: { status?: string; read?: boolean }) {
  if (status === "sending") {
    return <Loader2 size={12} className="animate-spin text-slate-400" />;
  }
  if (read) {
    return <CheckCheck size={12} className="text-teal-500" />;
  }
  if (status === "sent") {
    return <Check size={12} className="text-slate-400" />;
  }
  return <Clock size={12} className="text-slate-400" />;
}

function Avatar({ name, image, isOwn }: { name: string; image?: string | null; isOwn: boolean }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`w-8 h-8 rounded-full object-cover border-2 ${
          isOwn ? "border-teal-200 dark:border-teal-800" : "border-slate-200 dark:border-slate-700"
        }`}
      />
    );
  }
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
        isOwn
          ? "bg-gradient-to-br from-teal-400 to-teal-600 text-white"
          : "bg-gradient-to-br from-slate-300 to-slate-400 text-white dark:from-slate-600 dark:to-slate-700"
      }`}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  senderName,
  senderImage,
}: MessageBubbleProps) {
  const hasFiles = message.files && message.files.length > 0;
  const hasText = message.content && message.content.trim().length > 0;
  const isVoiceMessage = message.content === "🎤 رسالة صوتية" || message.content?.includes("🎤");

  return (
    <div
      className={`flex gap-2 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"} ${
        showAvatar ? "" : isOwn ? "pr-10" : "pl-10"
      }`}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0 self-end mb-1">
          <Avatar
            name={senderName || message.sender?.name || "?"}
            image={senderImage || message.sender?.imageUrl}
            isOwn={isOwn}
          />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name for group chats */}
        {senderName && !isOwn && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5 mr-2">
            {senderName}
          </span>
        )}

        {/* Files */}
        {hasFiles && (
          <div className={`flex flex-col gap-1.5 ${isOwn ? "items-end" : "items-start"}`}>
            {message.files?.map((file, i) => (
              <FileAttachment key={i} file={file} />
            ))}
          </div>
        )}

        {/* Text Message */}
        {hasText && !isVoiceMessage && (
          <div
            className={`relative px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
              isOwn
                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl rounded-tr-sm"
                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700"
            }`}
          >
            {message.content}
          </div>
        )}

        {/* Timestamp & Status */}
        <div
          className={`flex items-center gap-1 mt-0.5 ${
            isOwn ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {format(new Date(message.createdAt), "h:mm a", { locale: ar })}
          </span>
          {isOwn && (
            <span className="flex items-center">
              <MessageStatus status={message.status} read={message.read} />
            </span>
          )}
          {message.isTemp && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              جارٍ الإرسال...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}