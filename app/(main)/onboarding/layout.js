import { getCurrentUser } from "@/actions/user";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Onboarding - Adabibanek",
  description: "Complete your profile to get started with Adabibanek",
};

export default async function OnboardingLayout({ children }) {
  // Get complete user profile
  const user = await getCurrentUser();

  // Redirect users who have already completed onboarding
  if (user) {
   if (user.role === "PATIENT") {
  redirect("/patient-dashboard");
    } else if (user.role === "DOCTOR") {
  redirect("/doctor-dashboard");
   
    } else if (user.role === "ADMIN") {
      redirect("/admin");
    }
  }

  return (
    <div className="container mx-auto px-4 py-30 bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            مرحبا بكم في وجهتكم الاولى للاستشارة الطبية عن بعد
          </h1>
          <p className="text-muted-foreground text-lg">
           اخبرنا كيف تريد تستخدم هذه المنصة
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
