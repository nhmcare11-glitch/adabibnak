import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileUrl, fileType } = await req.json();
    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl مطلوب" }, { status: 400 });
    }

    type ContentBlock =
      | { type: "image"; source: { type: "url"; url: string } }
      | { type: "text"; text: string };

    const userContent: ContentBlock[] = [];

    // PDF غير مدعوم كـ URL مباشر في Claude — نعامله كصورة
    userContent.push({
      type: "image",
      source: { type: "url", url: fileUrl },
    });

    userContent.push({
      type: "text",
      text: `أنت مساعد طبي. استخرج أسماء الأدوية من هذه الوصفة.
أجب فقط بـ JSON بدون أي نص خارجه:
{
  "drugs": [
    { "name": "اسم الدواء", "dosage": "الجرعة أو null", "frequency": "عدد المرات أو null" }
  ],
  "doctorName": "اسم الطبيب أو null",
  "date": "التاريخ أو null",
  "notes": "ملاحظات أو null"
}`,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: userContent }],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const clean = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const extracted = JSON.parse(clean) as {
      drugs: { name: string; dosage: string | null; frequency: string | null }[];
      doctorName: string | null;
      date: string | null;
      notes: string | null;
    };

    // مطابقة الأدوية في قاعدة البيانات
    const drugNames = extracted.drugs.map((d) => d.name);

    const matchedDrugs = await db.drug.findMany({
      where: {
        OR: drugNames.flatMap((name) => [
          { nameAr: { contains: name, mode: "insensitive" } },
          { nameEn: { contains: name, mode: "insensitive" } },
          { genericName: { contains: name, mode: "insensitive" } },
        ]),
      },
      include: {
        pharmacyDrugs: {
          where: { isAvailable: true },
          include: { pharmacy: true },
          take: 3,
        },
      },
    });

    // تسجيل الوصفة
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (user) {
      await db.prescription.create({
        data: {
          patientId: user.id,
          fileUrl,
          fileType,
          extractedDrugs: JSON.stringify(extracted),
          medications: extracted.drugs,
          status: "pending",
        },
      });
    }

    return NextResponse.json({
      success: true,
      drugs: matchedDrugs,
      extracted,
    });

  } catch (error) {
    console.error("[prescription/route] error:", error);
    return NextResponse.json(
      { error: "فشل تحليل الوصفة، حاول مرة أخرى" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const prescriptions = await db.prescription.findMany({
      where: {
        patientId: user.id,
        fileUrl: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        fileUrl: true,
        extractedDrugs: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error("[prescription GET] error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}