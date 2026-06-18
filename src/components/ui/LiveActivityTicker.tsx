import { useEffect, useState } from "react";

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

const LiveActivityTicker = ({
  messages = DEFAULT_MESSAGES,
  speed = 80,
  className = "",
}: LiveActivityTickerProps) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [staticIndex, setStaticIndex] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!reducedMotion) return;
    const id = setInterval(() => setStaticIndex((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(id);
  }, [reducedMotion, messages.length]);

  // Each message: ~300px average width. With 8 messages × 300px = ~2400px per set.
  // We render 4 copies so even on 4K screens the strip always overflows.
  // Animation moves by exactly 25% (= 1 copy width) so the loop is seamless.
  const COPIES = 4;
  const estimatedOneCopyWidth = messages.length * 300;
  const durationSeconds = estimatedOneCopyWidth / speed;

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
          {bold && (
            <span style={{ color: GOLD }}>{bold} </span>
          )}
          <span style={{ color: MUTED }}>{rest}</span>
        </span>
        <span style={{ margin: "0 20px", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>·</span>
      </span>
    );
  };

  // Wrapper: full width, clips overflow, thin strip height
  const wrapperStyle: React.CSSProperties = {
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

  // The scrolling track: all copies side by side, animated left
  // translateX goes from 0 to -(100/COPIES)% = -25%
  // Since we have 4 identical copies, moving -25% = exactly 1 copy width
  const trackStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    height: "100%",
    flexShrink: 0,
    // animation applied via <style> below using a unique class
  };

  return (
    <div style={wrapperStyle} className={`mvticker-wrap ${className}`}>
      {/* Left fade mask */}
      <div style={{
        pointerEvents: "none",
        position: "absolute",
        top: 0, bottom: 0, left: 0,
        width: 60,
        zIndex: 10,
        background: "linear-gradient(to right, #000 0%, transparent 100%)",
      }} />
      {/* Right fade mask */}
      <div style={{
        pointerEvents: "none",
        position: "absolute",
        top: 0, bottom: 0, right: 0,
        width: 60,
        zIndex: 10,
        background: "linear-gradient(to left, #000 0%, transparent 100%)",
      }} />

      {reducedMotion ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "0 60px" }}>
          <span
            key={staticIndex}
            style={{
              fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              animation: "mvticker-fade 0.6s ease",
            }}
          >
            <span style={{ marginRight: 8 }}>{messages[staticIndex].icon}</span>
            {(() => {
              const { bold, rest } = splitText(messages[staticIndex].text);
              return bold
                ? <><span style={{ color: GOLD }}>{bold} </span><span style={{ color: MUTED }}>{rest}</span></>
                : <span style={{ color: MUTED }}>{rest}</span>;
            })()}
          </span>
        </div>
      ) : (
        <div
          className="mvticker-track"
          style={{
            ...trackStyle,
            animationDuration: `${durationSeconds}s`,
          }}
        >
          {Array.from({ length: COPIES }, (_, ci) => (
            <div key={ci} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              {messages.map((m, i) => renderItem(m, `${ci}-${i}`))}
            </div>
          ))}
        </div>
      )}

      <span className="sr-only">
        Live activity: {messages.map((m) => m.text).join(". ")}.
      </span>

      <style>{`
        @keyframes mvticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .mvticker-track {
          animation-name: mvticker-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        @media (hover: hover) and (pointer: fine) {
          .mvticker-wrap:hover .mvticker-track {
            animation-play-state: paused;
          }
        }
        @keyframes mvticker-fade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mvticker-track { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LiveActivityTicker;
