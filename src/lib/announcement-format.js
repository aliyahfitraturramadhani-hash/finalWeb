const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Format "YYYY-MM-DD" menjadi "23 November 2026" tanpa pengaruh timezone
export function formatTanggalID(isoDate) {
  if (!isoDate) return "-";

  const [year, month, day] = String(isoDate).slice(0, 10).split("-");
  const monthName = BULAN[Number(month) - 1];

  if (!year || !monthName) return "-";

  return `${Number(day)} ${monthName} ${year}`;
}

export function getAnnouncementCategoryLabel(kategori) {
  switch (kategori) {
    case "Operational":
      return "Operasional";
    case "Service":
      return "Layanan";
    case "Event":
      return "Acara";
    default:
      return kategori || "Umum";
  }
}
