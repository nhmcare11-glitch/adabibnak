import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ drugs: [] });
  }

  const drugs = await db.drug.findMany({
    where: {
      OR: [
        { nameAr: { contains: query, mode: "insensitive" } },
        { nameEn: { contains: query, mode: "insensitive" } },
        { genericName: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      alternatives: { select: { id: true, nameAr: true, nameEn: true } },
      pharmacyDrugs: {
        where: { isAvailable: true },
        include: {
          pharmacy: {
            select: { id: true, name: true, latitude: true, longitude: true, is24Hours: true },
          },
        },
      },
    },
    take: 10,
  });

  return NextResponse.json({ drugs });
}