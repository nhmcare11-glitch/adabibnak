"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function SecretaryDoctorsList({ doctors }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        قائمة الأطباء ({doctors.length})
      </h2>

      {doctors.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">لا يوجد أطباء</p>
      ) : (
        <div className="space-y-3">
          {doctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={doctor.imageUrl} />
                  <AvatarFallback>
                    {doctor.name?.charAt(0) || "د"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">د. {doctor.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {doctor.specialty}
                  </p>
                  <p className="text-xs text-muted-foreground">{doctor.email}</p>
                </div>
                <Badge className="ml-auto bg-green-100 text-green-800">
                  متاح
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ملاحظة */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        💡 لتعديل أوقات توافر الأطباء، يرجى التواصل مع الإدارة
      </p>
    </div>
  );
}