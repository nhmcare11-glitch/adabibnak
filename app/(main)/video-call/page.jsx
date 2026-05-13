import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import VideoCallLayout from "./VideoCallLayout";

export default async function VideoCallPage({ searchParams }) {
  const { appointmentId, sessionId: directSessionId } = await searchParams;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  let appointment = null;

  // الحالة 1: جاء appointmentId في الـ URL (الداشبورد الجديدة)
  if (appointmentId) {
    appointment = await db.appointment.findFirst({
      where: { id: appointmentId },
      include: {
        patient: {
          include: { patientProfile: true },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            imageUrl: true,
            experience: true,
            description: true,
          },
        },
        prescription: true,
      },
    });

    // إذا لم يكن للموعد sessionId، أنشئ واحداً وخزّنه
    if (appointment && !appointment.videoSessionId) {
      const newSessionId = `session-${appointmentId}-${Date.now()}`;
      appointment = await db.appointment.update({
        where: { id: appointmentId },
        data: { videoSessionId: newSessionId },
        include: {
          patient: {
            include: { patientProfile: true },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialty: true,
              imageUrl: true,
              experience: true,
              description: true,
            },
          },
          prescription: true,
        },
      });
    }
  }

  // الحالة 2: جاء sessionId مباشرة في الـ URL (الطريقة القديمة)
  else if (directSessionId) {
    appointment = await db.appointment.findFirst({
      where: { videoSessionId: directSessionId },
      include: {
        patient: {
          include: { patientProfile: true },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            imageUrl: true,
            experience: true,
            description: true,
          },
        },
        prescription: true,
      },
    });
  }

  const sessionId = appointment?.videoSessionId || directSessionId;

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <p className="text-xl">❌ لا يوجد Session ID</p>
        <p className="text-slate-400 text-sm">
          appointmentId: {appointmentId || "غير موجود"}
        </p>
        <a href="/doctor-dashboard" className="text-blue-400 underline">
          العودة للداشبورد
        </a>
      </div>
    );
  }

  return (
    <VideoCallLayout
      sessionId={sessionId}
      appointment={appointment}
      currentUserId={userId}
    />
  );
}