"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cancelAppointmentBySecretary, rescheduleAppointment } from "@/actions/secretary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ألوان حسب حالة الموعد
const statusColors = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels = {
  SCHEDULED: "مجدول",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

export default function SecretaryAppointmentsList({ appointments }) {
  const [loading, setLoading] = useState(false);

  // Dialog الإلغاء
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  // Dialog التأجيل
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // ======= إلغاء الموعد =======
  const handleCancel = async () => {
    setLoading(true);
    const result = await cancelAppointmentBySecretary(
      selectedAppointment.id,
      cancelReason
    );
    setLoading(false);

    if (result.success) {
      toast.success("تم إلغاء الموعد بنجاح");
      setCancelDialog(false);
      setCancelReason("");
      // تحديث الصفحة
      window.location.reload();
    } else {
      toast.error(result.error || "حدث خطأ");
    }
  };

  // ======= تأجيل الموعد =======
  const handleReschedule = async () => {
    if (!newStartTime || !newEndTime) {
      toast.error("يرجى تحديد الوقت الجديد");
      return;
    }
    setLoading(true);
    const result = await rescheduleAppointment(
      selectedAppointment.id,
      newStartTime,
      newEndTime,
      rescheduleReason
    );
    setLoading(false);

    if (result.success) {
      toast.success("تم تأجيل الموعد بنجاح");
      setRescheduleDialog(false);
      window.location.reload();
    } else {
      toast.error(result.error || "حدث خطأ");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        إدارة المواعيد ({appointments.length})
      </h2>

      {appointments.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          لا توجد مواعيد حالياً
        </p>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  {/* معلومات الموعد */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={statusColors[apt.status]}>
                        {statusLabels[apt.status]}
                      </Badge>
                    </div>
                    <p className="font-medium">
                      🧑‍⚕️ الطبيب: {apt.doctor?.name} ({apt.doctor?.specialty})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      👤 المريض: {apt.patient?.name} — {apt.patient?.email}
                    </p>
                    <p className="text-sm mt-1">
                      🕐{" "}
                      {format(new Date(apt.startTime), "dd MMM yyyy — HH:mm", {
                        locale: ar,
                      })}{" "}
                      إلى{" "}
                      {format(new Date(apt.endTime), "HH:mm", { locale: ar })}
                    </p>
                    {apt.cancellationReason && (
                      <p className="text-sm text-red-500 mt-1">
                        السبب: {apt.cancellationReason}
                      </p>
                    )}
                  </div>

                  {/* أزرار الإجراءات */}
                  {apt.status === "SCHEDULED" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setRescheduleDialog(true);
                        }}
                      >
                        تأجيل
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setCancelDialog(true);
                        }}
                      >
                        إلغاء
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ====== Dialog الإلغاء ====== */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إلغاء الموعد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              هل أنت متأكد من إلغاء موعد{" "}
              <strong>{selectedAppointment?.patient?.name}</strong> مع الدكتور{" "}
              <strong>{selectedAppointment?.doctor?.name}</strong>؟
            </p>
            <div>
              <Label>سبب الإلغاء (اختياري)</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="اكتب سبب الإلغاء..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(false)}>
              رجوع
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== Dialog التأجيل ====== */}
      <Dialog open={rescheduleDialog} onOpenChange={setRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأجيل الموعد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>وقت البداية الجديد</Label>
              <Input
                type="datetime-local"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>وقت النهاية الجديد</Label>
              <Input
                type="datetime-local"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>سبب التأجيل (اختياري)</Label>
              <Textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="اكتب سبب التأجيل..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleDialog(false)}
            >
              رجوع
            </Button>
            <Button onClick={handleReschedule} disabled={loading}>
              {loading ? "جاري التأجيل..." : "تأكيد التأجيل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}