import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/user";
import { getPatientDashboardData } from "@/actions/patient-dashboard";
import { PatientDashboardClient } from "./_components/patient-dashboard-client";

export default async function PatientDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PATIENT") redirect("/onboarding");

  const data = await getPatientDashboardData();
  if (data.error) redirect("/onboarding");

  return <PatientDashboardClient data={data} />;
}