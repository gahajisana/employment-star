export interface EmailAddress {
  email: string;
  name?: string;
}

export interface OutboundEmail {
  to: EmailAddress | EmailAddress[];
  from?: EmailAddress;
  subject: string;
  text: string;
  html?: string;
  replyTo?: EmailAddress;
  headers?: Record<string, string>;
}

export interface EmailSendResult {
  messageId?: string;
  provider: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: OutboundEmail): Promise<EmailSendResult>;
}

export class EmailDeliveryError extends Error {
  readonly provider: string;
  override readonly cause?: unknown;

  constructor(provider: string, message: string, cause?: unknown) {
    super(message);
    this.name = "EmailDeliveryError";
    this.provider = provider;
    this.cause = cause;
  }
}
