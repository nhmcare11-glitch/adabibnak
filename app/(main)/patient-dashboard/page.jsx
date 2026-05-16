import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/user";
import { getPatientDashboardData } from "@/actions/patient-dashboard";
import { getActiveVideoCallForPatient } from "@/actions/video-call";
import { PatientDashboardClient } from "./_components/patient-dashboard-client";
import VideoCallNotification from "@/components/VideoCallNotification";

export default async function PatientDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PATIENT") redirect("/onboarding");

  const data = await getPatientDashboardData();
  if (data.error) redirect("/onboarding");

  // ✅ Get active video call
  const videoCallData = await getActiveVideoCallForPatient();
  const activeCall = videoCallData?.success ? videoCallData.appointment : null;

  return (
    <>
      {/* 🔔 Video Call Notification */}
      {activeCall?.id && (
        <VideoCallNotification
          appointmentId={activeCall.id}
          sessionId={activeCall.videoSessionId}
          doctorName={activeCall.doctor?.name || "الطبيب"}
        />
      )}

      <PatientDashboardClient data={data} user={user} />
    </>
  );
}