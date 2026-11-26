// Front-end fixtures only. Replace these with the job/company APIs later;
// company and job content deliberately stays in its collected language (ID).
export const JOB_TYPES = [
  "fullTime",
  "partTime",
  "internship",
  "contract",
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const WORK_TYPES = ["onSite", "hybrid", "remote"] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export const EDUCATION_LEVELS = ["SMA", "D3", "D4", "S1", "S2"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const EDUCATION_LABELS = {
  SMA: "highSchool",
  D3: "diploma",
  D4: "appliedBachelorSDegree",
  S1: "bachelorSDegree",
  S2: "masterSDegree",
} as const;

export interface DemoEmployer {
  id: string;
  name: string;
  initials: string;
  industry: string;
  province: string;
  city: string;
  verified: boolean;
  description: string;
}

export const DEMO_EMPLOYERS: readonly DemoEmployer[] = [
  {
    id: "telkom",
    name: "PT. Telkom Indonesia",
    initials: "TI",
    industry: "Telekomunikasi",
    province: "Jawa Barat",
    city: "Kota Bandung",
    verified: true,
    description:
      "Perusahaan telekomunikasi yang mengembangkan konektivitas dan layanan digital di Indonesia.",
  },
  {
    id: "bca",
    name: "PT. Bank Central Asia",
    initials: "BCA",
    industry: "Perbankan",
    province: "DKI Jakarta",
    city: "Jakarta Pusat",
    verified: true,
    description:
      "Perusahaan perbankan dengan layanan keuangan dan produk digital untuk nasabah individu dan bisnis.",
  },
  {
    id: "tokopedia",
    name: "PT. Tokopedia",
    initials: "TK",
    industry: "E-commerce",
    province: "DKI Jakarta",
    city: "Jakarta Selatan",
    verified: true,
    description:
      "Platform perdagangan digital yang menghubungkan penjual dan pembeli di berbagai daerah Indonesia.",
  },
  {
    id: "ruangguru",
    name: "Ruangguru",
    initials: "RG",
    industry: "Teknologi pendidikan",
    province: "DKI Jakarta",
    city: "Jakarta Selatan",
    verified: true,
    description:
      "Perusahaan teknologi pendidikan yang menyediakan layanan belajar dan pengembangan keterampilan.",
  },
  {
    id: "traveloka",
    name: "Traveloka",
    initials: "TV",
    industry: "Teknologi perjalanan",
    province: "Banten",
    city: "Kota Tangerang",
    verified: true,
    description:
      "Platform digital untuk kebutuhan perjalanan, akomodasi, dan aktivitas wisata.",
  },
  {
    id: "dana",
    name: "DANA Indonesia",
    initials: "DN",
    industry: "Teknologi finansial",
    province: "DKI Jakarta",
    city: "Jakarta Pusat",
    verified: true,
    description:
      "Penyedia layanan dompet digital dan pembayaran untuk kebutuhan sehari-hari.",
  },
  {
    id: "gojek",
    name: "Gojek",
    initials: "GJ",
    industry: "Teknologi dan transportasi",
    province: "DKI Jakarta",
    city: "Jakarta Selatan",
    verified: true,
    description:
      "Platform layanan transportasi, pengiriman, dan kebutuhan sehari-hari berbasis teknologi.",
  },
  {
    id: "bukalapak",
    name: "Bukalapak",
    initials: "BL",
    industry: "E-commerce",
    province: "DKI Jakarta",
    city: "Jakarta Selatan",
    verified: true,
    description:
      "Perusahaan perdagangan digital yang menyediakan layanan bagi pelaku usaha dan konsumen.",
  },
];

export interface DemoJob {
  id: string;
  title: string;
  employerId: string;
  companyName: string;
  province: string;
  city: string;
  jobType: JobType;
  workType: WorkType;
  education: EducationLevel | null;
  salaryMin: number | null;
  salaryMax: number | null;
  postedDaysAgo: number;
  languages: readonly ("en" | "id")[];
  skills: readonly string[];
  responsibilities: string;
  requirements: string;
}

type JobOptions = Pick<
  DemoJob,
  "postedDaysAgo" | "skills" | "responsibilities"
> &
  Partial<Omit<DemoJob, "id" | "title" | "employerId" | "companyName">>;

function job(
  id: string,
  title: string,
  employerId: string,
  options: JobOptions,
): DemoJob {
  const employer = DEMO_EMPLOYERS.find((item) => item.id === employerId)!;
  return {
    id,
    title,
    employerId,
    companyName: employer.name,
    province: employer.province,
    city: employer.city,
    jobType: "fullTime",
    workType: "onSite",
    education: "S1",
    salaryMin: null,
    salaryMax: null,
    languages: ["id"],
    requirements: `Menguasai ${options.skills.join(", ")}, mampu bekerja sama dalam tim, dan bersedia belajar. Lulusan baru dipersilakan melamar.`,
    ...options,
  };
}

// Twenty-four entries exercise three pages, every filter, and undisclosed pay.
// Relative posted dates keep the sample stable between SSR and hydration.
export const DEMO_JOBS: readonly DemoJob[] = [
  job("telkom-frontend", "Pengembang Frontend Junior", "telkom", {
    postedDaysAgo: 0,
    salaryMin: 7_000_000,
    salaryMax: 10_000_000,
    workType: "hybrid",
    languages: ["id", "en"],
    skills: ["React", "TypeScript", "HTML", "CSS"],
    responsibilities:
      "Membangun antarmuka aplikasi web yang responsif dan bekerja bersama tim desain serta pengembang backend.",
  }),
  job("bca-data", "Analis Data Junior", "bca", {
    postedDaysAgo: 1,
    salaryMin: 6_500_000,
    salaryMax: 9_000_000,
    languages: ["id", "en"],
    skills: ["SQL", "Excel", "Python"],
    responsibilities:
      "Mengolah data operasional dan menyusun laporan untuk membantu pengambilan keputusan bisnis.",
  }),
  job("tokopedia-design", "Magang Desain Produk", "tokopedia", {
    postedDaysAgo: 2,
    salaryMin: 3_000_000,
    salaryMax: 4_000_000,
    jobType: "internship",
    workType: "hybrid",
    education: "D4",
    skills: ["Figma", "UI/UX", "Prototyping"],
    responsibilities:
      "Membantu riset pengguna, membuat prototipe, dan mendukung pengembangan desain produk digital.",
  }),
  job("ruangguru-content", "Penulis Konten Pendidikan", "ruangguru", {
    postedDaysAgo: 3,
    jobType: "partTime",
    workType: "remote",
    education: null,
    skills: ["Copywriting", "SEO", "Bahasa Indonesia"],
    responsibilities:
      "Menulis materi pembelajaran dan artikel pendidikan yang mudah dipahami oleh siswa.",
  }),
  job("traveloka-qa", "Penguji Perangkat Lunak Junior", "traveloka", {
    postedDaysAgo: 4,
    salaryMin: 6_000_000,
    salaryMax: 8_500_000,
    workType: "hybrid",
    languages: ["en"],
    skills: ["Software Testing", "Postman", "SQL"],
    responsibilities:
      "Menguji fitur aplikasi, mencatat temuan, dan berkolaborasi dengan pengembang untuk meningkatkan kualitas produk.",
  }),
  job("dana-support", "Staf Dukungan Pelanggan", "dana", {
    postedDaysAgo: 5,
    salaryMin: 4_500_000,
    salaryMax: 6_000_000,
    education: "D3",
    skills: ["Customer Service", "Komunikasi"],
    responsibilities:
      "Membantu pengguna menyelesaikan kendala layanan dan mencatat umpan balik pelanggan.",
  }),
  job("gojek-operations", "Staf Operasional", "gojek", {
    postedDaysAgo: 6,
    salaryMin: 5_000_000,
    salaryMax: 7_000_000,
    education: "D3",
    province: "Jawa Timur",
    city: "Kota Surabaya",
    skills: ["Excel", "Administrasi", "Koordinasi"],
    responsibilities:
      "Mendukung kegiatan operasional harian dan koordinasi dengan mitra di wilayah Surabaya.",
  }),
  job("bukalapak-marketing", "Magang Pemasaran Digital", "bukalapak", {
    postedDaysAgo: 7,
    salaryMin: 2_500_000,
    salaryMax: 3_500_000,
    jobType: "internship",
    workType: "hybrid",
    skills: ["Social Media", "Content Marketing", "Analytics"],
    responsibilities:
      "Membantu pelaksanaan kampanye digital dan mengevaluasi kinerja konten media sosial.",
  }),
  job("telkom-network", "Teknisi Jaringan", "telkom", {
    postedDaysAgo: 8,
    salaryMin: 5_000_000,
    salaryMax: 7_500_000,
    education: "D3",
    province: "Jawa Tengah",
    city: "Kota Semarang",
    skills: ["Networking", "TCP/IP", "Troubleshooting"],
    responsibilities:
      "Melakukan pemeliharaan jaringan dan membantu penyelesaian gangguan layanan konektivitas.",
  }),
  job("bca-service", "Staf Layanan Nasabah", "bca", {
    postedDaysAgo: 9,
    salaryMin: 4_500_000,
    salaryMax: 6_000_000,
    education: "SMA",
    province: "Jawa Barat",
    city: "Kota Bekasi",
    skills: ["Pelayanan Nasabah", "Administrasi"],
    responsibilities:
      "Memberikan informasi layanan perbankan dan membantu kebutuhan administrasi nasabah.",
  }),
  job("tokopedia-backend", "Pengembang Backend Junior", "tokopedia", {
    postedDaysAgo: 10,
    salaryMin: 8_000_000,
    salaryMax: 12_000_000,
    workType: "hybrid",
    languages: ["id", "en"],
    skills: ["Go", "PostgreSQL", "REST API"],
    responsibilities:
      "Mengembangkan layanan backend dan menjaga kualitas integrasi antarsistem.",
  }),
  job("ruangguru-tutor", "Tutor Bahasa Inggris", "ruangguru", {
    postedDaysAgo: 11,
    salaryMin: 3_500_000,
    salaryMax: 5_500_000,
    jobType: "partTime",
    workType: "remote",
    languages: ["en"],
    skills: ["English", "Teaching", "Lesson Planning"],
    responsibilities:
      "Menyampaikan pembelajaran bahasa Inggris secara daring dan mendampingi perkembangan siswa.",
  }),
  job("traveloka-finance", "Staf Keuangan Junior", "traveloka", {
    postedDaysAgo: 12,
    salaryMin: 5_500_000,
    salaryMax: 7_000_000,
    education: "D4",
    skills: ["Akuntansi", "Excel", "Rekonsiliasi"],
    responsibilities:
      "Membantu rekonsiliasi transaksi dan menyiapkan laporan keuangan rutin.",
  }),
  job("dana-security", "Analis Keamanan Informasi", "dana", {
    postedDaysAgo: 13,
    salaryMin: 9_000_000,
    salaryMax: 13_000_000,
    jobType: "contract",
    languages: ["id", "en"],
    skills: ["Cybersecurity", "Linux", "Risk Assessment"],
    responsibilities:
      "Memantau keamanan sistem dan membantu identifikasi serta mitigasi risiko teknologi informasi.",
  }),
  job("gojek-research", "Asisten Riset Pengguna", "gojek", {
    postedDaysAgo: 14,
    salaryMin: 3_000_000,
    salaryMax: 4_000_000,
    jobType: "internship",
    workType: "hybrid",
    skills: ["User Research", "Interview", "Analisis Data"],
    responsibilities:
      "Mendukung wawancara pengguna dan merangkum temuan untuk pengembangan produk.",
  }),
  job("bukalapak-seller", "Staf Pendamping Penjual", "bukalapak", {
    postedDaysAgo: 15,
    salaryMin: 4_000_000,
    salaryMax: 5_500_000,
    education: "SMA",
    province: "DI Yogyakarta",
    city: "Kota Yogyakarta",
    skills: ["Komunikasi", "Sales", "Administrasi"],
    responsibilities:
      "Mendampingi penjual dalam menggunakan layanan digital dan mengembangkan usaha mereka.",
  }),
  job("telkom-data-intern", "Magang Analisis Data", "telkom", {
    postedDaysAgo: 16,
    jobType: "internship",
    education: "D3",
    skills: ["SQL", "Excel", "Data Visualization"],
    responsibilities:
      "Membantu pengumpulan data, pembuatan dasbor, dan penyusunan laporan analisis.",
  }),
  job("bca-mobile", "Pengembang Aplikasi Mobile Junior", "bca", {
    postedDaysAgo: 17,
    salaryMin: 7_500_000,
    salaryMax: 10_500_000,
    languages: ["id", "en"],
    skills: ["Kotlin", "Android", "Git"],
    responsibilities:
      "Mengembangkan fitur aplikasi mobile dan melakukan pengujian bersama tim produk.",
  }),
  job("tokopedia-copywriter", "Penulis Konten Produk", "tokopedia", {
    postedDaysAgo: 18,
    salaryMin: 4_000_000,
    salaryMax: 6_000_000,
    jobType: "contract",
    workType: "remote",
    education: null,
    skills: ["Copywriting", "SEO", "Content Strategy"],
    responsibilities:
      "Menulis deskripsi produk dan materi komunikasi yang jelas untuk pengguna platform.",
  }),
  job("ruangguru-curriculum", "Pengembang Kurikulum", "ruangguru", {
    postedDaysAgo: 19,
    salaryMin: 7_000_000,
    salaryMax: 9_500_000,
    workType: "hybrid",
    education: "S2",
    skills: ["Curriculum Design", "Teaching", "Assessment"],
    responsibilities:
      "Mengembangkan struktur materi belajar dan mengevaluasi kualitas kurikulum pendidikan.",
  }),
  job("traveloka-frontend", "Pengembang Frontend Junior", "traveloka", {
    postedDaysAgo: 20,
    salaryMin: 8_000_000,
    salaryMax: 11_000_000,
    workType: "remote",
    languages: ["en"],
    skills: ["React", "JavaScript", "Accessibility"],
    responsibilities:
      "Membangun pengalaman pengguna yang mudah diakses untuk layanan perjalanan digital.",
  }),
  job("dana-design", "Magang Desain Grafis", "dana", {
    postedDaysAgo: 21,
    salaryMin: 2_500_000,
    salaryMax: 3_500_000,
    jobType: "internship",
    education: "D4",
    skills: ["Illustrator", "Photoshop", "Figma"],
    responsibilities:
      "Membantu pembuatan aset visual dan materi komunikasi untuk kampanye digital.",
  }),
  job("gojek-community", "Staf Komunitas Mitra", "gojek", {
    postedDaysAgo: 22,
    salaryMin: 4_500_000,
    salaryMax: 6_500_000,
    jobType: "contract",
    education: "D3",
    province: "Bali",
    city: "Kota Denpasar",
    skills: ["Community Management", "Komunikasi", "Event Planning"],
    responsibilities:
      "Mendukung kegiatan komunitas dan membangun komunikasi yang baik dengan mitra.",
  }),
  job("bukalapak-qa", "Magang Pengujian Perangkat Lunak", "bukalapak", {
    postedDaysAgo: 23,
    jobType: "internship",
    workType: "hybrid",
    education: "D3",
    skills: ["Software Testing", "Bug Reporting", "Postman"],
    responsibilities:
      "Membantu pengujian fitur dan mendokumentasikan temuan untuk tim pengembang.",
  }),
];
