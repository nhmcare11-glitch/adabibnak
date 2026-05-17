"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * إنشاء إشعار جديد
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link = null,
  metadata = null,
}) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        metadata,
      },
    });
    return { success: true, notification };
  } catch (error) {
    console.error("فشل إنشاء الإشعار:", error);
    return { success: false, error: error.message };
  }
}

/**
 * جلب إشعارات المستخدم الحالي
 */
export async function getMyNotifications(limit = 20) {
  const { userId } = await auth();
  if (!userId) return { notifications: [], unreadCount: 0 };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return { notifications: [], unreadCount: 0 };

    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await db.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return { notifications, unreadCount };
  } catch (error) {
    console.error("فشل جلب الإشعارات:", error);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * تحديد إشعار كمقروء
 */
export async function markNotificationAsRead(notificationId) {
  const { userId } = await auth();
  if (!userId) return { success: false };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return { success: false };

    await db.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id,
      },
      data: { isRead: true },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("فشل تحديد الإشعار كمقروء:", error);
    return { success: false };
  }
}

/**
 * تحديد كل الإشعارات كمقروءة
 */
export async function markAllNotificationsAsRead() {
  const { userId } = await auth();
  if (!userId) return { success: false };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return { success: false };

    await db.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("فشل تحديد كل الإشعارات كمقروءة:", error);
    return { success: false };
  }
}

/**
 * حذف إشعار
 */
export async function deleteNotification(notificationId) {
  const { userId } = await auth();
  if (!userId) return { success: false };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return { success: false };

    await db.notification.deleteMany({
      where: {
        id: notificationId,
        userId: user.id,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("فشل حذف الإشعار:", error);
    return { success: false };
  }
}