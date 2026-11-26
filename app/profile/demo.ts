// shortcut: fictional demo profile, shown until the résumé API exists (W3).
// Not real data: never seed it into the database.
import type { MessageKey } from "../i18n";
import type { BasicInfo } from "./basic-info";
import type { JobIntention } from "./job-intention";

/** The 11 online résumé sections (Requirement Report, P08), as glossary keys. */
export const RESUME_SECTIONS = [
  "basicInformation",
  "education",
  "workHistory",
  "projectExperience",
  "internshipExperience",
  "professionalSkills",
  "languageProficiency",
  "certificates",
  "selfEvaluation",
  "honoursAndAwards",
  "careerPlan",
] as const satisfies readonly MessageKey[];

export type ResumeSectionId = (typeof RESUME_SECTIONS)[number];
export type CompletenessPart = ResumeSectionId | "jobIntention";

/** Existing product rule: applying needs at least this much (F18). */
export const APPLY_THRESHOLD = 70;

// shortcut: illustrative weights in %, total 100; real weights still to be
// confirmed with Houpu.
export const WEIGHTS: Record<CompletenessPart, number> = {
  basicInformation: 15,
  jobIntention: 10,
  education: 15,
  workHistory: 10,
  internshipExperience: 8,
  projectExperience: 8,
  professionalSkills: 10,
  languageProficiency: 6,
  certificates: 6,
  selfEvaluation: 8,
  honoursAndAwards: 2,
  careerPlan: 2,
};

export function completeness(filled: ReadonlySet<CompletenessPart>): number {
  let sum = 0;
  for (const part of filled) sum += WEIGHTS[part];
  return sum;
}

export const canApply = (percent: number) => percent >= APPLY_THRESHOLD;

export const DEMO_FILLED: CompletenessPart[] = [
  "basicInformation",
  "jobIntention",
  "education",
  "professionalSkills",
  "selfEvaluation",
];

export const DEMO_PROFILE: BasicInfo = {
  fullName: "Nama",
  whatsapp: "+6281234567890",
  province: "DKI Jakarta",
  city: "Jakarta Selatan",
  linkedinUrl: "",
};

export const DEMO_INTENTION: JobIntention = {
  expectedRole: "Pengembang Frontend Junior",
  salaryMin: 6_000_000,
  salaryMax: 9_000_000,
  province: "DKI Jakarta",
  city: "Jakarta Selatan",
  jobSeekingStatus: "lookingForAJob",
};
