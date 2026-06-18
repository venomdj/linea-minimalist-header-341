import { useEffect, useState, type CSSProperties } from "react";

interface TickerMessage {
  icon: string;
  text: string;
}

interface LiveActivityTickerProps {
  /** Override the default rotating messages */
  messages?: TickerMessage[];
  /** Seconds for one full loop of the scrolling content — higher = slower, more unhurried */
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

// Accent tokens scoped to this component only. If your theme already has
// gold/cyan tokens, swap these for `var(--your-token)` to inherit them
// instead — everything below reads from these two CSS variables.
const ACCENT_VARS = {
  "--lat-gold": "#D4AF37",
  "--lat-gold-glow": "rgba(212, 175, 55, 0.38)",
  "--lat-cyan": "#5EEAD4",
  "--lat-cyan-glow": "rgba(94, 234, 212, 0.32)",
};

/**
 * LiveActivityTicker
 *
 * A thin, continuously-scrolling activity strip for the hero section.
 * Place it as a normal block-level sibling above your welcome heading —
 * it has no fixed/absolute positioning, so it can't overlap the navbar
 * or hero content; it just occupies its own height in the page flow.
 *
 * Usage:
 *   <LiveActivityTicker />
 *   <h1>Welcome back, {username}</h1>
 */
const LiveActivityTicker = ({
  messages = DEFAULT_MESSAGES,
  speed = 34,
  className = "",
}: LiveActivityTickerProps) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [staticIndex, setStaticIndex] = useState(0);

  // Respect prefers-reduced-motion, and keep listening in case the OS
  // setting changes mid-session.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Reduced-motion fallback: a gentle crossfade between messages instead
  // of continuous scrolling motion.
  useEffect(() => {
    if (!reducedMotion) return;
    const id = window.setInterval(() => {
      setStaticIndex((i) => (i + 1) % messages.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [reducedMotion, messages.length]);

  const wrapperStyle = {
    ...ACCENT_VARS,
    "--lat-duration": `${speed}s`,
  } as CSSProperties;

  // Split message text into an optional bolded "name" prefix and the rest.
  // Convention: if the text contains " just " or starts with a proper noun phrase
  // before a verb, we boldface the first word(s) up to the first verb keyword.
  const splitText = (text: string) => {
    const verbMatch = text.match(/^(.+?)\s+(just|shipped|joined|authenticated|updated|sold)\s/i);
    if (verbMatch) {
      const nameEnd = text.indexOf(verbMatch[2]);
      return { bold: text.slice(0, nameEnd).trim(), rest: text.slice(nameEnd).trim() };
    }
    return { bold: null, rest: text };
  };

  const renderItem = (msg: TickerMessage, key: string) => {
    const { bold, rest } = splitText(msg.text);
    return (
      <span key={key} className="lat-item inline-flex items-center shrink-0 px-5 sm:px-7">
        <span aria-hidden="true" className="text-[11px] sm:text-[12px] leading-none mr-2.5">
          {msg.icon}
        </span>
        <span className="font-mono text-[9px] sm:text-[10px] md:text-[10.5px] tracking-[0.18em] uppercase whitespace-nowrap">
          {bold && (
            <span className="lat-name" style={{ color: "var(--lat-gold)" }}>
              {bold}{" "}
            </span>
          )}
          <span className="text-foreground/60">{rest}</span>
        </span>
        <span aria-hidden="true" className="lat-sep mx-4 sm:mx-6 text-foreground/20 font-mono text-[10px] tracking-widest">·</span>
      </span>
    );
  };

  return (
    <div
      className={`lat-wrap relative w-full flex items-stretch overflow-hidden border-y border-border/30 bg-background/60 backdrop-blur-[2px] ${className}`}
      style={wrapperStyle}
    >
      {/* Scrolling region — no Live badge, full width */}
      <div className="relative flex-1 min-w-0 overflow-hidden h-8 sm:h-9 md:h-10" aria-hidden="true">
        {/* Edge fade masks — messages ease in/out rather than cutting off */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-14 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-14 z-10 bg-gradient-to-l from-background to-transparent" />

        {reducedMotion ? (
          <div className="flex items-center justify-center h-full px-8">
            <span
              key={staticIndex}
              className="lat-fade-msg font-mono text-[9px] sm:text-[10px] md:text-[10.5px] tracking-[0.18em] uppercase whitespace-nowrap"
            >
              <span className="mr-2.5">{messages[staticIndex].icon}</span>
              {(() => {
                const { bold, rest } = splitText(messages[staticIndex].text);
                return bold
                  ? <><span style={{ color: "var(--lat-gold)" }}>{bold} </span><span className="text-foreground/60">{rest}</span></>
                  : <span className="text-foreground/60">{rest}</span>;
              })()}
            </span>
          </div>
        ) : (
          <div className="lat-track flex items-center h-full">
            <div className="flex items-center">
              {messages.map((m, i) => renderItem(m, `a-${i}`))}
            </div>
            <div className="flex items-center">
              {messages.map((m, i) => renderItem(m, `b-${i}`))}
            </div>
          </div>
        )}
      </div>

      {/* Static, single-read summary for assistive tech — the animated strip above is hidden from it */}
      <span className="sr-only">
        Live activity: {messages.map((m) => m.text).join(". ")}.
      </span>

      <style>{`
        .lat-track {
          width: max-content;
          animation: lat-scroll var(--lat-duration, 34s) linear infinite;
          will-change: transform;
        }
        @keyframes lat-scroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        /* Pause on hover — desktop/mouse only, never on touch */
        @media (hover: hover) and (pointer: fine) {
          .lat-wrap:hover .lat-track { animation-play-state: paused; }
        }
        .lat-pulse {
          display: none;
        }
        .lat-dot {
          display: none;
        }
        .lat-fade-msg {
          animation: lat-fade-in 0.7s ease;
        }
        @keyframes lat-fade-in {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lat-track { animation: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LiveActivityTicker;
