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

  // ============================================================
  // TOTAL SLOTS
  // ============================================================
  const totalSlots = availableDays?.reduce(
    (total, day) => total + day.slots.length,
    0
  );

  // ============================================================
  // STATUS (clean logic)
  // ============================================================
  const now = new Date();

  const hasUpcoming = false; // نقدر نطورو لاحقاً إذا أضفت appointments
  const hasSlots = totalSlots > 0;

  let status = "offline";

  if (hasSlots) {
    status = "online";
  }

  // ============================================================
  // HANDLERS
  // ============================================================
  const toggleBooking = () => {
    setShowBooking(!showBooking);

    if (!showBooking) {
      setTimeout(() => {
        document
          .getElementById("booking-section")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookingComplete = () => {
    router.push("/patient-dashboard");
  };

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* LEFT */}
      <div className="md:col-span-1">
        <div className="md:sticky md:top-24">
          <Card className="border-blue-900/20">
            <CardContent className="pt-6">

              <div className="flex flex-col items-center text-center">

                {/* IMAGE */}
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

                {/* NAME */}
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Dr. {doctor.name}
                </h2>

                {/* STATUS (ONE ONLY - FIXED) */}
                <div className="flex items-center gap-2 mb-3">

                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      status === "online"
                        ? "bg-green-500"
                        : status === "busy"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    } animate-pulse`}
                  />

                  <span className="text-sm text-muted-foreground">
                    {status === "online"
                      ? "🟢 Online"
                      : status === "busy"
                      ? "🔴 Busy"
                      : "🟡 Offline"}
                  </span>

                </div>

                {/* SPECIALTY */}
                <Badge
                  variant="outline"
                  className="bg-blue-900/20 border-blue-900/30 text-blue-400 mb-4"
                >
                  {doctor.specialty}
                </Badge>

                {/* EXPERIENCE */}
                <div className="flex items-center justify-center mb-2">
                  <Medal className="h-4 w-4 text-blue-400 mr-2" />
                  <span className="text-muted-foreground">
                    {doctor.experience} years experience
                  </span>
                </div>

                {/* BUTTON */}
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

      {/* RIGHT */}
      <div className="md:col-span-2 space-y-6">

        <Card className="border-blue-900/20">
          <CardHeader>
            <CardTitle>
              حول Dr. {doctor.name}
            </CardTitle>
            <CardDescription>
              الخلفية المهنية والخبرة
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* DESCRIPTION */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <h3>الوصف</h3>
              </div>
              <p className="text-muted-foreground whitespace-pre-line">
                {doctor.description}
              </p>
            </div>

            <Separator />

            {/* AVAILABILITY */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <h3>التوفر</h3>
              </div>

              {hasSlots ? (
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-400 mr-2" />
                  <p className="text-muted-foreground">
                    {totalSlots} فترة متاحة للحجز
                  </p>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    لا توجد مواعيد متاحة حالياً
                  </AlertDescription>
                </Alert>
              )}
            </div>

          </CardContent>
        </Card>

        {/* BOOKING */}
        {showBooking && (
          <div id="booking-section">

            <Card className="border-blue-900/20">
              <CardHeader>
                <CardTitle>حجز موعد</CardTitle>
                <CardDescription>
                  اختر الوقت المناسب
                </CardDescription>
              </CardHeader>

              <CardContent>

                {hasSlots ? (
                  <>
                    {!selectedSlot && (
                      <SlotPicker
                        days={availableDays}
                        onSelectSlot={handleSlotSelect}
                      />
                    )}

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
                  <p className="text-muted-foreground">
                    لا توجد مواعيد متاحة
                  </p>
                )}

              </CardContent>

            </Card>

          </div>
        )}

      </div>
    </div>
  );
}