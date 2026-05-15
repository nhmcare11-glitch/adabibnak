"use client";



import { usePathname } from "next/navigation";
import Header from "@/components/ui/header";
import FooterWrapper from "@/components/ui/footer-wrapper";


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