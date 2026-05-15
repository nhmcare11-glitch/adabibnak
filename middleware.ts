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
]);

export default clerkMiddleware(async (auth, req) => {

  const { userId } = await auth();

  // المستخدم غير مسجل ويحاول دخول Route محمي
  if (!userId && isProtectedRoute(req)) {

    const { redirectToSignIn } = await auth();

    return redirectToSignIn({
      returnBackUrl: req.url,
    });
  }

  const response = NextResponse.next();

  // منع تخزين صفحات الداشبورد والكاش
  if (isProtectedRoute(req)) {

    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    response.headers.set(
      "Pragma",
      "no-cache"
    );

    response.headers.set(
      "Expires",
      "0"
    );
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ico|woff2?|ttf|map)).*)",
    "/(api|trpc)(.*)",
  ],
};