import {
  HeartPulse,
  Stethoscope,
  Bone,
  Eye,
  Baby,
  Brain,
  Flower2,
  Target,
  Milestone,
  Microscope,
  Timer,
  Thermometer,
  Activity,
  CircleDot,
} from "lucide-react";

export const SPECIALTIES = [
  {
    name: "الطب العام",
    icon: <Stethoscope className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "أمراض القلب",
    icon: <HeartPulse className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "الأمراض الجلدية",
    icon: <CircleDot className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "الغدد الصماء",
    icon: <Timer className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "أمراض الجهاز الهضمي",
    icon: <Thermometer className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "طب الأعصاب",
    icon: <Brain className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "النساء والتوليد",
    icon: <Flower2 className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "علم الأورام",
    icon: <Target className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "طب العيون",
    icon: <Eye className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "جراحة العظام",
    icon: <Bone className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "طب الأطفال",
    icon: <Baby className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "الطب النفسي",
    icon: <Brain className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "أمراض الرئة",
    icon: <Activity className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "الأشعة التشخيصية",
    icon: <CircleDot className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "المسالك البولية",
    icon: <Milestone className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
  {
    name: "أخرى",
    icon: <Microscope className="h-5 w-5 text-slate-900 dark:text-white" />,
  },
];