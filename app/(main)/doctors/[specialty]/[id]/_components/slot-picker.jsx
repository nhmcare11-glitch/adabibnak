"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight, Video, MapPin, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAvailableTimeSlots } from "@/actions/appointments";

const DURATIONS = [15, 30, 45];

export function SlotPicker({ doctorId, days: initialDays, onSelectSlot }) {
  const [days,             setDays]             = useState(initialDays || []);
  const [loading,          setLoading]          = useState(false);
  const [selectedSlot,     setSelectedSlot]     = useState(null);
  const [consultationType, setConsultationType] = useState("REMOTE");
  const [duration,         setDuration]         = useState(30);

  const firstDayWithSlots =
    days.find((d) => d.slots.length > 0)?.date || days[0]?.date;
  const [activeTab, setActiveTab] = useState(firstDayWithSlots);

  // ✅ إعادة جلب الـ slots عند تغيير المدة
  const handleDurationChange = async (d) => {
    setDuration(d);
    setSelectedSlot(null);
    setLoading(true);
    try {
      const result = await getAvailableTimeSlots(doctorId, d);
      setDays(result.days || []);
      // اذهب لأول يوم فيه slots
      const first = result.days?.find((day) => day.slots.length > 0);
      if (first) setActiveTab(first.date);
    } catch (err) {
      console.error("خطأ في جلب المواعيد:", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmSelection = () => {
    if (selectedSlot) {
      onSelectSlot({ ...selectedSlot, consultationType, duration });
    }
  };

  return (
    <div className="space-y-6">

      {/* نوع الاستشارة */}
      <div className="flex gap-3">
        {[
          { value: "REMOTE",    label: "استشارة عن بُعد", icon: Video },
          { value: "IN_PERSON", label: "حضوري",           icon: MapPin },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setConsultationType(value)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
              consultationType === value
                ? "bg-blue-900/30 border-blue-600 text-blue-400"
                : "border-blue-900/20 text-muted-foreground hover:border-blue-700/40"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* مدة الاستشارة */}
      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">المدة:</span>
        {DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => handleDurationChange(d)}
            disabled={loading}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all disabled:opacity-50 ${
              duration === d
                ? "bg-blue-900/30 border-blue-600 text-blue-400"
                : "border-blue-900/20 text-muted-foreground hover:border-blue-700/40"
            }`}
          >
            {d} د
          </button>
        ))}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
      </div>

      {/* الـ slots */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin ml-2" />
          جارٍ تحميل المواعيد...
        </div>
      ) : days.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          لا توجد مواعيد متاحة. يرجى العودة لاحقاً.
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            {days.map((day) => (
              <TabsTrigger
                key={day.date}
                value={day.date}
                disabled={day.slots.length === 0}
                className={day.slots.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
              >
                <div className="flex gap-2">
                  <span className="opacity-80">{format(new Date(day.date), "MMM d")}</span>
                  <span>({format(new Date(day.date), "EEE")})</span>
                </div>
                {day.slots.length > 0 && (
                  <span className="ml-2 bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded">
                    {day.slots.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {days.map((day) => (
            <TabsContent key={day.date} value={day.date} className="pt-4">
              {day.slots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد مواعيد متاحة لهذا اليوم.
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-white mb-2">
                    {day.displayDate}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {day.slots.map((slot) => (
                      <Card
                        key={`${slot.startTime}-${slot.endTime}`}
                        onClick={() => setSelectedSlot(slot)}
                        className={`border-blue-900/20 cursor-pointer transition-all ${
                          selectedSlot?.startTime === slot.startTime
                            ? "bg-blue-900/30 border-blue-600"
                            : "hover:border-blue-700/40"
                        }`}
                      >
                        <CardContent className="p-3 flex flex-col gap-1">
                          <div className="flex items-center">
                            <Clock className={`h-4 w-4 mr-2 ${
                              selectedSlot?.startTime === slot.startTime
                                ? "text-blue-400" : "text-muted-foreground"
                            }`} />
                            <span className={
                              selectedSlot?.startTime === slot.startTime
                                ? "text-white" : "text-muted-foreground"
                            }>
                              {format(new Date(slot.startTime), "h:mm a")}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground pr-6">
                            {duration} د
                          </span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <div className="flex justify-end">
        <Button
          onClick={confirmSelection}
          disabled={!selectedSlot || loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          متابعة
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}