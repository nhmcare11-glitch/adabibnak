"use client";

// components/ui/ConditionalShell.tsx
// مكون يقرأ الـ URL الحالي ويخفي Header/Footer في صفحات dashboard

import { usePathname } from "next/navigation";
import Header from "@/components/ui/header";
import FooterWrapper from "@/components/ui/footer-wrapper";

// الصفحات التي لا تحتاج Header أو Footer
const SHELL_HIDDEN_PATHS = [
  "/patient-dashboard",
  "/doctor-dashboard",
  "/doctor/doctor-dashboard",
  "/admin",
  "/secretary-dashboard",
  "/chat",
];

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideShell = SHELL_HIDDEN_PATHS.some((path) =>
    pathname?.startsWith(path)
  );

  return (
    <>
      {!hideShell && <Header />}
      <main>{children}</main>
      {!hideShell && <FooterWrapper />}
    </>
  );
}