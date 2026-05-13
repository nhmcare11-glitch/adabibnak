import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();

    const { image } = body;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          message: "Image missing",
        },
        { status: 400 }
      );
    }

    const doctor = await db.doctorFaceVerification.findFirst({
      where: {
        isVerified: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          message: "No registered doctor",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      doctorId: doctor.doctorId,
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