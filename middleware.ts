import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "fallback_secret_key_please_change_it_12345";
const key = new TextEncoder().encode(secretKey);

const PUBLIC_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/api/auth/login",
  "/api/auth/register",
  "/api/seed",
  "/api/health",
];

async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload;
  } catch (err) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Standard asset paths to bypass immediately
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/static") || 
    pathname.includes(".") || 
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Check if route is explicitly public
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  
  const session = req.cookies.get("traveloop-session")?.value;

  // If they are trying to reach public pages, let them pass (or redirect them AWAY from login if logged in)
  if (isPublic) {
    if ((pathname === "/sign-in" || pathname === "/sign-up") && session) {
      // Verify session before redirecting away
      const verified = await verifySession(session);
      if (verified) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    return NextResponse.next();
  }

  // Protected Route
  if (!session) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Actually verify JWT authenticity
  const verifiedToken = await verifySession(session);
  if (!verifiedToken) {
    const response = NextResponse.redirect(new URL("/sign-in", req.url));
    response.cookies.delete("traveloop-session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico).*)",
    "/",
    "/api/((?!auth|seed|health).*)"
  ],
};
