import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PharmacyPage } from "@/components/pharmacy/PharmacyPage";

export const metadata = {
  title: "الصيدلية | أدبيبناك",
  description: "ابحث عن دواءك أو ارفع وصفتك للعثور على أقرب صيدلية",
};

export default async function Page() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <PharmacyPage />;
}