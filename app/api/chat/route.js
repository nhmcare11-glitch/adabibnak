import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { mkdir, writeFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { createNotification } from "@/actions/notifications";

// Helper to get current user
async function getCurrentUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    return user;
  } catch (error) {
    console.error("[API Chat] Auth error:", error);
    return null;
  }
}

// GET /api/chat/conversations - Get all conversations
export async function GET(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Get messages for a specific conversation
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          doctor: { select: { id: true, name: true, imageUrl: true, specialty: true } },
          patient: { select: { id: true, name: true, imageUrl: true } },
        },
      });

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      if (conversation.doctorId !== currentUser.id && conversation.patientId !== currentUser.id) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      // Mark messages as read
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

      return NextResponse.json({ 
        messages, 
        conversation, 
        currentUserId: currentUser.id 
      });
    }

    // Get all conversations
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

    return NextResponse.json({ 
      conversations: conversationsWithUnread, 
      currentUserId: currentUser.id 
    });
  } catch (error) {
    console.error("[API Chat] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/chat - Send message or upload file
export async function POST(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    // Handle file upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const files = formData.getAll("files");

      const uploadedFiles = [];
      const uploadDir = join(process.cwd(), "public", "uploads", "chat", currentUser.id);

      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      for (const file of files) {
        if (!(file instanceof File)) continue;

        if (file.size > 25 * 1024 * 1024) {
          return NextResponse.json({ error: `File ${file.name} exceeds 25MB` }, { status: 400 });
        }

        const extension = file.name.split(".").pop() || "bin";
        const filename = `${uuidv4()}.${extension}`;
        const filePath = join(uploadDir, filename);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/chat/${currentUser.id}/${filename}`;

        uploadedFiles.push({
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          url: fileUrl,
          path: filePath,
        });
      }

      return NextResponse.json({ success: true, files: uploadedFiles });
    }

    // Handle message sending
    const body = await request.json();
    const { conversationId, content, files = [] } = body;

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    if (!content?.trim() && (!files || files.length === 0)) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.doctorId !== currentUser.id && conversation.patientId !== currentUser.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const messageData = {
      conversationId,
      senderId: currentUser.id,
      content: content?.trim() || "",
    };

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

    // Create notification
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

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[API Chat] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/chat - Mark messages as read
export async function PATCH(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: currentUser.id },
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API Chat] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}