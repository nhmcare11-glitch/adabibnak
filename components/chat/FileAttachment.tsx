"use client";

import { useState } from "react";
import {
  File, Image, FileText, Music, Video,
  Download, X, FileSpreadsheet, Eye, Loader2,
} from "lucide-react";

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getMedicalLabel(type: string, name?: string) {
  if (type.startsWith("image/")) return "صورة طبية";
  if (type.startsWith("audio/")) return "تسجيل صوتي";
  if (type.startsWith("video/")) return "فيديو";
  if (type.includes("pdf")) return "تقرير PDF";
  if (type.includes("dicom") || name?.includes(".dcm")) return "أشعة DICOM";
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return "تحليلات مخبرية";
  if (type.includes("document") || type.includes("word")) return "تقرير طبي";
  return "ملف طبي";
}

interface FileData {
  name: string;
  type: string;
  url?: string;
  size?: number;
  preview?: string | null;
}

function FileIconComp({ type, size = 18 }: { type: string; size?: number }) {
  if (type.startsWith("image/")) return <Image size={size} />;
  if (type.startsWith("audio/")) return <Music size={size} />;
  if (type.startsWith("video/")) return <Video size={size} />;
  if (type.includes("pdf")) return <FileText size={size} />;
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return <FileSpreadsheet size={size} />;
  if (type.includes("document") || type.includes("word")) return <FileText size={size} />;
  return <File size={size} />;
}

function getIconStyle(type: string): string {
  if (type.startsWith("image/")) return "text-emerald-600 bg-emerald-50";
  if (type.startsWith("audio/")) return "text-violet-600 bg-violet-50";
  if (type.startsWith("video/")) return "text-rose-600 bg-rose-50";
  if (type.includes("pdf")) return "text-red-600 bg-red-50";
  if (type.includes("sheet") || type.includes("excel")) return "text-green-600 bg-green-50";
  if (type.includes("document") || type.includes("word")) return "text-blue-600 bg-blue-50";
  return "text-slate-600 bg-slate-50";
}

// ── Small preview chip used in the input area before sending ─────────────
export function FilePreview({ file, onRemove }: { file: FileData; onRemove: () => void }) {
  const isImage = file.type.startsWith("image/");
  return (
    <div className="relative group flex-shrink-0">
      <div
        className={`w-12 h-12 rounded-xl border border-[#d0eaea] overflow-hidden ${
          isImage ? "" : "flex flex-col items-center justify-center bg-[#f5fafa]"
        }`}
      >
        {isImage && file.preview ? (
          <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <>
            <FileIconComp type={file.type} size={18} />
            <span className="text-[8px] text-[#8ab5b5] mt-0.5 px-1 truncate max-w-full">{file.name.slice(0, 7)}</span>
          </>
        )}
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <X size={9} />
      </button>
    </div>
  );
}

// ── Full attachment card used inside message bubbles ─────────────────────
export default function FileAttachment({ file }: { file: FileData }) {
  const [imageError, setImageError] = useState(false);
  const isImage = file.type.startsWith("image/");
  const isAudio = file.type.startsWith("audio/");
  const isVideo = file.type.startsWith("video/");
  const label = getMedicalLabel(file.type, file.name);
  const hasUrl = !!file.url?.trim();

  // ── Image ────────────────────────────────────────────────────────────────
  if (isImage) {
    if (!hasUrl || imageError) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-[#d0eaea] bg-[#f5fafa] px-4 py-3 max-w-[280px]">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Image size={18} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-[#0d3d3d] truncate">{file.name}</p>
            <p className="text-[9px] text-[#8ab5b5]">{label} · جارٍ التحميل</p>
          </div>
          <Loader2 size={14} className="animate-spin text-[#8ab5b5] flex-shrink-0" />
        </div>
      );
    }
    return (
      <div className="relative group max-w-[280px]">
        <div className="rounded-2xl overflow-hidden border border-[#d0eaea]">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-[280px] max-h-[200px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => window.open(file.url, "_blank")}
            onError={() => setImageError(true)}
          />
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] bg-black/55 text-white px-2 py-0.5 rounded-full">{label}</span>
          <div className="flex gap-1">
            <button
              onClick={() => window.open(file.url, "_blank")}
              className="p-1.5 rounded-full bg-black/55 text-white hover:bg-black/70 transition-colors"
            >
              <Eye size={11} />
            </button>
            <a
              href={file.url}
              download={file.name}
              className="p-1.5 rounded-full bg-black/55 text-white hover:bg-black/70 transition-colors"
            >
              <Download size={11} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Audio ────────────────────────────────────────────────────────────────
  if (isAudio) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-[#d0eaea] px-4 py-3 max-w-[300px] shadow-sm">
        <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
          <Music size={16} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-[#0d3d3d]">{label}</p>
          {hasUrl ? (
            <audio controls src={file.url} className="w-full h-7 mt-1" />
          ) : (
            <p className="text-[9px] text-[#8ab5b5] mt-0.5">جارٍ التحميل...</p>
          )}
        </div>
        {hasUrl && (
          <a href={file.url} download={file.name} className="p-1.5 rounded-full hover:bg-[#f0fafa] flex-shrink-0">
            <Download size={13} className="text-[#6b9e9e]" />
          </a>
        )}
      </div>
    );
  }

  // ── Video ────────────────────────────────────────────────────────────────
  if (isVideo) {
    return (
      <div className="max-w-[280px]">
        {hasUrl ? (
          <>
            <div className="rounded-2xl overflow-hidden border border-[#d0eaea]">
              <video controls src={file.url} className="max-w-[280px] max-h-[200px] w-full" />
            </div>
            <div className="flex items-center justify-between mt-1 px-1">
              <span className="text-[9px] text-[#8ab5b5]">{label}</span>
              <a href={file.url} download={file.name} className="p-1 rounded-full hover:bg-[#f0fafa]">
                <Download size={11} className="text-[#6b9e9e]" />
              </a>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-[#d0eaea] bg-[#f5fafa] px-4 py-3">
            <Video size={18} className="text-rose-500" />
            <div className="flex-1">
              <p className="text-[11px] font-medium text-[#0d3d3d]">{file.name}</p>
              <p className="text-[9px] text-[#8ab5b5]">جارٍ التحميل...</p>
            </div>
            <Loader2 size={14} className="animate-spin text-[#8ab5b5]" />
          </div>
        )}
      </div>
    );
  }

  // ── Generic (PDF, DOC, XLS…) ─────────────────────────────────────────────
  const iconStyle = getIconStyle(file.type);
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-[#d0eaea] bg-white px-4 py-3 max-w-[280px] cursor-pointer hover:border-[#0d7377]/30 hover:shadow-sm transition-all shadow-sm"
      onClick={() => hasUrl && window.open(file.url, "_blank")}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
        <FileIconComp type={file.type} size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-[#0d3d3d] truncate">{file.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] text-[#0d7377] font-medium">{label}</span>
          {file.size && <span className="text-[9px] text-[#8ab5b5]">{formatFileSize(file.size)}</span>}
        </div>
      </div>
      {hasUrl ? (
        <a
          href={file.url}
          download={file.name}
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-full hover:bg-[#f0fafa] flex-shrink-0"
        >
          <Download size={13} className="text-[#6b9e9e]" />
        </a>
      ) : (
        <Loader2 size={13} className="animate-spin text-[#8ab5b5]" />
      )}
    </div>
  );
}