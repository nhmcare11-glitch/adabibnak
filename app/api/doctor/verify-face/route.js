
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function POST(req) {
  try {

    // =========================
    // AUTH
    // =========================

    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // =========================
    // BODY
    // =========================

    const body = await req.json();

    const { descriptor } = body;

    if (!descriptor) {
      return NextResponse.json(
        {
          success: false,
          error: "No descriptor",
        },
        { status: 400 }
      );
    }

    // =========================
    // USER
    // =========================

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // =========================
    // SAVE FACE
    // =========================

    await db.doctorFaceVerification.upsert({
      where: {
        doctorId: user.id,
      },
      update: {
        faceEmbedding: descriptor,
        isVerified: true,
        enrolledAt: new Date(),
        failedAttempts: 0,
      },
      create: {
        doctorId: user.id,
        faceEmbedding: descriptor,
        isVerified: true,
        enrolledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Face registered successfully",
    });

  } catch (error) {

    console.log("VERIFY FACE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}



