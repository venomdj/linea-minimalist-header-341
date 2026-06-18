import { useEffect, useState, type CSSProperties } from "react";

interface TickerMessage {
  icon: string;
  text: string;
}

interface LiveActivityTickerProps {
  messages?: TickerMessage[];
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

const ACCENT_VARS = {
  "--lat-gold": "#D4AF37",
  "--lat-gold-glow": "rgba(212, 175, 55, 0.38)",
  "--lat-cyan": "#5EEAD4",
  "--lat-cyan-glow": "rgba(94, 234, 212, 0.32)",
};

const LiveActivityTicker = ({
  messages = DEFAULT_MESSAGES,
  speed = 34,
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
      <span className="font-sans font-medium text-[10px] sm:text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-foreground/80 whitespace-nowrap drop-shadow-sm">
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
      {/* Scrolling region */}
      <div className="relative flex-1 min-w-0 overflow-hidden h-8 sm:h-9 md:h-10" aria-hidden="true">
        {/* Edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-14 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-14 z-10 bg-gradient-to-l from-background to-transparent" />

        {reducedMotion ? (
          <div className="flex items-center justify-center h-full px-8">
            <span
              key={staticIndex}
              className="lat-fade-msg font-sans font-medium text-[10px] sm:text-[11px] md:text-[12px] tracking-[0.2em] uppercase text-foreground/80 whitespace-nowrap drop-shadow-sm"
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
        @media (hover: hover) and (pointer: fine) {
          .lat-wrap:hover .lat-track { animation-play-state: paused; }
        }
        .lat-dot {
          display: inline-block;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--lat-cyan);
          box-shadow: 0 0 5px 1px var(--lat-cyan-glow);
        }
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
