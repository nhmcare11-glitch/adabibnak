import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(
        new URL("/sign-in", request.url)
      );
    }

    // جلب المستخدم من Prisma
    const dbUser = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      include: {
        faceVerification: true,
      },
    });

    // المستخدم غير موجود داخل DB
    if (!dbUser) {
      return NextResponse.redirect(
        new URL("/onboarding", request.url)
      );
    }

    // المستخدم جديد ولم يختر role
    if (dbUser.role === "UNASSIGNED") {
      return NextResponse.redirect(
        new URL("/onboarding", request.url)
      );
    }

    // =========================
    // PATIENT
    // =========================
    if (dbUser.role === "PATIENT") {
      return NextResponse.redirect(
        new URL("/patient-dashboard", request.url)
      );
    }

    // =========================
    // SECRETARY
    // =========================
    if (dbUser.role === "SECRETARY") {
      return NextResponse.redirect(
        new URL("/secretary-dashboard", request.url)
      );
    }

    // =========================
    // ADMIN
    // =========================
    if (dbUser.role === "ADMIN") {
      return NextResponse.redirect(
        new URL("/admin", request.url)
      );
    }

    // =========================
    // VERIFICATION_MANAGER  ← جديد
    // =========================
    if (dbUser.role === "VERIFICATION_MANAGER") {
      return NextResponse.redirect(
        new URL("/verification-manager", request.url)
      );
    }

    // =========================
    // DOCTOR
    // =========================
    if (dbUser.role === "DOCTOR") {

      // إذا لم يوثق الوجه
      if (!dbUser.faceVerification?.isVerified) {
        return NextResponse.redirect(
          new URL("/doctor/verification", request.url)
        );
      }

      // إذا موثق
      return NextResponse.redirect(
        new URL("/doctor-dashboard", request.url)
      );
    }

    // fallback
    return NextResponse.redirect(
      new URL("/onboarding", request.url)
    );

  } catch (error) {
    console.error("AUTH_REDIRECT_ERROR:", error);

    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }
}