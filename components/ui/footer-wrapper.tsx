
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Stethoscope, ArrowLeft } from "lucide-react";

export default function FooterWrapper() {
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith("/chat/");

  if (isChatPage) return null;

  return (
    <footer className="bg-[#034641] py-16" dir="rtl">
      <div className="container mx-auto px-4 md:px-10">
        {/* Top Section - 4 Columns */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 overflow-hidden">
                <Image src="/logo-s.png" alt="Adabibnek" width={40} height={40} className="object-cover w-full h-full" />
              </div>
             <span className="text-xl font-black text-white">Adabibnek</span>
            </div>
            
            <p className="text-sm text-white/70 leading-relaxed">
              رعاية صحية عن بعد. تميز طبي صحراوي.
            </p>
            <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
              <span>📍</span>
               <span>تمنراست - الصحراء الكبرى</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-[#2DBFB8] font-bold mb-4 text-lg flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              روابط سريعة
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/doctors" 
                  className="text-white/80 hover:text-[#2DBFB8] transition-all duration-300 text-sm flex items-center gap-2 group"
                >
                  <span className="text-[#2DBFB8] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  <span className="group-hover:mr-1 transition-all">العيادات الإقليمية</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-white/80 hover:text-[#2DBFB8] transition-all duration-300 text-sm flex items-center gap-2 group"
                >
                  <span className="text-[#2DBFB8] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  <span className="group-hover:mr-1 transition-all">اتصال الطوارئ</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/medical-board" 
                  className="text-white/80 hover:text-[#2DBFB8] transition-all duration-300 text-sm flex items-center gap-2 group"
                >
                  <span className="text-[#2DBFB8] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  <span className="group-hover:mr-1 transition-all">المجلس الطبي</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-white/80 hover:text-[#2DBFB8] transition-all duration-300 text-sm flex items-center gap-2 group"
                >
                  <span className="text-[#2DBFB8] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  <span className="group-hover:mr-1 transition-all">من نحن</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-[#2DBFB8] font-bold mb-4 text-lg flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              قانوني
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-white/80 hover:text-[#2DBFB8] transition-all duration-300 text-sm flex items-center gap-2 group"
                >
                  <span className="text-[#2DBFB8] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  <span className="group-hover:mr-1 transition-all">سياسة الخصوصية</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-white/80 hover:text-[#2DBFB8] transition-all duration-300 text-sm flex items-center gap-2 group"
                >
                  <span className="text-[#2DBFB8] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  <span className="group-hover:mr-1 transition-all">شروط الخدمة</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  className="text-white/80 hover:text-[#2DBFB8] transition-all duration-300 text-sm flex items-center gap-2 group"
                >
                  <span className="text-[#2DBFB8] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  <span className="group-hover:mr-1 transition-all">الأسئلة الشائعة</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Languages Column */}
          <div>
            

            {/* Social or Contact */}
            <div className="mt-6">
             <h4 className="text-[#2DBFB8] font-bold mb-3 text-sm">تواصل معنا</h4>



<a
  href="tel:0696465311"
  className="text-white/80 hover:text-[#2DBFB8] transition text-sm flex items-center gap-2"
>
  <span>📞</span>
  0696 46 53 11
</a>


<a
  href="mailto:nhm.care11@gmail.com"
  className="text-white/80 hover:text-[#2DBFB8] transition text-sm flex items-center gap-2"
>
  <span>📨</span>
  nhm.care11@gmail.com
</a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white/60 text-sm flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[#2DBFB8]" />
              <span className="text-[#2DBFB8] font-bold">Adabibnek</span>
            </div>

            <div className="text-white/60 text-sm">
              created by <span className="text-[#2DBFB8] font-bold">MHNcare</span>
            </div>

            <div className="text-white/60 text-sm">
              © 2026 Adabibnek. جميع الحقوق محفوظة.
            </div>
          </div>

         
        </div>
      </div>
    </footer>
  );
}