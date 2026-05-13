"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { addDays, startOfWeek, setHours, setMinutes, format } from "date-fns";

const DAY_INDEX = {
  MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 0,
};

// ============================================================
// getDoctorAvailability — للـ doctor-dashboard
// تأخذ clerkUserId وترجع slots الطبيب
// ============================================================
export async function getDoctorAvailability(clerkUserId) {
  try {
    const doctor = await db.user.findUnique({ where: { clerkUserId } });
    if (!doctor) return [];

    const slots = await db.availability.findMany({
      where: {
        doctorId:  doctor.id,
        status:    { in: ["AVAILABLE", "BOOKED", "BLOCKED"] },
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: "asc" },
      take: 100,
    });

    return slots;
  } catch (error) {
    console.error("Error fetching doctor availability:", error);
    throw new Error("Failed to fetch availability slots");
  }
}

// ============================================================
// getDoctorAvailabilityForAdmin — للأدمن
// ============================================================
export async function getDoctorAvailabilityForAdmin(doctorId) {
  try {
    const availability = await db.availability.findMany({
      where: {
        doctorId,
        status:    { in: ["AVAILABLE", "BOOKED", "BLOCKED"] },
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: "asc" },
      take: 200,
    });

    return availability;
  } catch (error) {
    console.error("Error fetching doctor availability:", error);
    return [];
  }
}

// ============================================================
// setDoctorAvailabilityByAdmin — الدالة الموحّدة
// mode = "DATES": slotsOrDates = [{ date, startTime, endTime }]
// mode = "DAYS":  slotsOrDates = [{ day, isAvailable, startTime, endTime }]
// ============================================================
export async function setDoctorAvailabilityByAdmin(doctorId, slotsOrDates, mode = "DAYS") {
  let result;

  if (mode === "DATES") {
    result = await _setByRealDates(doctorId, slotsOrDates);
  } else {
    result = await _setByWeekdays(doctorId, slotsOrDates);
  }

  if (result?.success) {
    // ✅ revalidate كل الصفحات المتأثرة
    revalidatePath("/doctor-dashboard");
    revalidatePath("/doctors");
    revalidatePath(`/doctors`);

    // ✅ إرسال إشعار للطبيب
    try {
      await _notifyDoctor(doctorId, result.createdSlots ?? 0, slotsOrDates, mode);
    } catch (e) {
      console.error("Notification error (non-fatal):", e);
    }
  }

  return result;
}

// ─── إشعار الطبيب ─────────────────────────────────────────
async function _notifyDoctor(doctorId, count, slotsOrDates, mode) {
  if (count === 0) return;

  // نبني رسالة مناسبة
  let dateInfo = "";
  if (mode === "DATES" && slotsOrDates?.length > 0) {
    const first = slotsOrDates[0];
    const last  = slotsOrDates[slotsOrDates.length - 1];
    dateInfo = first.date === last.date
      ? `ليوم ${first.date} من ${first.startTime} إلى ${first.endTime}`
      : `من ${first.date} إلى ${last.date}`;
  }

  await db.notification.create({
    data: {
      userId:  doctorId,
      type:    "AVAILABILITY_UPDATED",
      title:   "📅 تم تحديث جدولك",
      message: `أضاف الأدمن ${count} موعد توافر جديد ${dateInfo}. تحقق من جدولك.`,
      link:    "/doctor-dashboard",
      metadata: { count, mode },
    },
  });
}

// ─── الطريقة الجديدة: تواريخ حقيقية ──────────────────────
async function _setByRealDates(doctorId, datesToCreate) {
  try {
    if (!datesToCreate?.length)
      return { success: true, createdSlots: 0 };

    const slotsToCreate = [];

    for (const item of datesToCreate) {
      const { date, startTime, endTime } = item;

      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const [year, month, day] = date.split("-").map(Number);

      const start = new Date(year, month - 1, day, sh, sm, 0, 0);
      const end   = new Date(year, month - 1, day, eh, em, 0, 0);

      if (end <= new Date()) continue;
      if (end <= start) continue;

      // تحقق من عدم التكرار
      const existing = await db.availability.findFirst({
        where: {
          doctorId,
          startTime: start,
          status: { in: ["AVAILABLE", "BLOCKED"] },
        },
      });

      if (!existing) {
        slotsToCreate.push({ doctorId, startTime: start, endTime: end, status: "AVAILABLE" });
      }
    }

    if (slotsToCreate.length > 0) {
      await db.availability.createMany({ data: slotsToCreate });
    }

    return { success: true, createdSlots: slotsToCreate.length };
  } catch (error) {
    console.error("Error setting availability by dates:", error);
    return { success: false, error: error.message };
  }
}

// ─── الطريقة القديمة: أيام الأسبوع ────────────────────────
async function _setByWeekdays(doctorId, slots) {
  try {
    await db.availability.deleteMany({
      where: { doctorId, status: { in: ["AVAILABLE", "BLOCKED"] } },
    });

    const availableSlots = slots.filter((s) => s.isAvailable);
    if (!availableSlots.length) return { success: true, createdSlots: 0 };

    const slotsToCreate = [];
    const today = new Date();

    for (let week = 0; week < 4; week++) {
      for (const slot of availableSlots) {
        const targetDayIndex = DAY_INDEX[slot.day];
        const weekStart      = startOfWeek(addDays(today, week * 7), { weekStartsOn: 0 });
        const targetDate     = addDays(weekStart, targetDayIndex);

        if (targetDate < today) continue;

        const [sh, sm] = slot.startTime.split(":").map(Number);
        const [eh, em] = slot.endTime.split(":").map(Number);

        const startTime = setMinutes(setHours(new Date(targetDate), sh), sm);
        const endTime   = setMinutes(setHours(new Date(targetDate), eh), em);

        if (endTime <= startTime) continue;

        slotsToCreate.push({ doctorId, startTime, endTime, status: "AVAILABLE" });
      }
    }

    if (slotsToCreate.length > 0) {
      await db.availability.createMany({ data: slotsToCreate });
    }

    return { success: true, createdSlots: slotsToCreate.length };
  } catch (error) {
    console.error("Error setting availability by weekdays:", error);
    return { success: false, error: error.message };
  }
}
