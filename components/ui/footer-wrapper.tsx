"use client";

import { usePathname } from "next/navigation";
import { Stethoscope } from "lucide-react";

export default function FooterWrapper() {
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith("/chat/");

  if (isChatPage) return null;

  return (
    <footer className="bg-background border-t border-blue-900/20 py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-400" />
            <span className="text-foreground font-bold text-lg font-serif">
              Adabibanek
            </span>
          </div>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent my-1" />
          <p className="text-xs text-muted-foreground">
            © 2026 Adabibnek — جميع الحقوق محفوظة
          </p>
          <p className="text-xs text-muted-foreground/60">
            created by{" "}
            <span className="text-blue-400 font-medium">MHNcare</span>
          </p>
        </div>
      </div>
    </footer>
  );
}