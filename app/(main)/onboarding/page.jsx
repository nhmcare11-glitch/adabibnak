"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  User,
  Stethoscope,
  Loader2,
  ClipboardList,
  Pill,
  FlaskConical,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { setUserRole } from "@/actions/onboarding";
import { doctorFormSchema } from "@/lib/schema";
import { SPECIALTIES } from "@/lib/specialities";
import useFetch from "@/hooks/use-fetch";

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState("choose-role");

  // ==============================
  // التحقق من role الحالي
  // ==============================
  useEffect(() => {
    const checkExistingRole = async () => {
      try {
        const res = await fetch("/api/check-role");

        if (!res.ok) return;

        const data = await res.json();

        if (data.role === "PATIENT") {
          window.location.href = "/patient-dashboard";
        } else if (data.role === "DOCTOR") {
          window.location.href = "/doctor-dashboard";
        } else if (data.role === "SECRETARY") {
          window.location.href = "/secretary-dashboard";
        } else if (data.role === "ADMIN") {
          window.location.href = "/admin";
        } else if (data.role === "VERIFICATION_MANAGER") {
          window.location.href = "/verification-manager"; // ← جديد
        }
      } catch (error) {
        console.log("Role check error:", error);
      }
    };

    checkExistingRole();
  }, []);

  // ==============================
  // useFetch
  // ==============================
  const {
    loading,
    fn: submitUserRole,
  } = useFetch(setUserRole);

  // ==============================
  // React Hook Form
  // ==============================
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      specialty: "",
      experience: undefined,
      credentialUrl: "",
      description: "",
    },
  });

  const specialtyValue = watch("specialty");

  // ==============================
  // اختيار المريض
  // ==============================
  const handlePatientSelection = async () => {
    if (loading) return;
    try {
      const formData = new FormData();
      formData.append("role", "PATIENT");
      await submitUserRole(formData);
      window.location.href = "/api/auth/redirect";
    } catch (error) {
      console.log(error);
    }
  };

  // ==============================
  // اختيار السكرتيرة
  // ==============================
  const handleSecretarySelection = async () => {
    if (loading) return;
    try {
      const formData = new FormData();
      formData.append("role", "SECRETARY");
      await submitUserRole(formData);
      window.location.href = "/api/auth/redirect";
    } catch (error) {
      console.log(error);
    }
  };

  // ==============================
  // الصيدلية
  // ==============================
  const handlePharmacySelection = async () => {
    if (loading) return;
    alert("قريباً...");
  };

  // ==============================
  // المخبر
  // ==============================
  const handleLabSelection = async () => {
    if (loading) return;
    alert("قريباً...");
  };

  // ==============================
  // تسجيل الطبيب
  // ==============================
  const onDoctorSubmit = async (formValues) => {
    if (loading) return;
    try {
      const formData = new FormData();
      formData.append("role", "DOCTOR");
      formData.append("specialty", formValues.specialty);
      formData.append("experience", formValues.experience.toString());
      formData.append("credentialUrl", formValues.credentialUrl);
      formData.append("description", formValues.description);
      await submitUserRole(formData);
      window.location.href = "/api/auth/redirect";
    } catch (error) {
      console.log(error);
    }
  };

  // ==============================
  // شاشة اختيار الدور
  // ==============================
  if (step === "choose-role") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background">

        {/* مريض */}
        <Card className="border-blue-900/20 hover:border-blue-700/40 cursor-pointer transition-all" onClick={() => !loading && handlePatientSelection()}>
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-blue-900/20 rounded-full mb-4">
              <User className="h-8 w-8 text-blue-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground mb-2">تسجيل الدخول كمريض</CardTitle>
            <CardDescription className="mb-4">احجز المواعيد، واستشر الأطباء، وقم بإدارة رحلتك في الرعاية الصحية</CardDescription>
            <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />يعالج...</> : "سجل"}
            </Button>
          </CardContent>
        </Card>

        {/* طبيب */}
        <Card className="border-blue-900/20 hover:border-blue-700/40 cursor-pointer transition-all" onClick={() => !loading && setStep("doctor-form")}>
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-blue-900/20 rounded-full mb-4">
              <Stethoscope className="h-8 w-8 text-blue-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground mb-2">تسجيل دخول كطبيب</CardTitle>
            <CardDescription className="mb-4">أنشئ ملفك المهني وحدد أوقات توافرك وقدم الاستشارات</CardDescription>
            <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700" disabled={loading}>سجل</Button>
          </CardContent>
        </Card>

        {/* سكرتيرة */}
        <Card className="border-blue-900/20 hover:border-blue-700/40 cursor-pointer transition-all" onClick={() => !loading && handleSecretarySelection()}>
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-purple-900/20 rounded-full mb-4">
              <ClipboardList className="h-8 w-8 text-purple-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground mb-2">تسجيل الدخول كسكرتيرة</CardTitle>
            <CardDescription className="mb-4">إدارة المواعيد والتواصل مع المرضى ومتابعة الملفات</CardDescription>
            <Button className="w-full mt-2 bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />يعالج...</> : "سجل"}
            </Button>
          </CardContent>
        </Card>

        {/* صيدلية */}
        <Card className="border-blue-900/20 hover:border-blue-700/40 cursor-pointer transition-all" onClick={() => !loading && handlePharmacySelection()}>
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-blue-900/20 rounded-full mb-4">
              <Pill className="h-8 w-8 text-blue-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground mb-2">تسجيل الدخول كصيدلية</CardTitle>
            <CardDescription className="mb-4">إدارة الأدوية والوصفات الطبية</CardDescription>
            <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700" disabled={loading}>سجل</Button>
          </CardContent>
        </Card>

        {/* مخبر */}
        <Card className="border-blue-900/20 hover:border-blue-700/40 cursor-pointer transition-all" onClick={() => !loading && handleLabSelection()}>
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-blue-900/20 rounded-full mb-4">
              <FlaskConical className="h-8 w-8 text-blue-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground mb-2">تسجيل الدخول كمخبر</CardTitle>
            <CardDescription className="mb-4">إدارة التحاليل الطبية والنتائج</CardDescription>
            <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700" disabled={loading}>سجل</Button>
          </CardContent>
        </Card>

      </div>
    );
  }

  // ==============================
  // فورم الطبيب
  // ==============================
  return (
    <Card className="border-blue-900/20">
      <CardContent className="pt-6">
        <div className="mb-6">
          <CardTitle className="text-2xl font-bold text-blue-700 mb-2">أكمل ملفك الطبي</CardTitle>
          <CardDescription>يرجى تقديم بياناتك المهنية للتحقق</CardDescription>
        </div>

        <form onSubmit={handleSubmit(onDoctorSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="specialty">التخصص الطبي</Label>
            <Select value={specialtyValue} onValueChange={(value) => setValue("specialty", value)}>
              <SelectTrigger id="specialty">
                <SelectValue placeholder="اختر تخصصك" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((spec) => (
                  <SelectItem key={spec.name} value={spec.name}>
                    <span className="text-blue-400">{spec.icon}</span>
                    {spec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.specialty && <p className="text-sm font-medium text-red-500">{errors.specialty.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">سنوات الخبرة</Label>
            <Input id="experience" type="number" placeholder="مثال: 5" {...register("experience", { valueAsNumber: true })} />
            {errors.experience && <p className="text-sm font-medium text-red-500">{errors.experience.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="credentialUrl">رابط الشهادة</Label>
            <Input id="credentialUrl" type="url" placeholder="https://example.com/file.pdf" {...register("credentialUrl")} />
            {errors.credentialUrl && <p className="text-sm font-medium text-red-500">{errors.credentialUrl.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف الخدمات</Label>
            <Textarea id="description" rows="4" placeholder="اكتب وصفاً لخدماتك..." {...register("description")} />
            {errors.description && <p className="text-sm font-medium text-red-500">{errors.description.message}</p>}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setStep("choose-role")}>عودة</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />جارٍ الإرسال...</> : "إرسال للتحقق"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}