// ─────────────────────────────────────────────────────────────────────────────
// groqApi.js — Llamada a Groq con fallback entre modelos
// ─────────────────────────────────────────────────────────────────────────────
import {
  GROQ_ENDPOINT, GROQ_MODELS, buildBatchMessages,
  BATCH_GENERATION_CONFIG, SCRIPT_SUMMARY_PROMPT, SCRIPT_SUMMARY_CONFIG,
} from "../data/sonPrompt";

const MODEL_KEY = "sonia_model";
const getSaved  = () => { try { return sessionStorage.getItem(MODEL_KEY) || null; } catch { return null; } };
const saveModel = m => { try { sessionStorage.setItem(MODEL_KEY, m); } catch {} };

/**
 * @param {string} apiKey  clave gsk_... del usuario
 * @param {Array}  messages  historial en formato [{role, content}, ...]
 * @param {object} genConfig  { temperature, max_tokens, top_p, stream }
 * @returns {Promise<{reply: string, model: string}>}
 */
export async function callGroq(apiKey, messages, genConfig) {
  const saved  = getSaved();
  const models = saved ? [saved, ...GROQ_MODELS.filter(m => m !== saved)] : GROQ_MODELS;

  let tooLarge = false;

  for (const model of models) {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature: genConfig.temperature,
        max_tokens: genConfig.max_tokens,
        top_p: genConfig.top_p,
        stream: false,
      }),
    });

    if (res.status === 404) continue; // este modelo no está disponible, probamos el siguiente

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.error?.message || "";
      if (res.status === 401) throw new Error("API key inválida. Verificala en console.groq.com/keys.");
      if (res.status === 429) throw new Error("Límite de requests alcanzado. Esperá un minuto y reintentá.");
      if (res.status === 413) { tooLarge = true; continue; } // se pasó del TPM — probamos el otro modelo
      throw new Error(`Error ${res.status}: ${msg || "Error de la API de Groq."}`);
    }

    saveModel(model);
    const reply = data?.choices?.[0]?.message?.content ?? "";
    if (!reply) throw new Error("Respuesta vacía. Probá de nuevo.");
    return { reply, model };
  }

  if (tooLarge) {
    throw new Error(
      'El mensaje sigue siendo muy largo para el plan gratuito de Groq (límite por minuto). ' +
      'Pegá el guion escena por escena en vez de la película entera, o arrancá "Nuevo proyecto" para esta parte.'
    );
  }
  throw new Error("Ningún modelo de la lista respondió. Verificá GROQ_MODELS en sonPrompt.js.");
}

// ─────────────────────────────────────────────────────────────────────────────
// Modo Guion — análisis por lotes de un guion completo (100+ páginas)
// ─────────────────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));
const estimateTokens = text => Math.ceil((text || "").length / 3.5);

/** Ventana deslizante de 60s sobre tokens realmente enviados — no un delay
 *  fijo. Antes de cada lote, espera lo que haga falta para no pasarse del
 *  presupuesto (7000, con margen bajo el límite real de 8000 TPM). */
class TokenRateLimiter {
  constructor(tpmBudget = 7000) {
    this.tpmBudget = tpmBudget;
    this.usage = []; // [{tokens, t}]
  }
  async wait(estimatedTokens) {
    const now = Date.now();
    this.usage = this.usage.filter(u => now - u.t < 60000);
    const used = this.usage.reduce((sum, u) => sum + u.tokens, 0);
    if (used + estimatedTokens > this.tpmBudget && this.usage.length > 0) {
      const waitMs = Math.max(1000, 60000 - (now - this.usage[0].t) + 400);
      await sleep(waitMs);
      return this.wait(estimatedTokens);
    }
  }
  record(tokens) {
    this.usage.push({ tokens, t: Date.now() });
  }
}

/** Aunque pedimos structured outputs, no confiamos ciegamente: hay reportes
 *  de que gpt-oss-120b a veces ignora el schema y devuelve texto suelto. */
function parseJsonLoose(text) {
  const cleaned = (text || "")
    .replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  throw new Error("No se pudo interpretar el JSON de la respuesta.");
}

/** 1 sola llamada, barata, sobre las primeras ~1500 palabras del guion —
 *  da contexto de tono/protagonistas para sumar al contexto determinístico
 *  de scriptParser.js. Si falla, el pipeline sigue solo con ese contexto. */
export async function summarizeScriptForContext(apiKey, fullText) {
  const sample = fullText.slice(0, 6000);
  try {
    const { reply } = await callGroq(
      apiKey,
      [{ role: "system", content: SCRIPT_SUMMARY_PROMPT }, { role: "user", content: sample }],
      SCRIPT_SUMMARY_CONFIG
    );
    return reply.trim();
  } catch {
    return null;
  }
}

/** Un solo intento de llamada para un lote. Separado del loop para poder
 *  reintentar limpio sin duplicar la construcción del request. */
async function callOneBatch(apiKey, model, messages) {
  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: BATCH_GENERATION_CONFIG.temperature,
      max_tokens: BATCH_GENERATION_CONFIG.max_tokens,
      top_p: BATCH_GENERATION_CONFIG.top_p,
      stream: false,
      // json_object en vez de json_schema/strict: más permisivo, sin rechazo
      // duro por validación — parseJsonLoose() abajo hace el resto del trabajo.
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Error ${res.status}`);

  const raw = data?.choices?.[0]?.message?.content ?? "";
  const parsed = parseJsonLoose(raw);
  const result = Array.isArray(parsed) ? parsed : parsed?.escenas;
  if (!Array.isArray(result)) throw new Error("La respuesta no tuvo el formato esperado.");
  return result;
}

/**
 * Recorre los lotes uno por uno, ritmeados por tokens reales (no un delay
 * fijo), y llama a onProgress después de cada uno. Cada lote tiene 1
 * reintento automático antes de darse por fallado — no corta la corrida:
 * queda con arrays vacíos y marca error, y se sigue con el próximo.
 *
 * @param {string} apiKey
 * @param {Array<Array>} batches        de scriptParser.batchScenes()
 * @param {string} globalContext        de scriptParser.extractDeterministicContext() (+ resumen opcional)
 * @param {(info:{batchIndex:number,total:number,result:Array,error:string|null})=>void} onProgress
 * @param {{cancelled?: boolean}} [signal]  objeto mutable para cancelar a mitad de camino
 */
export async function analyzeScriptBatches(apiKey, batches, globalContext, onProgress, signal = {}) {
  const model = GROQ_MODELS[0];
  const limiter = new TokenRateLimiter(7000);

  for (let i = 0; i < batches.length; i++) {
    if (signal.cancelled) break;

    const messages = buildBatchMessages(globalContext, batches[i]);
    const estimated = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
      + BATCH_GENERATION_CONFIG.max_tokens;

    let result, error = null;
    try {
      await limiter.wait(estimated);
      limiter.record(estimated);
      result = await callOneBatch(apiKey, model, messages);
    } catch (firstErr) {
      try {
        await limiter.wait(estimated);
        limiter.record(estimated);
        result = await callOneBatch(apiKey, model, messages); // 1 reintento
      } catch (secondErr) {
        error = secondErr.message || firstErr.message || "Error al procesar este lote.";
        // No perdemos el lugar de estas escenas en el resultado final, solo
        // quedan sin datos — se pueden reintentar o completar a mano después.
        result = batches[i].map(s => ({ id: s.id, header: s.header, ambientes: [], foley: [], fx: [] }));
      }
    }

    onProgress({ batchIndex: i, total: batches.length, result, error });
  }
}
