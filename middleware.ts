import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";

import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/doctor-dashboard(.*)",
  "/doctor(.*)",
  "/admin(.*)",
  "/appointments(.*)",
  "/video-call(.*)",
  "/secretary-dashboard(.*)",
  "/verification-manager(.*)",
  "/onboarding(.*)",
  "/doctors(.*)",
  "/dashboard(.*)", // ← أضفنا dashboard للحماية
]);

// ✅ كشف بيئة Capacitor من الـ User-Agent
function isCapacitorRequest(req: Request): boolean {
  const ua = req.headers.get("user-agent") || "";
  const origin = req.headers.get("origin") || "";
  const capacitorHeader = req.headers.get("x-capacitor-platform");

  return (
    ua.includes("Capacitor") ||
    origin.startsWith("capacitor://") ||
    origin.startsWith("http://localhost") && ua.includes("wv") || // Android WebView
    capacitorHeader !== null
  );
}

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth();
  const userId = authObject.userId;
  const isNative = isCapacitorRequest(req);
  const url = req.nextUrl.clone();

  // ✅ إذا موبايل + غير مسجل + محاول يوصل لـ /
  if (isNative && url.pathname === "/" && !userId) {
    url.pathname = "/mobile-login";
    return NextResponse.redirect(url);
  }

  // ✅ إذا موبايل + مسجل + في صفحة login أو splash → وجهه للـ dashboard
  if (isNative && userId && ["/mobile-login", "/splash", "/"].includes(url.pathname)) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (!userId && isProtectedRoute(req)) {
    return authObject.redirectToSignIn({
      returnBackUrl: req.url,
    });
  }

  const response = NextResponse.next();

  // ✅ أضف header باش الـ components تعرف هي في موبايل
  if (isNative) {
    response.headers.set("x-is-native", "true");
  }

  if (isProtectedRoute(req)) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ico|woff2?|ttf|map)).*)",
    "/(api|trpc)(.*)",
  ],
};