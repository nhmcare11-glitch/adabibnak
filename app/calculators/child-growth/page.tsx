'use client'
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Baby, TrendingUp, Info, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ── جدول النمو المعياري WHO (وزن الذكور/الإناث kg، طول cm) ──
const WHO_BOYS = [
  { age: 0,  weight: [2.9, 3.3, 3.9, 4.4], height: [46.1, 49.9, 51.8, 53.7] },
  { age: 1,  weight: [3.9, 4.5, 5.1, 5.7], height: [50.8, 54.7, 56.5, 58.4] },
  { age: 2,  weight: [4.9, 5.6, 6.4, 7.1], height: [54.4, 58.4, 60.4, 62.4] },
  { age: 3,  weight: [5.7, 6.4, 7.2, 8.0], height: [57.3, 61.4, 63.5, 65.5] },
  { age: 4,  weight: [6.2, 7.0, 7.8, 8.7], height: [59.7, 63.9, 65.9, 68.0] },
  { age: 6,  weight: [6.9, 7.9, 8.8, 9.8], height: [63.3, 67.6, 69.8, 71.9] },
  { age: 9,  weight: [7.7, 8.9, 9.8, 10.9], height: [67.7, 72.3, 74.5, 76.8] },
  { age: 12, weight: [8.1, 9.6, 10.6, 11.7], height: [71.0, 75.7, 78.0, 80.3] },
  { age: 18, weight: [9.1, 10.9, 12.1, 13.2], height: [76.9, 82.3, 84.9, 87.5] },
  { age: 24, weight: [10.0, 12.2, 13.5, 14.8], height: [81.7, 87.8, 90.4, 93.2] },
  { age: 36, weight: [11.7, 14.3, 16.0, 17.7], height: [89.0, 96.1, 99.3, 102.7] },
  { age: 48, weight: [13.1, 16.3, 18.3, 20.4], height: [95.8, 103.3, 107.0, 110.9] },
  { age: 60, weight: [14.5, 18.3, 20.7, 23.2], height: [102.0, 110.0, 114.2, 118.3] },
];

const WHO_GIRLS = [
  { age: 0,  weight: [2.8, 3.2, 3.7, 4.2], height: [45.4, 49.1, 51.0, 52.9] },
  { age: 1,  weight: [3.6, 4.2, 4.8, 5.5], height: [49.8, 53.7, 55.6, 57.5] },
  { age: 2,  weight: [4.5, 5.1, 5.8, 6.6], height: [53.0, 57.1, 59.0, 61.1] },
  { age: 3,  weight: [5.2, 5.8, 6.6, 7.5], height: [55.6, 59.8, 61.8, 63.8] },
  { age: 4,  weight: [5.7, 6.4, 7.3, 8.2], height: [57.8, 62.1, 64.0, 66.2] },
  { age: 6,  weight: [6.3, 7.3, 8.2, 9.3], height: [61.2, 65.7, 67.8, 70.0] },
  { age: 9,  weight: [7.0, 8.2, 9.2, 10.4], height: [65.3, 70.1, 72.3, 74.7] },
  { age: 12, weight: [7.5, 8.9, 10.1, 11.3], height: [68.9, 74.0, 76.3, 78.8] },
  { age: 18, weight: [8.4, 10.2, 11.5, 12.9], height: [74.9, 80.7, 83.2, 85.9] },
  { age: 24, weight: [9.2, 11.5, 13.0, 14.6], height: [79.3, 85.7, 88.3, 91.0] },
  { age: 36, weight: [10.8, 13.9, 15.8, 17.8], height: [86.5, 95.1, 97.9, 100.8] },
  { age: 48, weight: [12.3, 16.0, 18.4, 21.0], height: [94.1, 102.7, 106.3, 109.9] },
  { age: 60, weight: [13.7, 18.2, 21.2, 24.5], height: [100.6, 109.4, 113.3, 117.1] },
];

type Result = {
  weightStatus: "underweight" | "normal" | "overweight" | "obese";
  heightStatus: "short" | "normal" | "tall";
  weightPercentile: string;
  heightPercentile: string;
  weightMsg: string;
  heightMsg: string;
};

function getStatus(value: number, refs: number[]): "low" | "normal" | "high" | "very_high" {
  if (value < refs[0]) return "low";
  if (value < refs[2]) return "normal";
  if (value < refs[3]) return "high";
  return "very_high";
}

function getPercentile(value: number, refs: number[]): string {
  if (value < refs[0]) return "< 3";
  if (value < refs[1]) return "3 - 15";
  if (value < refs[2]) return "15 - 85";
  if (value < refs[3]) return "85 - 97";
  return "> 97";
}

function findClosestAge(ageMonths: number, table: typeof WHO_BOYS) {
  let closest = table[0];
  let minDiff = Math.abs(ageMonths - table[0].age);
  for (const row of table) {
    const diff = Math.abs(ageMonths - row.age);
    if (diff < minDiff) { minDiff = diff; closest = row; }
  }
  return closest;
}

export default function ChildGrowthCalculator() {
  const [gender, setGender] = useState<"boy" | "girl">("boy");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    const totalMonths = (parseInt(ageYears || "0") * 12) + parseInt(ageMonths || "0");
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (!totalMonths || !w || !h) {
      setError("يرجى ملء جميع الحقول بشكل صحيح");
      return;
    }
    if (totalMonths > 60) {
      setError("هذه الحاسبة مخصصة للأطفال من 0 إلى 5 سنوات");
      return;
    }

    const table = gender === "boy" ? WHO_BOYS : WHO_GIRLS;
    const row = findClosestAge(totalMonths, table);

    const wStatus = getStatus(w, row.weight);
    const hStatus = getStatus(h, row.height);
    const wPerc = getPercentile(w, row.weight);
    const hPerc = getPercentile(h, row.height);

    const weightMap: Record<string, Result["weightStatus"]> = {
      low: "underweight", normal: "normal", high: "overweight", very_high: "obese"
    };
    const heightMap: Record<string, Result["heightStatus"]> = {
      low: "short", normal: "normal", high: "tall", very_high: "tall"
    };

    const weightMsgs: Record<string, string> = {
      low: "وزن الطفل أقل من المعدل الطبيعي. يُنصح باستشارة الطبيب لتقييم التغذية والنمو.",
      normal: "وزن الطفل في النطاق الطبيعي الصحي. استمر في التغذية المتوازنة.",
      high: "وزن الطفل أعلى قليلاً من المعدل. راجع عادات التغذية مع طبيب الأطفال.",
      very_high: "وزن الطفل مرتفع بشكل ملحوظ. يُوصى باستشارة طبيب الأطفال.",
    };
    const heightMsgs: Record<string, string> = {
      low: "طول الطفل أقل من المعدل الطبيعي. تابع مع طبيب الأطفال للتأكد من النمو الطبيعي.",
      normal: "طول الطفل في النطاق الطبيعي تماماً.",
      high: "طول الطفل فوق المعدل، وهذا أمر جيد في الغالب.",
      very_high: "طول الطفل مرتفع جداً مقارنة بالمعدل.",
    };

    setResult({
      weightStatus: weightMap[wStatus],
      heightStatus: heightMap[hStatus],
      weightPercentile: wPerc,
      heightPercentile: hPerc,
      weightMsg: weightMsgs[wStatus],
      heightMsg: heightMsgs[hStatus],
    });
  };

  const statusColors: Record<string, string> = {
    underweight: "text-amber-400",
    normal: "text-emerald-400",
    overweight: "text-orange-400",
    obese: "text-red-400",
    short: "text-amber-400",
    tall: "text-sky-400",
  };

  const statusLabels: Record<string, string> = {
    underweight: "أقل من الطبيعي",
    normal: "طبيعي ✓",
    overweight: "أعلى من الطبيعي",
    obese: "مرتفع",
    short: "أقل من الطبيعي",
    tall: "أطول من المعدل",
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">

      {/* ── breadcrumb ── */}
      <div className="pt-24 pb-2 container mx-auto px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link href="/#calculators" className="hover:text-foreground transition-colors">الحاسبات</Link>
          <span>/</span>
          <span className="text-pink-400">حاسبة نمو الطفل</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="py-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-[500px] h-[300px] bg-pink-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="bg-pink-950/30 border-pink-700/40 text-pink-400 px-4 py-1.5 mb-4 inline-flex items-center gap-2">
              <Baby className="w-3.5 h-3.5" />
              حاسبة نمو الطفل
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4" style={{ fontFamily:"'Amiri',serif" }}>
              تابع{" "}
              <span className="bg-gradient-to-l from-pink-400 to-rose-500 text-transparent bg-clip-text">
                نمو طفلك
              </span>
              {" "}بدقة علمية
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              أداة تعتمد على معايير منظمة الصحة العالمية WHO لتقييم وزن وطول طفلك حسب عمره وجنسه
            </p>
          </div>
        </div>
      </section>

      {/* ── الحاسبة ── */}
      <section className="pb-16 container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-pink-900/20 bg-card/60 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.15)] overflow-hidden">

            {/* شريط علوي */}
            <div className="h-1 bg-gradient-to-l from-pink-500 via-rose-400 to-pink-600" />

            <div className="p-6 md:p-8">

              {/* الجنس */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-3">جنس الطفل</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "boy" as const, label: "ذكر 👦", color: "border-sky-500/60 bg-sky-900/20 text-sky-300" },
                    { val: "girl" as const, label: "أنثى 👧", color: "border-pink-500/60 bg-pink-900/20 text-pink-300" },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => { setGender(opt.val); setResult(null); }}
                      className={`py-3 rounded-xl border-2 font-semibold text-base transition-all duration-200
                        ${gender === opt.val ? opt.color : "border-muted/30 bg-muted/10 text-muted-foreground hover:border-muted/50"}
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* العمر */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-3">عمر الطفل (0 - 5 سنوات)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">السنوات</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      placeholder="0"
                      value={ageYears}
                      onChange={e => { setAgeYears(e.target.value); setResult(null); }}
                      className="w-full px-4 py-3 rounded-xl border border-muted/30 bg-muted/10 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-pink-500/60 focus:bg-pink-950/10 transition-all text-center text-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الأشهر</label>
                    <input
                      type="number"
                      min="0"
                      max="11"
                      placeholder="0"
                      value={ageMonths}
                      onChange={e => { setAgeMonths(e.target.value); setResult(null); }}
                      className="w-full px-4 py-3 rounded-xl border border-muted/30 bg-muted/10 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-pink-500/60 focus:bg-pink-950/10 transition-all text-center text-lg font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* الوزن والطول */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">الوزن (كغ)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="مثال: 7.5"
                    value={weight}
                    onChange={e => { setWeight(e.target.value); setResult(null); }}
                    className="w-full px-4 py-3 rounded-xl border border-muted/30 bg-muted/10 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-pink-500/60 focus:bg-pink-950/10 transition-all text-center text-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">الطول (سم)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="مثال: 68"
                    value={height}
                    onChange={e => { setHeight(e.target.value); setResult(null); }}
                    className="w-full px-4 py-3 rounded-xl border border-muted/30 bg-muted/10 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-pink-500/60 focus:bg-pink-950/10 transition-all text-center text-lg font-bold"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-950/20 border border-amber-800/30 rounded-xl px-4 py-3 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={calculate}
                className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all duration-200
                  bg-gradient-to-l from-pink-500 to-rose-500
                  hover:shadow-[0_8px_30px_rgba(236,72,153,0.45)]
                  hover:[transform:translateY(-2px)]
                  active:[transform:translateY(0)]"
                style={{ willChange:"transform" }}
              >
                احسب الآن 👶
              </button>
            </div>

            {/* ── النتيجة ── */}
            {result && (
              <div className="border-t border-pink-900/20 p-6 md:p-8 bg-pink-950/10">
                <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-400" />
                  نتيجة التقييم
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  {/* الوزن */}
                  <div className="rounded-xl border border-pink-900/20 bg-card/40 p-4">
                    <div className="text-xs text-muted-foreground mb-1">الوزن</div>
                    <div className={`text-xl font-bold mb-1 ${statusColors[result.weightStatus]}`}>
                      {statusLabels[result.weightStatus]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      المئيني: <span className="text-pink-300 font-semibold">{result.weightPercentile}%</span>
                    </div>
                  </div>

                  {/* الطول */}
                  <div className="rounded-xl border border-pink-900/20 bg-card/40 p-4">
                    <div className="text-xs text-muted-foreground mb-1">الطول</div>
                    <div className={`text-xl font-bold mb-1 ${statusColors[result.heightStatus]}`}>
                      {statusLabels[result.heightStatus]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      المئيني: <span className="text-pink-300 font-semibold">{result.heightPercentile}%</span>
                    </div>
                  </div>
                </div>

                {/* توصيات */}
                <div className="space-y-3">
                  <div className="flex gap-3 rounded-xl bg-card/30 border border-white/5 p-4">
                    <CheckCircle className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.weightMsg}</p>
                  </div>
                  <div className="flex gap-3 rounded-xl bg-card/30 border border-white/5 p-4">
                    <CheckCircle className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.heightMsg}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-950/20 border border-amber-800/20 p-3">
                  <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">هذه النتائج للتوعية فقط وليست بديلاً عن استشارة طبيب الأطفال.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ✅ مقال شرح استخدام الحاسبة
      ══════════════════════════════════════════════════════ */}
      <article className="pb-20 container mx-auto px-4" dir="rtl">
        <div className="max-w-3xl mx-auto">

          <div className="rounded-2xl border border-pink-900/15 bg-card/40 backdrop-blur-sm overflow-hidden">
            <div className="p-6 md:p-10">

              <Badge variant="outline" className="bg-pink-950/30 border-pink-700/40 text-pink-400 px-3 py-1 mb-6 text-xs">
                دليل الاستخدام
              </Badge>

              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6" style={{ fontFamily:"'Amiri',serif" }}>
                كيف تستخدم حاسبة نمو الطفل؟
              </h2>

              <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-5">

                <p>
                  حاسبة نمو الطفل هي أداة علمية تعتمد على <strong className="text-foreground">معايير منظمة الصحة العالمية (WHO)</strong> لتقييم نمو الأطفال من عمر الولادة حتى 5 سنوات. تساعدك على معرفة ما إذا كان وزن وطول طفلك ضمن النطاق الطبيعي بالنسبة لعمره وجنسه.
                </p>

                <h3 className="text-lg font-bold text-foreground mt-8 mb-3">خطوات الاستخدام</h3>

                <ol className="space-y-4 list-none pr-0">
                  {[
                    { num: "1", title: "اختر جنس الطفل", text: "اضغط على 'ذكر' أو 'أنثى'. هذا مهم لأن معايير النمو تختلف بين الجنسين." },
                    { num: "2", title: "أدخل عمر الطفل", text: "أدخل عمره بالسنوات والأشهر. مثلاً: طفل عمره سنة وأربعة أشهر = 1 سنة و4 أشهر." },
                    { num: "3", title: "أدخل الوزن والطول", text: "قِس وزن طفلك بدقة باستخدام ميزان خاص بالأطفال، والطول بشريط قياس ناعم." },
                    { num: "4", title: "اضغط احسب الآن", text: "ستظهر النتائج فوراً مع شرح وتوصيات مبنية على معايير WHO." },
                  ].map(step => (
                    <li key={step.num} className="flex gap-4 p-4 rounded-xl bg-pink-950/10 border border-pink-900/15">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                        {step.num}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">{step.title}</p>
                        <p className="text-sm">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <h3 className="text-lg font-bold text-foreground mt-8 mb-3">ما معنى النتائج؟</h3>

                <p>
                  النتائج تُعطيك <strong className="text-foreground">النسبة المئوية (Percentile)</strong> — وهي مقارنة وزن/طول طفلك مع 100 طفل من نفس العمر والجنس. مثلاً:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                  {[
                    { range: "< 3%", label: "أقل من المعدل بشكل واضح", color: "text-amber-400 bg-amber-950/20 border-amber-800/20" },
                    { range: "3% - 85%", label: "النطاق الطبيعي الصحي", color: "text-emerald-400 bg-emerald-950/20 border-emerald-800/20" },
                    { range: "85% - 97%", label: "أعلى من المعدل قليلاً", color: "text-orange-400 bg-orange-950/20 border-orange-800/20" },
                    { range: "> 97%", label: "خارج النطاق الطبيعي", color: "text-red-400 bg-red-950/20 border-red-800/20" },
                  ].map(item => (
                    <div key={item.range} className={`rounded-xl border px-4 py-3 ${item.color}`}>
                      <div className="font-bold text-sm">{item.range}</div>
                      <div className="text-xs opacity-80 mt-0.5">{item.label}</div>
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-bold text-foreground mt-8 mb-3">متى يجب استشارة الطبيب؟</h3>

                <p>استشر طبيب الأطفال إذا:</p>
                <ul className="space-y-2 mt-3">
                  {[
                    "كان وزن أو طول طفلك خارج النطاق بشكل ملحوظ (أقل من 3% أو أكثر من 97%)",
                    "لاحظت توقفاً مفاجئاً في النمو أو فقدان وزن",
                    "كان الطفل يأكل بشكل سيئ أو يرفض الرضاعة",
                    "تشعر بقلق بشأن نمو طفلك بغض النظر عن الأرقام",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <h3 className="text-lg font-bold text-foreground mt-8 mb-3">نصائح لنمو صحي</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  {[
                    { icon: "🍼", title: "الرضاعة الطبيعية", text: "الرضاعة حتى 6 أشهر توفر كل العناصر الغذائية اللازمة للنمو." },
                    { icon: "🥦", title: "تنويع الغذاء", text: "ابدأ بتقديم الأطعمة الصلبة بعد 6 أشهر تدريجياً ومتنوعة." },
                    { icon: "😴", title: "النوم الكافي", text: "الأطفال ينمون أثناء النوم. تأكد من ساعات نوم كافية حسب العمر." },
                  ].map(tip => (
                    <div key={tip.icon} className="rounded-xl bg-card/30 border border-white/5 p-4 text-center">
                      <div className="text-2xl mb-2">{tip.icon}</div>
                      <div className="font-semibold text-foreground text-sm mb-1">{tip.title}</div>
                      <div className="text-xs text-muted-foreground">{tip.text}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-xl bg-pink-950/20 border border-pink-800/20 p-5 flex gap-3">
                  <Info className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1">تنبيه طبي مهم</p>
                    <p className="text-sm">هذه الأداة للتوعية الصحية فقط وليست تشخيصاً طبياً. القرار النهائي دائماً بيد طبيب الأطفال الذي يعرف تاريخ طفلك الصحي الكامل.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── روابط للحاسبات الأخرى ── */}
          <div className="mt-10">
            <h3 className="text-lg font-bold text-foreground mb-4 text-center">حاسبات أخرى قد تهمك</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { href: "/calculators/pregnancy", label: "حاسبة الحمل والولادة", icon: "🤰", color: "border-violet-800/30 hover:border-violet-500/50" },
                { href: "/calculators/ideal-weight", label: "حاسبة الوزن المثالي", icon: "⚖️", color: "border-amber-800/30 hover:border-amber-500/50" },
                { href: "/calculators/ovulation", label: "حاسبة أيام التبويض", icon: "📅", color: "border-teal-800/30 hover:border-teal-500/50" },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border bg-card/40 transition-all duration-200 hover:[transform:translateY(-2px)] text-center ${link.color}`}
                >
                  <span className="text-2xl">{link.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}