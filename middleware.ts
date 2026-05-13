import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// تعريف المسارات حسب الصلاحية
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isDoctorRoute = createRouteMatcher(["/doctor(.*)", "/video-call(.*)"]);
const isSecretaryRoute = createRouteMatcher(["/secretary-dashboard(.*)"]);
const isPatientRoute = createRouteMatcher(["/appointments(.*)", "/doctors(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role as string | undefined;

  // غير مسجّل دخول → أعد توجيهه لتسجيل الدخول
  if (!userId) {
    if (
      isAdminRoute(req) ||
      isDoctorRoute(req) ||
      isSecretaryRoute(req) ||
      isPatientRoute(req) ||
      isOnboardingRoute(req)
    ) {
      const { redirectToSignIn } = await auth();
      return redirectToSignIn();
    }
    return NextResponse.next();
  }

  // مسجّل دخول لكن بدون role → أرسله للـ onboarding
  if (!role && !isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // التحقق من الصلاحية حسب المسار
  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isDoctorRoute(req) && role !== "doctor") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isSecretaryRoute(req) && role !== "secretary") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};