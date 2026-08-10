// ─────────────────────────────────────────────────────────────────────────────
// batchToMarkdown.js — resultado de un lote → tabla Markdown (misma tubería de
// Message.jsx: se renderiza y queda exportable a CSV como cualquier otra tabla).
// ─────────────────────────────────────────────────────────────────────────────

/** @param {Array<{id,header,ambientes,foley,fx}>} result  ya desenvuelto por groqApi.js */
export function batchResultToMarkdown(result, label) {
  if (!Array.isArray(result) || result.length === 0) {
    return `**${label}** — no se pudo extraer estructura de este lote (respuesta vacía o mal formada).`;
  }

  const rows = result.map(s => {
    const amb = (s.ambientes || []).join("; ") || "—";
    const fol = (s.foley || []).join("; ") || "—";
    const fx = (s.fx || []).join("; ") || "—";
    const header = (s.header || `Escena ${s.id}`).replace(/\|/g, "/");
    return `| ${header} | ${amb} | ${fol} | ${fx} |`;
  });

  return [
    `**${label}**`,
    "",
    "| Escena | Ambientes | Foley (post) | FX |",
    "|---|---|---|---|",
    ...rows,
  ].join("\n");
}
