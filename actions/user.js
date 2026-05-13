"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function getCurrentUser() {
  try {
    const { userId } = await auth();

    if (!userId) return null;

    // البحث عن المستخدم
    let dbUser = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    // =========================
    // AUTO CREATE USER
    // =========================
    if (!dbUser) {

      const clerk = await clerkClient();

      const clerkUser = await clerk.users.getUser(userId);

      dbUser = await db.user.create({
        data: {
          clerkUserId: userId,
          email:
            clerkUser.emailAddresses?.[0]
              ?.emailAddress || "",

          name:
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),

          imageUrl: clerkUser.imageUrl,

          role: "UNASSIGNED",
        },
      });
    }

    return dbUser;

  } catch (error) {
    console.error("GET_CURRENT_USER_ERROR", error);

    return null;
  }
}