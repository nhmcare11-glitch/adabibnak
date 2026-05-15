'use client'

import React from "react";
import { MapPin, Download } from "lucide-react";

export default function ClinicMapSection() {
  return (
    <section className="bg-[#062220] py-16" dir="rtl">
      <div className="container mx-auto px-4 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
          {/* النص */}
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
              اعثر على أقرب <span className="text-[#2DBFB8]">عيادة</span>
            </h2>
            <p className="text-sm text-white/60 leading-relaxed mb-6 max-w-md">
              شبكتنا تغطي كل المراكز الرئيسية والمسارات البدوية في الصحراء الجزائرية. 
              من أدرار إلى جانت، الرعاية دائماً في متناول يدك.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 rounded-full bg-[#2DBFB8] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_25px_rgba(45,191,184,0.4)] transition hover:-translate-y-0.5 hover:bg-teal-500">
                <MapPin className="h-4 w-4" />
                افتح الخريطة التفاعلية
              </button>
              <button className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white/80 backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/20 hover:text-white">
                <Download className="h-4 w-4" />
                تحميل قائمة العيادات (PDF)
              </button>
            </div>
          </div>

          {/* صورة الخريطة */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#2DBFB8]/20 shadow-[0_0_60px_rgba(45,191,184,0.15)]">
              <img 
                src="/algeria-map.jpg" 
                alt="خريطة عيادات أديبيناك في الجزائر"
                className="w-full h-auto object-cover"
              />
              {/* تأثير الإضاءة */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#062220]/80 via-transparent to-transparent" />
              
              {/* نقاط العيادات المضيئة */}
              <div className="absolute top-[45%] left-[55%]">
                <div className="relative">
                  <div className="h-3 w-3 bg-[#2DBFB8] rounded-full animate-pulse" />
                  <div className="absolute inset-0 h-3 w-3 bg-[#2DBFB8] rounded-full animate-ping opacity-75" />
                </div>
              </div>
              <div className="absolute top-[35%] left-[40%]">
                <div className="relative">
                  <div className="h-2 w-2 bg-[#2DBFB8] rounded-full animate-pulse" />
                </div>
              </div>
              <div className="absolute top-[60%] left-[65%]">
                <div className="relative">
                  <div className="h-2 w-2 bg-[#2DBFB8] rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* بطاقة العيادة المميزة */}
            <div className="absolute -bottom-4 left-4 bg-white dark:bg-[#0a1e1d] rounded-xl border border-[#2DBFB8]/20 px-4 py-2 shadow-lg">
              <div className="text-[10px] font-bold text-[#062220] dark:text-white">تمنراست المركزية</div>
              <div className="text-[9px] text-[#6b7a7a] dark:text-slate-400">عيادة نشطة</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}