

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/user";
import { getPatientDashboardData } from "@/actions/patient-dashboard";
import { getActiveVideoCallForPatient } from "@/actions/video-call";
import { PatientDashboardClient } from "./_components/patient-dashboard-client";
import VideoCallNotification from "@/components/VideoCallNotification";
export const dynamic = "force-dynamic";

export default async function PatientDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PATIENT") redirect("/onboarding");

  const data = await getPatientDashboardData();
  if (data.error) redirect("/onboarding");

  // ✅ نجيب الموعد النشط (24 ساعة قادمة)
  const videoCallData = await getActiveVideoCallForPatient();
  const activeCall = videoCallData?.success ? videoCallData.appointment : null;

  // ✅ fallback: أقرب موعد قادم من الداشبورد
  const upcomingAppointment = activeCall || data.upcoming?.[0] || null;

  return (
    <>
      {/* 🔔 إشعار المكالمة — يظهر دائماً إذا كان هناك موعد */}
      {upcomingAppointment?.id && (
        <VideoCallNotification
          appointmentId={upcomingAppointment.id}
          sessionId={upcomingAppointment.videoSessionId}
          doctorName={upcomingAppointment.doctor?.name || "الطبيب"}
        />
      )}

      <PatientDashboardClient data={data} />
    </>
  );
}