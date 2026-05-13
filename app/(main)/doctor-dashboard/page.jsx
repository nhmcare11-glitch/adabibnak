import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
// ✅ الإصلاح الرئيسي: استيراد من availability.js (تأخذ clerkUserId)
// وليس من doctor.js (التي تأخذ لا شيء وتستخدم auth داخلياً)
import { getDoctorAvailability } from "@/actions/availability";
import DoctorDashboardClient from "./_components/doctor-dashboard-client";

export default async function DoctorDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // جلب بيانات الطبيب
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user || user.role !== "DOCTOR") redirect("/");
  const verification = await db.doctorFaceVerification.findUnique({
  where: {
    doctorId: user.id,
  },
});

if (!verification?.isVerified) {
  redirect("/doctor/verification");
}

  // جلب المواعيد مع بيانات المريض والدفع
  const appointments = await db.appointment.findMany({
    where: { doctorId: user.id },
    include: {
      patient: {
        include: { patientProfile: true },
      },
      prescription: true,
      payment:      true,
    },
    orderBy: { startTime: "desc" },
  });

  // ✅ استخدام getDoctorAvailability الصحيحة من availability.js
  // تأخذ clerkUserId وتبحث عن الطبيب بنفسها
  const availabilitySlots = await getDoctorAvailability(userId);

  // جلب الإشعارات غير المقروءة للطبيب
  const notifications = await db.notification.findMany({
    where: {
      userId:  user.id,
      isRead:  false,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // جلب المحادثات
  const conversations = await db.conversation.findMany({
    where: { doctorId: user.id },
    include: {
      patient:  { select: { id: true, name: true, imageUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <DoctorDashboardClient
      user={user}
      appointments={JSON.parse(JSON.stringify(appointments))}
      availabilitySlots={JSON.parse(JSON.stringify(availabilitySlots))}
      conversations={JSON.parse(JSON.stringify(conversations))}
      notifications={JSON.parse(JSON.stringify(notifications))}
    />
  );
}
