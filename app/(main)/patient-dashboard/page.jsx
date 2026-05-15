import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/user";
import { getPatientDashboardData } from "@/actions/patient-dashboard";
import { getActiveVideoCallForPatient } from "@/actions/video-call";
import { PatientDashboardClient } from "./_components/patient-dashboard-client";
import VideoCallNotification from "@/components/VideoCallNotification";
import { Video } from "lucide-react";
import Link from "next/link";

export default async function PatientDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PATIENT") redirect("/onboarding");

  const data = await getPatientDashboardData();
  if (data.error) redirect("/onboarding");

  // ✅ Get active video call
  const videoCallData = await getActiveVideoCallForPatient();
  const active