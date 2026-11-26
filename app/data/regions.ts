// Indonesian provinces and their cities for province -> city selects.
// shortcut: hand-picked subset of real places, not the full list; replace with
// the shared province/city source (A02, Rafi's W2.1 cascade) once it lands.
export const REGIONS: Record<string, readonly string[]> = {
  "DKI Jakarta": [
    "Jakarta Pusat",
    "Jakarta Utara",
    "Jakarta Barat",
    "Jakarta Selatan",
    "Jakarta Timur",
    "Kepulauan Seribu",
  ],
  "Jawa Barat": [
    "Kota Bandung",
    "Kota Bekasi",
    "Kota Bogor",
    "Kota Cimahi",
    "Kota Cirebon",
    "Kota Depok",
    "Kota Sukabumi",
    "Kota Tasikmalaya",
  ],
  "Jawa Tengah": [
    "Kota Semarang",
    "Kota Surakarta",
    "Kota Magelang",
    "Kota Salatiga",
    "Kota Tegal",
  ],
  "DI Yogyakarta": ["Kota Yogyakarta", "Kabupaten Sleman", "Kabupaten Bantul"],
  "Jawa Timur": ["Kota Surabaya", "Kota Malang", "Kota Batu", "Kota Kediri"],
  Banten: [
    "Kota Tangerang",
    "Kota Tangerang Selatan",
    "Kota Serang",
    "Kota Cilegon",
  ],
  Bali: ["Kota Denpasar"],
  "Sumatera Utara": ["Kota Medan"],
};

export function isCityOf(province: string, city: string): boolean {
  return REGIONS[province]?.includes(city) ?? false;
}
