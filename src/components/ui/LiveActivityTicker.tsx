import type { CSSProperties } from "react";

interface TickerMessage {
  icon: string;
  text: string;
}

interface LiveActivityTickerProps {
  messages?: TickerMessage[];
  /** px/second scroll speed */
  speed?: number;
  className?: string;
}

const DEFAULT_MESSAGES: TickerMessage[] = [
  { icon: "🔥", text: "Arjun just secured a Blue-Eyes White Dragon" },
  { icon: "🚚", text: "1,200+ orders shipped securely" },
  { icon: "⭐", text: "New collector joined from Mumbai" },
  { icon: "💎", text: "Rare cards authenticated daily" },
  { icon: "🛡️", text: "100% secure transactions" },
  { icon: "⚡", text: "Limited inventory updated" },
  { icon: "📦", text: "Pan-India insured shipping" },
  { icon: "🎴", text: "Collector sold a PSA 10 card" },
];

const GOLD = "#D4AF37";
const MUTED = "rgba(255,255,255,0.45)";

// 4 identical copies side-by-side. Animation moves -25% (= exactly 1 copy width).
// Works on any screen size — no measurement, no JS, no media-query branches.
const COPIES = 4;

const LiveActivityTicker = ({
  messages = DEFAULT_MESSAGES,
  speed = 80,
  className = "",
}: LiveActivityTickerProps) => {
  // Estimated width of one copy: ~300px per message item (conservative)
  const durationSeconds = (messages.length * 300) / speed;

  const splitText = (text: string) => {
    const m = text.match(/^(.+?)\s+(just|shipped|joined|authenticated|updated|sold)\s/i);
    if (m) {
      const idx = text.indexOf(m[2]);
      return { bold: text.slice(0, idx).trim(), rest: text.slice(idx).trim() };
    }
    return { bold: null, rest: text };
  };

  const renderItem = (msg: TickerMessage, key: string) => {
    const { bold, rest } = splitText(msg.text);
    return (
      <span
        key={key}
        style={{
          display: "inline-flex",
          alignItems: "center",
          flexShrink: 0,
          padding: "0 28px",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 12, marginRight: 9, lineHeight: 1 }}>{msg.icon}</span>
        <span
          style={{
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {bold && <span style={{ color: GOLD }}>{bold} </span>}
          <span style={{ color: MUTED }}>{rest}</span>
        </span>
        <span style={{ margin: "0 20px", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>·</span>
      </span>
    );
  };

  const wrapperStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    height: 36,
    display: "flex",
    alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(2px)",
  };

  return (
    <div style={wrapperStyle} className={`mvticker-wrap ${className}`}>
      {/* Fade masks */}
      <div style={{
        pointerEvents: "none", position: "absolute",
        top: 0, bottom: 0, left: 0, width: 60, zIndex: 10,
        background: "linear-gradient(to right, #000 0%, transparent 100%)",
      }} />
      <div style={{
        pointerEvents: "none", position: "absolute",
        top: 0, bottom: 0, right: 0, width: 60, zIndex: 10,
        background: "linear-gradient(to left, #000 0%, transparent 100%)",
      }} />

      {/* Scrolling track — always animating, no conditional branches */}
      <div
        className="mvticker-track"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {Array.from({ length: COPIES }, (_, ci) => (
          <div key={ci} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {messages.map((m, i) => renderItem(m, `${ci}-${i}`))}
          </div>
        ))}
      </div>

      <span className="sr-only">
        Live activity: {messages.map((m) => m.text).join(". ")}.
      </span>

      <style>{`
        .mvticker-track {
          display: flex;
          align-items: center;
          height: 36px;
          flex-shrink: 0;
          will-change: transform;
          animation-name: mvticker-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes mvticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        @media (hover: hover) and (pointer: fine) {
          .mvticker-wrap:hover .mvticker-track {
            animation-play-state: paused;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveActivityTicker;
