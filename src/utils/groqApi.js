// ─────────────────────────────────────────────────────────────────────────────
// groqApi.js — Llamada a Groq con fallback entre modelos
// ─────────────────────────────────────────────────────────────────────────────
import { GROQ_ENDPOINT, GROQ_MODELS } from "../data/sonPrompt";

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
      throw new Error(`Error ${res.status}: ${msg || "Error de la API de Groq."}`);
    }

    saveModel(model);
    const reply = data?.choices?.[0]?.message?.content ?? "";
    if (!reply) throw new Error("Respuesta vacía. Probá de nuevo.");
    return { reply, model };
  }

  throw new Error("Ningún modelo de la lista respondió. Verificá GROQ_MODELS en sonPrompt.js.");
}
