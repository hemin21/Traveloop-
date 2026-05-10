import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.JWT_SECRET || "fallback_secret_key_please_change_it_12345";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(user: { id: string; email: string; isAdmin?: boolean }) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ user, expires });

  // Set cookie via server action / endpoint
  cookies().set("traveloop-session", session, { 
    expires, 
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  });
}

export function logout() {
  cookies().set("traveloop-session", "", { expires: new Date(0), path: '/' });
}

export async function getSession() {
  const session = cookies().get("traveloop-session")?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const mongoose = await import("./mongodb");
  await mongoose.default();
  
  const User = (await import("./models/User")).default;
  const userDoc = await User.findById(userId).lean();
  if (!userDoc) return null;

  return {
    id: userDoc._id.toString(),
    firstName: (userDoc as any).firstName,
    lastName: (userDoc as any).lastName,
    imageUrl: (userDoc as any).photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(userDoc as any).email}`,
    emailAddresses: [{ emailAddress: (userDoc as any).email }],
    username: (userDoc as any).email?.split('@')[0]
  };
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("traveloop-session")?.value;
  if (!session) return;

  // Refresh session so it doesn't expire
  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "traveloop-session",
    value: await encrypt(parsed),
    httpOnly: true,
    path: '/',
    expires: parsed.expires,
  });
  return res;
}
