import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ─── POST: استخراج الأدوية من وصفة مرفوعة ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // PrescriptionUpload يرسل: { fileUrl, fileType }
    const { fileUrl, fileType } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl مطلوب" }, { status: 400 });
    }

    // ── بناء محتوى الرسالة حسب نوع الملف ──────────────────────────────────
    type ContentBlock =
      | { type: "image"; source: { type: "url"; url: string } }
      | { type: "document"; source: { type: "url"; url: string; media_type: "application/pdf" } }
      | { type: "text"; text: string };

    const userContent: ContentBlock[] = [];

    if (fileType === "pdf") {
      userContent.push({
        type: "document",
        source: { type: "url", url: fileUrl, media_type: "application/pdf" },
      });
    } else {
      // image (jpeg, png, webp …)
      userContent.push({
        type: "image",
        source: { type: "url", url: fileUrl },
      });
    }

    userContent.push({
      type: "text",
      text: `أنت مساعد طبي متخصص. حلل هذه الوصفة الطبية واستخرج قائمة الأدوية بدقة.

أجب فقط بـ JSON بهذا الشكل الصارم، بدون أي نص أو markdown خارجه:
{
  "drugs": [
    {
      "name": "اسم الدواء باللاتينية أو العربية",
      "dosage": "الجرعة إن وُجدت وإلا null",
      "frequency": "عدد مرات التناول إن وُجد وإلا null"
    }
  ],
  "doctorName": "اسم الطبيب إن ظهر وإلا null",
  "date": "تاريخ الوصفة إن ظهر وإلا null",
  "notes": "أي ملاحظات إضافية مهمة أو null"
}`,
    });

    // ── استدعاء Claude ──────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: userContent }],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    // تنظيف أي backticks قد تأتي رغم التعليمات
    const clean = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const extracted = JSON.parse(clean) as {
      drugs: { name: string; dosage: string | null; frequency: string | null }[];
      doctorName: string | null;
      date: string | null;
      notes: string | null;
    };

    // ── مطابقة الأدوية في قاعدة البيانات ──────────────────────────────────
    const drugNames = extracted.drugs.map((d) => d.name);

    const matchedDrugs = await db.drug.findMany({
      where: {
        OR: drugNames.flatMap((name) => [
          { name: { contains: name, mode: "insensitive" } },
          { nameAr: { contains: name, mode: "insensitive" } },
        ]),
      },
      include: {
        pharmacyDrugs: {
          where: { inStock: true },
          include: { pharmacy: true },
          take: 3,
        },
      },
    });

    // ── تسجيل الوصفة للمريض (اختياري — لا نربطها بموعد) ──────────────────
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (user) {
      await db.prescription.create({
        data: {
          // appointmentId مطلوب في الـ schema الحالي بـ @unique
          // نولّد قيمة مؤقتة حتى تُعدَّل الـ schema لاحقاً لجعله اختيارياً
          patientId: user.id,
doctorId: user.id,
          medications: extracted.drugs,
          uploadedImageUrl: fileUrl,
          extractedDrugs: extracted,
          status: "PROCESSED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      drugs: matchedDrugs,          // ← هذا ما يستخدمه PrescriptionUpload → onExtracted
      extracted,                     // ← تفاصيل إضافية للعرض
    });
  } catch (error) {
    console.error("[prescription/route] error:", error);
    return NextResponse.json(
      { error: "فشل تحليل الوصفة، حاول مرة أخرى" },
      { status: 500 }
    );
  }
}

// ─── GET: آخر وصفات المريض ─────────────────────────────────────────────────
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
        uploadedImageUrl: { not: null }, // وصفات الصيدلية فقط
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        uploadedImageUrl: true,
        extractedDrugs: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error("[prescription/route GET] error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}