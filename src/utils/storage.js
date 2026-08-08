// ─────────────────────────────────────────────────────────────────────────────
// storage.js — Persistencia local (API key, historial, modo activo)
// ─────────────────────────────────────────────────────────────────────────────

const KEY_API  = "sonia_api_key";
const KEY_MSGS = "sonia_messages";
const KEY_MODE = "sonia_mode";

// ── API Key ───────────────────────────────────────────────────────────────
export const saveApiKey  = k => { try { localStorage.setItem(KEY_API, k.trim()); } catch {} };
export const loadApiKey  = () => { try { return localStorage.getItem(KEY_API) || ""; } catch { return ""; } };
export const clearApiKey = () => { try { localStorage.removeItem(KEY_API); } catch {} };

// ── Historial de chat (para no perder el proyecto si se recarga la página) ──
export function saveMessages(messages) {
  try { localStorage.setItem(KEY_MSGS, JSON.stringify(messages)); } catch {}
}
export function loadMessages() {
  try {
    const raw = localStorage.getItem(KEY_MSGS);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function clearMessages() {
  try { localStorage.removeItem(KEY_MSGS); } catch {}
}

// ── Modo activo ───────────────────────────────────────────────────────────
export const saveMode = m => { try { localStorage.setItem(KEY_MODE, m); } catch {} };
export const loadMode = () => { try { return localStorage.getItem(KEY_MODE) || ""; } catch { return ""; } };
