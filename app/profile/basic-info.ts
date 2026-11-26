// Basic information on My Profile: the shape and the one validator used by
// the form (and later the API), so they can never disagree.
import { isCityOf } from "../data/regions";
import type { FieldError } from "./job-intention";

export type BasicInfo = {
  fullName: string;
  /** Normalized to +62 followed by 9–12 digits. */
  whatsapp: string;
  province: string;
  city: string;
  /** "" when not given. */
  linkedinUrl: string;
};

export type BasicField = keyof BasicInfo;

export const NAME_MIN = 2;
export const NAME_MAX = 50;
export const URL_MAX = 200;

const NAME_PATTERN = /^[\p{L} .'-]+$/u;
const URL_PATTERN = /^https?:\/\/\S+$/;

/** "0812-3456 7890" / "62812…" / "+62812…" -> "+62812…"; anything else is returned as typed. */
function normalizeWhatsapp(raw: string): string {
  const compact = raw.replace(/[\s-]/g, "");
  if (compact.startsWith("+62")) return compact;
  if (compact.startsWith("62")) return `+${compact}`;
  if (compact.startsWith("0")) return `+62${compact.slice(1)}`;
  return compact;
}

/**
 * Checks untrusted input (form state or a request body).
 * Returns the cleaned value, or one error per invalid field.
 */
export function validateBasicInfo(
  input: unknown,
):
  | { ok: true; value: BasicInfo }
  | { ok: false; errors: Partial<Record<BasicField, FieldError>> } {
  const raw = (typeof input === "object" && input ? input : {}) as Record<
    string,
    unknown
  >;
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const errors: Partial<Record<BasicField, FieldError>> = {};
  const required: FieldError = { key: "thisFieldIsRequired" };

  // Phones auto-type ’ (e.g. Ma’ruf); store the plain apostrophe.
  const fullName = text(raw.fullName).replace(/[‘’]/g, "'");
  if (!fullName) errors.fullName = required;
  else if (fullName.length < NAME_MIN || fullName.length > NAME_MAX)
    errors.fullName = {
      key: "useMinToMaxCharacters",
      vars: { min: NAME_MIN, max: NAME_MAX },
    };
  else if (!NAME_PATTERN.test(fullName))
    errors.fullName = { key: "useOnlyLettersSpacesAnd" };

  const typedWhatsapp = text(raw.whatsapp);
  const whatsapp = normalizeWhatsapp(typedWhatsapp);
  if (!typedWhatsapp) errors.whatsapp = required;
  // No 0 right after +62: "+62 0812…" would store a different number.
  else if (!/^\+62[1-9]\d{8,11}$/.test(whatsapp))
    errors.whatsapp = { key: "invalidPhoneNumber" };

  const province = text(raw.province);
  const city = text(raw.city);
  if (!province) errors.province = required;
  if (!city || (province && !isCityOf(province, city))) errors.city = required;

  const linkedinUrl = text(raw.linkedinUrl);
  if (
    linkedinUrl &&
    (linkedinUrl.length > URL_MAX || !URL_PATTERN.test(linkedinUrl))
  )
    errors.linkedinUrl = { key: "pleaseEnterAValidUrl" };

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: { fullName, whatsapp, province, city, linkedinUrl },
  };
}
