/**
 * المسار: /app/guide/[category]/[sub]/page.tsx
 *
 * تعرض قائمة المقالات لقسم فرعي معين
 * مثال: /guide/medical/heart  →  مقالات القلب
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

// ──────────────────────────────────────────────
// البيانات — انقليها لـ /lib/guide-data.ts
// يمكن استبدالها بـ fetch من API
// ──────────────────────────────────────────────
const articlesData: Record<string, {
  label: string;
  emoji: string;
  categoryLabel: string;
  categoryId: string;
  badge: string;
  articles: {
    id: string;
    title: string;
    excerpt: string;
    tag: string;
    tagColor: string;
    readTime: string;
  }[];
}> = {
  heart: {
    label: "القلب",
    emoji: "❤️",
    categoryLabel: "طب وصحة",
    categoryId: "medical",
    badge: "bg-red-900/40 border-red-700/30 text-red-300",
    articles: [
      { id: "1", title: "أمراض القلب الشائعة وأسبابها الخفية", excerpt: "تعرّف على أكثر أمراض القلب انتشاراً وكيف تحمي نفسك منها بخطوات يومية بسيطة.", tag: "وقاية", tagColor: "text-blue-400", readTime: "5 دقائق" },
      { id: "2", title: "علامات النوبة القلبية: لا تتجاهلها", excerpt: "ألم الصدر ليس العلامة الوحيدة — اكتشف الأعراض غير المتوقعة التي يجب أن تعرفها.", tag: "طوارئ", tagColor: "text-red-400", readTime: "3 دقائق" },
      { id: "3", title: "كيف تحافظ على ضغط الدم الطبيعي", excerpt: "نصائح عملية مدعومة علمياً لخفض ضغط الدم المرتفع والحفاظ على مستوى صحي.", tag: "نصائح", tagColor: "text-green-400", readTime: "4 دقائق" },
      { id: "4", title: "أفضل الأطعمة لصحة القلب", excerpt: "ما الذي يجب أن تضعه في طبقك لتقوية قلبك؟ دليل غذائي مبسط من خبراء التغذية.", tag: "تغذية", tagColor: "text-amber-400", readTime: "6 دقائق" },
      { id: "5", title: "الرياضة وصحة القلب: كم دقيقة تكفي؟", excerpt: "دراسات حديثة تجيب: ما مقدار التمرين الأسبوعي الذي يحمي قلبك فعلاً؟", tag: "رياضة", tagColor: "text-purple-400", readTime: "4 دقائق" },
      { id: "6", title: "الكوليسترول: الفرق بين النافع والضار", excerpt: "ليس كل كوليسترول مضراً — افهم الفرق واعرف كيف تتحكم في مستوياتك.", tag: "تحاليل", tagColor: "text-cyan-400", readTime: "7 دقائق" },
    ],
  },
  mental: {
    label: "الصحة النفسية",
    emoji: "🧠",
    categoryLabel: "طب وصحة",
    categoryId: "medical",
    badge: "bg-purple-900/40 border-purple-700/30 text-purple-300",
    articles: [
      { id: "1", title: "القلق والاكتئاب: كيف تفرق بينهما؟", excerpt: "أعراض متشابهة لكن علاج مختلف — دليل طبي لفهم الفرق والتصرف الصحيح.", tag: "طب", tagColor: "text-purple-400", readTime: "8 دقائق" },
      { id: "2", title: "اضطرابات النوم: أسبابها وعلاجها", excerpt: "نوم متقطع أو أرق مستمر؟ اكتشف الأسباب الخفية وأفضل طرق التخلص منها.", tag: "نوم", tagColor: "text-blue-400", readTime: "5 دقائق" },
      { id: "3", title: "تقنيات التأمل لإدارة الضغط اليومي", excerpt: "5 دقائق يومياً تكفي — تعلّم تقنيات مدعومة علمياً لتهدئة عقلك وجسمك.", tag: "وقاية", tagColor: "text-green-400", readTime: "4 دقائق" },
    ],
  },
  diet: {
    label: "الريجيم وتخفيف الوزن",
    emoji: "🥗",
    categoryLabel: "الصحة والجمال",
    categoryId: "lifestyle",
    badge: "bg-orange-900/40 border-orange-700/30 text-orange-300",
    articles: [
      { id: "1", title: "أفضل أنظمة الحمية لعام 2025", excerpt: "مقارنة علمية بين الأنظمة الغذائية الأكثر فعالية وأيها مناسب لجسمك.", tag: "تغذية", tagColor: "text-orange-400", readTime: "7 دقائق" },
      { id: "2", title: "كيف تحسب سعراتك اليومية بدقة", excerpt: "صيغة بسيطة تحدد احتياجك اليومي من السعرات بناءً على وزنك ونشاطك.", tag: "أدوات", tagColor: "text-blue-400", readTime: "3 دقائق" },
      { id: "3", title: "لماذا تعود الوزن بعد الحمية؟", excerpt: "العلم يشرح ظاهرة يويو وكيف تتجنبها للحصول على نتائج مستدامة.", tag: "علم", tagColor: "text-purple-400", readTime: "6 دقائق" },
    ],
  },
  drugs: {
    label: "الأدوية",
    emoji: "💊",
    categoryLabel: "الأمراض والأدوية",
    categoryId: "diseases",
    badge: "bg-emerald-900/40 border-emerald-700/30 text-emerald-300",
    articles: [
      { id: "1", title: "مضادات الالتهاب: الأنواع والاستخدامات", excerpt: "ليست كلها متشابهة — دليل كامل لفهم الفرق بين أنواع مضادات الالتهاب.", tag: "دواء", tagColor: "text-emerald-400", readTime: "6 دقائق" },
      { id: "2", title: "تفاعلات الأدوية الأكثر خطورة", excerpt: "مجموعات دوائية يجب عدم دمجها مطلقاً — احفظها لسلامتك.", tag: "تحذير", tagColor: "text-red-400", readTime: "5 دقائق" },
      { id: "3", title: "متى تحتاج وصفة طبية؟", excerpt: "فهم الفرق بين الأدوية الحرة والمقيدة وكيف تتصرف بحكمة.", tag: "إرشاد", tagColor: "text-blue-400", readTime: "3 دقائق" },
    ],
  },
};

// Fallback للأقسام التي لم تُعرَّف بعد
const defaultArticles = {
  articles: [
    { id: "1", title: "مقال صحي شامل", excerpt: "محتوى صحي موثوق من متخصصين معتمدين.", tag: "صحة", tagColor: "text-blue-400", readTime: "5 دقائق" },
    { id: "2", title: "نصائح وإرشادات من خبراء", excerpt: "توصيات عملية يمكن تطبيقها في حياتك اليومية.", tag: "نصائح", tagColor: "text-green-400", readTime: "3 دقائق" },
  ],
};

// ──────────────────────────────────────────────
// الصفحة
// ──────────────────────────────────────────────
export default function GuideSubPage({
  params,
}: {
  params: { category: string; sub: string };
}) {
  const subKey = params.sub.replace("-list", "") === "diseases" ? "diseases-list" : params.sub;
  const data = articlesData[subKey] ?? {
    label: params.sub,
    emoji: "📄",
    categoryLabel: params.category,
    categoryId: params.category,
    badge: "bg-blue-900/40 border-blue-700/30 text-blue-300",
    ...defaultArticles,
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">

      {/* Breadcrumb + Header */}
      <div className="border-b border-border/40 bg-gradient-to-b from-background/80 to-muted/20 py-10">
        <div className="container mx-auto px-4">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
            <Link href="/#guide" className="hover:text-foreground transition-colors">الرئيسية</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <Link href={`/guide/${data.categoryId}`} className="hover:text-foreground transition-colors">
              {data.categoryLabel}
            </Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-foreground">{data.label}</span>
          </nav>

          <Link
            href={`/guide/${data.categoryId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة لـ {data.categoryLabel}
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-5xl">{data.emoji}</span>
            <div>
              <Badge variant="outline" className={`text-xs px-3 py-1 mb-2 ${data.badge}`}>
                {data.categoryLabel}
              </Badge>
              <h1
                className="text-3xl md:text-4xl font-bold text-foreground"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                {data.label}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* قائمة المقالات */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.articles.map((article) => (
            <Link
              key={article.id}
              href={`/guide/${params.category}/${params.sub}/${article.id}`}
              className="group relative rounded-2xl border border-blue-900/20 hover:border-blue-700/40
                bg-card/60 backdrop-blur-sm p-6 flex flex-col gap-4
                transition-all duration-300
                hover:[transform:perspective(600px)_translateZ(8px)_translateY(-3px)]
                hover:shadow-[0_8px_40px_rgba(59,130,246,0.18)]"
              style={{ willChange: "transform" }}
            >
              {/* Tag + وقت القراءة */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${article.tagColor}`}>
                  {article.tag}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {article.readTime}
                </span>
              </div>

              {/* العنوان */}
              <h3 className="text-base font-semibold text-foreground leading-snug
                group-hover:text-white transition-colors duration-300">
                {article.title}
              </h3>

              {/* المقتطف */}
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>

              {/* رابط */}
              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                <span className="text-xs text-muted-foreground group-hover:text-blue-300 transition-colors duration-300">
                  اقرأ المقال
                </span>
                <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-300
                  group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}