/**
 * theme.js — Sistema de diseño de SonIA
 *
 * Punto de partida: el display de un grabador de campo (Zoom F8n, Sound
 * Devices), no un "dark mode" genérico. En vez de un único color de marca,
 * el estado de las cosas se lee con la semántica de un VU-metro:
 *   verde = confirmado / riesgo bajo · ámbar = pendiente / riesgo medio
 *   rojo  = alerta / riesgo alto     · cian  = acción / foco activo
 * Esa lógica de color es la misma que ya usás en las tablas del dossier
 * (Confirmado/Pendiente, Riesgo Bajo/Medio/Alto) — la interfaz simplemente
 * la hace visible.
 */
export const T = {
  // ── Fondos ────────────────────────────────────────────────────────────────
  bg:        "#0b0d0c",   // base — negro con la mínima tibieza verdosa de un chasis
  surface:   "#141715",   // header, footer, paneles
  card:      "#181c19",   // burbujas, tarjetas
  inset:     "#20241f",   // inputs, elementos internos

  // ── Bordes ────────────────────────────────────────────────────────────────
  borderSub: "#20251f",
  borderMid: "#2c332c",
  borderStr: "#3c453d",

  // ── Texto ─────────────────────────────────────────────────────────────────
  ink:       "#e9ece6",   // texto principal
  inkDim:    "#9aa199",   // texto secundario
  inkMuted:  "#666e64",   // texto deshabilitado / decorativo

  // ── Semántica de VU-metro (estado, no marca) ────────────────────────────────
  green:       "#4fae7a", greenBg: "#0d1a14", greenBorder: "#1f3a28",
  amber:       "#c9a227", amberBg: "#1c1608", amberBorder: "#3d3110",
  red:         "#c9564f", redBg:   "#1e0e0d", redBorder:   "#3d1c1a",
  cyan:        "#4fa3b0", cyanBg:  "#0a1a1e", cyanBorder:  "#183a41",

  // ── Semánticos funcionales ───────────────────────────────────────────────
  success: "#4fae7a",
  warning: "#c9a227",
  error:   "#c9564f",
  focus:   "#4fa3b0",

  // ── Tipografía ────────────────────────────────────────────────────────────
  fontBase: "'IBM Plex Sans', 'Helvetica Neue', system-ui, sans-serif",
  fontMono: "'IBM Plex Mono', 'Consolas', monospace",

  // ── Radios ────────────────────────────────────────────────────────────────
  radiusSm: "6px",
  radiusMd: "10px",
  radiusLg: "16px",
};

/** Mapea un nivel de riesgo textual (como los que genera el modelo en las
 *  tablas: "Alto", "Medio", "Bajo") a los tres colores del VU-metro. */
export function riskColor(level = "") {
  const l = level.toLowerCase();
  if (l.includes("alto")) return { fg: T.red, bg: T.redBg, border: T.redBorder };
  if (l.includes("medio")) return { fg: T.amber, bg: T.amberBg, border: T.amberBorder };
  if (l.includes("bajo")) return { fg: T.green, bg: T.greenBg, border: T.greenBorder };
  return { fg: T.inkDim, bg: T.inset, border: T.borderMid };
}
