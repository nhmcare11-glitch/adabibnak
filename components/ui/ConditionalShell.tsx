
"use client";

import { usePathname } from "next/navigation";
import { usePlatform } from "@/hooks/usePlatform";

import Header from "@/components/ui/header";
import FooterWrapper from "@/components/ui/footer-wrapper";
import MobileBottomNav from "@/components/ui/MobileBottomNav"; // سننشئه خطوة 7

const SHELL_HIDDEN_PATHS = [
  "/patient-dashboard",
  "/doctor-dashboard",
  "/doctor/doctor-dashboard",
  "/admin",
  "/secretary-dashboard",
  "/chat",
  "/doctor/face-login",
  "/doctor/verification",
  // ✅ أضفنا صفحات الموبايل
  "/dashboard",
  "/mobile-login",
  "/splash",
];

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isNative, isLoading } = usePlatform();

  const hideShell = SHELL_HIDDEN_PATHS.some((path) =>
    pathname?.startsWith(path)
  );

  // ✅ أثناء كشف البيئة — لا نحرك شيء
  if (isLoading) {
    return <main>{children}</main>;
  }

  // ✅ بيئة موبايل
  if (isNative) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>
        {/* Bottom Nav يظهر فقط في صفحات معينة */}
        {!hideShell && <MobileBottomNav />}
      </div>
    );
  }

  // ✅ بيئة الويب — نفس منطقك القديم بالضبط
  return (
    <>
      {!hideShell && <Header />}
      <main>{children}</main>
      {!hideShell && <FooterWrapper />}
    </>
  );
}