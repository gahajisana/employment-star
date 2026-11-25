import type { AppDb } from "../../db/index.server";
import {
  countRecentChallenges,
  createOtpChallenge,
  deleteOtpChallenge,
  findLatestActiveChallenge,
  incrementChallengeAttempts,
  invalidateActiveChallenges,
  markChallengeConsumed,
  upsertUserByEmail,
} from "../../db/repositories/auth.server";
import type { UserRecord } from "../../db/schema";
import { DEFAULT_LANG, isLang, type Lang } from "../../i18n";
import { renderOtpEmail, type EmailProvider } from "../email/index.server";
import {
  API_ERROR_CODES,
  apiError,
  apiOk,
  type ApiErrorCode,
  type ApiResult,
} from "../http/api-result";
import {
  generateNumericOtp,
  hashOtpCode,
  verifyOtpHash,
} from "./crypto.server";

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_RATE_WINDOW_MS = 15 * 60 * 1000;
export const OTP_MAX_SENDS_PER_WINDOW = 5;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;
const MAX_EMAIL_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RequestOtpResult = ApiResult<
  { cooldownSeconds: number },
  400 | 429 | 502,
  ApiErrorCode,
  { retryAfterSeconds?: number }
>;

export type VerifyOtpResult = ApiResult<
  { user: UserRecord },
  400 | 429,
  ApiErrorCode
>;

export interface OtpServiceDeps {
  db: AppDb;
  emailProvider: EmailProvider;
  otpSecret: string;
  now?: () => Date;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return (
    email.length > 0 &&
    email.length <= MAX_EMAIL_LENGTH &&
    EMAIL_PATTERN.test(email)
  );
}

function normalizeLang(raw: string | undefined): Lang {
  return isLang(raw) ? raw : DEFAULT_LANG;
}

/** Issues a 6-digit email OTP, enforces cooldown/rate limits, and sends via EmailProvider. */
export async function requestEmailOtp(
  deps: OtpServiceDeps,
  input: { email: string; lang?: string },
): Promise<RequestOtpResult> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    return apiError(400, API_ERROR_CODES.INVALID_EMAIL);
  }

  const now = (deps.now ?? (() => new Date()))();
  const latest = await findLatestActiveChallenge(deps.db, "email", email);

  if (latest) {
    const elapsedMs = now.getTime() - latest.createdAt.getTime();
    if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000,
      );
      return apiError(429, API_ERROR_CODES.RATE_LIMITED, {
        retryAfterSeconds,
      });
    }
  }

  const windowStart = new Date(now.getTime() - OTP_RATE_WINDOW_MS);
  const recentCount = await countRecentChallenges(
    deps.db,
    "email",
    email,
    windowStart,
  );
  if (recentCount >= OTP_MAX_SENDS_PER_WINDOW) {
    return apiError(429, API_ERROR_CODES.RATE_LIMITED);
  }

  await invalidateActiveChallenges(deps.db, "email", email, now);

  const challengeId = crypto.randomUUID();
  const code = generateNumericOtp(OTP_LENGTH);
  const codeHash = await hashOtpCode(deps.otpSecret, challengeId, code);
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await createOtpChallenge(deps.db, {
    id: challengeId,
    channel: "email",
    target: email,
    codeHash,
    maxAttempts: OTP_MAX_VERIFY_ATTEMPTS,
    expiresAt,
    createdAt: now,
  });

  const lang = normalizeLang(input.lang);
  const rendered = renderOtpEmail({
    lang,
    code,
    expiresMinutes: Math.floor(OTP_TTL_MS / 60_000),
  });

  try {
    await deps.emailProvider.send({
      to: { email },
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
  } catch {
    await deleteOtpChallenge(deps.db, challengeId);
    return apiError(502, API_ERROR_CODES.EMAIL_SEND_FAILED);
  }

  return apiOk({
    cooldownSeconds: Math.floor(OTP_RESEND_COOLDOWN_MS / 1000),
  });
}

/** Verifies a 6-digit email OTP, enforces brute-force protection, and upserts the user. */
export async function verifyEmailOtp(
  deps: Pick<OtpServiceDeps, "db" | "otpSecret" | "now">,
  input: { email: string; code: string; lang?: string },
): Promise<VerifyOtpResult> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    return apiError(400, API_ERROR_CODES.INVALID_EMAIL);
  }

  const code = input.code.trim();
  if (!/^\d{6}$/.test(code)) {
    return apiError(400, API_ERROR_CODES.INVALID_CODE);
  }

  const now = (deps.now ?? (() => new Date()))();
  const challenge = await findLatestActiveChallenge(deps.db, "email", email);

  if (!challenge) {
    return apiError(400, API_ERROR_CODES.OTP_INVALID);
  }

  if (challenge.expiresAt.getTime() <= now.getTime()) {
    await markChallengeConsumed(deps.db, challenge.id, now);
    return apiError(400, API_ERROR_CODES.OTP_EXPIRED);
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    return apiError(429, API_ERROR_CODES.OTP_TOO_MANY_ATTEMPTS);
  }

  const matches = await verifyOtpHash(
    deps.otpSecret,
    challenge.id,
    code,
    challenge.codeHash,
  );

  if (!matches) {
    const nextAttempts = challenge.attempts + 1;
    await incrementChallengeAttempts(deps.db, challenge.id, nextAttempts);
    if (nextAttempts >= challenge.maxAttempts) {
      await markChallengeConsumed(deps.db, challenge.id, now);
      return apiError(429, API_ERROR_CODES.OTP_TOO_MANY_ATTEMPTS);
    }
    return apiError(400, API_ERROR_CODES.OTP_INVALID);
  }

  const consumed = await markChallengeConsumed(deps.db, challenge.id, now);
  if (!consumed) {
    return apiError(400, API_ERROR_CODES.OTP_INVALID);
  }

  const lang = normalizeLang(input.lang);
  const user = await upsertUserByEmail(deps.db, email, lang, now);
  return apiOk({ user });
}
