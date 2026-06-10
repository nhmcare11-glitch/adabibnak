import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const drugId = searchParams.get("drugId");

  // جلب الصيدليات مع حالة الدواء المطلوب
  const pharmacies = await db.pharmacy.findMany({
    include: {
      drugs: drugId
        ? { where: { drugId }, select: { isAvailable: true, drugId: true } }
        : false,
    },
  });

  // ترتيب حسب المسافة (Haversine formula)
  const sorted = pharmacies
    .map((p) => ({
      ...p,
      distance: getDistance(lat, lng, p.latitude, p.longitude),
      drugStatus: drugId
        ? p.drugs[0]?.isAvailable === true
          ? "available"
          : p.drugs[0]
          ? "unavailable"
          : "unknown"
        : null,
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  return NextResponse.json({ pharmacies: sorted });
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}