// ─────────────────────────────────────────────────────────────────────────────
// scriptParser.js — Guion completo → escenas → lotes, para el Modo Guion.
// No depende de que el texto haya salido de un PDF (pdfExtract.js) o de un
// paste directo — solo trabaja sobre texto plano.
// ─────────────────────────────────────────────────────────────────────────────

// Sluglines típicos en español/rioplatense: "INT.", "EXT.", "INT/EXT.",
// con o sin numeración/"ESCENA" adelante ("14.", "ESCENA 14 -", "14) INT...").
const SLUGLINE_RE = /^\s*(?:(?:ESC(?:ENA)?\.?\s*)?\d+[.)]?\s*[-–—]?\s*)?(INT|EXT|INT\s*\/\s*EXT|EXT\s*\/\s*INT|I\/E)[.\s]/i;

/**
 * Divide el texto completo del guion en escenas.
 * @returns {Array<{id:number, header:string, body:string, chars:number}>}
 */
export function parseScenes(fullText) {
  const lines = fullText.split("\n");
  const raw = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (SLUGLINE_RE.test(line)) {
      if (current) raw.push(current);
      current = { header: line.slice(0, 90), lines: [] };
    } else if (current) {
      current.lines.push(rawLine);
    }
    // Texto antes de la primera slugline (portada, "FADE IN", etc.) se descarta.
  }
  if (current) raw.push(current);

  return raw.map((s, i) => {
    const body = s.lines.join("\n").trim();
    return { id: i + 1, header: s.header || `Escena ${i + 1}`, body, chars: body.length };
  });
}

/**
 * Agrupa escenas en lotes. Corta un lote apenas se cumple CUALQUIERA de los
 * dos topes — el que llegue primero — para que ni "muchas escenas cortas"
 * ni "pocas escenas largas" hagan un lote demasiado pesado en tokens.
 * @param {Array} scenes
 * @param {{targetCount?:number, maxChars?:number}} opts
 * @returns {Array<Array>} lotes (arrays de escenas)
 */
export function batchScenes(scenes, { targetCount = 4, maxChars = 6000 } = {}) {
  const batches = [];
  let current = [];
  let currentChars = 0;

  for (const scene of scenes) {
    const wouldOverflow = current.length > 0 &&
      (current.length >= targetCount || currentChars + scene.chars > maxChars);
    if (wouldOverflow) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(scene);
    currentChars += scene.chars;
  }
  if (current.length) batches.push(current);
  return batches;
}

/**
 * Contexto macro GRATIS (sin llamar a la API): metadata determinística
 * sacada directo de los sluglines. Sirve de base incluso si la capa
 * narrativa opcional (ver groqApi.js: summarizeScriptForContext) falla.
 */
export function extractDeterministicContext(scenes) {
  const locations = new Set();
  let intCount = 0, extCount = 0, dayCount = 0, nightCount = 0;

  for (const s of scenes) {
    const h = s.header.toUpperCase();
    if (/\bINT\b/.test(h)) intCount++;
    if (/\bEXT\b/.test(h)) extCount++;
    if (/\bNOCHE\b|\bNIGHT\b/.test(h)) nightCount++;
    if (/\bD[IÍ]A\b|\bDAY\b/.test(h)) dayCount++;
    const locMatch = h.match(/(?:INT|EXT)[.\s/]+([A-ZÀ-Ÿ0-9ÑÁÉÍÓÚ\s,]+?)(?:\s*[-–—]\s*|$)/);
    if (locMatch) {
      const loc = locMatch[1].trim();
      if (loc.length > 1) locations.add(loc);
    }
  }

  const locList = [...locations].slice(0, 15).join(", ") || "sin detectar";
  return `Guion de ${scenes.length} escenas. Locaciones recurrentes: ${locList}. ` +
    `INT: ${intCount} · EXT: ${extCount} · Día: ${dayCount} · Noche: ${nightCount}.`;
}
