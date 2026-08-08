// ─────────────────────────────────────────────────────────────────────────────
// remoteLog.js — Registro opcional del Parte de Sonido en Google Sheets
// No hace nada hasta que se configure SHEETS_ENDPOINT en data/sonPrompt.js
// (ver apps-script/Code.gs para el template del backend).
// ─────────────────────────────────────────────────────────────────────────────
import { SHEETS_ENDPOINT } from "../data/sonPrompt";

export async function sendToRemoteLog(payload) {
  if (!SHEETS_ENDPOINT) {
    console.info("[SonIA] Registro remoto no configurado — seteá SHEETS_ENDPOINT en sonPrompt.js para activarlo.");
    return false;
  }
  try {
    await fetch(SHEETS_ENDPOINT, {
      method: "POST",
      mode: "no-cors", // Apps Script Web Apps no siempre devuelven CORS headers
      headers: { "Content-Type": "text/plain" }, // evita el preflight OPTIONS
      body: JSON.stringify({ ts: new Date().toISOString(), ...payload }),
    });
    return true;
  } catch (err) {
    console.warn("[SonIA] No se pudo escribir en el registro remoto:", err);
    return false;
  }
}
