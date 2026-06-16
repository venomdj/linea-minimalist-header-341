import { useState } from "react";
import { Share2, Check } from "lucide-react";
import ImageZoom from "./ImageZoom";
import type { Product } from "@/data/products";

interface Props { product: Product; }

const ShareButton = ({ product }: { product: Product }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger the image zoom underneath
    const url = window.location.href;
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on Mythical Vault`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user dismissed the native share sheet — no action needed
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied — fail silently
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label="Share product"
      className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-sm border border-border/40 hover:bg-background transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-foreground" /> : <Share2 className="w-4 h-4 text-foreground" />}
    </button>
  );
};

const ProductImageGallery = ({ product }: Props) => {
  const images = [product.image, product.hoverImage].filter(Boolean) as string[];

  const [current, setCurrent] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

  const handleClick = (i: number) => { setZoomIndex(i); setZoomOpen(true); };

  return (
    <div className="w-full">
      {/* Desktop — vertical column */}
      <div className="hidden lg:block space-y-3">
        {images.map((img, i) => (
          <div
            key={i}
            onClick={() => handleClick(i)}
            className="relative aspect-[4/5] overflow-hidden cursor-zoom-in bg-surface-1 group"
          >
            <img
              src={img}
              alt={`${product.name} view ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="w-full h-full object-cover transition-transform duration-[1400ms] ease-expo-out group-hover:scale-105"
            />
            {i === 0 && <ShareButton product={product} />}
          </div>
        ))}
      </div>

      {/* Mobile/tablet — slider */}
      <div className="lg:hidden">
        <div
          onClick={() => handleClick(current)}
          className="relative aspect-[4/5] overflow-hidden cursor-zoom-in bg-surface-1"
        >
          <img src={images[current]} alt={product.name} className="w-full h-full object-cover" />
          <ShareButton product={product} />
        </div>
        <div className="flex justify-center mt-4 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-px transition-all duration-500 ${i === current ? "w-8 bg-foreground" : "w-4 bg-foreground/30"}`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <ImageZoom images={images} initialIndex={zoomIndex} isOpen={zoomOpen} onClose={() => setZoomOpen(false)} />
    </div>
  );
};

export default ProductImageGallery;
