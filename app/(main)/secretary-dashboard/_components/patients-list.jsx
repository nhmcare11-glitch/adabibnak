"use client";

import { useState } from "react";
import { updatePatientInfo } from "@/actions/secretary";
import { Card, CardContent } from "@/components/ui/card";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function SecretaryPatientsList({ patients }) {
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    bloodType: "",
  });

  const openEditDialog = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name || "",
      age: patient.age?.toString() || "",
      bloodType: patient.bloodType || "",
    });
    setEditDialog(true);
  };

  const handleUpdate = async () => {
    setLoading(true);
    const result = await updatePatientInfo(selectedPatient.id, formData);
    setLoading(false);

    if (result.success) {
      toast.success("تم تحديث بيانات المريض");
      setEditDialog(false);
      window.location.reload();
    } else {
      toast.error(result.error || "حدث خطأ");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        قائمة المرضى ({patients.length})
      </h2>

      {patients.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">لا يوجد مرضى</p>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <Card key={patient.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={patient.imageUrl} />
                    <AvatarFallback>
                      {patient.name?.charAt(0) || "م"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{patient.name || "بدون اسم"}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      العمر: {patient.age || "—"} | فصيلة الدم:{" "}
                      {patient.bloodType || "—"}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(patient)}
                >
                  تعديل
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog تعديل المريض */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات المريض</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>الاسم</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>العمر</Label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>فصيلة الدم</Label>
              <Input
                value={formData.bloodType}
                onChange={(e) =>
                  setFormData({ ...formData, bloodType: e.target.value })
                }
                placeholder="مثال: A+, O-, B+"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}