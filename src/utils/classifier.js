// ─────────────────────────────────────────────────────────────────────────────
// classifier.js — Enrutado por keywords (sin llamar al LLM)
// Sugiere a qué modo pertenece el mensaje del usuario, para que la UI pueda
// cambiar el botón activo sola. Si no hay match claro, devuelve null y se
// mantiene el modo que ya estaba seleccionado.
// ─────────────────────────────────────────────────────────────────────────────

const KEYWORDS = {
  bitacora: [
    "grabé", "grabe", "tomamos", "hoy grabamos", "jornada", "problema con",
    "no salió", "se rompió", "quedó", "parte de sonido", "parte de rodaje",
  ],
  microfonia: [
    "escena", "actor", "actriz", "guion", "casting", "solapero", "corbatero",
    "boom", "cámara", "camaras", "cámaras", "plano secuencia", "steadicam",
    "360", "ambisónico", "ambisonico",
  ],
  wildtracks: [
    "wild track", "wildtrack", "ambiente", "room tone", "diseño sonoro",
    "diseno sonoro", "propuesta creativa", "textura",
  ],
  pendientes: [
    "pendiente", "pendientes", "qué falta", "que falta", "continuidad",
    "alerta",
  ],
  exportar: ["exportar", "csv", "sheets", "planilla", "excel"],
  teoria: [
    "por qué", "por que", "justificá", "justifica", "chion", "saitta",
    "teoría", "teoria", "fundamentá", "fundamenta",
  ],
};

/** Devuelve el id de modo con más coincidencias de keywords, o null si no
 *  hay ninguna coincidencia (el llamador debería mantener el modo actual). */
export function classifyMessage(text = "") {
  const t = text.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const [mode, words] of Object.entries(KEYWORDS)) {
    const score = words.reduce((acc, w) => (t.includes(w) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      best = mode;
    }
  }
  return best;
}
