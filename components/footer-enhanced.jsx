'use client'

import React from "react";
import { MapPin, ArrowUpRight, Stethoscope } from "lucide-react";

export default function FooterEnhanced() {
  return (
    <footer className="bg-white dark:bg-[#0a1e1d] border-t border-[#2DBFB8]/10" dir="rtl">
      <div className="container mx-auto px-4 md:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-[#2DBFB8]/15 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-[#2DBFB8]" />
              </div>
              <h3 className="text-lg font-bold text-[#2DBFB8]">أديبيناك</h3>
            </div>
            <p className="text-xs text-[#6b7a7a] leading-relaxed">
              رعاية صحية عن بعد. تميز طبي صحراوي.
            </p>
          </div>

          {/* روابط سريعة */}
          <div>
            <h4 className="text-xs font-bold text-[#2DBFB8] mb-4">روابط سريعة</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/doctors" className="text-xs text-[#6b7a7a] hover:text-[#2DBFB8] transition flex items-center gap-1">
                  العيادات الإقليمية
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/emergency" className="text-xs text-[#6b7a7a] hover:text-[#2DBFB8] transition flex items-center gap-1">
                  اتصال الطوارئ
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/medical-board" className="text-xs text-[#6b7a7a] hover:text-[#2DBFB8] transition flex items-center gap-1">
                  المجلس الطبي
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* قانوني */}
          <div>
            <h4 className="text-xs font-bold text-[#2DBFB8] mb-4">قانوني</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/privacy" className="text-xs text-[#6b7a7a] hover:text-[#2DBFB8] transition">
                  سياسة الخصوصية
                </a>
              </li>
              <li>
                <a href="/terms" className="text-xs text-[#6b7a7a] hover:text-[#2DBFB8] transition">
                  شروط الخدمة
                </a>
              </li>
            </ul>
          </div>

          {/* اللغات */}
          <div>
            <h4 className="text-xs font-bold text-[#2DBFB8] mb-4">اللغات</h4>
            <div className="flex gap-3">
              <button className="text-xs font-bold text-[#2DBFB8] bg-[#2DBFB8]/10 px-2 py-1 rounded">عربي</button>
              <button className="text-xs text-[#6b7a7a] hover:text-[#062220] transition px-2 py-1">FR</button>
              <button className="text-xs text-[#6b7a7a] hover:text-[#062220] transition px-2 py-1">EN</button>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-[#6b7a7a]">
              <MapPin className="h-3 w-3" />
              <span className="text-[9px]">الجزائر - الصحراء الكبرى</span>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-[#2DBFB8]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-right">
            <p className="text-[10px] text-[#6b7a7a]">
              © 2026 أديبيناك. جميع الحقوق محفوظة.
            </p>
            <p className="text-[10px] text-[#6b7a7a]/70 mt-1">
              مصمم لسكان المناطق النائية
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-[10px] text-[#6b7a7a]">
              created by <span className="text-[#2DBFB8] font-semibold">MHNcare</span>
            </p>
          </div>
          
          <div className="text-center md:text-left">
            <p className="text-[10px] text-[#6b7a7a]/70">
              Adabibnek — رعاية صحية عن بعد
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}