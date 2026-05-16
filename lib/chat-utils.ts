"use client";

export function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getFileIconColor(type: string): string {
  if (type.startsWith("image/")) return "text-emerald-500";
  if (type.startsWith("audio/")) return "text-violet-500";
  if (type.startsWith("video/")) return "text-rose-500";
  if (type.includes("pdf")) return "text-red-500";
  if (type.includes("sheet") || type.includes("excel")) return "text-green-600";
  if (type.includes("document") || type.includes("word")) return "text-blue-600";
  return "text-slate-500";
}

export function getFileBgColor(type: string): string {
  if (type.startsWith("image/")) return "bg-emerald-50 dark:bg-emerald-950/30";
  if (type.startsWith("audio/")) return "bg-violet-50 dark:bg-violet-950/30";
  if (type.startsWith("video/")) return "bg-rose-50 dark:bg-rose-950/30";
  if (type.includes("pdf")) return "bg-red-50 dark:bg-red-950/30";
  if (type.includes("sheet") || type.includes("excel")) return "bg-green-50 dark:bg-green-950/30";
  if (type.includes("document") || type.includes("word")) return "bg-blue-50 dark:bg-blue-950/30";
  return "bg-slate-50 dark:bg-slate-900/50";
}

export function getMedicalFileLabel(type: string, name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("x-ray") || lowerName.includes("radiology") || lowerName.includes("scan")) {
    return "صورة أشعة";
  }
  if (lowerName.includes("lab") || lowerName.includes("blood") || lowerName.includes("test")) {
    return "نتيجة تحليل";
  }
  if (lowerName.includes("prescription") || lowerName.includes("rx")) {
    return "وصفة طبية";
  }
  if (type.startsWith("image/")) return "صورة";
  if (type.startsWith("audio/")) return "رسالة صوتية";
  if (type.includes("pdf")) return "ملف PDF";
  return "ملف مرفق";
}