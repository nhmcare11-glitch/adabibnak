'use client'

import React, { useState } from "react";
import { Phone, Copy, AlertTriangle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CONTACTS = [
  { id: "general", dept: "الطب العام", phone: "+213 696 46 53 11" },
  { id: "eye", dept: "طب العيون", phone: "+213 696 46 53 12" },
  { id: "heart", dept: "طب القلب", phone: "+213 696 46 53 13" },
  { id: "child", dept: "طب الأطفال", phone: "+213 696 46 53 14" },
];

export default function EmergencyButton() {
  const [copiedId, setCopiedId] = useState(null);
  const [open, setOpen] = useState(false);

  const copy = async (phone, id) => {
    const clean = phone.replace(/\s/g, "");
    try {
      await navigator.clipboard.writeText(clean);
    } catch {
      const t = document.createElement("textarea");
      t.value = clean;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const call = (phone) => {
    window.location.href = `tel:${phone.replace(/\s/g, "")}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border-2 border-red-500/80 bg-red-600/90 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-red-500 shadow-[0_8px_25px_rgba(220,38,38,0.4)] hover:shadow-[0_8px_30px_rgba(220,38,38,0.6)]">
          <AlertTriangle className="h-4 w-4" />
          حالة طوارئ
        </button>
      </DialogTrigger>

      <DialogContent 
        className="w-[340px] p-0 overflow-hidden border-[#2DBFB8]/20 dark:border-[#2DBFB8]/15 bg-[#f0f4f4] dark:bg-[#0a1e1d]" 
        dir="rtl"
      >
        {/* DialogTitle مخفي للـ Accessibility - يُصلح الخطأ */}
        <DialogTitle className="sr-only">
          جهات اتصال الطوارئ
        </DialogTitle>

        {/* Header */}
        <div className="px-3 pt-8 pb-2 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-3 w-3 text-red-500" />
          </div>
          <div className="text-xs font-bold text-[#062220] dark:text-white">
            طوارئ
          </div>
        </div>

        {/* Contacts */}
        <div className="px-3 pb-2 space-y-1">
          {CONTACTS.map((c) => (
            <div 
              key={c.id}
              className="flex items-center justify-between rounded-lg bg-white dark:bg-[#071312] border border-[#2DBFB8]/10 px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-bold text-[#062220] dark:text-white">
                  {c.dept}
                </div>
                <div className="text-[9px] font-mono text-[#6b7a7a] dark:text-slate-400">
                  {c.phone}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => copy(c.phone, c.id)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-[#2DBFB8]/20 text-[#6b7a7a] hover:bg-[#2DBFB8]/10"
                >
                  {copiedId === c.id ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                
                <button
                  onClick={() => call(c.phone)}
                  className="flex items-center gap-1 rounded bg-[#2DBFB8] px-2 py-0.5 text-[9px] font-bold text-white hover:bg-teal-600"
                >
                  <Phone className="h-2.5 w-2.5" />
                  اتصل
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between rounded-lg bg-white dark:bg-[#071312] border border-[#2DBFB8]/10 px-2.5 py-1">
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] text-[#6b7a7a] dark:text-slate-400">متاح</span>
            </div>
            <span className="text-[9px] text-[#2DBFB8]">{'<<'} 2 د</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}