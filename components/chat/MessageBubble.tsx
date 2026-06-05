"use client";

import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Check, CheckCheck, Loader2, FileText, Music, Image, Download, File, FileSpreadsheet } from "lucide-react";

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

interface FileItem {
  name: string;
  type: string;
  url?: string;
  size?: number;
}

function InlineFile({ file }: { file: FileItem }) {
  const isImage = file.type?.startsWith("image/");
  const isAudio = file.type?.startsWith("audio/");
  const isPDF = file.type?.includes("pdf");
  const isSheet = file.type?.includes("sheet") || file.type?.includes("excel") || file.type?.includes("csv");
  const hasUrl = !!file.url?.trim();

  if (isImage && hasUrl) {
    return (
      <div className="relative group max-w-[210px] rounded-xl overflow-hidden border border-[#d0e8e8]">
        <img
          src={file.url}
          alt={file.name}
          className="w-full max-h-[160px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(file.url, "_blank")}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
      </div>
    );
  }

  if (isAudio && hasUrl) {
    return (
      <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2 border border-[#d0e8e8] max-w-[240px]">
        <div className="w-7 h-7 rounded-full bg-[#e0f5f5] flex items-center justify-center flex-shrink-0">
          <Music size={14} className="text-[#0d7377]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-[#0d3d3d] mb-0.5">رسالة صوتية</p>
          <audio controls src={file.url} className="w-full h-6" />
        </div>
      </div>
    );
  }

  // Generic: PDF, DOC, XLS, etc.
  const IconComp = isPDF ? FileText : isSheet ? FileSpreadsheet : File;
  const iconBg = isPDF ? "bg-red-50 text-red-500" : isSheet ? "bg-green-50 text-green-600" : "bg-[#f0f7f7] text-[#6b9e9e]";

  return (
    <div
      className="flex items-center gap-2.5 bg-white/80 rounded-xl px-3 py-2 border border-[#d0e8e8] max-w-[230px] cursor-pointer hover:border-[#0d7377]/30 transition-colors"
      onClick={() => hasUrl && window.open(file.url, "_blank")}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <IconComp size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-[#0d3d3d] truncate">{file.name}</p>
        <p className="text-[9px] text-[#8ab5b5] mt-0.5">{formatFileSize(file.size)}</p>
      </div>
      {hasUrl && (
        <a
          href={file.url}
          download={file.name}
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded-full hover:bg-[#f0fafa] transition-colors flex-shrink-0"
        >
          <Download size={12} className="text-[#6b9e9e]" />
        </a>
      )}
    </div>
  );
}

interface Message {
  id: string;
  content?: string;
  senderId: string;
  createdAt: string;
  files?: FileItem[];
  status?: "sending" | "sent" | "delivered" | "read";
  read?: boolean;
  isTemp?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderImage?: string;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  senderName,
  senderImage,
}: MessageBubbleProps) {
  const hasFiles = message.files && message.files.length > 0;
  const hasText = message.content?.trim() && message.content !== "🎤 رسالة صوتية";
  const offsetClass = !showAvatar ? (isOwn ? "pr-8" : "pl-8") : "";

  const StatusIcon = () => {
    if (message.status === "sending") return <Loader2 size={10} className="animate-spin text-white/60" />;
    if (message.read || message.status === "read") return <CheckCheck size={11} className="text-[#7dd3d0]" />;
    if (message.status === "sent") return <Check size={11} className="text-[#8ab5b5]" />;
    return <Check size={11} className="text-[#8ab5b5]" />;
  };

  return (
    <div className={`flex gap-2 mb-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"} ${offsetClass}`}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0 self-end">
          {senderImage ? (
            <img
              src={senderImage}
              alt={senderName}
              className="w-6 h-6 rounded-full object-cover border border-[#d0e5e5]"
            />
          ) : (
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                isOwn ? "bg-[#0d7377] text-white" : "bg-[#d5eaea] text-[#0d5c5c]"
              }`}
            >
              {senderName?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`flex flex-col max-w-[68%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Files */}
        {hasFiles && (
          <div className={`flex flex-col gap-1.5 mb-1 ${isOwn ? "items-end" : "items-start"}`}>
            {message.files?.map((file, i) => <InlineFile key={i} file={file} />)}
          </div>
        )}

        {/* Text bubble */}
        {hasText && (
          <div
            className={`px-3 py-2 text-[12px] leading-relaxed ${
              isOwn
                ? "bg-[#0d7377] text-white rounded-2xl rounded-tr-sm"
                : "bg-white text-[#1a3d3d] rounded-2xl rounded-tl-sm border border-[#e0eaea] shadow-sm"
            }`}
          >
            {message.content}
          </div>
        )}

        {/* Timestamp & status */}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[9px] text-[#94b5b5]">
            {format(new Date(message.createdAt), "h:mm a", { locale: ar })}
          </span>
          {isOwn && <StatusIcon />}
          {message.isTemp && (
            <span className="text-[9px] text-[#94b5b5]">جارٍ الإرسال...</span>
          )}
        </div>
      </div>
    </div>
  );
}