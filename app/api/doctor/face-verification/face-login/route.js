
import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/prisma";

// =========================
// DISTANCE FUNCTION
// =========================
function euclideanDistance(a, b) {

  return Math.sqrt(

    a.reduce((sum, val, i) => {

      return sum +
        Math.pow(val - b[i], 2);

    }, 0)
  );
}

export async function POST(req) {

  try {

    // =========================
    // AUTH
    // =========================
    const session = await auth();

    const userId = session.userId;

    if (!userId) {

      return NextResponse.json(
        {
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
          error: "No face descriptor",
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
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // =========================
    // FACE DATA
    // =========================
    const verification =
      await db.doctorFaceVerification.findUnique({
        where: {
          doctorId: user.id,
        },
      });

    if (
      !verification ||
      !verification.faceEmbedding
    ) {

      return NextResponse.json(
        {
          error:
            "No registered face found",
        },
        { status: 404 }
      );
    }

    // =========================
    // COMPARE FACES
    // =========================
    const savedDescriptor =
      verification.faceEmbedding;

    const distance =
      euclideanDistance(
        descriptor,
        savedDescriptor
      );

    console.log(
      "FACE DISTANCE:",
      distance
    );

    // threshold صارم
    const MATCH_THRESHOLD = 0.45;

    const isMatch =
      distance < MATCH_THRESHOLD;

    // =========================
    // FAILED
    // =========================
    if (!isMatch) {

      await db.doctorFaceVerification.update({
        where: {
          doctorId: user.id,
        },

        data: {
          failedAttempts: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(
        {
          error:
            "Face does not match",
        },
        { status: 401 }
      );
    }

    // =========================
    // SUCCESS
    // =========================
    await db.doctorFaceVerification.update({
      where: {
        doctorId: user.id,
      },

      data: {
        failedAttempts: 0,
      },
    });

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.error(
      "FACE LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Server error",
      },
      { status: 500 }
    );
  }
}

