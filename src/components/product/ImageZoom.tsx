import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageZoomProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageZoom = ({ images, initialIndex, isOpen, onClose }: ImageZoomProps) => {
  const [current, setCurrent] = useState(initialIndex);

  // Sync index when modal opens
  useEffect(() => {
    if (isOpen) setCurrent(initialIndex);
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((c) => Math.min(c + 1, images.length - 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(c - 1, 0));
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, images.length]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasPrev = current > 0;
  const hasNext = current < images.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 z-0" onClick={onClose} />

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => c - 1); }}
          aria-label="Previous image"
          className="absolute left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <div className="relative z-10 flex items-center justify-center w-full h-full px-16 py-12">
        <img
          key={current}
          src={images[current]}
          alt={`Product view ${current + 1}`}
          className="max-h-full max-w-full object-contain animate-fade-in"
          style={{ maxHeight: "calc(100vh - 96px)", maxWidth: "min(600px, calc(100vw - 128px))" }}
        />
      </div>

      {/* Next */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => c + 1); }}
          aria-label="Next image"
          className="absolute right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Dot indicators (only if multiple images) */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              aria-label={`View image ${i + 1}`}
              className={`h-px transition-all duration-300 ${i === current ? "w-8 bg-white" : "w-4 bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageZoom;
