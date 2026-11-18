"use client";

/**
 * Animated measuring tape — scrolls from 0 to 225 cm continuously.
 * Matches the Atelier prototype CSS exactly:
 *   .tape { height:46px; background:#ffc43a; border-top/bottom 1.5px solid #000 }
 *   .tape-in { animation: tape 40s linear infinite; width:200% }
 */
export default function MeasuringTape({ className = "" }) {
  // Numbers from 0 to 225 at every 5cm. Duplicated twice for the seamless loop.
  const marks = Array.from({ length: 46 }, (_, i) => i * 5); // 0,5,10,...225
  const allMarks = [...marks, ...marks]; // doubled for seamless animation

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`relative h-[46px] w-full overflow-hidden select-none ${className}`}
      style={{
        background: "#ffc43a",
        borderTop: "1.5px solid #000",
        borderBottom: "1.5px solid #000",
      }}
    >
      {/* Tick marks layer — scrolling */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "200%",
          backgroundImage: [
            "repeating-linear-gradient(90deg,#000 0 1.5px,transparent 1.5px 12px)",
            "repeating-linear-gradient(90deg,#000 0 1.5px,transparent 1.5px 60px)",
          ].join(","),
          backgroundSize: "100% 12px, 100% 22px",
          backgroundRepeat: "repeat-x",
          backgroundPosition: "0 0, 0 0",
          animation: "nixie-tape 40s linear infinite",
        }}
      />

      {/* Numbers layer — scrolling in sync */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          paddingBottom: "5px",
          font: '600 11px/1 "Helvetica Neue", Helvetica, Arial, sans-serif',
          whiteSpace: "nowrap",
          width: "200%",
          animation: "nixie-tape 40s linear infinite",
        }}
      >
        {allMarks.map((num, idx) => (
          <span
            key={idx}
            style={{
              width: "60px",
              flex: "0 0 60px",
              paddingLeft: "4px",
              color: "#000",
              letterSpacing: "-0.02em",
            }}
          >
            {num}
          </span>
        ))}
      </div>

      {/* Keyframe injected via style tag — only once */}
      <style>{`
        @keyframes nixie-tape {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
