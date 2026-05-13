import { db } from "@/lib/prisma";
import { createNotification } from "@/actions/notifications";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // تأكد أن الطلب من cron job (secret key)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  
  // تذكير قبل 24 ساعة
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const appointments24h = await db.appointment.findMany({
    where: {
      status: "SCHEDULED",
      startTime: {
        gte: new Date(in24Hours.setHours(0, 0, 0, 0)),
        lt: new Date(in24Hours.setHours(23, 59, 59, 999)),
      },
    },
    include: { patient: true, doctor: true },
  });

  // تذكير قبل 10 دقائق
  const in10Min = new Date(now.getTime() + 10 * 60 * 1000);
  const appointments10min = await db.appointment.findMany({
    where: {
      status: "SCHEDULED",
      startTime: {
        gte: new Date(in10Min.setMinutes(in10Min.getMinutes() - 5)),
        lt: new Date(in10Min.setMinutes(in10Min.getMinutes() + 5)),
      },
    },
    include: { patient: true, doctor: true },
  });

  // إرسال التذكيرات
  for (const apt of appointments24h) {
    await createNotification({
      userId: apt.patient.id,
      type: "APPOINTMENT_REMINDER_24H",
      title: "⏰ تذكير بموعدك غداً",
      message: `لديك موعد مع الدكتور ${apt.doctor.name} غداً الساعة ${new Date(apt.startTime).toLocaleTimeString('ar-DZ')}`,
      link: `/appointments/${apt.id}`,
    });
  }

  for (const apt of appointments10min) {
    await createNotification({
      userId: apt.patient.id,
      type: "APPOINTMENT_REMINDER_10MIN",
      title: "⚠️ تذكير بموعدك بعد 10 دقائق",
      message: `موعدك مع الدكتور ${apt.doctor.name} بعد 10 دقائق`,
      link: `/appointments/${apt.id}`,
    });
    
    await createNotification({
      userId: apt.doctor.id,
      type: "APPOINTMENT_REMINDER_10MIN",
      title: "⚠️ تذكير بموعدك بعد 10 دقائق",
      message: `لديك موعد مع المريض ${apt.patient.name} بعد 10 دقائق`,
      link: `/doctor/appointments/${apt.id}`,
    });
  }

  return NextResponse.json({ 
    success: true, 
    sent24h: appointments24h.length, 
    sent10min: appointments10min.length 
  });
}