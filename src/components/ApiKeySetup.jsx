import { useState } from "react";
import { T } from "../utils/theme";
import { saveApiKey } from "../utils/storage";
import LevelMeter from "./LevelMeter";

export default function ApiKeySetup({ onReady }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = key.trim();
    if (!trimmed.startsWith("gsk_") || trimmed.length < 30) {
      setError('La clave de Groq empieza con "gsk_" y tiene ~56 caracteres.');
      return;
    }
    saveApiKey(trimmed);
    onReady(trimmed);
  };

  return (
    <div
      style={{
        minHeight: "100vh", background: T.bg, color: T.ink,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: T.fontBase, padding: 24,
      }}
    >
      <div style={{ maxWidth: 460, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <LevelMeter active size={28} />
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
            SonIA
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: T.inkDim, lineHeight: 1.6 }}>
            Coordinadora de Departamento de Sonido
          </p>
        </div>

        <div
          style={{
            background: T.surface, border: `1px solid ${T.borderSub}`,
            borderRadius: T.radiusLg, padding: 24,
          }}
        >
          <label style={{ display: "block", fontSize: 12, color: T.inkDim, marginBottom: 8, fontFamily: T.fontMono }}>
            GROQ_API_KEY
          </label>
          <input
            type="password"
            value={key}
            onChange={e => { setKey(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="gsk_..."
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box", background: T.inset,
              border: `1px solid ${error ? T.red : T.borderMid}`, borderRadius: T.radiusMd,
              padding: "11px 12px", color: T.ink, fontFamily: T.fontMono, fontSize: 14,
              outline: "none",
            }}
          />
          {error && (
            <p style={{ color: T.red, fontSize: 12, marginTop: 8, marginBottom: 0 }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            style={{
              width: "100%", marginTop: 16, background: T.cyan, color: "#06181b",
              border: "none", borderRadius: T.radiusMd, padding: "11px 0",
              fontSize: 14, fontWeight: 600, fontFamily: T.fontBase, cursor: "pointer",
            }}
          >
            Empezar
          </button>

          <p style={{ fontSize: 12, color: T.inkMuted, lineHeight: 1.6, marginTop: 16, marginBottom: 0 }}>
            Tu clave se guarda solo en este navegador (localStorage) — nunca pasa por
            ningún servidor propio. Se consigue gratis en{" "}
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: T.cyan }}>
              console.groq.com/keys
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
