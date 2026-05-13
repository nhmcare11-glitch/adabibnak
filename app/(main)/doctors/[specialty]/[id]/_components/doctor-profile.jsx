// /app/doctors/[id]/_components/doctor-profile.jsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Calendar,
  Clock,
  Medal,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SlotPicker } from "./slot-picker";
import { AppointmentForm } from "./appointment-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DoctorProfile({ doctor, availableDays }) {
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const router = useRouter();

  // Calculate total available slots
  const totalSlots = availableDays?.reduce(
    (total, day) => total + day.slots.length,
    0
  );

  const toggleBooking = () => {
    setShowBooking(!showBooking);
    if (!showBooking) {
      // Scroll to booking section when expanding
      setTimeout(() => {
        document.getElementById("booking-section")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookingComplete = () => {
    router.push("/patient-dashboard");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left column - Doctor Photo and Quick Info (fixed on scroll) */}
      <div className="md:col-span-1">
        <div className="md:sticky md:top-24">
          <Card className="border-blue-900/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 bg-blue-900/20">
                  {doctor.imageUrl ? (
                    <Image
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-blue-400" />
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold text-white mb-1">
                  Dr. {doctor.name}
                </h2>

                <Badge
                  variant="outline"
                  className="bg-blue-900/20 border-blue-900/30 text-blue-400 mb-4"
                >
                  {doctor.specialty}
                </Badge>

                <div className="flex items-center justify-center mb-2">
                  <Medal className="h-4 w-4 text-blue-400 mr-2" />
                  <span className="text-muted-foreground">
                    {doctor.experience} years experience
                  </span>
                </div>

                <Button
                  onClick={toggleBooking}
                  className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                >
                  {showBooking ? (
                    <>
                      إخفاء الحجز
                      <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      حجز موعد
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right column - Doctor Details and Booking Section */}
      <div className="md:col-span-2 space-y-6">
        <Card className="border-blue-900/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">
             حول Dr. {doctor.name}
            </CardTitle>
            <CardDescription>
              الخلفية المهنية والخبرة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <h3 className="text-white font-medium">الوصف</h3>
              </div>
              <p className="text-muted-foreground whitespace-pre-line">
                {doctor.description}
              </p>
            </div>

            <Separator className="bg-blue-900/20" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <h3 className="text-white font-medium">التوفر</h3>
              </div>
              {totalSlots > 0 ? (
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-400 mr-2" />
                  <p className="text-muted-foreground">
                    {totalSlots} الفترات الزمنية المتاحة للحجز على مدار الأيام الأربعة القادمة
                  </p>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
لا توجد أي مواعيد متاحة للأيام الأربعة القادمة. يرجى العودة لاحقًا.   
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Section - Conditionally rendered */}
        {showBooking && (
          <div id="booking-section">
            <Card className="border-blue-900/20">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">
                  حجز موعد
                </CardTitle>
                <CardDescription>
                  اختر فترة زمنية وقدم تفاصيل لاستشارتك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {totalSlots > 0 ? (
                  <>
                    {/* Slot selection step */}
                    {!selectedSlot && (
                      <SlotPicker
                        days={availableDays}
                        onSelectSlot={handleSlotSelect}
                      />
                    )}

                    {/* Appointment form step */}
                    {selectedSlot && (
                      <AppointmentForm
                        doctorId={doctor.id}
                        slot={selectedSlot}
                        onBack={() => setSelectedSlot(null)}
                        onComplete={handleBookingComplete}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-xl font-medium text-white mb-2">
                      لا توجد مواعيد متاحة
                    </h3>
                    <p className="text-muted-foreground">
                      ليس لدى هذا الطبيب أي مواعيد متاحة للأيام الأربعة القادمة. يُرجى المحاولة لاحقًا أو تجربة طبيب آخر.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}