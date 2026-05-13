import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        role: null,
      });
    }

    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({
        role: null,
      });
    }

    // ====================================
    // البحث عن المستخدم
    // ====================================

    let user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    // ====================================
    // إنشاء المستخدم تلقائياً إذا غير موجود
    // ====================================

    if (!user) {
      user = await db.user.create({
        data: {
          clerkUserId: userId,

          email:
            clerkUser.emailAddresses[0]?.emailAddress ||
            `${userId}@temp.com`,

          name:
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),

          imageUrl: clerkUser.imageUrl,

          role: "UNASSIGNED",
        },
      });
    }

    return NextResponse.json({
      role: user.role,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        role: null,
        error: "server error",
      },
      {
        status: 500,
      }
    );
  }
}