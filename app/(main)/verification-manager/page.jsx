import { redirect } from "next/navigation";
import { verifyVerificationManager, getVerificationStats, getPendingDoctorsVM, getVerifiedDoctorsVM, getRejectedDoctorsVM } from "@/actions/verification-manager";
import VerificationManagerDashboard from "./components/VerificationManagerDashboard";

export const revalidate = 60;

export default async function VerificationManagerPage() {
  const isAllowed = await verifyVerificationManager();
  console.log("isAllowed:", isAllowed); // ← زيدي هذا
  if (!isAllowed) redirect("/");

  const [stats, pendingDoctors, verifiedDoctors, rejectedDoctors] = await Promise.all([
    getVerificationStats(),
    getPendingDoctorsVM(),
    getVerifiedDoctorsVM(),
    getRejectedDoctorsVM(),
  ]);

  return (
    <VerificationManagerDashboard
      stats={stats}
      pendingDoctors={pendingDoctors}
      verifiedDoctors={verifiedDoctors}
      rejectedDoctors={rejectedDoctors}
    />
  );
}