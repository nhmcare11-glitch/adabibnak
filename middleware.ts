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

  const authObject = await auth();
  const userId = authObject.userId;

  if (!userId && isProtectedRoute(req)) {

    return authObject.redirectToSignIn({
      returnBackUrl: req.url,
    });
  }

  const response = NextResponse.next();

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