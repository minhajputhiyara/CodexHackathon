import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import {
  createSessionToken,
  getUsersCollection,
  hashPassword,
  normalizeEmail,
  safeUser,
  SESSION_COOKIE,
  type UserDocument,
} from "@/lib/auth";
import { ensureStarterProject } from "@/lib/projects-db";

type SignupRequest = {
  email?: string;
  name?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SignupRequest | null;
  const email = normalizeEmail(body?.email ?? "");
  const name = body?.name?.trim() ?? "";
  const password = body?.password ?? "";

  if (!name || !email || password.length < 6) {
    return NextResponse.json(
      { message: "Enter a name, email, and password with at least 6 characters." },
      { status: 400 },
    );
  }

  const users = await getUsersCollection();
  const existingUser = await users.findOne({ email });

  if (existingUser) {
    return NextResponse.json(
      { message: "An account already exists for this email." },
      { status: 409 },
    );
  }

  const { hash, salt } = hashPassword(password);
  const now = new Date();
  const user: UserDocument = {
    _id: new ObjectId(),
    createdAt: now,
    email,
    name,
    passwordHash: hash,
    salt,
  };

  await users.insertOne(user);
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
