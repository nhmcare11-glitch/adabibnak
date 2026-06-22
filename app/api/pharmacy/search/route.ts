import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");

  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const drugs = await db.drug.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { nameAr: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      pharmacyDrugs: {
        include: { pharmacy: true },
      },
    },
  });

  // احسب المسافة بين المريض والصيدلية
  const results = drugs.map((drug) => ({
    id: drug.id,
    name: drug.name,
    nameAr: drug.nameAr,
    category: drug.category,
    requiresPrescription: drug.requiresPrescription,
    pharmacies: drug.pharmacyDrugs
      .map((pd) => ({
        id: pd.pharmacy.id,
        name: pd.pharmacy.name,
        nameAr: pd.pharmacy.nameAr,
        address: pd.pharmacy.address,
        city: pd.pharmacy.city,
        phone: pd.pharmacy.phone,
        isOpen24h: pd.pharmacy.isOpen24h,
        inStock: pd.inStock,
        price: pd.price,
        distance: lat && lng
          ? calcDistance(lat, lng, pd.pharmacy.latitude, pd.pharmacy.longitude)
          : null,
      }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)),
  }));

  return NextResponse.json(results);
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}