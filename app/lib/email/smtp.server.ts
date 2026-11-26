import type {
  AuthType,
  EmailOptions,
  WorkerMailerOptions,
} from "worker-mailer";

import {
  EmailDeliveryError,
  type EmailAddress,
  type EmailProvider,
  type EmailSendResult,
  type OutboundEmail,
} from "./types.server";

export interface SmtpProviderConfig {
  host: string;
  port: number;
  secure: boolean;
  startTls?: boolean;
  username: string;
  password: string;
  authType?: AuthType | AuthType[];
  defaultFrom: EmailAddress;
  sendViaTransport?: (
    options: WorkerMailerOptions,
    email: EmailOptions,
  ) => Promise<void>;
}

async function defaultSendViaTransport(
  options: WorkerMailerOptions,
  email: EmailOptions,
): Promise<void> {
  const { WorkerMailer } = await import("worker-mailer");
  await WorkerMailer.send(options, email);
}

/**
 * Third-party SMTP email provider built for Cloudflare Workers using
 * `worker-mailer` (`cloudflare:sockets` TCP/TLS).
 */
export class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp";
  private readonly config: SmtpProviderConfig;

  constructor(config: SmtpProviderConfig) {
    this.config = config;
  }

  async send(message: OutboundEmail): Promise<EmailSendResult> {
    const from = message.from ?? this.config.defaultFrom;
    const toList = Array.isArray(message.to) ? message.to : [message.to];
    const sendTransport =
      this.config.sendViaTransport ?? defaultSendViaTransport;

    const mailerOptions: WorkerMailerOptions = {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      startTls: this.config.startTls ?? !this.config.secure,
      credentials: {
        username: this.config.username,
        password: this.config.password,
      },
      authType: this.config.authType ?? "plain",
    };

    const emailOptions: EmailOptions = {
      from,
      to: toList,
      subject: message.subject,
      text: message.text,
      html: message.html,
      reply: message.replyTo,
      headers: message.headers,
    };

    try {
      await sendTransport(mailerOptions, emailOptions);
      return {
        provider: this.name,
        messageId: crypto.randomUUID(),
      };
    } catch (error) {
      throw new EmailDeliveryError(
        this.name,
        error instanceof Error ? error.message : "SMTP delivery failed",
        error,
      );
    }
  }
}
