import {
  Calendar,
  Video,
  CreditCard,
  User,
  FileText,
  ShieldCheck,
} from "lucide-react";

// JSON data for features
export const features = [
  {
    icon: <User className="h-6 w-6 text-blue-400" />,
    title: "أنشئ ملفك الشخصي",
    description:
      "سجّل وأكمل ملفك الشخصي للحصول على توصيات وخدمات صحية مخصصة.",
  },
  {
    icon: <Calendar className="h-6 w-6 text-blue-400" />,
    title: "حجز المواعيد",
    description:
      "تصفح ملفات الأطباء، تحقق من التوافر، واحجز المواعيد التي تناسب جدولك.",
  },
  {
    icon: <Video className="h-6 w-6 text-blue-400" />,
    title: "استشارة فيديو",
    description:
      "تواصل مع الأطباء من خلال استشارات فيديو آمنة وعالية الجودة من  منزلك.",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-blue-400" />,
    title: "استشارة دردشة",
    description:
            "تواصل مع الأطباء من خلال استشارات دردشة آمنة وعالية الجودة من  منزلك.",

  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-blue-400" />,
    title: "أطباء موثوقون",
    description:
      "يتم التحقق من جميع مقدمي الرعاية الصحية والتحقق منهم بعناية لضمان جودة الرعاية.",
  },
  {
    icon: <FileText className="h-6 w-6 text-blue-400" />,
    title: "التوثيق الطبي",
    description:
      "الوصول إلى تاريخ مواعيدك وإدارته، وملاحظات الطبيب، والتوصيات الطبية.",
  },
];

// JSON data for testimonials
export const testimonials = [
  {
    initials: "SP",
    name: "سارة . ك",
    role: "Patient",
    quote:
      "ميزة الاستشارة عبر الفيديو وفرت لي الكثير من الوقت. تمكنت من الحصول على نصائح طبية دون أخذ إجازة من العمل أو السفر إلى عيادة.",
  },
  {
    initials: "DR",
    name: "Dr. Nawal.M",
    role: "Cardiologist",
    quote:
      "لقد أحدثت هذه المنصة ثورة في ممارستي. يمكنني الآن الوصول إلى المزيد من المرضى وتقديم الرعاية في الوقت المناسب دون قيود المكتب الفعلي.",
    },
  {
    initials: "JT",
    name: "محمد. ل",
    role: "Patient",
    quote:
      "نظام الائتمان مريح جدًا. لقد اشتريت باقة لعائلتي، وتمكنا من استشارة المتخصصين كلما دعت الحاجة.",
  },
];

// JSON data for credit system benefits
export const creditBenefits = [
  "Each consultation requires <strong class='text-blue-400'>2 credits</strong> regardless of duration",
  "Credits <strong class='text-blue-400'>never expire</strong> - use them whenever you need",
  "Monthly subscriptions give you <strong class='text-blue-400'>fresh credits every month</strong>",
  "Cancel or change your subscription <strong class='text-blue-400'>anytime</strong> without penalties",
];