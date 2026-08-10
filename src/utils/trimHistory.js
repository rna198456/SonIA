// ─────────────────────────────────────────────────────────────────────────────
// trimHistory.js — Arma el array de mensajes que se manda a Groq, acotado a un
// presupuesto de caracteres para no pasarse del TPM del plan gratuito
// (openai/gpt-oss-120b: 8000 TPM — ver console.groq.com/docs/rate-limits).
//
// Importante: esto SOLO recorta lo que se envía en el request. El historial
// completo se sigue mostrando en pantalla y guardando en localStorage — acá
// no se borra nada de la conversación, solo se decide qué mandar esta vez.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_BUDGET_CHARS = 12000; // ≈ 3000-3400 tokens de historial

/**
 * @param {string} systemPrompt
 * @param {Array<{role,content}>} messages  incluye el WELCOME_MESSAGE en [0]
 * @param {number} maxChars  presupuesto de caracteres para el historial (sin contar el system prompt)
 * @returns {{apiMessages: Array, trimmedCount: number}}
 */
export function buildApiMessages(systemPrompt, messages, maxChars = DEFAULT_BUDGET_CHARS) {
  // El primer mensaje del array siempre es el WELCOME_MESSAGE (assistant, estático)
  // — no aporta nada nuevo que el system prompt no diga ya, así que no se manda.
  const real = messages.slice(1);

  if (real.length === 0) {
    return { apiMessages: [{ role: "system", content: systemPrompt }], trimmedCount: 0 };
  }

  // El primer mensaje REAL suele traer el guion/casting/plan — se preserva
  // siempre entero, aunque coma buena parte del presupuesto.
  const first = real[0];
  const rest = real.slice(1);

  let budget = maxChars - first.content.length;
  const kept = [];
  for (let i = rest.length - 1; i >= 0; i--) {
    const len = rest[i].content.length;
    if (budget - len < 0 && kept.length > 0) break; // siempre entra al menos el último mensaje
    kept.unshift(rest[i]);
    budget -= len;
  }

  const trimmedCount = rest.length - kept.length;
  const notice = trimmedCount > 0
    ? [{
        role: "system",
        content: `(Se omitieron ${trimmedCount} mensaje(s) intermedios más viejos de este envío por presupuesto de tokens — el pedido inicial y lo más reciente siguen presentes.)`,
      }]
    : [];

  return {
    apiMessages: [
      { role: "system", content: systemPrompt },
      first,
      ...notice,
      ...kept,
    ],
    trimmedCount,
  };
}
