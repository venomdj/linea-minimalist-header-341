import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from "lucide-react";
import { useActiveAnnouncement, type Announcement } from "@/hooks/useAnnouncement";

const TYPE_STYLES: Record<
  Announcement["type"],
  { icon: typeof Info; ring: string; text: string; glow: string; label: string }
> = {
  info: {
    icon: Info,
    ring: "border-rarity-rare/40 bg-rarity-rare/10",
    text: "text-rarity-rare",
    glow: "shadow-[0_0_60px_-12px_hsl(var(--rarity-rare)/0.55)]",
    label: "Notice",
  },
  warning: {
    icon: AlertTriangle,
    ring: "border-accent/40 bg-accent/10",
    text: "text-accent",
    glow: "shadow-[0_0_60px_-12px_hsl(var(--accent)/0.55)]",
    label: "Important",
  },
  success: {
    icon: CheckCircle2,
    ring: "border-verified/40 bg-verified/10",
    text: "text-verified",
    glow: "shadow-[0_0_60px_-12px_hsl(var(--verified)/0.55)]",
    label: "Update",
  },
  error: {
    icon: OctagonAlert,
    ring: "border-destructive/40 bg-destructive/10",
    text: "text-destructive",
    glow: "shadow-[0_0_60px_-12px_hsl(var(--destructive)/0.5)]",
    label: "Urgent",
  },
};

const Cta = ({
  href,
  label,
  className,
  onClick,
}: {
  href: string;
  label: string;
  className: string;
  onClick?: () => void;
}) => {
  const isExternal = /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {label}
      </a>
    );
  }
  return (
    <Link to={href} className={className} onClick={onClick}>
      {label}
    </Link>
  );
};

const AnnouncementSystem = () => {
  const { announcement } = useActiveAnnouncement();
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const seenKey = announcement ? `mv_ann_seen_${announcement.id}_${announcement.updated_at}` : null;
  const bannerKey = announcement ? `mv_ann_banner_${announcement.id}_${announcement.updated_at}` : null;

  const style = useMemo(
    () => TYPE_STYLES[announcement?.type ?? "info"] ?? TYPE_STYLES.info,
    [announcement?.type],
  );
  const Icon = style.icon;

  // Session-scoped modal + persisted banner dismissal
  useEffect(() => {
    if (!announcement || !seenKey || !bannerKey) {
      setModalOpen(false);
      setBannerDismissed(false);
      return;
    }
    setBannerDismissed(localStorage.getItem(bannerKey) === "1");

    const showsModal = announcement.display_mode === "modal" || announcement.display_mode === "both";
    if (showsModal && sessionStorage.getItem(seenKey) !== "1") {
      const t = setTimeout(() => {
        setModalOpen(true);
        requestAnimationFrame(() => setMounted(true));
      }, 450);
      return () => clearTimeout(t);
    }
  }, [announcement, seenKey, bannerKey]);

  // Lock scroll while modal is open
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  const closeModal = () => {
    setMounted(false);
    if (seenKey) sessionStorage.setItem(seenKey, "1");
    setTimeout(() => setModalOpen(false), 260);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  if (!announcement) return null;

  const showsBanner = announcement.display_mode === "banner" || announcement.display_mode === "both";

  const dismissBanner = () => {
    if (bannerKey) localStorage.setItem(bannerKey, "1");
    setBannerDismissed(true);
  };

  return (
    <>
      {/* ── Slim top banner ── */}
      {showsBanner && !bannerDismissed && (
        <div
          role="status"
          className={`relative z-[55] w-full border-b ${style.ring} backdrop-blur-xl animate-fade-in`}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center gap-3">
            <Icon size={14} className={`${style.text} shrink-0`} strokeWidth={2} aria-hidden />
            <p className="flex-1 min-w-0 text-[11px] sm:text-xs text-foreground/90 leading-snug">
              <span className="font-semibold">{announcement.title}</span>
              <span className="hidden sm:inline text-foreground/60"> — {announcement.message}</span>
            </p>
            {announcement.cta_link && announcement.cta_label && (
              <Cta
                href={announcement.cta_link}
                label={announcement.cta_label}
                className={`hidden sm:inline-block shrink-0 text-[10px] font-mono tracking-widest uppercase px-3 py-1 border ${style.ring} ${style.text} hover:opacity-80 transition-opacity`}
              />
            )}
            <button
              onClick={dismissBanner}
              aria-label="Dismiss announcement"
              className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Fullscreen welcome modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-title"
        >
          <div
            onClick={closeModal}
            className={`absolute inset-0 bg-background/70 backdrop-blur-md transition-opacity duration-300 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`relative w-full max-w-md glass border border-border/60 ${style.glow} p-6 sm:p-8 transition-all duration-300 ${
              mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
            }`}
            style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
          >
            <button
              onClick={closeModal}
              aria-label="Close announcement"
              className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`relative mb-5 h-14 w-14 flex items-center justify-center rounded-full border ${style.ring}`}>
                <span className={`absolute inset-0 rounded-full border ${style.ring} animate-ping opacity-40`} />
                <Icon size={24} className={style.text} strokeWidth={1.75} aria-hidden />
              </div>

              <p className="eyebrow mb-3">{style.label}</p>
              <h2 id="announcement-title" className="text-xl sm:text-2xl font-semibold tracking-tight mb-3">
                {announcement.title}
              </h2>
              <p className="text-sm leading-relaxed text-foreground/75 whitespace-pre-line">
                {announcement.message}
              </p>

              <div className="mt-7 w-full flex flex-col sm:flex-row gap-2">
                {announcement.cta_link && announcement.cta_label && (
                  <Cta
                    href={announcement.cta_link}
                    label={announcement.cta_label}
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground text-[11px] font-mono tracking-widest uppercase hover:bg-primary-hover transition-colors text-center"
                  />
                )}
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-border text-[11px] font-mono tracking-widest uppercase text-foreground/80 hover:bg-surface-2 transition-colors"
                >
                  Continue browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementSystem;
