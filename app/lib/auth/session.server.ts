import { createSessionStorage, type SessionStorage } from "react-router";

import { createDb, type AppDb } from "../../db/index.server";
import {
  createSessionRecord,
  findActiveSessionRecord,
  findUserById,
  revokeSessionRecord,
  updateSessionExpiry,
} from "../../db/repositories/auth.server";
import type { UserRecord } from "../../db/schema";

const SESSION_COOKIE_NAME = "__es_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEV_FALLBACK_SECRET = "dev-only-session-secret-change-in-production";

export interface SessionData {
  userId: string;
}

export interface SessionEnv {
  DB: D1Database;
  SESSION_SECRET?: string;
}

/** Resolves the cookie signing secret, requiring explicit configuration in production. */
export function resolveSessionSecret(
  env: SessionEnv,
  isDev = import.meta.env.DEV,
): string {
  if (env.SESSION_SECRET && env.SESSION_SECRET.length >= 16) {
    return env.SESSION_SECRET;
  }
  if (isDev) {
    return env.SESSION_SECRET || DEV_FALLBACK_SECRET;
  }
  throw new Error(
    "SESSION_SECRET must be set (at least 16 characters) in production.",
  );
}

/** Creates React Router SessionStorage backed by Drizzle/D1 sessions table. */
export function createAuthSessionStorage(
  db: AppDb,
  secret: string,
  secure: boolean,
): SessionStorage<SessionData> {
  return createSessionStorage<SessionData>({
    cookie: {
      name: SESSION_COOKIE_NAME,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
      secrets: [secret],
      secure,
    },
    async createData(data, expires) {
      if (!data.userId) {
        throw new Error("Cannot create session without userId");
      }
      const id = crypto.randomUUID();
      const now = new Date();
      await createSessionRecord(db, {
        id,
        userId: data.userId,
        expiresAt: expires ?? new Date(now.getTime() + SESSION_TTL_MS),
        createdAt: now,
      });
      return id;
    },
    async readData(id) {
      const record = await findActiveSessionRecord(db, id, new Date());
      if (!record) return null;
      return { userId: record.userId };
    },
    async updateData(id, _data, expires) {
      const nextExpiry = expires ?? new Date(Date.now() + SESSION_TTL_MS);
      await updateSessionExpiry(db, id, nextExpiry);
    },
    async deleteData(id) {
      await revokeSessionRecord(db, id, new Date());
    },
  });
}

function getStorageForRequest(request: Request, env: SessionEnv) {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  const db = createDb(env.DB);
  const secret = resolveSessionSecret(env);
  return {
    db,
    storage: createAuthSessionStorage(db, secret, secure),
  };
}

/** Returns the authenticated user for the incoming request, or null if guest/invalid. */
export async function getCurrentUser(
  request: Request,
  env: SessionEnv,
): Promise<UserRecord | null> {
  const { db, storage } = getStorageForRequest(request, env);
  const session = await storage.getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) return null;

  const user = await findUserById(db, userId);
  if (!user) return null;
  return user;
}

/** Persists a new session in D1 and returns the serialized Set-Cookie header value. */
export async function createUserSessionHeader(
  request: Request,
  env: SessionEnv,
  userId: string,
): Promise<string> {
  const { storage } = getStorageForRequest(request, env);
  const session = await storage.getSession(request.headers.get("Cookie"));
  session.set("userId", userId);
  return storage.commitSession(session);
}

/** Revokes the active D1 session (if any) and returns the clearing Set-Cookie header. */
export async function destroyUserSessionHeader(
  request: Request,
  env: SessionEnv,
): Promise<string> {
  const { storage } = getStorageForRequest(request, env);
  const session = await storage.getSession(request.headers.get("Cookie"));
  return storage.destroySession(session);
}
