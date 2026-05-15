import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { sendBulkSMS } from "@/lib/sms";
import { msgAppointmentReminder } from "@/lib/sms-messages";
import { addHours } from "date-fns";

// ============================================================
// GET /api/cron/send-reminders
//
// يُشغَّل كل ساعة عبر Vercel Cron
// يرسل SMS تذكير للمرضى الذين موعدهم بعد 23–25 ساعة
//
// في vercel.json:
// { "crons": [{ "path": "/api/cron/send-reminders", "schedule": "0 * * * *" }] }
// ============================================================
export async function GET(request) {
  // حماية الـ endpoint
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const windowStart = addHours(now, 23);
    const windowEnd   = addHours(now, 25);

    // جلب المواعيد القريبة مع بيانات المريض والطبيب
    const appointments = await db.appointment.findMany({
      where: {
        status: "SCHEDULED",
        startTime: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            patientProfile: {
              select: { phone: true },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (appointments.length === 0) {
      return NextResponse.json({ sent: 0, message: "لا توجد مواعيد قريبة" });
    }

    // بناء قائمة الرسائل
    const messages = [];

    for (const appt of appointments) {
      const phone = appt.patient.patientProfile?.phone;
      if (!phone) continue;

      messages.push({
        to: phone,
        text: msgAppointmentReminder({
          patientName: appt.patient.name || "المريض",
          doctorName:  appt.doctor.name  || "الطبيب",
          startTime:   appt.startTime,
        }),
      });
    }

    await sendBulkSMS(messages);

    console.log(`[CRON] ✅ أُرسلت ${messages.length} رسالة من أصل ${appointments.length} موعد`);

    return NextResponse.json({
      success: true,
      total:   appointments.length,
      sent:    messages.length,
      skipped: appointments.length - messages.length,
    });

  } catch (error) {
    console.error("[CRON] ❌ خطأ:", error?.message);
    return NextResponse.json({ error: error?.message || "خطأ غير معروف" }, { status: 500 });
  }
}