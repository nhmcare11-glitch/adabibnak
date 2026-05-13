/**
 * المسار: /app/guide/[category]/page.tsx
 *
 * تعرض الأقسام الفرعية للقسم المختار (طب وصحة / الصحة والجمال / الأمراض والأدوية)
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

// ──────────────────────────────────────────────
// البيانات — انقليها لـ /lib/guide-data.ts
// ──────────────────────────────────────────────
const guideData: Record<string, {
  label: string;
  description: string;
  badge: string;
  gradient: string;
  border: string;
  glow: string;
  iconBg: string;
  subs: { id: string; label: string; emoji: string; description: string }[];
}> = {
  medical: {
    label: "طب وصحة",
    description: "محتوى طبي موثوق ومراجَع من متخصصين",
    badge: "bg-blue-900/40 border-blue-700/30 text-blue-300",
    gradient: "from-blue-900/40 to-blue-950/20",
    border: "border-blue-800/30 hover:border-blue-600/50",
    glow: "hover:shadow-[0_8px_40px_rgba(59,130,246,0.2)]",
    iconBg: "bg-blue-800/40 border-blue-600/30",
    subs: [
      { id: "heart",   label: "القلب",           emoji: "❤️",  description: "أمراض القلب والأوعية الدموية والوقاية منها" },
      { id: "dental",  label: "صحة الأسنان",     emoji: "🦷",  description: "العناية بالفم والأسنان واللثة" },
      { id: "mental",  label: "الصحة النفسية",   emoji: "🧠",  description: "القلق، الاكتئاب، إدارة الضغط والنوم" },
      { id: "eye",     label: "صحة العيون",      emoji: "👁️",  description: "أمراض العيون والوقاية في العصر الرقمي" },
      { id: "women",   label: "صحة المرأة",      emoji: "👩",  description: "الصحة الهرمونية وما يخص المرأة" },
      { id: "cancer",  label: "السرطان",          emoji: "🔬",  description: "الكشف المبكر والعلاج والوقاية" },
      { id: "organs",  label: "أجهزة الجسم",    emoji: "🫀",  description: "كيف تعمل أجهزة الجسم المختلفة" },
      { id: "altmed",  label: "الطب البديل",     emoji: "🌿",  description: "الأعشاب والعلاجات الطبيعية الآمنة" },
    ],
  },
  lifestyle: {
    label: "الصحة والجمال",
    description: "نصائح عملية لحياة صحية ومظهر متميز",
    badge: "bg-pink-900/40 border-pink-700/30 text-pink-300",
    gradient: "from-pink-900/40 to-rose-950/20",
    border: "border-pink-800/30 hover:border-pink-600/50",
    glow: "hover:shadow-[0_8px_40px_rgba(236,72,153,0.2)]",
    iconBg: "bg-pink-800/40 border-pink-600/30",
    subs: [
      { id: "diet",      label: "الريجيم وتخفيف الوزن", emoji: "🥗", description: "أنظمة غذائية آمنة وفعّالة" },
      { id: "nutrition", label: "التغذية السليمة",       emoji: "🍎", description: "دليلك لأكل صحي متوازن" },
      { id: "fitness",   label: "الرياضة والرشاقة",      emoji: "🏋️", description: "تمارين للمنزل والنادي لكل المستويات" },
      { id: "skin",      label: "العناية بالبشرة",       emoji: "💆", description: "روتين يومي لبشرة مضيئة وصحية" },
      { id: "hair",      label: "العناية بالشعر",        emoji: "💇", description: "وصفات ونصائح لشعر قوي وجميل" },
      { id: "recipes",   label: "وصفات صحية",            emoji: "🍽️", description: "أكلات لذيذة وقليلة السعرات" },
    ],
  },
  diseases: {
    label: "الأمراض والأدوية",
    description: "مرجع طبي شامل للأمراض والعلاجات",
    badge: "bg-emerald-900/40 border-emerald-700/30 text-emerald-300",
    gradient: "from-emerald-900/40 to-teal-950/20",
    border: "border-emerald-800/30 hover:border-emerald-600/50",
    glow: "hover:shadow-[0_8px_40px_rgba(16,185,129,0.2)]",
    iconBg: "bg-emerald-800/40 border-emerald-600/30",
    subs: [
      { id: "diseases-list", label: "الأمراض",         emoji: "📋", description: "موسوعة شاملة للأمراض وأعراضها" },
      { id: "drugs",         label: "الأدوية",          emoji: "💊", description: "دليل الأدوية والجرعات والتأثيرات" },
      { id: "vaccines",      label: "التطعيمات",        emoji: "💉", description: "جدول التطعيمات للأطفال والبالغين" },
      { id: "tests",         label: "الفحوصات",         emoji: "🧪", description: "تفسير نتائج التحاليل والفحوصات" },
      { id: "vitamins",      label: "الفيتامينات",      emoji: "🫙", description: "المكملات الغذائية ومتى تحتاجها" },
      { id: "symptoms",      label: "مشخص الأعراض",    emoji: "🤒", description: "ابدأ بالأعراض لمعرفة الحالة المحتملة" },
    ],
  },
};

// ──────────────────────────────────────────────
// الصفحة
// ──────────────────────────────────────────────
export default function GuideCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const cat = guideData[params.category];
  if (!cat) notFound();

  return (
    <div className="min-h-screen bg-background" dir="rtl">

      {/* Header */}
      <div className={`border-b border-border/40 bg-gradient-to-b ${cat.gradient} py-12`}>
        <div className="container mx-auto px-4">
          <Link
            href="/#guide"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </Link>
          <Badge variant="outline" className={`text-xs px-3 py-1 mb-3 ${cat.badge}`}>
            {cat.label}
          </Badge>
          <h1
            className="text-3xl md:text-4xl font-bold text-foreground mb-2"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {cat.label}
          </h1>
          <p className="text-muted-foreground text-lg">{cat.description}</p>
        </div>
      </div>

      {/* شبكة الأقسام الفرعية */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cat.subs.map((sub) => (
            <Link
              key={sub.id}
              href={`/guide/${params.category}/${sub.id}`}
              className={`
                group relative rounded-2xl border ${cat.border}
                bg-card/60 backdrop-blur-sm
                p-6 flex flex-col gap-4
                transition-all duration-300
                ${cat.glow}
                hover:[transform:perspective(600px)_translateZ(8px)_translateY(-3px)]
              `}
              style={{ willChange: "transform" }}
            >
              {/* الأيقونة */}
              <div className={`
                w-14 h-14 rounded-xl border flex items-center justify-center text-3xl
                ${cat.iconBg}
                group-hover:[transform:translateZ(14px)_scale(1.1)]
                transition-all duration-300
              `}
                style={{ willChange: "transform" }}
              >
                {sub.emoji}
              </div>

              {/* النص */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-white transition-colors duration-300">
                  {sub.label}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {sub.description}
                </p>
              </div>

              {/* رابط */}
              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                <span className="text-xs text-muted-foreground group-hover:text-blue-300 transition-colors duration-300">
                  اقرأ المزيد
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-300
                  group-hover:-translate-x-1 transition-all duration-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}