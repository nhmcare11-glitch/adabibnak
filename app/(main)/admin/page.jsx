import { redirect } from "next/navigation";
import { verifyAdmin } from "@/actions/admin";
import { db } from "@/lib/prisma";
import AdminDashboard from "./components/AdminDashboard";

export const revalidate = 60;

async function getAdminStats() {
  const [
    totalUsers,
    totalDoctors,
    totalPatients,
    pendingDoctorsCount,
    verifiedDoctorsCount,
    rejectedDoctors,
    totalAppointments,
    scheduledAppointments,
    completedAppointments,
    cancelledAppointments,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "DOCTOR" } }),
    db.user.count({ where: { role: "PATIENT" } }),
    db.user.count({ where: { role: "DOCTOR", verificationStatus: "PENDING" } }),
    db.user.count({ where: { role: "DOCTOR", verificationStatus: "VERIFIED" } }),
    db.user.count({ where: { role: "DOCTOR", verificationStatus: "REJECTED" } }),
    db.appointment.count(),
    db.appointment.count({ where: { status: "SCHEDULED" } }),
    db.appointment.count({ where: { status: "COMPLETED" } }),
    db.appointment.count({ where: { status: "CANCELLED" } }),
  ]);

  return {
    totalUsers,
    totalDoctors,
    totalPatients,
    pendingDoctors: pendingDoctorsCount,
    verifiedDoctors: verifiedDoctorsCount,
    rejectedDoctors,
    totalAppointments,
    scheduledAppointments,
    completedAppointments,
    cancelledAppointments,
  };
}

function serializeUser(u) {
  return {
    ...u,
    createdAt: u.createdAt?.toISOString?.() ?? u.createdAt,
    updatedAt: u.updatedAt?.toISOString?.() ?? u.updatedAt,
  };
}

export default async function AdminPage() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect("/");

  const [stats, pendingDoctorsRaw, verifiedDoctorsRaw] = await Promise.all([
    getAdminStats(),
    db.user.findMany({
      where: { role: "DOCTOR", verificationStatus: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      where: { role: "DOCTOR", verificationStatus: "VERIFIED" },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AdminDashboard
      stats={stats}
      pendingDoctors={pendingDoctorsRaw.map(serializeUser)}
      verifiedDoctors={verifiedDoctorsRaw.map(serializeUser)}
    />
  );
}