import { T } from "../utils/theme";

/**
 * Barras estilo VU-metro. En reposo (active=false) quedan bajas y quietas —
 * como un grabador en standby. Mientras SonIA está generando (active=true)
 * "respiran" en loop, como señal entrando.
 */
export default function LevelMeter({ active = false, size = 16 }) {
  const bars = [
    { h: 0.55, color: T.green,  delay: "0s" },
    { h: 0.85, color: T.amber,  delay: "0.12s" },
    { h: 1.0,  color: T.red,    delay: "0.24s" },
  ];

  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 3, height: size }}
      aria-hidden="true"
    >
      {bars.map((b, i) => (
        <span
          key={i}
          style={{
            width: Math.max(3, size / 5),
            height: active ? "100%" : `${b.h * 35}%`,
            background: b.color,
            borderRadius: 1,
            transformOrigin: "bottom",
            animation: active ? `sonia-meter 0.9s ease-in-out infinite alternate` : "none",
            animationDelay: b.delay,
            opacity: active ? 1 : 0.55,
            transition: "height 0.2s ease, opacity 0.2s ease",
          }}
        />
      ))}
    </div>
  );
}
