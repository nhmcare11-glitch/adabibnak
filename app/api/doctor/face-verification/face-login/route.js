import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      include: {
        faceVerification: true,
      },
    });

    if (!user?.faceVerification) {
      return NextResponse.json(
        {
          success: false,
          message: "No face registered",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      { status: 500 }
    );
  }
}