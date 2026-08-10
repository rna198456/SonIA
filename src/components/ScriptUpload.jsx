import { useRef, useState } from "react";
import { T } from "../utils/theme";
import { parseScenes, batchScenes, extractDeterministicContext } from "../utils/scriptParser";
import { analyzeScriptBatches, summarizeScriptForContext } from "../utils/groqApi";
import { batchResultToMarkdown } from "../utils/batchToMarkdown";

const BATCH_THRESHOLD = 6; // a partir de cuántas escenas ofrecemos el escaneo completo

function batchLabel(batch, allScenesCount) {
  const first = batch[0].id;
  const last = batch[batch.length - 1].id;
  return first === last
    ? `Escena ${first} de ${allScenesCount}`
    : `Escenas ${first}-${last} de ${allScenesCount}`;
}

export default function ScriptUpload({ apiKey, onInsertText, onBatchMessage }) {
  const fileRef = useRef(null);
  const cancelRef = useRef({ cancelled: false });

  const [stage, setStage] = useState("idle"); // idle | extracting | review | context | scanning
  const [scenes, setScenes] = useState([]);
  const [fullText, setFullText] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [globalContext, setGlobalContext] = useState("");
  const [autoContextLoading, setAutoContextLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [err, setErr] = useState("");

  const reset = () => {
    setStage("idle"); setScenes([]); setSelected(new Set()); setErr("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStage("extracting"); setErr("");
    try {
      const { extractPdfText } = await import("../utils/pdfExtract");
      const { fullText, pageCount } = await extractPdfText(file);
      const found = parseScenes(fullText);
      setFullText(fullText);
      setPageCount(pageCount);
      if (found.length === 0) {
        // No se detectaron sluglines — insertamos todo el texto tal cual y
        // dejamos que el usuario lo recorte a mano en el input.
        onInsertText(fullText.slice(0, 20000));
        reset();
        return;
      }
      setScenes(found);
      setStage("review");
    } catch (e2) {
      setErr("No pude leer ese PDF. ¿Es un PDF de texto (no un escaneo/imagen)?");
      setStage("idle");
    }
  };

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedChars = scenes
    .filter(s => selected.has(s.id))
    .reduce((sum, s) => sum + s.chars, 0);

  const insertSelected = () => {
    const chosen = scenes.filter(s => selected.has(s.id));
    const text = chosen.map(s => `### ${s.header}\n${s.body}`).join("\n\n");
    onInsertText(text);
    reset();
  };

  const goToContext = () => {
    // Precarga con el contexto determinístico (gratis) — el usuario suma
    // tono/género arriba si quiere, sin perder lo que ya se detectó solo.
    setGlobalContext(extractDeterministicContext(scenes));
    setStage("context");
  };

  const autoContext = async () => {
    setAutoContextLoading(true);
    const summary = await summarizeScriptForContext(apiKey, fullText);
    if (summary) setGlobalContext(prev => `${summary}\n\n${prev}`);
    setAutoContextLoading(false);
  };

  const startScan = async () => {
    cancelRef.current = { cancelled: false };
    const batches = batchScenes(scenes);
    setProgress({ current: 0, total: batches.length });
    setStage("scanning");

    await analyzeScriptBatches(
      apiKey,
      batches,
      globalContext,
      ({ batchIndex, total, result, error }) => {
        const label = batchLabel(batches[batchIndex], scenes.length);
        onBatchMessage(
          error
            ? `**${label}** — no se pudo procesar (${error}). Podés reintentar esta escena a mano desde el chat.`
            : batchResultToMarkdown(result, label)
        );
        setProgress({ current: batchIndex + 1, total });
      },
      cancelRef.current
    );
    reset();
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} style={{ display: "none" }} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={stage === "extracting"}
        title="Subir guion en PDF"
        style={{
          background: "transparent", border: `1px solid ${T.borderMid}`, color: T.inkDim,
          borderRadius: T.radiusMd, width: 40, flexShrink: 0, cursor: "pointer", fontSize: 16,
        }}
      >
        {stage === "extracting" ? "…" : "📎"}
      </button>

      {err && (
        <div style={{ position: "fixed", bottom: 70, left: 12, right: 12, background: T.redBg, border: `1px solid ${T.redBorder}`, color: T.red, borderRadius: T.radiusMd, padding: "8px 12px", fontSize: 12.5 }}>
          {err}
        </div>
      )}

      {(stage === "review" || stage === "context" || stage === "scanning") && (
        <div style={overlayStyle}>
          <div style={panelStyle}>
            {stage === "review" && (
              <>
                <h3 style={titleStyle}>{scenes.length} escenas detectadas · {pageCount} páginas</h3>
                <p style={hintStyle}>
                  Elegí las que querés cargar en el chat para trabajarlas a fondo (microfonía, wild tracks, teoría).
                </p>
                <div style={{ maxHeight: 260, overflowY: "auto", border: `1px solid ${T.borderSub}`, borderRadius: T.radiusMd, margin: "10px 0" }}>
                  {scenes.map(s => (
                    <label key={s.id} style={rowStyle}>
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} style={{ accentColor: T.cyan }} />
                      <span style={{ flex: 1, fontFamily: T.fontMono, fontSize: 12 }}>{s.header}</span>
                      <span style={{ fontSize: 11, color: T.inkMuted }}>{s.chars.toLocaleString()}c</span>
                    </label>
                  ))}
                </div>
                <p style={{ ...hintStyle, marginTop: 0 }}>
                  Seleccionado: ~{selectedChars.toLocaleString()} caracteres (~{Math.ceil(selectedChars / 3.5).toLocaleString()} tokens)
                </p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={insertSelected} disabled={selected.size === 0} style={primaryBtn(selected.size === 0)}>
                    Insertar seleccionadas ({selected.size})
                  </button>
                  <button onClick={reset} style={secondaryBtn}>Cancelar</button>
                </div>

                {scenes.length >= BATCH_THRESHOLD && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSub}` }}>
                    <p style={{ ...hintStyle, marginTop: 0 }}>
                      ¿Guion completo? Escaneá las {scenes.length} escenas en lotes y armá un primer pantallazo de ambientes/foley/fx de todo el largometraje.
                    </p>
                    <button onClick={goToContext} style={secondaryBtn}>
                      📊 Escanear el guion completo
                    </button>
                  </div>
                )}
              </>
            )}

            {stage === "context" && (
              <>
                <h3 style={titleStyle}>Contexto general del proyecto</h3>
                <p style={hintStyle}>
                  Ya precargamos lo que se puede sacar solo de los sluglines (locaciones, INT/EXT, día/noche).
                  Sumale tono/género a mano, o dejá que la IA lea las primeras páginas — esto viaja igual en
                  cada uno de los {batchScenes(scenes).length} lotes, así el modelo no pierde el hilo global.
                </p>
                <textarea
                  value={globalContext}
                  onChange={e => setGlobalContext(e.target.value)}
                  rows={5}
                  style={{ width: "100%", boxSizing: "border-box", background: T.inset, border: `1px solid ${T.borderMid}`, borderRadius: T.radiusMd, padding: 10, color: T.ink, fontFamily: T.fontBase, fontSize: 13.5, resize: "vertical" }}
                />
                <button onClick={autoContext} disabled={autoContextLoading} style={{ ...secondaryBtn, marginTop: 8, fontSize: 12 }}>
                  {autoContextLoading ? "Leyendo el guion…" : "✨ Completar con IA (1 llamada corta)"}
                </button>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={startScan} style={primaryBtn(false)}>Empezar escaneo</button>
                  <button onClick={() => setStage("review")} style={secondaryBtn}>Volver</button>
                </div>
              </>
            )}

            {stage === "scanning" && (
              <>
                <h3 style={titleStyle}>Analizando lote {progress.current} de {progress.total}…</h3>
                <div style={{ height: 6, background: T.inset, borderRadius: 3, overflow: "hidden", margin: "12px 0" }}>
                  <div style={{
                    height: "100%", background: T.cyan, borderRadius: 3,
                    width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%`,
                    transition: "width 0.3s ease",
                  }} />
                </div>
                <p style={hintStyle}>Los resultados van apareciendo en el chat a medida que cada lote termina. Podés seguir usándolo mientras tanto.</p>
                <button onClick={() => { cancelRef.current.cancelled = true; }} style={secondaryBtn}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
  display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50,
};
const panelStyle = {
  background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: "16px 16px 0 0",
  padding: 20, width: "100%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto",
};
const titleStyle = { margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: T.ink };
const hintStyle = { margin: "0 0 10px", fontSize: 12.5, color: T.inkDim, lineHeight: 1.5 };
const rowStyle = { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderBottom: `1px solid ${T.borderSub}`, cursor: "pointer" };
const primaryBtn = (disabled) => ({
  background: disabled ? T.inset : T.cyan, color: disabled ? T.inkMuted : "#06181b",
  border: "none", borderRadius: T.radiusMd, padding: "9px 16px", fontSize: 13, fontWeight: 600,
  cursor: disabled ? "default" : "pointer",
});
const secondaryBtn = {
  background: "transparent", border: `1px solid ${T.borderMid}`, color: T.inkDim,
  borderRadius: T.radiusMd, padding: "9px 16px", fontSize: 13, cursor: "pointer",
};
