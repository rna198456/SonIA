import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { T } from "../utils/theme";
import { downloadTableAsCSV, copyTableAsTSV } from "../utils/csv";

/** Tabla + fila de acciones (Copiar / Descargar CSV) debajo. */
function MarkdownTable({ children }) {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyTableAsTSV(ref.current);
    setCopied(ok);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ margin: "10px 0" }}>
      <div style={{ overflowX: "auto", border: `1px solid ${T.borderSub}`, borderRadius: T.radiusMd }}>
        <table ref={ref} style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
          {children}
        </table>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button onClick={handleCopy} style={btnStyle}>
          {copied ? "Copiado ✓" : "Copiar (Sheets)"}
        </button>
        <button onClick={() => downloadTableAsCSV(ref.current, "sonia")} style={btnStyle}>
          Descargar CSV
        </button>
      </div>
    </div>
  );
}

const btnStyle = {
  fontSize: 11, fontFamily: T.fontMono, color: T.inkDim, background: T.inset,
  border: `1px solid ${T.borderMid}`, borderRadius: T.radiusSm, padding: "4px 9px",
  cursor: "pointer",
};

const mdComponents = {
  table: ({ children }) => <MarkdownTable>{children}</MarkdownTable>,
  thead: ({ children }) => <thead style={{ background: T.inset }}>{children}</thead>,
  th: ({ children }) => (
    <th style={{ textAlign: "left", padding: "7px 10px", borderBottom: `1px solid ${T.borderMid}`, color: T.ink, fontFamily: T.fontMono, fontSize: 12 }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSub}`, color: T.inkDim, verticalAlign: "top" }}>
      {children}
    </td>
  ),
  code: ({ inline, className, children }) =>
    inline ? (
      <code style={{ background: T.inset, padding: "1px 5px", borderRadius: 4, fontFamily: T.fontMono, fontSize: 12.5 }}>
        {children}
      </code>
    ) : (
      <pre style={{ background: T.inset, border: `1px solid ${T.borderSub}`, borderRadius: T.radiusMd, padding: 12, overflowX: "auto" }}>
        <code style={{ fontFamily: T.fontMono, fontSize: 12.5, color: T.ink }}>{children}</code>
      </pre>
    ),
  li: ({ children, className }) => (
    <li className={className} style={{ margin: "3px 0" }}>{children}</li>
  ),
  strong: ({ children }) => <strong style={{ color: T.ink }}>{children}</strong>,
};

export default function Message({ role, content, loading = false }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", padding: "6px 0" }}>
      <article
        style={{
          maxWidth: "88%", background: isUser ? T.cyanBg : T.card,
          border: `1px solid ${isUser ? T.cyanBorder : T.borderSub}`,
          borderRadius: T.radiusLg, padding: "12px 14px",
          color: T.ink, fontSize: 14.5, lineHeight: 1.55,
        }}
      >
        {loading ? (
          <span style={{ color: T.inkDim, fontFamily: T.fontMono, fontSize: 13 }}>Generando…</span>
        ) : isUser ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{content}</span>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {content}
          </ReactMarkdown>
        )}
      </article>
    </div>
  );
}
