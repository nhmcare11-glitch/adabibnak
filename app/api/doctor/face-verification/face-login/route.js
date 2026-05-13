import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST() {
  try {
    const verification =
      await db.doctorFaceVerification.findFirst({
        where: {
          isVerified: true,
        },
      });

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          message: "No registered face found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      descriptor:
        verification.faceEmbedding?.descriptor,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}