import type {
  EmailAddress,
  EmailProvider,
  EmailSendResult,
  OutboundEmail,
} from "./types.server";

function formatAddressList(recipients: EmailAddress | EmailAddress[]): string {
  const list = Array.isArray(recipients) ? recipients : [recipients];
  return list
    .map((item) => (item.name ? `${item.name} <${item.email}>` : item.email))
    .join(", ");
}

/**
 * Local development / test email provider that logs outgoing emails instead of
 * opening a network SMTP connection.
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";
  private readonly defaultFrom: EmailAddress;

  constructor(defaultFrom: EmailAddress) {
    this.defaultFrom = defaultFrom;
  }

  async send(message: OutboundEmail): Promise<EmailSendResult> {
    const from = message.from ?? this.defaultFrom;
    console.info(
      [
        "[email:console] Outbound email",
        `From: ${formatAddressList(from)}`,
        `To: ${formatAddressList(message.to)}`,
        `Subject: ${message.subject}`,
        message.text,
      ].join("\n"),
    );

    return {
      provider: this.name,
      messageId: crypto.randomUUID(),
    };
  }
}
