"use client";

import { useState } from "react";
import { File, Image, FileText, Music, Video, Download, X, FileSpreadsheet, Eye, Loader2 } from "lucide-react";
import { formatFileSize, getFileIconColor, getFileBgColor, getMedicalFileLabel } from "@/lib/chat-utils";

interface ChatFile {
  name: string;
  type: string;
  size?: number;
  url: string;
}

interface FileAttachmentProps {
  file: ChatFile;
  isPreview?: boolean;
  onRemove?: () => void;
}

function FileIcon({ type, size = 20 }: { type: string; size?: number }) {
  if (type.startsWith("image/")) return <Image size={size} />;
  if (type.startsWith("audio/")) return <Music size={size} />;
  if (type.startsWith("video/")) return <Video size={size} />;
  if (type.includes("pdf")) return <FileText size={size} />;
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return <FileSpreadsheet size={size} />;
  if (type.includes("document") || type.includes("word")) return <FileText size={size} />;
  return <File size={size} />;
}

export function FilePreview({ file, onRemove }: { file: { file: File; preview: string | null; type: string; name: string }; onRemove: () => void }) {
  const isImage = file.type.startsWith("image/");

  return (
    <div className="relative group flex-shrink-0">
      <div className={`w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${
        isImage ? "" : "flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800"
      }`}>
        {isImage && file.preview ? (
          <img
            src={file.preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <FileIcon type={file.type} size={20} />
            <span className="text-[8px] text-slate-500 dark:text-slate-400 mt-1 px-1 truncate max-w-full">
              {file.name.slice(0, 8)}
            </span>
          </>
        )}
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <X size={10} />
      </button>
    </div>
  );
}

export default function FileAttachment({ file, isPreview = false, onRemove }: FileAttachmentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isImage = file.type.startsWith("image/");
  const isAudio = file.type.startsWith("audio/");
  const isVideo = file.type.startsWith("video/");
  const label = getMedicalFileLabel(file.type, file.name);

  // Handle empty URL
  const hasUrl = file.url && file.url.trim().length > 0;

  // Image preview with error handling
  if (isImage) {
    if (!hasUrl || imageError) {
      return (
        <div className="max-w-[280px]">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm bg-slate-50 dark:bg-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <Image size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                {file.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {label} • جارٍ التحميل...
              </p>
            </div>
            <Loader2 size={16} className="animate-spin text-slate-400" />
          </div>
        </div>
      );
    }

    return (
      <div className="relative group max-w-[280px]">
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-[280px] max-h-[200px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => window.open(file.url, "_blank")}
            onError={() => setImageError(true)}
          />
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            {label}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => window.open(file.url, "_blank")}
              className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-colors"
              title="عرض"
            >
              <Eye size={12} />
            </button>
            <a
              href={file.url}
              download={file.name}
              className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-colors"
              title="تحميل"
            >
              <Download size={12} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Audio player
  if (isAudio) {
    return (
      <div className="max-w-[320px]">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0">
            <Music size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
              {label}
            </p>
            {hasUrl ? (
              <audio
                controls
                src={file.url}
                className="w-full h-8 mt-1 [&::-webkit-media-controls-panel]:bg-transparent"
              />
            ) : (
              <p className="text-[10px] text-slate-400">جارـ التحميل...</p>
            )}
          </div>
          {hasUrl && (
            <a
              href={file.url}
              download={file.name}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              title="تحميل"
            >
              <Download size={14} className="text-slate-500 dark:text-slate-400" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Video preview
  if (isVideo) {
    return (
      <div className="max-w-[280px]">
        {hasUrl ? (
          <>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
              <video
                controls
                src={file.url}
                className="max-w-[280px] max-h-[200px] w-full"
              />
            </div>
            <div className="flex items-center justify-between mt-1 px-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
              <a
                href={file.url}
                download={file.name}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Download size={12} className="text-slate-500" />
              </a>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm bg-slate-50 dark:bg-slate-800">
            <Video size={20} className="text-rose-500" />
            <div className="flex-1">
              <p className="text-xs font-medium">{file.name}</p>
              <p className="text-[10px] text-slate-400">جارـ التحميل...</p>
            </div>
            <Loader2 size={16} className="animate-spin text-slate-400" />
          </div>
        )}
      </div>
    );
  }

  // Generic file
  return (
    <div className="max-w-[280px]">
      <div
        className={`flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm cursor-pointer hover:shadow-md transition-all ${
          getFileBgColor(file.type)
        }`}
        onClick={() => hasUrl && window.open(file.url, "_blank")}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getFileBgColor(file.type)}`}>
          <FileIcon type={file.type} size={20} className={getFileIconColor(file.type)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
            {file.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {label}
            </span>
            {file.size && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
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
            className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors flex-shrink-0"
            title="تحميل"
          >
            <Download size={14} className="text-slate-500 dark:text-slate-400" />
          </a>
        ) : (
          <Loader2 size={14} className="animate-spin text-slate-400" />
        )}
      </div>
    </div>
  );
}