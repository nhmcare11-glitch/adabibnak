"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderImage?: string;
}

function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  senderName,
  senderImage,
}: MessageBubbleProps) {
  return (
    <div
      className={`flex items-end gap-2 mb-4 ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar للطبيب فقط */}
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8 border border-[#d7f3ef] shadow-sm">
          <AvatarImage src={senderImage} />

          <AvatarFallback className="bg-[#e6fffb] text-[#0d7377] text-xs font-bold">
            {senderName?.charAt(0) || "د"}
          </AvatarFallback>
        </Avatar>
      )}

      {/* الرسالة */}
      <div
        className={`
          relative
          max-w-[78%]
          px-4
          py-3
          rounded-[22px]
          shadow-sm
          transition-all
          duration-200
          ${
            isOwn
              ? `
                bg-gradient-to-br
                from-[#0d7377]
                to-[#10959a]
                text-white
                rounded-br-md
              `
              : `
                bg-white
                text-[#134e4a]
                border
                border-[#d7f3ef]
                rounded-bl-md
              `
          }
        `}
      >
        {/* اسم الطبيب */}
        {!isOwn && senderName && (
          <p className="text-[11px] font-bold mb-1 text-[#0d7377]">
            {senderName}
          </p>
        )}

        {/* محتوى الرسالة */}
        {message.content && (
          <p className="text-[14px] leading-7 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* الوقت */}
        <div
          className={`text-[10px] mt-2 flex justify-end ${
            isOwn
              ? "text-white/70"
              : "text-[#8ab5b5]"
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString(
            "ar",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;