
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/prisma";

import DoctorDashboardClient from "./_components/doctor-dashboard-client";

import FaceProtection from "@/components/doctor/FaceProtection";

export default async function DoctorDashboardPage(props) {

  // =========================
  // AUTH
  // =========================
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // =========================
  // GET USER
  // =========================
  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  // =========================
  // ONLY DOCTOR
  // =========================
  if (user.role !== "DOCTOR") {
    redirect("/");
  }

  // =========================
  // FACE VERIFICATION CHECK
  // =========================
  const verification =
    await db.doctorFaceVerification.findUnique({
      where: {
        doctorId: user.id,
      },
    });

  // الطبيب لم يسجل وجهه بعد
  if (!verification) {
    redirect("/doctor/verification");
  }

  // الطبيب غير مقبول بعد
  if (!verification.isVerified) {
    redirect("/doctor/verification");
  }

  // =========================
  // DASHBOARD
  // =========================
  return (
    <>
      <FaceProtection />

      <DoctorDashboardClient
        {...props}
      />
    </>
  );
}
