import type { AuthType } from "worker-mailer";

import { ConsoleEmailProvider } from "./console-email.server";
import { SmtpEmailProvider } from "./smtp.server";
import {
  EmailDeliveryError,
  type EmailAddress,
  type EmailProvider,
} from "./types.server";

export interface EmailEnv {
  EMAIL_PROVIDER?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_AUTH_TYPE?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
}

const VALID_AUTH_TYPES: ReadonlySet<AuthType> = new Set([
  "plain",
  "login",
  "cram-md5",
]);

function parseAuthType(value: string | undefined): AuthType {
  if (value && VALID_AUTH_TYPES.has(value as AuthType)) {
    return value as AuthType;
  }
  return "plain";
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 587);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new EmailDeliveryError(
      "smtp",
      `Invalid SMTP_PORT value: "${value ?? ""}"`,
    );
  }
  return port;
}

/** Resolves the configured EmailProvider from Worker environment variables/secrets. */
export function createEmailProvider(
  env: EmailEnv,
  options: { isDev?: boolean } = {},
): EmailProvider {
  const isDev = options.isDev ?? import.meta.env.DEV;
  const defaultFrom: EmailAddress = {
    email: env.EMAIL_FROM || "noreply@example.com",
    name: env.EMAIL_FROM_NAME || "Employment Star",
  };

  const configured = env.EMAIL_PROVIDER?.toLowerCase();

  if (configured === "console") {
    return new ConsoleEmailProvider(defaultFrom);
  }

  if (isDev && (!env.SMTP_USER || !env.SMTP_PASS)) {
    return new ConsoleEmailProvider(defaultFrom);
  }

  if (configured && configured !== "smtp") {
    throw new EmailDeliveryError(
      configured,
      `Unsupported EMAIL_PROVIDER: "${configured}"`,
    );
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.EMAIL_FROM) {
    throw new EmailDeliveryError(
      "smtp",
      "Missing required SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM)",
    );
  }

  const secure = env.SMTP_SECURE === "true";
  const port = parsePort(env.SMTP_PORT);

  return new SmtpEmailProvider({
    host: env.SMTP_HOST,
    port,
    secure,
    startTls: !secure,
    username: env.SMTP_USER,
    password: env.SMTP_PASS,
    authType: parseAuthType(env.SMTP_AUTH_TYPE),
    defaultFrom,
  });
}

export * from "./types.server";
export * from "./templates.server";
