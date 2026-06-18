import { useEffect, useRef, useState, type CSSProperties } from "react";

interface TickerMessage {
  icon: string;
  text: string;
}

interface LiveActivityTickerProps {
  messages?: TickerMessage[];
  /** Pixels per second — higher = faster */
  pixelsPerSecond?: number;
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
  "--lat-cyan": "#5EEAD4",
};

const LiveActivityTicker = ({
  messages = DEFAULT_MESSAGES,
  pixelsPerSecond = 60,
  className = "",
}: LiveActivityTickerProps) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [staticIndex, setStaticIndex] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Reduced-motion crossfade fallback
  useEffect(() => {
    if (!reducedMotion) return;
    const id = window.setInterval(() => {
      setStaticIndex((i) => (i + 1) % messages.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [reducedMotion, messages.length]);

  // Measure one copy of the strip to derive exact pixel duration.
  // This is the key fix: we animate by the exact pixel width of one copy,
  // not by a percentage, so it always loops perfectly on any screen size.
  useEffect(() => {
    if (reducedMotion || !stripRef.current) return;
    const measure = () => {
      if (!stripRef.current) return;
      // stripRef points to the first copy div; its scrollWidth = one copy width
      const oneSetWidth = stripRef.current.scrollWidth;
      if (oneSetWidth > 0) {
        setDuration(oneSetWidth / pixelsPerSecond);
      }
    };
    measure();
    // Re-measure if fonts/layout shift (e.g. after hydration)
    const ro = new ResizeObserver(measure);
    ro.observe(stripRef.current);
    return () => ro.disconnect();
  }, [reducedMotion, messages, pixelsPerSecond]);

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
            <span style={{ color: "var(--lat-gold)" }}>
              {bold}{" "}
            </span>
          )}
          <span className="text-foreground/60">{rest}</span>
        </span>
        <span aria-hidden="true" className="lat-sep mx-4 sm:mx-6 text-foreground/20 font-mono text-[10px]">·</span>
      </span>
    );
  };

  // The animation uses a CSS custom property set inline so the keyframe
  // can reference the exact one-copy width in pixels — works on all screens.
  const trackStyle = duration
    ? ({
        "--lat-one-copy-width": `${stripRef.current?.scrollWidth ?? 0}px`,
        animationDuration: `${duration}s`,
      } as CSSProperties)
    : ({ opacity: 0 } as CSSProperties); // hide until measured to avoid flash

  return (
    <div
      className={`lat-wrap relative w-full overflow-hidden border-y border-border/30 bg-background/60 backdrop-blur-[2px] h-8 sm:h-9 md:h-10 flex items-center ${className}`}
      style={ACCENT_VARS as CSSProperties}
    >
      {/* Edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-16 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-16 z-10 bg-gradient-to-l from-background to-transparent" />

      {reducedMotion ? (
        <div className="flex items-center justify-center w-full px-8" aria-hidden="true">
          <span key={staticIndex} className="lat-fade-msg font-mono text-[9px] sm:text-[10px] md:text-[10.5px] tracking-[0.18em] uppercase whitespace-nowrap">
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
        // Two copies side-by-side. We animate translateX by exactly -oneSetWidth px,
        // so as the first copy scrolls off-left, the second copy (identical) is already
        // in place — seamless, zero jump, works at any viewport width.
        <div className="lat-track flex items-center h-full" style={trackStyle} aria-hidden="true">
          <div ref={stripRef} className="flex items-center shrink-0">
            {messages.map((m, i) => renderItem(m, `a-${i}`))}
          </div>
          <div className="flex items-center shrink-0">
            {messages.map((m, i) => renderItem(m, `b-${i}`))}
          </div>
        </div>
      )}

      <span className="sr-only">
        Live activity: {messages.map((m) => m.text).join(". ")}.
      </span>

      <style>{`
        .lat-track {
          will-change: transform;
          animation: lat-scroll linear infinite;
        }
        @keyframes lat-scroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(calc(-1 * var(--lat-one-copy-width)), 0, 0); }
        }
        @media (hover: hover) and (pointer: fine) {
          .lat-wrap:hover .lat-track { animation-play-state: paused; }
        }
        .lat-fade-msg {
          animation: lat-fade-in 0.7s ease;
        }
        @keyframes lat-fade-in {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lat-track { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LiveActivityTicker;
