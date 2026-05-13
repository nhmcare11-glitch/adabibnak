"use client";

import { useEffect } from "react";
import { getDoctorAppointmentsWithPayments } from "@/actions/payment";
import { AppointmentCard } from "@/components/appointment-card";
import PaymentSuggestion from "@/components/ui/payment-suggestion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import useFetch from "@/hooks/use-fetch";

export default function DoctorAppointmentsList() {
  const {
    loading,
    data,
    fn: fetchAppointments,
  } = useFetch(getDoctorAppointmentsWithPayments);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const appointments = data?.appointments || [];

  return (
    <Card className="border-blue-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-400" />
          المواعيد القادمة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">جارٍ تحميل المواعيد...</p>
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-6">
            {appointments.map((appointment) => (
              <div key={appointment.id}>
                {/* بطاقة الموعد الأصلية */}
                <AppointmentCard
                  appointment={appointment}
                  userRole="DOCTOR"
                  refetchAppointments={fetchAppointments}
                />

                {/* قسم الدفع */}
                <PaymentSuggestion
                  payment={appointment.payment}
                  appointmentId={appointment.id}
                  patientProfile={appointment.patient?.patientProfile}
                  onUpdate={fetchAppointments}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-xl font-medium text-white mb-2">
              لا توجد مواعيد قادمة
            </h3>
            <p className="text-muted-foreground">
              ليس لديك أي مواعيد محددة بعد.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}