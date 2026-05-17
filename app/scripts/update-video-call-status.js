const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating videoCallStatus for existing appointments...");

  const result = await prisma.appointment.updateMany({
    where: { videoCallStatus: null },
    data: { videoCallStatus: 'WAITING' },
  });

  console.log(`✅ Updated ${result.count} appointments to WAITING`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });