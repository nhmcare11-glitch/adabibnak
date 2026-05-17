"use client";

import { useState } from "react";
import {
  File,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  Download,
  X,
  FileSpreadsheet,
  Eye,
  Loader2,
  Play,
  Pause,
} from "lucide-react";

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getMedicalFileLabel(type = "", name = "") {
  if (type.startsWith("image/")) return "صورة طبية";
  if (type.startsWith("audio/")) return "تسجيل صوتي";
  if (type.startsWith("video/")) return "فيديو";
  if (type.includes("pdf")) return "تقرير PDF";
  if (type.includes("dicom") || name?.includes(".dcm"))
    return "صورة أشعة (DICOM)";
  if (
    type.includes("sheet") ||
    type.includes("excel") ||
    type.includes("csv")
  )
    return "تحليلات مخبرية";
  if (type.includes("document") || type.includes("word"))
    return "تقرير طبي";

  const lower = name?.toLowerCase();

  if (
    lower?.includes("radiology") ||
    lower?.includes("xray") ||
    lower?.includes("mri") ||
    lower?.includes("ct")
  )
    return "أشعة تشخيصية";

  if (
    lower?.includes("lab") ||
    lower?.includes("blood") ||
    lower?.includes("analysis")
  )
    return "تحليل مخبري";

  return "ملف طبي";
}

function getFileIcon(type = "", size = 20) {
  if (type.startsWith("image/")) return <ImageIcon size={size} />;
  if (type.startsWith("audio/")) return <Music size={size} />;
  if (type.startsWith("video/")) return <Video size={size} />;
  if (type.includes("pdf")) return <FileText size={size} />;

  if (
    type.includes("sheet") ||
    type.includes("excel") ||
    type.includes("csv")
  ) {
    return <FileSpreadsheet size={size} />;
  }

  if (type.includes("document") || type.includes("word")) {
    return <FileText size={size} />;
  }

  return <File size={size} />;
}

function getColors(type = "") {
  if (type.startsWith("image/")) {
    return {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      icon: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200/60 dark:border-emerald-700/40",
    };
  }

  if (type.startsWith("audio/")) {
    return {
      bg: "bg-violet-50 dark:bg-violet-900/20",
      icon: "text-violet-600 dark:text-violet-400",
      border: "border-violet-200/60 dark:border-violet-700/40",
    };
  }

  if (type.startsWith("video/")) {
    return {
      bg: "bg-rose-50 dark:bg-rose-900/20",
      icon: "text-rose-600 dark:text-rose-400",
      border: "border-rose-200/60 dark:border-rose-700/40",
    };
  }

  if (type.includes("pdf")) {
    return {
      bg: "bg-red-50 dark:bg-red-900/20",
      icon: "text-red-600 dark:text-red-400",
      border: "border-red-200/60 dark:border-red-700/40",
    };
  }

  if (
    type.includes("sheet") ||
    type.includes("excel") ||
    type.includes("csv")
  ) {
    return {
      bg: "bg-green-50 dark:bg-green-900/20",
      icon: "text-green-600 dark:text-green-400",
      border: "border-green-200/60 dark:border-green-700/40",
    };
  }

  if (type.includes("document") || type.includes("word")) {
    return {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      icon: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200/60 dark:border-blue-700/40",
    };
  }

  return {
    bg: "bg-slate-50 dark:bg-slate-800/70",
    icon: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200/60 dark:border-slate-700/40",
  };
}

/* =========================
   FILE PREVIEW BEFORE SEND
========================= */

export function FilePreview({
  file,
  onRemove,
}: {
  file: any;
  onRemove: () => void;
}) {
  const isImage = file.type?.startsWith("image/");

  return (
    <div className="relative group flex-shrink-0">
      <div
        className={`w-20 h-20 rounded-2xl overflow-hidden border border-[#2DBFB8]/20 bg-white dark:bg-[#0b2323] shadow-sm ${
          !isImage && "flex flex-col items-center justify-center p-2"
        }`}
      >
        {isImage && file.preview ? (
          <img
            src={file.preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <div className="text-[#2DBFB8]">
              {getFileIcon(file.type, 22)}
            </div>

            <span className="text-[9px] text-[#6b9e9e] mt-2 text-center line-clamp-2 break-all">
              {file.name}
            </span>
          </>
        )}
      </div>

      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
      >
        <X size={11} />
      </button>
    </div>
  );
}

/* =========================
   MAIN ATTACHMENT
========================= */

export default function FileAttachment({
  file,
}: {
  file: any;
  isPreview?: boolean;
  onRemove?: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  const isImage = file.type?.startsWith("image/");
  const isAudio = file.type?.startsWith("audio/");
  const isVideo = file.type?.startsWith("video/");

  const hasUrl = file.url && file.url.trim().length > 0;

  const label = getMedicalFileLabel(file.type, file.name);

  const colors = getColors(file.type);

  /* =========================
     IMAGE
  ========================= */

  if (isImage) {
    if (!hasUrl || imageError) {
      return (
        <div
          className={`w-[280px] rounded-2xl border ${colors.border} ${colors.bg} p-4 flex items-center gap-3`}
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.bg}`}
          >
            <ImageIcon className={colors.icon} size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0d5c5c] dark:text-white truncate">
              {file.name}
            </p>

            <p className="text-[10px] text-[#6b9e9e] mt-0.5">
              {label} • جارٍ التحميل...
            </p>
          </div>

          <Loader2
            size={16}
            className="animate-spin text-[#8ab5b5]"
          />
        </div>
      );
    }

    return (
      <div className="relative group w-fit">
        <div className="rounded-3xl overflow-hidden border border-[#2DBFB8]/15 shadow-sm bg-white dark:bg-[#0b2323]">
          <img
            src={file.url}
            alt={file.name}
            onError={() => setImageError(true)}
            onClick={() => window.open(file.url, "_blank")}
            className="max-w-[280px] max-h-[220px] object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="rounded-2xl bg-black/60 backdrop-blur-md px-3 py-2 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] text-white truncate">
                {file.name}
              </p>

              <p className="text-[9px] text-white/70">
                {formatFileSize(file.size)}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => window.open(file.url, "_blank")}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              >
                <Eye size={13} />
              </button>

              <a
                href={file.url}
                download={file.name}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              >
                <Download size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     AUDIO
  ========================= */

  if (isAudio) {
    return (
      <div
        className={`w-[320px] rounded-3xl border ${colors.border} bg-white dark:bg-[#0b2323] p-4 shadow-sm`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center ${colors.bg}`}
          >
            <Music className={colors.icon} size={18} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0d5c5c] dark:text-white truncate">
              {label}
            </p>

            <p className="text-[10px] text-[#8ab5b5] truncate">
              {file.name}
            </p>
          </div>

          {hasUrl && (
            <a
              href={file.url}
              download={file.name}
              className="w-9 h-9 rounded-full hover:bg-[#2DBFB8]/10 flex items-center justify-center transition-colors"
            >
              <Download
                size={15}
                className="text-[#6b9e9e]"
              />
            </a>
          )}
        </div>

        {hasUrl ? (
          <audio
            controls
            src={file.url}
            className="w-full h-10"
          />
        ) : (
          <div className="flex items-center gap-2 text-[#8ab5b5] text-xs">
            <Loader2 size={14} className="animate-spin" />
            جارٍ التحميل...
          </div>
        )}
      </div>
    );
  }

  /* =========================
     VIDEO
  ========================= */

  if (isVideo) {
    return (
      <div className="w-fit">
        {hasUrl ? (
          <>
            <div className="rounded-3xl overflow-hidden border border-[#2DBFB8]/15 shadow-sm bg-black">
              <video
                controls
                src={file.url}
                className="max-w-[300px] max-h-[240px]"
              />
            </div>

            <div className="flex items-center justify-between px-2 mt-1">
              <span className="text-[10px] text-[#6b9e9e]">
                {label}
              </span>

              <a
                href={file.url}
                download={file.name}
                className="w-7 h-7 rounded-full hover:bg-[#2DBFB8]/10 flex items-center justify-center transition-colors"
              >
                <Download
                  size={13}
                  className="text-[#6b9e9e]"
                />
              </a>
            </div>
          </>
        ) : (
          <div
            className={`w-[280px] rounded-2xl border ${colors.border} ${colors.bg} p-4 flex items-center gap-3`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.bg}`}
            >
              <Video className={colors.icon} size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#0d5c5c] dark:text-white truncate">
                {file.name}
              </p>

              <p className="text-[10px] text-[#6b9e9e]">
                جارٍ التحميل...
              </p>
            </div>

            <Loader2
              size={16}
              className="animate-spin text-[#8ab5b5]"
            />
          </div>
        )}
      </div>
    );
  }

  /* =========================
     GENERIC FILE
  ========================= */

  return (
    <div
      onClick={() => hasUrl && window.open(file.url, "_blank")}
      className={`w-[290px] rounded-3xl border ${colors.border} ${colors.bg} p-4 shadow-sm hover:shadow-md transition-all cursor-pointer`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors.bg}`}
        >
          <div className={colors.icon}>
            {getFileIcon(file.type, 22)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#0d5c5c] dark:text-white truncate">
            {file.name}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[10px] text-[#2DBFB8] font-medium">
              {label}
            </span>

            {file.size && (
              <span className="text-[10px] text-[#8ab5b5]">
                {formatFileSize(file.size)}
              </span>
            )}
          </div>
        </div>

        {hasUrl ? (
          <a
            href={file.url}
            download={file.name}
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 rounded-full hover:bg-white/70 dark:hover:bg-[#102d2d] flex items-center justify-center transition-colors"
          >
            <Download
              size={15}
              className="text-[#6b9e9e]"
            />
          </a>
        ) : (
          <Loader2
            size={15}
            className="animate-spin text-[#8ab5b5]"
          />
        )}
      </div>
    </div>
  );
}