"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import { v4 as uuidv4 } from "uuid";
import { mkdir, writeFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// ==================== رفع الملفات (محلي) ====================
export async function uploadFile(formData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const currentUser = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!currentUser) throw new Error("User not found");

    const files = formData.getAll("files");
    const uploadedFiles = [];

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    // مجلد التخزين المحلي
    const uploadDir = join(process.cwd(), "public", "uploads", "chat", currentUser.id);

    // أنشئ المجلد إذا لم يكن موجوداً
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      if (!(file instanceof File)) continue;

      if (file.size > 25 * 1024 * 1024) {
        throw new Error(`File ${file.name} exceeds 25MB limit`);
      }

      const extension = file.name.split(".").pop() || "bin";
      const filename = `${uuidv4()}.${extension}`;
      const filePath = join(uploadDir, filename);

      // احفظ الملف محلياً
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // URL للوصول للملف
      const fileUrl = `/uploads/chat/${currentUser.id}/${filename}`;

      uploadedFiles.push({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        url: fileUrl,
        path: filePath,
      });
    }

    return { success: true, files: uploadedFiles };
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

// ==================== المحادثات ====================
export async function getOrCreateConversation(doctorId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const currentUser = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!currentUser) throw new Error("User not found");

  const patientId = currentUser.role === "PATIENT" ? currentUser.id : doctorId;
  const resolvedDoctorId = currentUser.role === "DOCTOR" ? currentUser.id : doctorId;

  let conversation = await db.conversation.findUnique({
    where: {
      doctorId_patientId: {
        doctorId: resolvedDoctorId,
        patientId: patientId,
      },
    },
    include: {
      doctor: { select: { id: true, name: true, imageUrl: true, specialty: true } },
      patient: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        doctorId: resolvedDoctorId,
        patientId: patientId,
      },
      include: {
        doctor: { select: { id: true, name: true, imageUrl: true, specialty: true } },
        patient: { select: { id: true, name: true, imageUrl: true } },
      },
    });
  }

  return { conversation };
}

// ==================== إرسال الرسائل ====================
export async function sendMessage(conversationId, content, files = []) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!content?.trim() && (!files || files.length === 0)) throw new Error("Message cannot be empty");

  const currentUser = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!currentUser) throw new Error("User not found");

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) throw new Error("Conversation not found");

  if (conversation.doctorId !== currentUser.id && conversation.patientId !== currentUser.id) {
    throw new Error("Not authorized to send messages in this conversation");
  }

  const messageData = {
    conversationId,
    senderId: currentUser.id,
    content: content?.trim() || "",
  };

  // Ensure files is properly formatted for Prisma JSON
  if (files && files.length > 0) {
    messageData.files = files.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size,
      url: f.url,
    }));
  }

  const message = await db.message.create({
    data: messageData,
    include: {
      sender: { select: { id: true, name: true, imageUrl: true, role: true } },
    },
  });

  await db.conversation.update({
    where: { id: conversationId },
    data: {
      updatedAt: new Date(),
      lastMessage: content?.trim() || (files.length > 0 ? "📎 ملف مرفق" : ""),
    },
  });

  const receiverId = conversation.doctorId === currentUser.id ? conversation.patientId : conversation.doctorId;
  const notificationType = currentUser.role === "PATIENT" ? "NEW_MESSAGE_FROM_PATIENT" : "NEW_MESSAGE_FROM_DOCTOR";
  const notificationTitle = currentUser.role === "PATIENT" ? "💬 رسالة جديدة من مريض" : "💬 رد من الطبيب";
  const notificationMessage = files.length > 0 
    ? `${currentUser.name} : أرسل مرفق (${files.length} ملف)`
    : `${currentUser.name} : ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`;

  await createNotification({
    userId: receiverId,
    type: notificationType,
    title: notificationTitle,
    message: notificationMessage,
    link: `/chat/${conversationId}`,
    metadata: { conversationId, messageId: message.id, hasFiles: files.length > 0 },
  });

  revalidatePath(`/chat/${conversationId}`);
  revalidatePath("/chat");

  return { message };
}

// ==================== جلب الرسائل ====================
export async function getMessages(conversationId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const currentUser = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!currentUser) throw new Error("User not found");

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      doctor: { select: { id: true, name: true, imageUrl: true, specialty: true } },
      patient: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  if (!conversation) throw new Error("Conversation not found");

  if (conversation.doctorId !== currentUser.id && conversation.patientId !== currentUser.id) {
    throw new Error("Not authorized to view this conversation");
  }

  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: currentUser.id },
      read: false,
    },
    data: { read: true },
  });

  const messages = await db.message.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, name: true, imageUrl: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return { messages, conversation, currentUserId: currentUser.id };
}

// ==================== جلب كل المحادثات ====================
export async function getMyConversations() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const currentUser = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!currentUser) throw new Error("User not found");

  const where = currentUser.role === "DOCTOR" 
    ? { doctorId: currentUser.id } 
    : { patientId: currentUser.id };

  const conversations = await db.conversation.findMany({
    where,
    include: {
      doctor: { select: { id: true, name: true, imageUrl: true, specialty: true } },
      patient: { select: { id: true, name: true, imageUrl: true } },
      messages: { 
        orderBy: { createdAt: "desc" }, 
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          files: true,
          senderId: true,
          read: true,
        }
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await db.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: currentUser.id },
          read: false,
        },
      });

      const lastMsg = conv.messages[0];

      return {
        ...conv,
        unreadCount,
        lastMessage: lastMsg?.content || null,
        lastMessageTime: lastMsg?.createdAt || conv.updatedAt,
        lastMessageHasFiles: lastMsg?.files && Array.isArray(lastMsg.files) && lastMsg.files.length > 0,
      };
    })
  );

  return { conversations: conversationsWithUnread, currentUserId: currentUser.id };
}

// ==================== تحديد الرسائل كمقروءة ====================
export async function markMessagesAsRead(conversationId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const currentUser = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!currentUser) throw new Error("User not found");

  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: currentUser.id },
      read: false,
    },
    data: { read: true },
  });

  revalidatePath(`/chat/${conversationId}`);
  return { success: true };
}

// ==================== حذف رسالة (محلي) ====================
export async function deleteMessage(messageId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const currentUser = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!currentUser) throw new Error("User not found");

  const message = await db.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message) throw new Error("Message not found");
  if (message.senderId !== currentUser.id) throw new Error("Not authorized to delete this message");

  // حذف الملفات المحلية
  if (message.files && Array.isArray(message.files) && message.files.length > 0) {
    for (const file of message.files) {
      if (file.path && existsSync(file.path)) {
        try {
          await unlink(file.path);
        } catch (err) {
          console.error("Failed to delete local file:", err);
        }
      }
    }
  }

  await db.message.delete({ where: { id: messageId } });
  revalidatePath(`/chat/${message.conversationId}`);
  return { success: true };
}

// ==================== عدد الرسائل غير المقروءة ====================
export async function getUnreadCount() {
  const { userId } = await auth();
  if (!userId) return { count: 0 };

  const currentUser = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!currentUser) return { count: 0 };

  const where = currentUser.role === "DOCTOR" 
    ? { doctorId: currentUser.id } 
    : { patientId: currentUser.id };

  const conversations = await db.conversation.findMany({
    where,
    select: { id: true },
  });

  const conversationIds = conversations.map(c => c.id);

  if (conversationIds.length === 0) return { count: 0 };

  const unreadCount = await db.message.count({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: currentUser.id },
      read: false,
    },
  });

  return { count: unreadCount };
}

// ==================== البحث عن الأطباء ====================
export async function searchDoctors(searchTerm) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  const doctors = await db.user.findMany({
    where: {
      role: "DOCTOR",
      verificationStatus: "VERIFIED",
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { specialty: { contains: searchTerm, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      specialty: true,
      imageUrl: true,
    },
    take: 10,
  });

  return doctors;
}