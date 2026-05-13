"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Loader2, Clock, ArrowLeft, Calendar, CreditCard, Video, MapPin } from "lucide-react";
import { bookAppointment } from "@/actions/appointments";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";

export function AppointmentForm({ doctorId, slot, onBack, onComplete }) {
  const [description, setDescription] = useState("");

  const { loading, data, fn: submitBooking } = useFetch(bookAppointment);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("doctorId",         doctorId);
    formData.append("startTime",        slot.startTime);
    formData.append("endTime",          slot.endTime);
    formData.append("description",      description);
    // ✅ إرسال consultationType و duration من الـ slot
    formData.append("consultationType", slot.consultationType || "REMOTE");
    formData.append("duration",         String(slot.duration || 30));

    await submitBooking(formData);
  };

  useEffect(() => {
    if (data?.success) {
      toast.success("تم حجز الموعد بنجاح!");
      onComplete();
    }
  }, [data]);

  const isRemote = (slot.consultationType || "REMOTE") === "REMOTE";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ملخص الموعد */}
      <div className="bg-muted/20 p-4 rounded-lg border border-blue-900/20 space-y-3">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-blue-400 mr-2" />
          <span className="text-white font-medium">
            {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-400 mr-2" />
          <span className="text-white">{slot.formatted}</span>
          <span className="text-muted-foreground text-sm mr-2">({slot.duration || 30} دقيقة)</span>
        </div>
        <div className="flex items-center">
          {isRemote
            ? <Video   className="h-5 w-5 text-blue-400 mr-2" />
            : <MapPin  className="h-5 w-5 text-blue-400 mr-2" />
          }
          <span className="text-muted-foreground">
            {isRemote ? "استشارة عن بُعد" : "استشارة حضورية"}
          </span>
        </div>
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 text-blue-400 mr-2" />
          <span className="text-muted-foreground">
            التكلفة: <span className="text-white font-medium">رصيدين</span>
          </span>
        </div>
      </div>

      {/* وصف المشكلة */}
      <div className="space-y-2">
        <Label htmlFor="description">صف مشكلتك الطبية (اختياري)</Label>
        <Textarea
          id="description"
          placeholder="يرجى تقديم أي تفاصيل حول مشكلتك الطبية أو ما ترغب في مناقشته..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-background border-blue-900/20 h-32"
        />
        <p className="text-sm text-muted-foreground">
          سيتم مشاركة هذه المعلومات مع الطبيب قبل موعدك
        </p>
      </div>

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="border-blue-900/30"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          تغيير الفترة الزمنية
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جارٍ الحجز...
            </>
          ) : (
            "تأكيد الحجز"
          )}
        </Button>
      </div>
    </form>
  );
}