import type { MessageKey } from "./en";

// Indonesian pack. Typed against en.ts, so a missing key fails typecheck.
// Every entry must be proofread by a native speaker; no machine translation.
export const id: Record<MessageKey, string> = {
  "lang.label": "Bahasa",
  "lang.en": "English",
  "lang.id": "Bahasa Indonesia",

  "nav.home": "Beranda",
  "nav.jobs": "Lowongan",
  "nav.companies": "Perusahaan",
  "nav.messages": "Pesan",
  "nav.classes": "Kelas karier",
  "nav.profile": "Profil Saya",
  "nav.applications": "Lamaran Saya",
  "nav.savedJobs": "Lowongan tersimpan",
  "nav.recommendations": "Lowongan rekomendasi",
  "nav.growthRecord": "Rekam jejak perkembangan",

  "action.save": "Simpan",
  "action.cancel": "Batal",
  "action.confirm": "Konfirmasi",
  "action.submit": "Kirim",
  "action.edit": "Ubah",
  "action.delete": "Hapus",
  "action.add": "Tambah",
  "action.back": "Kembali",
  "action.retry": "Coba lagi",
  "action.loadMore": "Muat lebih banyak",
  "action.logIn": "Masuk",
  "action.logOut": "Keluar",

  "login.title": "Selamat datang kembali",
  "login.subtitle": "Masuk untuk melanjutkan pencarian kerja Anda.",
  "login.phone": "Nomor ponsel",
  "login.email": "Email",
  "login.phoneNumber": "Nomor ponsel",
  "login.emailAddress": "Alamat email",
  "login.code": "Kode verifikasi",
  "login.sendCode": "Kirim kode",
  "login.guest": "Lanjut sebagai tamu",
  "login.unavailable": "Fitur masuk belum tersedia.",
  "login.or": "atau",

  "status.saved": "Tersimpan",
  "status.loading": "Memuat",
  "status.required": "Wajib diisi",
  "status.optional": "Opsional",

  "error.title": "Kesalahan",
  "error.notFound": "Halaman tidak ditemukan",
  "error.notFoundDetail": "Halaman yang Anda cari tidak ditemukan.",
  "error.generic": "Terjadi kesalahan",
  "error.network": "Kesalahan jaringan",
};
