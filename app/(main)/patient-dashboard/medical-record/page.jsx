"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/actions/user";
import { getMedicalRecord } from "@/actions/medical-record";  // ✅ alias
import { MedicalRecordForm } from "./_components/MedicalRecordForm";
import { Heart, ChevronRight } from "lucide-react";

const C = {
  primary: "#0d9488",
  primaryLight: "#f0fdfb",
  text: "#134e4a",
  textLight: "#5eaaa4",
  border: "#ccfbf1",
  grad: "linear-gradient(135deg,#0d9488,#0891b2)",
};

export default function MedicalRecordPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const u = await getCurrentUser();
        if (!u || u.role !== "PATIENT") {
          router.push("/onboarding");
          return;
        }
        setUser(u);
        const res = await getMedicalRecord(u.id);
        if (res.success) setRecord(res.record);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.primaryLight }}>
        <div className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-6" dir="rtl" style={{ background: C.primaryLight }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: C.textLight }}>
          <button onClick={() => router.push("/patient-dashboard")} className="hover:underline transition-all">
            لوحة التحكم
          </button>
          <ChevronRight className="h-4 w-4" />
          <span style={{ color: C.text }} className="font-medium">ملفي الطبي</span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: C.grad }}>
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: C.text }}>ملفي الطبي</h1>
            <p className="text-sm mt-0.5" style={{ color: C.textLight }}>
              أدخل معلوماتك الطبية الكاملة لمساعدة الأطباء في تقديم أفضل رعاية
            </p>
          </div>
        </div>

        <MedicalRecordForm user={user} existingRecord={record} />
      </div>
    </div>
  );
}