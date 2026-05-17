"use client";

import { Stethoscope } from "lucide-react";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/page-header";

export default function DoctorDashboardLayout({ children }) {
  const pathname = usePathname();
  
  const hideHeader = pathname?.includes("/face-login") || pathname?.includes("/verification");

  return (
    <div className={hideHeader ? "" : "container mx-auto px-4 py-8"}>
      {!hideHeader && <PageHeader icon={<Stethoscope />} title="Doctor Dashboard" />}
      {children}
    </div>
  );
}
