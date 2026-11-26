import { and, count, desc, eq, gte, isNull } from "drizzle-orm";

import type { AppDb } from "../index.server";
import {
  otpChallenges,
  sessions,
  users,
  type OtpChallengeRecord,
  type SessionRecord,
  type UserRecord,
} from "../schema";

export interface CreateOtpChallengeInput {
  id: string;
  channel: "email";
  target: string;
  codeHash: string;
  maxAttempts: number;
  expiresAt: Date;
  createdAt: Date;
}

/** Returns the most recent unconsumed OTP challenge for a channel and target. */
export async function findLatestActiveChallenge(
  db: AppDb,
  channel: "email",
  target: string,
): Promise<OtpChallengeRecord | null> {
  const [row] = await db
    .select()
    .from(otpChallenges)
    .where(
      and(
        eq(otpChallenges.channel, channel),
        eq(otpChallenges.target, target),
        isNull(otpChallenges.consumedAt),
      ),
    )
    .orderBy(desc(otpChallenges.createdAt))
    .limit(1);

  return row ?? null;
}

/** Counts OTP challenges issued for a target since the given timestamp. */
export async function countRecentChallenges(
  db: AppDb,
  channel: "email",
  target: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(otpChallenges)
    .where(
      and(
        eq(otpChallenges.channel, channel),
        eq(otpChallenges.target, target),
        gte(otpChallenges.createdAt, since),
      ),
    );

  return Number(row?.value ?? 0);
}

/** Inserts a new OTP challenge record. */
export async function createOtpChallenge(
  db: AppDb,
  input: CreateOtpChallengeInput,
): Promise<void> {
  await db.insert(otpChallenges).values({
    id: input.id,
    channel: input.channel,
    target: input.target,
    codeHash: input.codeHash,
    attempts: 0,
    maxAttempts: input.maxAttempts,
    expiresAt: input.expiresAt,
    consumedAt: null,
    createdAt: input.createdAt,
  });
}

/** Marks all unconsumed OTP challenges for a target as consumed/invalidated. */
export async function invalidateActiveChallenges(
  db: AppDb,
  channel: "email",
  target: string,
  now: Date,
): Promise<void> {
  await db
    .update(otpChallenges)
    .set({ consumedAt: now })
    .where(
      and(
        eq(otpChallenges.channel, channel),
        eq(otpChallenges.target, target),
        isNull(otpChallenges.consumedAt),
      ),
    );
}

/** Marks a single OTP challenge as consumed if not already consumed. */
export async function markChallengeConsumed(
  db: AppDb,
  id: string,
  now: Date,
): Promise<boolean> {
  const updated = await db
    .update(otpChallenges)
    .set({ consumedAt: now })
    .where(and(eq(otpChallenges.id, id), isNull(otpChallenges.consumedAt)))
    .returning({ id: otpChallenges.id });

  return updated.length > 0;
}

/** Deletes an OTP challenge by ID (used to roll back failed email sends). */
export async function deleteOtpChallenge(db: AppDb, id: string): Promise<void> {
  await db.delete(otpChallenges).where(eq(otpChallenges.id, id));
}

/** Increments failed verification attempts on an OTP challenge. */
export async function incrementChallengeAttempts(
  db: AppDb,
  id: string,
  nextAttempts: number,
): Promise<void> {
  await db
    .update(otpChallenges)
    .set({ attempts: nextAttempts })
    .where(eq(otpChallenges.id, id));
}

/** Finds or creates a verified user for the given normalized email address. */
export async function upsertUserByEmail(
  db: AppDb,
  email: string,
  preferredLang: string,
  now: Date,
): Promise<UserRecord> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        emailVerifiedAt: existing.emailVerifiedAt ?? now,
        preferredLang,
        updatedAt: now,
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      email,
      phone: null,
      emailVerifiedAt: now,
      preferredLang,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created;
}

/** Finds a user by ID. */
export async function findUserById(
  db: AppDb,
  userId: string,
): Promise<UserRecord | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

/** Persists a new session row in D1. */
export async function createSessionRecord(
  db: AppDb,
  input: { id: string; userId: string; expiresAt: Date; createdAt: Date },
): Promise<void> {
  await db.insert(sessions).values({
    id: input.id,
    userId: input.userId,
    expiresAt: input.expiresAt,
    createdAt: input.createdAt,
    revokedAt: null,
  });
}

/** Reads an active (non-revoked, non-expired) session row by ID. */
export async function findActiveSessionRecord(
  db: AppDb,
  id: string,
  now: Date,
): Promise<SessionRecord | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, id),
        isNull(sessions.revokedAt),
        gte(sessions.expiresAt, now),
      ),
    )
    .limit(1);

  return session ?? null;
}

/** Extends a session expiration timestamp. */
export async function updateSessionExpiry(
  db: AppDb,
  id: string,
  expiresAt: Date,
): Promise<void> {
  await db
    .update(sessions)
    .set({ expiresAt })
    .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)));
}

/** Revokes a session so its cookie is immediately invalid server-side. */
export async function revokeSessionRecord(
  db: AppDb,
  id: string,
  now: Date,
): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: now })
    .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)));
}
