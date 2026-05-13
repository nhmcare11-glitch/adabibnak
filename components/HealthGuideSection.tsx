'use client'

/**
 * HealthGuideSection — سكشن "دليلك الصحي الشامل"
 *
 * كيفية الاستخدام:
 * 1. انسخ هذا الكومبوننت في مجلد /components/HealthGuideSection.tsx
 * 2. في page.tsx أضيفي الاستيراد:
 *      import HealthGuideSection from "@/components/HealthGuideSection";
 * 3. ضيفيه بعد سكشن "How It Works" مباشرة:
 *      <HealthGuideSection />
 *
 * الملفات المطلوبة:
 * - /app/guide/[category]/page.tsx        ← صفحة القسم الفرعي
 * - /app/guide/[category]/[sub]/page.tsx  ← صفحة المقالات
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

// ──────────────────────────────────────────────
// البيانات — تقدري تنقليها لـ /lib/data.ts
// ──────────────────────────────────────────────
const guideCategories = [
  {
    id: "medical",
    label: "طب وصحة",
    description: "أجهزة الجسم، القلب، الصحة النفسية، العيون وأكثر",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    gradient: "from-blue-900/60 to-blue-950/40",
    border: "border-blue-800/30 hover:border-blue-600/50",
    glow: "group-hover:shadow-[0_8px_40px_rgba(59,130,246,0.25)]",
    badge: "bg-blue-900/40 border-blue-700/30 text-blue-300",
    iconBg: "bg-blue-800/40 border-blue-600/30",
    subs: [
      { id: "heart",       label: "القلب",            emoji: "❤️" },
      { id: "dental",      label: "صحة الأسنان",      emoji: "🦷" },
      { id: "mental",      label: "الصحة النفسية",    emoji: "🧠" },
      { id: "eye",         label: "صحة العيون",       emoji: "👁️" },
      { id: "women",       label: "صحة المرأة",       emoji: "👩" },
      { id: "cancer",      label: "السرطان",          emoji: "🔬" },
      { id: "organs",      label: "أجهزة الجسم",     emoji: "🫀" },
      { id: "altmed",      label: "الطب البديل",      emoji: "🌿" },
    ],
  },
  {
    id: "lifestyle",
    label: "الصحة والجمال",
    description: "التغذية، الرياضة، العناية بالبشرة والشعر ووصفات صحية",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    gradient: "from-pink-900/50 to-rose-950/40",
    border: "border-pink-800/30 hover:border-pink-600/50",
    glow: "group-hover:shadow-[0_8px_40px_rgba(236,72,153,0.2)]",
    badge: "bg-pink-900/40 border-pink-700/30 text-pink-300",
    iconBg: "bg-pink-800/40 border-pink-600/30",
    subs: [
      { id: "diet",        label: "الريجيم وتخفيف الوزن", emoji: "🥗" },
      { id: "nutrition",   label: "التغذية السليمة",       emoji: "🍎" },
      { id: "fitness",     label: "الرياضة والرشاقة",      emoji: "🏋️" },
      { id: "skin",        label: "العناية بالبشرة",       emoji: "💆" },
      { id: "hair",        label: "العناية بالشعر",        emoji: "💇" },
      { id: "recipes",     label: "وصفات صحية",            emoji: "🍽️" },
    ],
  },
  {
    id: "diseases",
    label: "الأمراض والأدوية",
    description: "الأمراض، الأدوية، التطعيمات، الفحوصات والفيتامينات",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    gradient: "from-emerald-900/50 to-teal-950/40",
    border: "border-emerald-800/30 hover:border-emerald-600/50",
    glow: "group-hover:shadow-[0_8px_40px_rgba(16,185,129,0.2)]",
    badge: "bg-emerald-900/40 border-emerald-700/30 text-emerald-300",
    iconBg: "bg-emerald-800/40 border-emerald-600/30",
    subs: [
      { id: "diseases-list", label: "الأمراض",         emoji: "📋" },
      { id: "drugs",         label: "الأدوية",          emoji: "💊" },
      { id: "vaccines",      label: "التطعيمات",        emoji: "💉" },
      { id: "tests",         label: "الفحوصات",         emoji: "🧪" },
      { id: "vitamins",      label: "الفيتامينات",      emoji: "🫙" },
      { id: "symptoms",      label: "مشخص الأعراض",    emoji: "🤒" },
    ],
  },
];

// ──────────────────────────────────────────────
// الكومبوننت الرئيسي
// ──────────────────────────────────────────────
export default function HealthGuideSection() {
  return (
    <section className="py-24 relative overflow-hidden" dir="rtl">

      {/* خلفية ديكورية — نفس أسلوب باقي السكشنات */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-pink-900/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">

        {/* ── Header ── */}
        <div className="text-center mb-14">
          <Badge
            variant="outline"
            className="bg-blue-900/30 border-blue-700/30 px-4 py-1.5 text-blue-400 text-sm font-medium mb-5 inline-flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            محتوى صحي موثوق
          </Badge>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            دليلك{" "}
            <span className="bg-gradient-to-l from-blue-400 to-blue-600 text-transparent bg-clip-text">
              الصحي الشامل
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            اختر قسماً لتستكشف محتوى صحياً موثوقاً ومراجَعاً من متخصصين
          </p>
        </div>

        {/* ── كروت الأقسام الثلاثة ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {guideCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/guide/${cat.id}`}
              className={`
                group relative rounded-2xl border ${cat.border}
                bg-gradient-to-br ${cat.gradient}
                backdrop-blur-sm p-6
                transition-all duration-300
                hover:[transform:perspective(800px)_rotateX(-2deg)_translateZ(8px)_translateY(-4px)]
                ${cat.glow}
                overflow-hidden
                flex flex-col gap-5
              `}
              style={{ willChange: "transform" }}
            >
              {/* توهج خلفي */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none rounded-2xl" />

              {/* الأيقونة + العنوان */}
              <div className="flex items-center gap-3">
                <div className={`
                  w-12 h-12 rounded-xl border flex items-center justify-center shrink-0
                  ${cat.iconBg}
                  group-hover:[transform:translateZ(12px)_scale(1.08)]
                  transition-all duration-300
                `}
                  style={{ willChange: "transform" }}
                >
                  <span className="text-foreground/80">{cat.icon}</span>
                </div>
                <div>
                  <Badge variant="outline" className={`text-xs px-2 py-0.5 mb-1 ${cat.badge}`}>
                    {cat.label}
                  </Badge>
                  <p className="text-muted-foreground text-sm leading-snug">{cat.description}</p>
                </div>
              </div>

              {/* شبكة الأقسام الفرعية */}
              <div className="grid grid-cols-2 gap-2">
                {cat.subs.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2 rounded-xl bg-background/10 border border-white/5
                      px-3 py-2 text-sm text-foreground/70
                      group-hover:border-white/10 transition-colors duration-200"
                  >
                    <span className="text-base leading-none">{sub.emoji}</span>
                    <span className="line-clamp-1">{sub.label}</span>
                  </div>
                ))}
              </div>

              {/* رابط "استكشف الكل" */}
              <div className="flex items-center justify-end gap-2 mt-auto pt-2 border-t border-white/5">
                <span className="text-sm text-muted-foreground group-hover:text-blue-300 transition-colors duration-300">
                  استكشف الكل
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-300
                  group-hover:-translate-x-1 transition-all duration-300" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}