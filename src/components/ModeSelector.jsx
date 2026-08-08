import { T } from "../utils/theme";
import { MODES } from "../data/sonPrompt";

const COLOR_MAP = {
  cyan:  { fg: T.cyan,  bg: T.cyanBg,  border: T.cyanBorder },
  amber: { fg: T.amber, bg: T.amberBg, border: T.amberBorder },
  green: { fg: T.green, bg: T.greenBg, border: T.greenBorder },
  red:   { fg: T.red,   bg: T.redBg,   border: T.redBorder },
};

export default function ModeSelector({ activeMode, onSelect }) {
  return (
    <div
      style={{
        display: "flex", gap: 6, overflowX: "auto", padding: "10px 12px",
        borderBottom: `1px solid ${T.borderSub}`, background: T.surface,
      }}
    >
      {MODES.map(mode => {
        const isActive = mode.id === activeMode;
        const c = COLOR_MAP[mode.color] || COLOR_MAP.cyan;
        return (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            title={mode.desc}
            style={{
              flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, padding: "8px 12px", borderRadius: T.radiusMd, cursor: "pointer",
              background: isActive ? c.bg : "transparent",
              border: `1px solid ${isActive ? c.border : "transparent"}`,
              transition: "background 0.15s ease, border-color 0.15s ease",
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: isActive ? c.fg : T.borderStr,
              }}
            />
            <span
              style={{
                fontSize: 11, fontFamily: T.fontMono, whiteSpace: "nowrap",
                color: isActive ? c.fg : T.inkDim, letterSpacing: "0.01em",
              }}
            >
              {mode.icon} {mode.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
