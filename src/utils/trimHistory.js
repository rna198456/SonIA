// ─────────────────────────────────────────────────────────────────────────────
// trimHistory.js — Arma el array de mensajes que se manda a Groq.
//
// Antes: "primer mensaje + más recientes". Problema real: si el guion no
// fue el primer mensaje de la charla, podía quedar afuera del recorte más
// adelante — y con el prompt actual (que no bloquea por datos faltantes),
// eso se traducía en diálogo inventado en vez de un corte limpio.
//
// Ahora: cualquier mensaje SUSTANCIAL del usuario (guion, casting, notas
// largas — más de SCRIPT_LIKE_CHARS) se manda SIEMPRE completo, sin
// importar qué tan viejo sea. Solo se acota por presupuesto lo
// conversacional corto. Si eso hace que el request sea grande, es
// preferible el 413 explícito (ya manejado en groqApi.js) a perder en
// silencio el guion real.
// ─────────────────────────────────────────────────────────────────────────────

const SCRIPT_LIKE_CHARS = 500;     // más largo que esto → material de referencia, nunca se recorta
const RECENT_BUDGET_CHARS = 8000;  // presupuesto solo para lo conversacional corto reciente

/**
 * @param {string} systemPrompt
 * @param {Array<{role,content}>} messages  incluye el WELCOME_MESSAGE en [0]
 * @param {number} recentBudget  presupuesto de caracteres para los mensajes cortos
 * @returns {{apiMessages: Array, trimmedCount: number}}
 */
export function buildApiMessages(systemPrompt, messages, recentBudget = RECENT_BUDGET_CHARS) {
  // El primer mensaje del array siempre es el WELCOME_MESSAGE (assistant,
  // estático) — no aporta nada que el system prompt no diga ya.
  const real = messages.slice(1);

  if (real.length === 0) {
    return { apiMessages: [{ role: "system", content: systemPrompt }], trimmedCount: 0 };
  }

  // Separamos: sustancial (guion/casting/notas largas del usuario — se
  // manda siempre entero) vs. corto (charla — se acota por presupuesto).
  const substantial = [];
  const short = [];
  real.forEach((m, i) => {
    const isSubstantial = m.role === "user" && m.content.length > SCRIPT_LIKE_CHARS;
    (isSubstantial ? substantial : short).push({ ...m, _i: i });
  });

  let budget = recentBudget;
  const keptShort = [];
  for (let i = short.length - 1; i >= 0; i--) {
    const len = short[i].content.length;
    if (budget - len < 0 && keptShort.length > 0) break; // siempre entra al menos el más reciente
    keptShort.unshift(short[i]);
    budget -= len;
  }

  // Reordenamos por posición original — la charla mantiene su secuencia
  // real para el modelo, no separamos "guion" de "conversación".
  const merged = [...substantial, ...keptShort]
    .sort((a, b) => a._i - b._i)
    .map(({ _i, ...m }) => m);

  const trimmedCount = short.length - keptShort.length;
  const notice = trimmedCount > 0
    ? [{
        role: "system",
        content: `(Se omitieron ${trimmedCount} mensaje(s) cortos más viejos por presupuesto — el material sustancial como guion/casting/notas largas se manda siempre completo, nunca se recorta. Si te piden algo sobre una escena y no ves su texto acá, decilo — no lo inventes.)`,
      }]
    : [];

  return {
    apiMessages: [{ role: "system", content: systemPrompt }, ...notice, ...merged],
    trimmedCount,
  };
}
