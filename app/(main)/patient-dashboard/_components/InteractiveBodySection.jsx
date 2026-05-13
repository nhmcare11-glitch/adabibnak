"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDoctorsBySpecialty } from "@/actions/doctors-listing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  X, Search, Stethoscope, ChevronLeft, HeartPulse,
  Brain, Activity, Eye, Bone, CircleDot, Thermometer, Star, Calendar
} from "lucide-react";

// ─── Organ Data ────────────────────────────────────────────────────────────────
const ORGANS = {
  brain: {
    id: "brain",
    label: "الدماغ",
    emoji: "🧠",
    specialty: "طب الأعصاب",
    color: "#818cf8",
    colorLight: "#eef2ff",
    colorGlow: "rgba(129,140,248,0.35)",
    icon: Brain,
    tips: [
      "احرص على النوم ٧–٩ ساعات يومياً لتعزيز صحة الدماغ",
      "مارس التأمل ودرِّب ذاكرتك بحل الألغاز",
      "تجنّب التوتر المزمن فهو يضر بالخلايا العصبية",
    ],
    symptoms: ["صداع متكرر", "دوار ومشاكل في التوازن", "ضعف الذاكرة أو التركيز", "تنميل أطراف الجسم"],
    prevention: "الرياضة المنتظمة، التغذية الغنية بأوميغا-3، وتجنّب الكحول والتدخين يحمون دماغك.",
  },
  heart: {
    id: "heart",
    label: "القلب",
    emoji: "❤️",
    specialty: "أمراض القلب",
    color: "#f43f5e",
    colorLight: "#fff1f2",
    colorGlow: "rgba(244,63,94,0.35)",
    icon: HeartPulse,
    tips: [
      "تناول الأغذية الصحية وقلّل الملح والدهون المشبعة",
      "مارس الرياضة الهوائية ٣٠ دقيقة يومياً",
      "راقب ضغط الدم والكوليسترول بانتظام",
    ],
    symptoms: ["ألم في الصدر أو الضغط", "ضيق التنفس عند المجهود", "خفقان القلب السريع", "تعب غير مبرر"],
    prevention: "الإقلاع عن التدخين، التحكم في وزنك، وفحص القلب دورياً يقي من أمراض القلب.",
  },
  lungs: {
    id: "lungs",
    label: "الرئتان",
    emoji: "🫁",
    specialty: "أمراض الرئة",
    color: "#06b6d4",
    colorLight: "#ecfeff",
    colorGlow: "rgba(6,182,212,0.35)",
    icon: Activity,
    tips: [
      "ابتعد عن الأماكن الملوثة وارتدِ الكمامة عند الحاجة",
      "مارس تمارين التنفس العميق يومياً",
      "تجنّب التدخين وتعرّضك للدخان السلبي",
    ],
    symptoms: ["سعال مزمن أو متكرر", "ضيق التنفس في الراحة", "صفير عند التنفس", "إنتاج بلغم غير طبيعي"],
    prevention: "التطعيم ضد الإنفلونزا والالتهاب الرئوي، والفحوص الدورية تحافظ على صحة رئتيك.",
  },
  stomach: {
    id: "stomach",
    label: "الجهاز الهضمي",
    emoji: "🫃",
    specialty: "أمراض الجهاز الهضمي",
    color: "#f59e0b",
    colorLight: "#fffbeb",
    colorGlow: "rgba(245,158,11,0.35)",
    icon: Thermometer,
    tips: [
      "تناول وجباتك بانتظام وامضغ الطعام جيداً",
      "اشرب ٨ أكواب ماء يومياً على الأقل",
      "أكثر من الألياف الغذائية في نظامك الغذائي",
    ],
    symptoms: ["آلام وتشنجات البطن", "اضطرابات الجهاز الهضمي", "حموضة وارتجاع المريء", "غثيان أو تقيؤ"],
    prevention: "تجنّب الأطعمة الحارة والدهنية، وقلّل الكحول والقهوة لحماية معدتك.",
  },
  eyes: {
    id: "eyes",
    label: "العينان",
    emoji: "👁️",
    specialty: "طب العيون",
    color: "#10b981",
    colorLight: "#ecfdf5",
    colorGlow: "rgba(16,185,129,0.35)",
    icon: Eye,
    tips: [
      "طبّق قاعدة 20-20-20 عند العمل على الشاشات",
      "ارتدِ نظارات الشمس لحماية عينيك من الأشعة فوق البنفسجية",
      "افحص نظرك سنوياً لدى طبيب العيون",
    ],
    symptoms: ["ضبابية الرؤية أو فقدانها المفاجئ", "احمرار وحرقة في العيون", "حساسية للضوء", "رؤية هالات حول الأضواء"],
    prevention: "الإضاءة المناسبة، التغذية الغنية بفيتامين أ، والتوقف الدوري عن الشاشات يصون بصرك.",
  },
  bones: {
    id: "bones",
    label: "العظام والمفاصل",
    emoji: "🦴",
    specialty: "جراحة العظام",
    color: "#8b5cf6",
    colorLight: "#f5f3ff",
    colorGlow: "rgba(139,92,246,0.35)",
    icon: Bone,
    tips: [
      "تناول الكالسيوم وفيتامين D بكميات كافية",
      "مارس تمارين تحمّل الوزن لتقوية العظام",
      "حافظ على وزن صحي لتقليل الضغط على المفاصل",
    ],
    symptoms: ["آلام المفاصل والعظام المزمنة", "تيبّس الصباح في المفاصل", "تورم وحرارة حول المفاصل", "صعوبة في الحركة"],
    prevention: "تجنّب السقوط، احمِ مفاصلك أثناء الرياضة، وافحص كثافة عظامك دورياً.",
  },
  skin: {
    id: "skin",
    label: "الجلد",
    emoji: "🧬",
    specialty: "الأمراض الجلدية",
    color: "#ec4899",
    colorLight: "#fdf2f8",
    colorGlow: "rgba(236,72,153,0.35)",
    icon: CircleDot,
    tips: [
      "رطّب جلدك يومياً واستخدم واقي الشمس",
      "شرب الماء الكافي يعطيك بشرة مشرقة",
      "تجنّب لمس وجهك لتقليل البثور والحبوب",
    ],
    symptoms: ["طفح جلدي أو احمرار مستمر", "حكة شديدة أو جفاف غير طبيعي", "شامات تغيّر شكلها أو لونها", "تقشّر الجلد وتشققه"],
    prevention: "فحص الجلد الدوري، الحماية من الشمس، والنظام الغذائي الصحي يقي من أمراض الجلد.",
  },
};

// ─── Organ Button Positions — calibrated to homme.png real anatomy ─────────────
// viewBox "0 0 100 155": head top≈y2, feet≈y153, body center x=50
const ORGAN_POSITIONS = [
  { id: "brain",   cx: 45,  cy: 3  },  // centre du crane
  { id: "eyes",    cx: 57,  cy: 14   },  // niveau des yeux
  { id: "heart",   cx: 60,  cy: 40  },  // sternum gauche
  { id: "lungs",   cx: 47,  cy: 50  },  // poumon superieur droit (vue)
  { id: "stomach", cx: 51,  cy: 60  },  // abdomen / nombril
  { id: "bones",   cx: 60,  cy: 83  },  // genou — articulation visible
  { id: "skin",    cx: 79,  cy: 33  },  // avant-bras visible
];

// ─── Human Body Image + SVG Overlay ─────────────────────────────────────────────
function HumanBodySVG({ activeOrgan, onOrganClick }) {
  const [hoveredOrgan, setHoveredOrgan] = useState(null);

  return (
    <div className="relative w-full flex justify-center">
      <div className="relative w-full max-w-[800px] ">
        {/* Real anatomical body image */}
        <img
          src="/homme.png"
          alt="جسم الإنسان التشريحي"
          className="w-full select-none"
          draggable={false}
          style={{
            filter: "drop-shadow(0 50px 60px rgba(13,148,136,0.25))",
            borderRadius: "12px",
          }}
        />

        {/* Interactive SVG overlay — same aspect ratio as the image */}
        <svg
          viewBox="0 0 100 155"
          className="absolute inset-0 w-full h-full"
          style={{ top: 0, left: 0 }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Organ interactive buttons */}
          {ORGAN_POSITIONS.map(({ id, cx, cy }) => {
            const organ = ORGANS[id];
            const isActive = activeOrgan === id;
            const isHovered = hoveredOrgan === id;
            const show = isActive || isHovered;

            return (
              <g key={id}>
                {/* Pulse rings */}
                {isActive && (
                  <>
                    <circle cx={cx} cy={cy} r="6" fill="none" stroke={organ.color} strokeWidth="0.5" opacity="0.4">
                      <animate attributeName="r" from="5" to="9" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={cx} cy={cy} r="6" fill="none" stroke={organ.color} strokeWidth="0.3" opacity="0.2">
                      <animate attributeName="r" from="5" to="12" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
                {/* Button circle */}
                <circle
                  cx={cx} cy={cy} r={isActive ? "5.5" : "4.5"}
                  fill={isActive ? organ.color : show ? organ.color + "cc" : "rgba(255,255,255,0.82)"}
                  stroke={organ.color}
                  strokeWidth="0.8"
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                  onClick={() => onOrganClick(id)}
                  onMouseEnter={() => setHoveredOrgan(id)}
                  onMouseLeave={() => setHoveredOrgan(null)}
                  filter={isActive ? "url(#glow)" : "none"}
                />
                {/* Emoji */}
                <text
                  x={cx} y={cy + 1.8}
                  textAnchor="middle"
                  fontSize="5"
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => onOrganClick(id)}
                  onMouseEnter={() => setHoveredOrgan(id)}
                  onMouseLeave={() => setHoveredOrgan(null)}
                >
                  {organ.emoji}
                </text>
                {/* Hover tooltip */}
                {show && !isActive && (
                  <g>
                    <rect x={cx - 12} y={cy - 12} width="24" height="7" rx="2" fill={organ.color} opacity="0.92" />
                    <text x={cx} y={cy - 7} textAnchor="middle" fontSize="3.5" fill="white" fontWeight="bold">
                      {organ.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>


    </div>
  );
}

// ─── Doctor Card ────────────────────────────────────────────────────────────────
function DoctorMiniCard({ doctor }) {
  const router = useRouter();
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.7)",
        border: "1px solid #ccfbf1",
        backdropFilter: "blur(8px)",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#0d9488"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(13,148,136,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#ccfbf1"; e.currentTarget.style.boxShadow = "none"; }}
      onClick={() => router.push(`/doctors/${doctor.specialty?.split(" ").join("%20")}/${doctor.id}`)}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={doctor.imageUrl} />
        <AvatarFallback className="text-white font-bold text-sm" style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}>
          {doctor.name?.[0] ?? "د"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[16px] truncate" style={{ color: "#134e4a" }}>د. {doctor.name}</p>
        <p className="text-[14px] truncate" style={{ color: "#5eaaa4" }}>{doctor.specialty}</p>
        {doctor.experience && (
          <p className="text-[13px]" style={{ color: "#99f6e4" }}>{doctor.experience} سنة خبرة</p>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        <span className="text-[14px] font-medium" style={{ color: "#134e4a" }}>4.8</span>
      </div>
    </div>
  );
}

// ─── Info Panel ─────────────────────────────────────────────────────────────────
function OrganInfoPanel({ organ, doctors, loading, onClose, onSearchDoctors }) {
  if (!organ) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 mx-auto"
          style={{ background: "linear-gradient(135deg,rgba(13,148,136,0.1),rgba(8,145,178,0.1))", border: "1.5px dashed #99f6e4" }}>
          <span className="text-5xl">👆</span>
        </div>
        <p className="font-bold text-[19px] mb-2" style={{ color: "#134e4a" }}>اختر منطقة من الجسم</p>
        <p className="text-[16px] leading-relaxed" style={{ color: "#5eaaa4" }}>
          اضغط على أي عضو في الرسم التشريحي للاطلاع على معلومات صحية وإيجاد أطباء متخصصين
        </p>
      </div>
    );
  }

  const IconComp = organ.icon;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 shrink-0" style={{ borderBottom: "1px solid #f0fdfb" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: organ.colorLight, border: `1.5px solid ${organ.color}30` }}>
              {organ.emoji}
            </div>
            <div>
              <h3 className="font-bold text-[20px]" style={{ color: organ.color }}>{organ.label}</h3>
              <p className="text-[20px]" style={{ color: "#5eaaa4" }}>{organ.specialty}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0"
            style={{ background: "#f0fdfb", color: "#5eaaa4" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#ccfbf1"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f0fdfb"; }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Tips */}
        <div>
          <h4 className="font-bold text-[25px] mb-3 flex items-center gap-2" style={{ color: "#134e4a" }}>
            <span className="w-1 h-4 rounded-full inline-block" style={{ background: organ.color }} />
            نصائح صحية
          </h4>
          <div className="space-y-2">
            {organ.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: organ.colorLight }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold text-white mt-0.5"
                  style={{ background: organ.color }}>{i + 1}</div>
                <p className="text-[20px] leading-relaxed" style={{ color: "#134e4a" }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <h4 className="font-bold text-[25px] mb-3 flex items-center gap-2" style={{ color: "#134e4a" }}>
            <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#f59e0b" }} />
            أعراض تستوجب المراجعة
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {organ.symptoms.map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#f59e0b" }} />
                <span className="text-[20px]" style={{ color: "#92400e" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prevention */}
        <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg,rgba(13,148,136,0.08),rgba(8,145,178,0.06))", border: "1px solid #ccfbf1" }}>
          <h4 className="font-bold text-[20px] mb-2 flex items-center gap-1.5" style={{ color: "#134e4a" }}>
            🛡️ الوقاية خير من العلاج
          </h4>
          <p className="text-[14px] leading-relaxed" style={{ color: "#2d7a72" }}>{organ.prevention}</p>
        </div>

        {/* Doctors */}
        <div>
          <h4 className="font-bold text-[25px] mb-3 flex items-center gap-2" style={{ color: "#134e4a" }}>
            <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#8b5cf6" }} />
            أطباء متاحون
          </h4>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "#f0fdfb" }} />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-4 rounded-xl" style={{ background: "#f0fdfb" }}>
              <p className="text-[20px]" style={{ color: "#5eaaa4" }}>لا يوجد أطباء متاحون حالياً في هذا التخصص</p>
            </div>
          ) : (
            <div className="space-y-2">
              {doctors.slice(0, 3).map(doc => (
                <DoctorMiniCard key={doc.id} doctor={doc} />
              ))}
              {doctors.length > 3 && (
                <p className="text-[14px] text-center" style={{ color: "#5eaaa4" }}>
                  و {doctors.length - 3} طبيب آخر...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <div className="p-4 shrink-0" style={{ borderTop: "1px solid #f0fdfb" }}>
        <button
          onClick={onSearchDoctors}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl font-bold text-[17px] text-white transition-all duration-200"
          style={{
            background: `linear-gradient(135deg, ${organ.color}, ${organ.color}cc)`,
            boxShadow: `0 4px 20px ${organ.colorGlow}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${organ.colorGlow}`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${organ.colorGlow}`; }}
        >
          <Search className="h-5 w-5" />
          ابحث عن {organ.specialty === "جراحة العظام" ? "جراح عظام" : `طبيب ${organ.specialty}`}
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function InteractiveBodySection() {
  const router = useRouter();
  const [activeOrgan, setActiveOrgan] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const handleOrganClick = async (organId) => {
    if (activeOrgan === organId) {
      setActiveOrgan(null);
      setDoctors([]);
      return;
    }
    setActiveOrgan(organId);
    setDoctors([]);
    setLoadingDoctors(true);
    try {
      const organ = ORGANS[organId];
      const result = await getDoctorsBySpecialty(organ.specialty);
      setDoctors(result.doctors ?? []);
    } catch {
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleSearchDoctors = () => {
    if (!activeOrgan) return;
    const specialty = ORGANS[activeOrgan].specialty;
    router.push(`/doctors?specialty=${encodeURIComponent(specialty)}`);
  };

  const organData = activeOrgan ? ORGANS[activeOrgan] : null;

  return (
    <section className="my-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="w-1 h-6 rounded-full inline-block" style={{ background: "linear-gradient(180deg,#0d9488,#0891b2)" }} />
        <h2 className="font-bold text-[50px]" style={{ color: "#134e4a" }}>
          خريطة جسمك الصحية
        </h2>
        <span className="text-[16px] px-2.5 py-1 rounded-full font-medium" style={{ background: "#f0fdfb", color: "#0d9488", border: "1px solid #ccfbf1" }}>
          تفاعلي
        </span>
      </div>

      {/* Main Card */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.85)",
          border: "1px solid #ccfbf1",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 40px rgba(13,148,136,0.08)",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[560px]">
          {/* Left info panel - body tips */}
          <div className="hidden lg:flex flex-col justify-between p-6"
            style={{ borderLeft: "1px solid #f0fdfb", background: "linear-gradient(180deg,rgba(240,253,251,0.6),rgba(236,254,255,0.4))" }}>
            <div>
              <h3 className="font-bold text-[25px] mb-4 flex items-center gap-2" style={{ color: "#134e4a" }}>
                <Stethoscope className="h-5 w-5" style={{ color: "#0d9488" }} />
                كيفية الاستخدام
              </h3>
              <div className="space-y-3">
                {[
                  { step: "1", text: "اضغط على أي جزء من الجسم" },
                  { step: "2", text: "اطلع على النصائح الصحية والأعراض" },
                  { step: "3", text: "ابحث عن طبيب متخصص مباشرةً" },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #ccfbf1" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[20px] shrink-0"
                      style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}>{step}</div>
                    <span className="text-[20px]" style={{ color: "#2d7a72" }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-bold text-[25px] mb-3" style={{ color: "#134e4a" }}>الأعضاء المتاحة</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ORGANS).map(organ => (
                  <button
                    key={organ.id}
                    onClick={() => handleOrganClick(organ.id)}
                    className="flex items-center gap-2 p-2 rounded-xl text-right transition-all"
                    style={{
                      background: activeOrgan === organ.id ? organ.colorLight : "rgba(255,255,255,0.6)",
                      border: `1px solid ${activeOrgan === organ.id ? organ.color + "60" : "#e2faf7"}`,
                    }}
                  >
                    <span className="text-[20px]">{organ.emoji}</span>
                    <span className="text-[18px] font-medium truncate" style={{ color: activeOrgan === organ.id ? organ.color : "#5eaaa4" }}>
                      {organ.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Body SVG */}
          <div className="flex flex-col items-center justify-center p-3 relative"
            style={{ borderLeft: "1px solid #f0fdfb" }}>
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: "radial-gradient(circle at 50% 40%, rgba(13,148,136,0.08) 0%, transparent 60%)"
            }} />
            <p className="text-[20px] font-medium mb-4 relative z-10" style={{ color: "#5eaaa4" }}>
              {activeOrgan ? `✅ تم اختيار: ${ORGANS[activeOrgan].label}` : "اضغط على أي عضو في الجسم"}
            </p>
            <div className="relative z-10 w-full">
              <HumanBodySVG activeOrgan={activeOrgan} onOrganClick={handleOrganClick} />
            </div>

            {/* Mobile organ grid */}
            <div className="lg:hidden mt-4 grid grid-cols-4 gap-2 w-full">
              {Object.values(ORGANS).map(organ => (
                <button
                  key={organ.id}
                  onClick={() => handleOrganClick(organ.id)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                  style={{
                    background: activeOrgan === organ.id ? organ.colorLight : "rgba(255,255,255,0.7)",
                    border: `1px solid ${activeOrgan === organ.id ? organ.color + "60" : "#ccfbf1"}`,
                  }}
                >
                  <span className="text-[22px]">{organ.emoji}</span>
                  <span className="text-[12px]" style={{ color: activeOrgan === organ.id ? organ.color : "#5eaaa4" }}>
                    {organ.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right - Info Panel */}
          <div className="flex flex-col" style={{ borderTop: "1px solid #f0fdfb" }}>
            <OrganInfoPanel
              organ={organData}
              doctors={doctors}
              loading={loadingDoctors}
              onClose={() => { setActiveOrgan(null); setDoctors([]); }}
              onSearchDoctors={handleSearchDoctors}
            />
          </div>
        </div>
      </div>
    </section>
  );
}