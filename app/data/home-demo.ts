// shortcut: fictional demo jobs across all fields for the Home page (P01); replace with the
// job list API once it exists. Companies are made up, not real employers.
export const JOB_TYPES = [
  "fullTime",
  "partTime",
  "internship",
  "contract",
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const EDUCATION_LEVELS = [
  "highSchool",
  "vocationalHighSchool",
  "diploma",
  "bachelorSDegree",
  "masterSDegree",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export type DemoJob = {
  id: string;
  title: string;
  company: string;
  province: string;
  city: string;
  remote: boolean;
  jobType: JobType;
  education: EducationLevel;
  /** null = Negotiable (never show 0 or blank). */
  salaryMin: number | null;
  salaryMax: number | null;
  postedDaysAgo: number;
  /** Language the job requires. */
  language: "en" | "id";
};

type Row = [
  title: string,
  company: string,
  province: string,
  city: string,
  remote: boolean,
  jobType: JobType,
  education: EducationLevel,
  salaryMin: number | null,
  salaryMax: number | null,
  postedDaysAgo: number,
  language: "en" | "id",
];

const M = 1_000_000;

// prettier-ignore
const ROWS: Row[] = [
  ["Marketing Associate", "PT Sari Rasa Pangan", "DKI Jakarta", "Jakarta Selatan", false, "fullTime", "bachelorSDegree", 6 * M, 8 * M, 0, "id"],
  ["Frontend Developer", "PT Awan Kode Nusantara", "DKI Jakarta", "Jakarta Selatan", false, "fullTime", "bachelorSDegree", 9 * M, 14 * M, 1, "en"],
  ["Accounting Staff", "PT Kas Digital Nusantara", "DKI Jakarta", "Jakarta Pusat", false, "fullTime", "bachelorSDegree", 5.5 * M, 7 * M, 1, "id"],
  ["Graphic Designer", "Studio Pelangi Kreatif", "DI Yogyakarta", "Kota Yogyakarta", true, "contract", "diploma", 4.5 * M, 6.5 * M, 2, "id"],
  ["Human Resources Intern", "PT Logistik Cepat Indonesia", "Banten", "Kota Tangerang", false, "internship", "bachelorSDegree", 3 * M, 4 * M, 2, "id"],
  ["Customer Service Officer", "PT Kas Digital Nusantara", "Jawa Timur", "Kota Surabaya", false, "fullTime", "diploma", 4.5 * M, 5.5 * M, 3, "id"],
  ["Civil Engineer (Fresh Graduate)", "PT Bangun Karya Konstruksi", "Jawa Barat", "Kota Bekasi", false, "fullTime", "bachelorSDegree", 7 * M, 10 * M, 3, "id"],
  ["Data Analyst Intern", "Rumah Data Indonesia", "DKI Jakarta", "Jakarta Pusat", false, "internship", "bachelorSDegree", 3.5 * M, 4.5 * M, 4, "en"],
  ["English Teacher", "Sekolah Cendekia Bangsa", "Jawa Tengah", "Kota Semarang", false, "fullTime", "bachelorSDegree", 5 * M, 7 * M, 4, "en"],
  ["Sales Executive", "PT Sari Rasa Pangan", "Jawa Barat", "Kota Bandung", false, "fullTime", "diploma", 5 * M, 9 * M, 5, "id"],
  ["Pharmacist Assistant", "Klinik Sehat Bersama", "Bali", "Kota Denpasar", false, "fullTime", "diploma", null, null, 5, "id"],
  ["Content Writer", "Kanal Kampus", "DI Yogyakarta", "Kabupaten Sleman", true, "partTime", "bachelorSDegree", 2.5 * M, 3.5 * M, 6, "id"],
  ["Supply Chain Management Trainee", "PT Logistik Cepat Indonesia", "Jawa Timur", "Kota Malang", false, "fullTime", "bachelorSDegree", 7 * M, 9 * M, 6, "en"],
  ["Administrative Staff", "PT Bangun Karya Konstruksi", "Sumatera Utara", "Kota Medan", false, "contract", "vocationalHighSchool", 3.5 * M, 4.5 * M, 7, "id"],
  ["Financial Analyst", "PT Kas Digital Nusantara", "DKI Jakarta", "Jakarta Selatan", false, "fullTime", "bachelorSDegree", 10 * M, 15 * M, 8, "en"],
  ["Social Media Specialist", "Studio Pelangi Kreatif", "DKI Jakarta", "Jakarta Barat", true, "fullTime", "bachelorSDegree", 6 * M, 9 * M, 8, "id"],
  ["Backend Engineer (Go)", "PT Awan Kode Nusantara", "Jawa Barat", "Kota Bandung", true, "fullTime", "bachelorSDegree", 12 * M, 18 * M, 9, "en"],
  ["Nurse", "Klinik Sehat Bersama", "Jawa Tengah", "Kota Surakarta", false, "fullTime", "diploma", 5 * M, 6.5 * M, 10, "id"],
  ["Legal Intern", "PT Sari Rasa Pangan", "DKI Jakarta", "Jakarta Pusat", false, "internship", "bachelorSDegree", null, null, 10, "id"],
  ["Quality Control Staff", "PT Sari Rasa Pangan", "Banten", "Kota Serang", false, "fullTime", "vocationalHighSchool", 4 * M, 5 * M, 12, "id"],
  ["Mechanical Engineer", "PT Bangun Karya Konstruksi", "Jawa Timur", "Kota Surabaya", false, "fullTime", "bachelorSDegree", 8 * M, 12 * M, 14, "en"],
  ["Research Assistant", "Rumah Data Indonesia", "Jawa Barat", "Kota Depok", false, "contract", "masterSDegree", 6 * M, 8 * M, 15, "en"],
];

export const DEMO_JOBS: DemoJob[] = ROWS.map(
  (
    [
      title,
      company,
      province,
      city,
      remote,
      jobType,
      education,
      salaryMin,
      salaryMax,
      postedDaysAgo,
      language,
    ],
    i,
  ) => ({
    id: String(i + 1),
    title,
    company,
    province,
    city,
    remote,
    jobType,
    education,
    salaryMin,
    salaryMax,
    postedDaysAgo,
    language,
  }),
);

// shortcut: fictional employers for the Home page until the companies API exists.
export const DEMO_EMPLOYERS = [
  { name: "PT Sari Rasa Pangan", industry: "Food & beverage" },
  { name: "PT Kas Digital Nusantara", industry: "Finance" },
  { name: "PT Bangun Karya Konstruksi", industry: "Construction" },
  { name: "Klinik Sehat Bersama", industry: "Healthcare" },
].map((c) => ({
  ...c,
  openings: DEMO_JOBS.filter((j) => j.company === c.name).length,
}));

// shortcut: fictional career classes until the class list API exists (F28).
export const DEMO_COURSES = [
  {
    id: "1",
    title: "Write a CV recruiters actually read",
    category: "Résumé",
    chapters: 8,
  },
  {
    id: "2",
    title: "Your first job interview, step by step",
    category: "Interview",
    chapters: 10,
  },
  {
    id: "3",
    title: "Excel for everyday office work",
    category: "Technical",
    chapters: 12,
  },
];
