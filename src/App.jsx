import { useEffect, useRef, useState } from "react";
import { T } from "./utils/theme";
import {
  MODES, WELCOME_MESSAGE, SUGGESTIONS, getGenerationConfig, buildSystemPrompt,
} from "./data/sonPrompt";
import { classifyMessage } from "./utils/classifier";
import { buildApiMessages } from "./utils/trimHistory";
import { callGroq } from "./utils/groqApi";
import { sendToRemoteLog } from "./utils/remoteLog";
import {
  loadApiKey, clearApiKey, saveMessages, loadMessages, saveMode, loadMode,
} from "./utils/storage";
import ApiKeySetup from "./components/ApiKeySetup";
import ModeSelector from "./components/ModeSelector";
import Message from "./components/Message";
import LevelMeter from "./components/LevelMeter";
import ScriptUpload from "./components/ScriptUpload";

export default function App() {
  const [apiKey, setApiKey]     = useState(() => loadApiKey());
  const [activeMode, setMode]   = useState(() => loadMode() || MODES[0].id);
  const [messages, setMessages] = useState(() => loadMessages() || [WELCOME_MESSAGE]);
  const [input, setInput]       = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError]       = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, generating]);
  useEffect(() => { saveMessages(messages); }, [messages]);
  useEffect(() => { saveMode(activeMode); }, [activeMode]);

  if (!apiKey) return <ApiKeySetup onReady={setApiKey} />;

  const handleReset = () => {
    if (!confirm("¿Empezar un proyecto nuevo? Se borra el historial de esta charla.")) return;
    setMessages([WELCOME_MESSAGE]);
    setMode(MODES[0].id);
  };

  const send = async (text) => {
    const clean = text.trim();
    if (!clean || generating) return;

    const suggestedMode = classifyMessage(clean);
    const modeForThisTurn = suggestedMode || activeMode;
    if (suggestedMode && suggestedMode !== activeMode) setMode(suggestedMode);

    const userMsg = { role: "user", content: clean };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setGenerating(true);
    setError("");

    try {
      const systemPrompt = buildSystemPrompt(modeForThisTurn);
      const { apiMessages } = buildApiMessages(systemPrompt, nextMessages);
      const genConfig = getGenerationConfig(modeForThisTurn);
      const { reply } = await callGroq(apiKey, apiMessages, genConfig);

      setMessages(m => [...m, { role: "assistant", content: reply }]);
      if (modeForThisTurn === "bitacora") {
        sendToRemoteLog({ mode: modeForThisTurn, question: clean, response: reply.slice(0, 500) });
      }
    } catch (err) {
      setError(err.message || "Error inesperado.");
      if (err.message?.includes("API key")) clearApiKey();
    } finally {
      setGenerating(false);
    }
  };

  const showSuggestions = messages.length === 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.bg, fontFamily: T.fontBase }}>
      {/* Header */}
      <header
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: `1px solid ${T.borderSub}`, background: T.surface,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LevelMeter active={generating} size={18} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, letterSpacing: "-0.01em" }}>SonIA</div>
            <div style={{ fontSize: 11, color: T.inkMuted, fontFamily: T.fontMono }}>
              Coordinadora de Sonido
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleReset} style={headerBtn}>Nuevo proyecto</button>
          <button onClick={() => { clearApiKey(); setApiKey(""); }} style={headerBtn}>🔑</button>
        </div>
      </header>

      <ModeSelector activeMode={activeMode} onSelect={setMode} />

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {messages.map((m, i) => <Message key={i} role={m.role} content={m.content} />)}
        {generating && <Message role="assistant" content="" loading />}
        {error && (
          <div style={{ color: T.red, background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: T.radiusMd, padding: "8px 12px", fontSize: 13, marginTop: 6 }}>
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias iniciales */}
      {showSuggestions && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 10px" }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => send(s)} style={chipStyle}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${T.borderSub}`, background: T.surface }}>
        <ScriptUpload
          apiKey={apiKey}
          onInsertText={(text) => setInput(prev => (prev ? prev + "\n\n" + text : text))}
          onBatchMessage={(markdown) => setMessages(m => [...m, { role: "assistant", content: markdown }])}
        />
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
          }}
          placeholder="Pegá tu guion, tus notas de rodaje, o preguntá algo…"
          rows={1}
          style={{
            flex: 1, resize: "none", background: T.inset, border: `1px solid ${T.borderMid}`,
            borderRadius: T.radiusMd, padding: "10px 12px", color: T.ink, fontFamily: T.fontBase,
            fontSize: 14, outline: "none", maxHeight: 140,
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={generating || !input.trim()}
          style={{
            background: T.cyan, color: "#06181b", border: "none", borderRadius: T.radiusMd,
            padding: "0 18px", fontWeight: 600, fontSize: 14, cursor: "pointer",
            opacity: generating || !input.trim() ? 0.5 : 1,
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

const headerBtn = {
  background: "transparent", border: `1px solid ${T.borderMid}`, color: T.inkDim,
  borderRadius: T.radiusSm, padding: "6px 10px", fontSize: 12, fontFamily: T.fontMono, cursor: "pointer",
};

const chipStyle = {
  flex: "0 0 auto", background: T.inset, border: `1px solid ${T.borderMid}`, color: T.inkDim,
  borderRadius: 999, padding: "7px 14px", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap",
};
