"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, Pill, ClipboardList, Stethoscope, Calendar } from "lucide-react";
import { savePrescription } from "@/actions/prescriptions";
import { toast } from "sonner";

const EMPTY_MED = { name: "", dosage: "", frequency: "", duration: "", notes: "" };

export function PrescriptionForm({ appointmentId, existingPrescription, onSaved }) {
  const [diagnosis, setDiagnosis] = useState(existingPrescription?.diagnosis || "");
  const [medications, setMedications] = useState(
    existingPrescription?.medications?.length
      ? existingPrescription.medications
      : [{ ...EMPTY_MED }]
  );
  const [instructions, setInstructions] = useState(existingPrescription?.instructions || "");
  const [followUpDate, setFollowUpDate] = useState(
    existingPrescription?.followUpDate
      ? new Date(existingPrescription.followUpDate).toISOString().split("T")[0]
      : ""
  );
  const [loading, setLoading] = useState(false);

  const addMed = () => setMedications((prev) => [...prev, { ...EMPTY_MED }]);

  const removeMed = (i) =>
    setMedications((prev) => prev.filter((_, idx) => idx !== i));

  const updateMed = (i, field, value) =>
    setMedications((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m))
    );

  const handleSubmit = async () => {
    if (!diagnosis.trim()) {
      toast.error("يرجى إدخال التشخيص");
      return;
    }
    if (medications.some((m) => !m.name.trim())) {
      toast.error("يرجى إدخال اسم الدواء لكل صف");
      return;
    }
    setLoading(true);
    const { prescription, error } = await savePrescription(appointmentId, {
      diagnosis,
      medications,
      instructions,
      followUpDate: followUpDate || null,
    });
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("تم حفظ الوصفة الطبية بنجاح");
      onSaved?.(prescription);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* التشخيص */}
      <Card className="border-amber-800/30 bg-amber-950/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
            <Stethoscope className="h-4 w-4" /> التشخيص
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="اكتب التشخيص الطبي..."
            className="bg-background resize-none min-h-[80px]"
          />
        </CardContent>
      </Card>

      {/* الأدوية */}
      <Card className="border-blue-800/30 bg-blue-950/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-400 flex items-center gap-2">
            <Pill className="h-4 w-4" /> الأدوية الموصوفة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* رؤوس الأعمدة */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground font-medium px-1">
            <span>اسم الدواء *</span>
            <span>الجرعة</span>
            <span>التكرار</span>
            <span>المدة</span>
            <span />
          </div>

          {medications.map((med, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center">
              <Input
                value={med.name}
                onChange={(e) => updateMed(i, "name", e.target.value)}
                placeholder="مثال: أموكسيسيلين"
                className="bg-background text-sm"
              />
              <Input
                value={med.dosage}
                onChange={(e) => updateMed(i, "dosage", e.target.value)}
                placeholder="500mg"
                className="bg-background text-sm"
              />
              <Input
                value={med.frequency}
                onChange={(e) => updateMed(i, "frequency", e.target.value)}
                placeholder="3×يوم"
                className="bg-background text-sm"
              />
              <Input
                value={med.duration}
                onChange={(e) => updateMed(i, "duration", e.target.value)}
                placeholder="7 أيام"
                className="bg-background text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeMed(i)}
                disabled={medications.length === 1}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* ملاحظات لكل دواء */}
          {medications.map((med, i) => (
            <div key={`notes-${i}`} className="flex gap-2 items-center">
              <Label className="text-xs text-muted-foreground whitespace-nowrap w-24 shrink-0">
                ملاحظة {med.name || `دواء ${i + 1}`}:
              </Label>
              <Input
                value={med.notes}
                onChange={(e) => updateMed(i, "notes", e.target.value)}
                placeholder="مثال: يؤخذ بعد الأكل"
                className="bg-background text-sm"
              />
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addMed}
            className="border-blue-700 text-blue-400 hover:bg-blue-900/30 mt-1"
          >
            <Plus className="h-4 w-4 mr-1" />
            إضافة دواء
          </Button>
        </CardContent>
      </Card>

      {/* تعليمات وموعد متابعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-green-800/30 bg-green-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-400 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> تعليمات وإرشادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="إرشادات للمريض، نظام غذائي، احتياطات..."
              className="bg-background resize-none min-h-[100px]"
            />
          </CardContent>
        </Card>

        <Card className="border-purple-800/30 bg-purple-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> موعد المتابعة (اختياري)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="bg-background"
              min={new Date().toISOString().split("T")[0]}
            />
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75"/>
            </svg>
            جار الحفظ...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Save className="h-4 w-4" /> حفظ الوصفة الطبية
          </span>
        )}
      </Button>
    </div>
  );
}