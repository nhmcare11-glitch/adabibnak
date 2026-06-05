"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getPatientDashboardData() {
  const { userId } = await auth();
  if (!userId) return { error: "غير مصرح" };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      role: true,
      patientProfile: true,
    },
  });

  if (!user || user.role !== "PATIENT") return { error: "غير مصرح" };

  const now = new Date();

  const appointments = await db.appointment.findMany({
    where: { patientId: user.id },
    include: {
      doctor: {
        select: { id: true, name: true, specialty: true, imageUrl: true },
      },
      prescription: {
        select: {
          id: true,
          diagnosis: true,
          medications: true,
          instructions: true,
          followUpDate: true,
          createdAt: true,
          doctor: { select: { name: true, specialty: true } },
        },
      },
      payment: {
        include: {
          approvedBy: { select: { name: true, role: true } },
        },
      },
    },
    orderBy: { startTime: "desc" },
  });

  const upcoming = appointments.filter(
    (a) => a.status === "SCHEDULED" && new Date(a.startTime) >= now
  );
  const past = appointments.filter(
    (a) => a.status === "COMPLETED" || new Date(a.startTime) < now
  );
  const prescriptions = appointments
    .filter((a) => a.prescription)
    .map((a) => ({ ...a.prescription, appointmentDate: a.startTime }));

  const doctorsMap = {};
  appointments.forEach((a) => {
    if (a.doctor && !doctorsMap[a.doctor.id]) {
      doctorsMap[a.doctor.id] = a.doctor;
    }
  });
  const doctors = Object.values(doctorsMap);

  // ── جلب المحادثات مع الأطباء ──────────────────────────────────────────────
  const rawConversations = await db.conversation.findMany({
    where: { patientId: user.id },
    include: {
      doctor: { select: { id: true, name: true, imageUrl: true, specialty: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, createdAt: true, read: true, senderId: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const conversations = await Promise.all(
    rawConversations.map(async (conv) => {
      const unreadCount = await db.message.count({
        where: { conversationId: conv.id, senderId: { not: user.id }, read: false },
      });
      const lastMsg = conv.messages[0];
      return {
        id: conv.id,
        doctorId: conv.doctor?.id,
        doctorName: conv.doctor?.name,
        doctorImage: conv.doctor?.imageUrl,
        doctorSpecialty: conv.doctor?.specialty,
        lastMessage: lastMsg?.content || null,
        lastMessageTime: lastMsg?.createdAt || conv.updatedAt,
        unreadCount,
      };
    })
  );

  return {
    user,
    stats: {
      total: appointments.length,
      upcoming: upcoming.length,
      completed: past.length,
      prescriptions: prescriptions.length,
    },
    upcoming,
    past,
    prescriptions,
    doctors,
    conversations,
  };
}

export async function updatePatientProfile({ name, phone, city, latitude, longitude }) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "غير مصرح" };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "PATIENT") return { error: "غير مصرح" };

    // تحديث اسم المستخدم في جدول User
    await db.user.update({
      where: { id: user.id },
      data: { name: name?.trim() || undefined },
    });

    // تحديث أو إنشاء PatientProfile
    await db.patientProfile.upsert({
      where: { userId: user.id },
      update: {
        phone:     phone?.trim()  || null,
        city:      city?.trim()   || null,
        latitude:  latitude       ?? null,
        longitude: longitude      ?? null,
      },
      create: {
        userId:    user.id,
        phone:     phone?.trim()  || null,
        city:      city?.trim()   || null,
        latitude:  latitude       ?? null,
        longitude: longitude      ?? null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("updatePatientProfile error:", error);
    return { error: "حدث خطأ أثناء الحفظ، حاول مجدداً" };
  }
}