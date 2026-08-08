// ─────────────────────────────────────────────────────────────────────────────
// csv.js — Exportar una tabla del DOM a un .csv descargable
// ─────────────────────────────────────────────────────────────────────────────

function cellToCSV(text) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

/** Lee un <table> del DOM (via ref) y dispara la descarga de un .csv */
export function downloadTableAsCSV(tableEl, filename = "sonia-export") {
  if (!tableEl) return;
  const rows = Array.from(tableEl.querySelectorAll("tr"));
  const csv = rows
    .map(row =>
      Array.from(row.querySelectorAll("th,td")).map(cell => cellToCSV(cell.textContent)).join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Copia la misma tabla al portapapeles como texto separado por tabs
 *  (pegado directo en Sheets/Excel sin pasar por un archivo). */
export async function copyTableAsTSV(tableEl) {
  if (!tableEl) return false;
  const rows = Array.from(tableEl.querySelectorAll("tr"));
  const tsv = rows
    .map(row => Array.from(row.querySelectorAll("th,td")).map(c => (c.textContent || "").trim()).join("\t"))
    .join("\n");
  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch {
    return false;
  }
}
