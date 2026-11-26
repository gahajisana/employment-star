import type { Lang } from "../../i18n";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface OtpEmailContent {
  subject: string;
  text: string;
  html: string;
}

/** Builds localized plain-text and HTML content for an email login OTP. */
export function renderOtpEmail(params: {
  lang: Lang;
  code: string;
  expiresMinutes: number;
}): OtpEmailContent {
  const { lang, code, expiresMinutes } = params;
  const safeCode = escapeHtml(code);

  if (lang === "id") {
    return {
      subject: `${code} adalah kode verifikasi Employment Star Anda`,
      text: [
        `Kode verifikasi Anda adalah: ${code}`,
        "",
        `Kode ini berlaku selama ${expiresMinutes} menit. Jangan bagikan kode ini kepada siapa pun.`,
        "Jika Anda tidak meminta kode ini, Anda dapat mengabaikan email ini.",
      ].join("\n"),
      html: [
        "<p>Kode verifikasi Employment Star Anda adalah:</p>",
        `<p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${safeCode}</p>`,
        `<p>Kode ini berlaku selama ${expiresMinutes} menit. Jangan bagikan kode ini kepada siapa pun.</p>`,
        "<p>Jika Anda tidak meminta kode ini, Anda dapat mengabaikan email ini.</p>",
      ].join(""),
    };
  }

  return {
    subject: `${code} is your Employment Star verification code`,
    text: [
      `Your verification code is: ${code}`,
      "",
      `This code expires in ${expiresMinutes} minutes. Do not share it with anyone.`,
      "If you did not request this code, you can safely ignore this email.",
    ].join("\n"),
    html: [
      "<p>Your Employment Star verification code is:</p>",
      `<p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${safeCode}</p>`,
      `<p>This code expires in ${expiresMinutes} minutes. Do not share it with anyone.</p>`,
      "<p>If you did not request this code, you can safely ignore this email.</p>",
    ].join(""),
  };
}
