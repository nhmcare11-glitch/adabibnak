import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {

  try {

    // =========================
    // AUTH
    // =========================
    const { userId } = await auth();

    if (!userId) {

      return NextResponse.redirect(
        new URL("/sign-in", request.url)
      );
    }

    // =========================
    // GET USER
    // =========================
    const dbUser = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!dbUser) {

      return NextResponse.redirect(
        new URL("/onboarding", request.url)
      );
    }

    // =========================
    // UNASSIGNED
    // =========================
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
    // VERIFICATION MANAGER
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

      const verification =
        await db.doctorFaceVerification.findUnique({
          where: {
            doctorId: dbUser.id,
          },
        });

      // أول مرة -> تسجيل الوجه
      if (!verification) {

        return NextResponse.redirect(
          new URL("/doctor/verification", request.url)
        );
      }

      // لم يتم قبول الطبيب بعد
      if (!verification.isVerified) {

        return NextResponse.redirect(
          new URL("/doctor/verification", request.url)
        );
      }

      // دخول عادي للدكتور
      return NextResponse.redirect(
        new URL("/doctor-dashboard", request.url)
      );
    }

    // =========================
    // FALLBACK
    // =========================
    return NextResponse.redirect(
      new URL("/", request.url)
    );

  } catch (error) {

    console.error("AUTH REDIRECT ERROR:", error);

    return NextResponse.redirect(
      new URL("/sign-in", request.url)
    );
  }
}