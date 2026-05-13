"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function setUserRole(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("غير مسجل الدخول");

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Clerk user غير موجود");

  const role = formData.get("role");
  const validRoles = ["PATIENT", "DOCTOR", "SECRETARY", "ADMIN"];
  if (!validRoles.includes(role)) throw new Error("Role غير صالح");

  let user = await db.user.findUnique({ where: { clerkUserId: userId } });

  if (!user) {
    user = await db.user.create({
      data: {
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@temp.com`,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        imageUrl: clerkUser.imageUrl,
        role: "UNASSIGNED",
      },
    });
  }

  if (user.role !== "UNASSIGNED") {
    return { success: true, role: user.role };
  }

  const client = await clerkClient();

  if (role === "PATIENT") {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "PATIENT" },
    });
    await db.user.update({ where: { clerkUserId: userId }, data: { role: "PATIENT" } });
    revalidatePath("/");
    return { success: true, role: "PATIENT" };
  }

  if (role === "SECRETARY") {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "SECRETARY" },
    });
    await db.user.update({ where: { clerkUserId: userId }, data: { role: "SECRETARY" } });
    revalidatePath("/");
    return { success: true, role: "SECRETARY" };
  }

  if (role === "DOCTOR") {
    const specialty = formData.get("specialty");
    const experience = parseInt(formData.get("experience"));
    const credentialUrl = formData.get("credentialUrl");
    const description = formData.get("description");

    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "DOCTOR" },
    });
    await db.user.update({
      where: { clerkUserId: userId },
      data: { role: "DOCTOR", specialty, experience, credentialUrl, description, verificationStatus: "PENDING" },
    });
    revalidatePath("/");
    return { success: true, role: "DOCTOR" };
  }

  throw new Error("Role غير معروف");
}