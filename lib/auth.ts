import { createHmac, randomBytes, timingSafeEqual, pbkdf2Sync } from "crypto";
import { cookies } from "next/headers";
import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";

export const SESSION_COOKIE = "designplate_session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type UserDocument = {
  _id: ObjectId;
  createdAt: Date;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
};

export type SafeUser = {
  id: string;
  email: string;
  name: string;
};

function getAuthSecret() {
  return process.env.AUTH_SECRET ?? process.env.MONGODB_URI ?? "designplate-dev";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const candidate = hashPassword(password, salt).hash;
  return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}

export function safeUser(user: UserDocument): SafeUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
  };
}

function signValue(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function createSessionToken(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${signValue(payload)}`;
}

export function readSessionToken(token?: string) {
  if (!token) {
    return null;
  }

  const [userId, expiresAt, signature] = token.split(".");
  if (!userId || !expiresAt || !signature) {
    return null;
  }

  const payload = `${userId}.${expiresAt}`;
  const expected = signValue(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  if (Number(expiresAt) < Math.floor(Date.now() / 1000)) {
    return null;
  }

  if (!ObjectId.isValid(userId)) {
    return null;
  }

  return userId;
}

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDb();
  const users = db.collection<UserDocument>("users");
  await users.createIndex({ email: 1 }, { unique: true });
  return users;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!userId) {
    return null;
  }

  const users = await getUsersCollection();
  return users.findOne({ _id: new ObjectId(userId) });
}
