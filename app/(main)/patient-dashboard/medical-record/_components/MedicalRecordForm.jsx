"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrUpdateMedicalRecord } from "@/actions/medical-record";
import {
  User, Heart, Pill, AlertTriangle, Activity,
  Calendar, Phone, Mail, Droplet, Ruler, Weight,
  Save, CheckCircle, ChevronRight
} from "lucide-react";

const C = {
  primary: "#0d9488",
  primaryLight: "#f0fdfb",
  text: "#134e4a",
  textMid: "#2d7a72",
  textLight: "#5eaaa4",
  border: "#ccfbf1",
  grad: "linear-gradient(135deg,#0d9488,#0891b2)",
};

export function MedicalRecordForm({ user, existingRecord }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    firstName: existingRecord?.firstName || user?.name?.split(" ")[0] || "",
    lastName: existingRecord?.lastName || user?.name?.split(" ").slice(1).join(" ") || "",
    gender: existingRecord?.gender || "",
    dateOfBirth: existingRecord?.dateOfBirth
      ? new Date(existingRecord.dateOfBirth).toISOString().split("T")[0]
      : "",
    age: existingRecord?.age || "",
    phone: existingRecord?.phone || user?.patientProfile?.phone || "",
    email: existingRecord?.email || user?.email || "",
    bloodType: existingRecord?.bloodType || "",
    weight: existingRecord?.weight || "",
    height: existingRecord?.height || "",
    chronicDiseases: existingRecord?.chronicDiseases || "",
    allergies: existingRecord?.allergies || "",
    previousSurgeries: existingRecord?.previousSurgeries || "",
    currentMedications: existingRecord?.currentMedications || "",
    smokingStatus: existingRecord?.smokingStatus || "",
    pregnancyStatus: existingRecord?.pregnancyStatus || "",
    familyDiseases: existingRecord?.familyDiseases || "",
  });

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const result = await createOrUpdateMedicalRecord({
      userId: user.id,
      ...form,
      age: form.age ? parseInt(form.age) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : undefined,
    });

    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const Section = ({ title, icon: Icon, children }) => (
    <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #ccfbf1" }}>
      <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: C.text }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.primaryLight }}>
          <Icon className="h-4 w-4" style={{ color: C.primary }} />
        </div>
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const Field = ({ label, icon: Icon, value, onChange, type = "text", placeholder, textarea = false }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textMid }}>{label}</label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white transition-all"
        style={{ border: "1px solid #ccfbf1" }}
        onFocusCapture={(e) => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)"; }}
        onBlurCapture={(e) => { e.currentTarget.style.borderColor = "#ccfbf1"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <Icon className="h-4 w-4 shrink-0" style={{ color: C.textLight }} />
        {textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="flex-1 bg-transparent text-sm outline-none resize-none"
            style={{ color: C.text }}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: C.text }}
          />
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Section title="المعلومات الأساسية" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="الاسم الأول" icon={User} value={form.firstName} onChange={(v) => update("firstName", v)} placeholder="الاسم الأول" />
          <Field label="الاسم الأخير" icon={User} value={form.lastName} onChange={(v) => update("lastName", v)} placeholder="الاسم الأخير" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textMid }}>الجنس</label>
            <div className="flex gap-2">
              {["ذكر", "أنثى"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => update("gender", g)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: form.gender === g ? C.primary : "#f0fdfb",
                    color: form.gender === g ? "#fff" : C.text,
                    border: `1px solid ${form.gender === g ? C.primary : "#ccfbf1"}`,
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <Field label="تاريخ الميلاد" icon={Calendar} value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} type="date" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="العمر" icon={Activity} value={form.age} onChange={(v) => update("age", v)} type="number" placeholder="العمر بالسنوات" />
          <Field label="فصيلة الدم" icon={Droplet} value={form.bloodType} onChange={(v) => update("bloodType", v)} placeholder="مثال: A+" />
          <Field label="رقم الهاتف" icon={Phone} value={form.phone} onChange={(v) => update("phone", v)} placeholder="رقم الهاتف" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="البريد الإلكتروني" icon={Mail} value={form.email} onChange={(v) => update("email", v)} type="email" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="الوزن (كجم)" icon={Weight} value={form.weight} onChange={(v) => update("weight", v)} type="number" placeholder="الوزن بالكيلوغرام" />
          <Field label="الطول (سم)" icon={Ruler} value={form.height} onChange={(v) => update("height", v)} type="number" placeholder="الطول بالسنتيمتر" />
        </div>
      </Section>

      {/* Medical History */}
      <Section title="المعلومات الطبية المهمة" icon={Heart}>
        <Field label="الأمراض المزمنة" icon={AlertTriangle} value={form.chronicDiseases} onChange={(v) => update("chronicDiseases", v)} placeholder="اذكر أي أمراض مزمنة..." textarea />
        <Field label="الحساسية" icon={AlertTriangle} value={form.allergies} onChange={(v) => update("allergies", v)} placeholder="حساسية من أدوية أو أطعمة..." textarea />
        <Field label="العمليات الجراحية السابقة" icon={Activity} value={form.previousSurgeries} onChange={(v) => update("previousSurgeries", v)} placeholder="عمليات سابقة..." textarea />
        <Field label="الأدوية الحالية" icon={Pill} value={form.currentMedications} onChange={(v) => update("currentMedications", v)} placeholder="الأدوية التي تتناولها حالياً..." textarea />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textMid }}>حالة التدخين</label>
            <select
              value={form.smokingStatus}
              onChange={(e) => update("smokingStatus", e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white"
              style={{ border: "1px solid #ccfbf1", color: C.text }}
            >
              <option value="">اختر...</option>
              <option value="non-smoker">غير مدخن</option>
              <option value="former-smoker">مدخن سابق</option>
              <option value="light-smoker">مدخن خفيف</option>
              <option value="heavy-smoker">مدخن كثير</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textMid }}>حالة الحمل (إن وجد)</label>
            <select
              value={form.pregnancyStatus}
              onChange={(e) => update("pregnancyStatus", e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white"
              style={{ border: "1px solid #ccfbf1", color: C.text }}
            >
              <option value="">غير مطبق</option>
              <option value="not-pregnant">غير حامل</option>
              <option value="pregnant">حامل</option>
              <option value="breastfeeding">مرضع</option>
            </select>
          </div>
        </div>

        <Field label="الأمراض الوراثية / العائلية" icon={Heart} value={form.familyDiseases} onChange={(v) => update("familyDiseases", v)} placeholder="أمراض وراثية في العائلة..." textarea />
      </Section>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-4 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          style={{ background: saving ? "#5eaaa4" : C.grad, opacity: saving ? 0.8 : 1 }}
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />جاري الحفظ...</>
          ) : saved ? (
            <><CheckCircle className="h-4 w-4" />تم الحفظ بنجاح!</>
          ) : (
            <><Save className="h-4 w-4" />حفظ الملف الطبي</>
          )}
        </button>

        <button
          type="button"
          onClick={() => router.push("/patient-dashboard")}
          className="px-6 py-4 rounded-xl text-sm font-medium transition-all"
          style={{ background: "#f0fdfb", color: C.primary, border: "1px solid #ccfbf1" }}
        >
          رجوع
        </button>
      </div>
    </form>
  );
}