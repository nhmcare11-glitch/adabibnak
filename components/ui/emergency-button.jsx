'use client'

import React, { useState } from "react";
import { Phone, Copy, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SECRETARY_PHONE = "+213-696465311"; // ← عدّل هذا برقم السكرتيرة الحقيقي

export default function EmergencyButton() {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopy = async () => {
    const cleanNumber = SECRETARY_PHONE.replace(/-/g, "");
    try {
      await navigator.clipboard.writeText(cleanNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = cleanNumber;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${SECRETARY_PHONE.replace(/-/g, "")}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="lg"
          className="gap-2 animate-pulse hover:animate-none shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 font-bold text-base px-6 py-5 rounded-full border-2 border-red-400 hover:border-red-300 bg-red-600 hover:bg-red-700"
        >
          <AlertTriangle className="h-5 w-5" />
          حالة طوارئ
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md border-red-200 dark:border-red-800 bg-white dark:bg-[#0a1e1d]" dir="rtl">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
            حالة طوارئ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-center text-[#6b7a7a] dark:text-slate-400 leading-relaxed text-sm">
            في الحالات المستعجلة أو عند صعوبة الحجز عبر الإنترنت، يرجى التواصل مباشرة مع السكرتيرة.
          </p>

          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-6 text-center space-y-3">
            <p className="text-sm font-medium text-[#6b7a7a] dark:text-slate-400">
              رقم السكرتيرة
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono tracking-wider">
              {SECRETARY_PHONE}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCall}
              className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold rounded-full"
              size="lg"
            >
              <Phone className="h-5 w-5" />
              اتصل الآن
            </Button>

            <Button
              onClick={handleCopy}
              variant="outline"
              className={`flex-1 gap-2 h-12 text-base font-semibold rounded-full border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 ${
                copied ? "bg-green-50 border-green-300 text-green-700 dark:bg-green-950/30 dark:border-green-700 dark:text-green-400" : "text-[#062220] dark:text-white"
              }`}
              size="lg"
            >
              {copied ? (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  تم النسخ!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  نسخ الرقم
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}