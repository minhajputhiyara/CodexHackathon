import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSessionToken,
  getUsersCollection,
  normalizeEmail,
  safeUser,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";
import { ensureStarterProject } from "@/lib/projects-db";

type LoginRequest = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginRequest | null;
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { message: "Enter your email and password." },
      { status: 400 },
    );
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ email });

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    return NextResponse.json(
      { message: "The email or password is incorrect." },
      { status: 401 },
    );
  }

  await ensureStarterProject(user._id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user._id.toString()), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ user: safeUser(user) });
}
