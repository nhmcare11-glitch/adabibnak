"use client";
import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Upload, FileText, Loader2, CheckCircle } from "lucide-react";

interface Props {
  onExtracted: (drugs: any[]) => void;
}

export function PrescriptionUpload({ onExtracted }: Props) {
  const [status, setStatus] = useState<"idle" | "uploading" | "extracting" | "done">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { startUpload } = useUploadThing("prescriptionUploader");

  const handleFile = async (file: File) => {
    if (!file) return;

    // معاينة الصورة
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    }

    try {
      // ١. رفع الملف
      setStatus("uploading");
      const uploaded = await startUpload([file]);
      if (!uploaded?.[0]) throw new Error("فشل الرفع");

      // ٢. استخراج الأدوية بالذكاء الاصطناعي
      setStatus("extracting");
      const res = await fetch("/api/pharmacy/prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: uploaded[0].url,
          fileType: file.type.startsWith("image/") ? "image" : "pdf",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الاستخراج");

      // ٣. إرسال النتائج للصفحة الأم
      setStatus("done");
      onExtracted(data.drugs);

    } catch (err: any) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const statusMessages = {
    idle: null,
    uploading: "جاري رفع الوصفة...",
    extracting: "جاري استخراج الأدوية بالذكاء الاصطناعي...",
    done: "تم استخراج الأدوية بنجاح ✓",
  };

  return (
    <div className="space-y-4">
      {/* منطقة الرفع */}
      <label
        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors text-center ${
          status !== "idle"
            ? "border-primary/40 bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-secondary/50"
        }`}
      >
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          disabled={status !== "idle"}
        />

        {/* أيقونة الحالة */}
        {status === "idle" && <Upload className="w-8 h-8 text-muted-foreground" />}
        {(status === "uploading" || status === "extracting") && (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        )}
        {status === "done" && <CheckCircle className="w-8 h-8 text-green-500" />}

        {/* النص */}
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {status === "idle" ? "اسحب الوصفة هنا أو اضغط للاختيار" : statusMessages[status]}
          </p>
          {status === "idle" && (
            <p className="text-xs text-muted-foreground">
              صورة أو PDF — مشفر ومحمي 🔒
            </p>
          )}
        </div>
      </label>

      {/* معاينة الصورة */}
      {preview && (
        <div className="relative rounded-xl overflow-hidden border">
          <img src={preview} alt="الوصفة" className="w-full max-h-48 object-cover" />
          <div className="absolute inset-0 bg-black/10" />
        </div>
      )}

      {/* رسالة خطأ */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <FileText className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}