import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // ===== الأدوية =====
  const drugs = await Promise.all([
    db.drug.upsert({
      where: { id: "drug_1" },
      update: {},
      create: {
        id: "drug_1",
        nameAr: "باراسيتامول",
        nameEn: "Paracetamol",
        genericName: "Acetaminophen",
        category: "مسكن",
        form: "أقراص",
        strength: "500mg",
      },
    }),
    db.drug.upsert({
      where: { id: "drug_2" },
      update: {},
      create: {
        id: "drug_2",
        nameAr: "إيبوبروفين",
        nameEn: "Ibuprofen",
        genericName: "Ibuprofen",
        category: "مسكن مضاد للالتهاب",
        form: "أقراص",
        strength: "400mg",
      },
    }),
    db.drug.upsert({
      where: { id: "drug_3" },
      update: {},
      create: {
        id: "drug_3",
        nameAr: "أموكسيسيلين",
        nameEn: "Amoxicillin",
        genericName: "Amoxicillin",
        category: "مضاد حيوي",
        form: "كبسول",
        strength: "500mg",
      },
    }),
    db.drug.upsert({
      where: { id: "drug_4" },
      update: {},
      create: {
        id: "drug_4",
        nameAr: "أزيثروميسين",
        nameEn: "Azithromycin",
        genericName: "Azithromycin",
        category: "مضاد حيوي",
        form: "أقراص",
        strength: "500mg",
      },
    }),
    db.drug.upsert({
      where: { id: "drug_5" },
      update: {},
      create: {
        id: "drug_5",
        nameAr: "أوميبرازول",
        nameEn: "Omeprazole",
        genericName: "Omeprazole",
        category: "معدة",
        form: "كبسول",
        strength: "20mg",
      },
    }),
    db.drug.upsert({
      where: { id: "drug_6" },
      update: {},
      create: {
        id: "drug_6",
        nameAr: "ميتفورمين",
        nameEn: "Metformin",
        genericName: "Metformin",
        category: "سكري",
        form: "أقراص",
        strength: "500mg",
      },
    }),
    db.drug.upsert({
      where: { id: "drug_7" },
      update: {},
      create: {
        id: "drug_7",
        nameAr: "أملوديبين",
        nameEn: "Amlodipine",
        genericName: "Amlodipine",
        category: "ضغط الدم",
        form: "أقراص",
        strength: "5mg",
      },
    }),
    db.drug.upsert({
      where: { id: "drug_8" },
      update: {},
      create: {
        id: "drug_8",
        nameAr: "سيتيريزين",
        nameEn: "Cetirizine",
        genericName: "Cetirizine",
        category: "حساسية",
        form: "أقراص",
        strength: "10mg",
      },
    }),
    db.drug.upsert({
      where: { id: "drug_9" },
      update: {},
      create: {
        id: "drug_9",
        nameAr: "ديكلوفيناك",
        nameEn: "Diclofenac",
        genericName: "Diclofenac",
        category: "مسكن مضاد للالتهاب",
        form: "أقراص",
        strength: "50mg",
      },
    }),
    db.drug.upsert({
      where: { id: "drug_10" },
      update: {},
      create: {
        id: "drug_10",
        nameAr: "فيتامين د",
        nameEn: "Vitamin D3",
        genericName: "Cholecalciferol",
        category: "فيتامينات",
        form: "أقراص",
        strength: "1000IU",
      },
    }),
  ]);

  // ===== الصيدليات =====
  const pharmacies = await Promise.all([
    db.pharmacy.upsert({
      where: { id: "ph_1" },
      update: {},
      create: {
        id: "ph_1",
        name: "صيدلية النور",
        address: "شارع العربي بن مهيدي، الجزائر العاصمة",
        phone: "021000001",
        latitude: 36.7538,
        longitude: 3.0588,
        is24Hours: true,
      },
    }),
    db.pharmacy.upsert({
      where: { id: "ph_2" },
      update: {},
      create: {
        id: "ph_2",
        name: "صيدلية الشفاء",
        address: "حي باب الزوار، الجزائر",
        phone: "021000002",
        latitude: 36.7312,
        longitude: 3.1021,
        is24Hours: false,
        openingHours: JSON.stringify({ open: "08:00", close: "22:00" }),
      },
    }),
    db.pharmacy.upsert({
      where: { id: "ph_3" },
      update: {},
      create: {
        id: "ph_3",
        name: "صيدلية الأمل",
        address: "شارع ديدوش مراد، الجزائر",
        phone: "021000003",
        latitude: 36.7612,
        longitude: 3.0445,
        is24Hours: false,
        openingHours: JSON.stringify({ open: "08:00", close: "21:00" }),
      },
    }),
  ]);

  // ===== ربط الأدوية بالصيدليات =====
  await Promise.all([
    // صيدلية النور — كل الأدوية متوفرة
    ...drugs.map((drug) =>
      db.pharmacyDrug.upsert({
        where: { pharmacyId_drugId: { pharmacyId: "ph_1", drugId: drug.id } },
        update: {},
        create: { pharmacyId: "ph_1", drugId: drug.id, isAvailable: true },
      })
    ),
    // صيدلية الشفاء — نصف الأدوية
    ...drugs.slice(0, 5).map((drug) =>
      db.pharmacyDrug.upsert({
        where: { pharmacyId_drugId: { pharmacyId: "ph_2", drugId: drug.id } },
        update: {},
        create: { pharmacyId: "ph_2", drugId: drug.id, isAvailable: true },
      })
    ),
    // صيدلية الأمل — الباقي
    ...drugs.slice(5).map((drug) =>
      db.pharmacyDrug.upsert({
        where: { pharmacyId_drugId: { pharmacyId: "ph_3", drugId: drug.id } },
        update: {},
        create: { pharmacyId: "ph_3", drugId: drug.id, isAvailable: true },
      })
    ),
  ]);

  console.log("✅ تم ملء قاعدة البيانات بنجاح");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());