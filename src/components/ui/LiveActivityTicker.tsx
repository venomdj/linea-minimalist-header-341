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

  const renderItem = (msg: TickerMessage, key: string) => (
    <span key={key} className="lat-item inline-flex items-center shrink-0 px-4 sm:px-6">
      <span aria-hidden="true" className="text-[11px] sm:text-[13px] leading-none mr-2 sm:mr-2.5">
        {msg.icon}
      </span>
      <span className="font-mono text-[9.5px] sm:text-[10.5px] md:text-[11px] tracking-[0.14em] uppercase text-foreground/75 whitespace-nowrap">
        {msg.text}
      </span>
      <span aria-hidden="true" className="lat-dot ml-4 sm:ml-6" />
    </span>
  );

  return (
    <div
      className={`lat-wrap relative w-full flex items-stretch overflow-hidden border-y border-border/50 bg-background/70 backdrop-blur-[2px] ${className}`}
      style={wrapperStyle}
    >
      {/* Fixed, non-scrolling marker — anchors the strip like an exchange ticker symbol */}
      <div className="flex items-center gap-2 px-3 sm:px-4 border-r border-border/50 shrink-0 z-20 bg-background">
        <span className="relative flex h-[5px] w-[5px] sm:h-1.5 sm:w-1.5">
          <span className="lat-pulse absolute inset-0 rounded-full" />
          <span
            className="relative inline-flex h-full w-full rounded-full"
            style={{ background: "var(--lat-gold)" }}
          />
        </span>
        <span
          className="font-mono text-[9px] sm:text-[10px] tracking-[0.22em] uppercase"
          style={{ color: "var(--lat-cyan)" }}
        >
          Live
        </span>
      </div>

      {/* Scrolling region */}
      <div className="relative flex-1 min-w-0 overflow-hidden h-8 sm:h-9 md:h-10" aria-hidden="true">
        {/* Edge fade masks — messages ease in/out rather than cutting off */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-14 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-14 z-10 bg-gradient-to-l from-background to-transparent" />

        {reducedMotion ? (
          <div className="flex items-center justify-center h-full px-8">
            <span
              key={staticIndex}
              className="lat-fade-msg font-mono text-[9.5px] sm:text-[10.5px] md:text-[11px] tracking-[0.14em] uppercase text-foreground/75 whitespace-nowrap"
            >
              <span className="mr-2">{messages[staticIndex].icon}</span>
              {messages[staticIndex].text}
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
          background: var(--lat-gold-glow);
          animation: lat-pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes lat-pulse-ring {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0; transform: scale(2.4); }
        }
        .lat-dot {
          display: inline-block;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--lat-cyan);
          box-shadow: 0 0 5px 1px var(--lat-cyan-glow);
        }
        /* Alternate every third divider to gold for a quiet two-tone rhythm */
        .lat-item:nth-of-type(3n+1) .lat-dot {
          background: var(--lat-gold);
          box-shadow: 0 0 5px 1px var(--lat-gold-glow);
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
