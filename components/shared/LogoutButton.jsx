"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton({
  className = "",
}) {

  const { signOut } = useClerk();

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {

    try {

      setLoading(true);

      // تسجيل الخروج الكامل من Clerk
      await signOut();

      // إعادة التوجيه للصفحة الرئيسية
      router.replace("/");

      // تنظيف الـ cache والـ session state
      router.refresh();

    } catch (error) {

      console.error("Logout Error:", error);

    } finally {

      setLoading(false);

    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={className}
    >
      <LogOut className="h-4 w-4" />

      <span>
        {loading
          ? "جاري تسجيل الخروج..."
          : "تسجيل الخروج"}
      </span>
    </button>
  );
}