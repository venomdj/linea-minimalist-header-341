import { useState } from "react";
import { useParams } from "react-router-dom";
import ImageZoom from "./ImageZoom";
import { getProduct } from "@/data/products";
import card01 from "@/assets/card-product-01.jpg";
import card02 from "@/assets/card-product-02.jpg";
import card03 from "@/assets/card-product-03.jpg";
import card04 from "@/assets/card-product-04.jpg";

const ProductImageGallery = () => {
  const { productId } = useParams();
  const product = getProduct(productId ?? 1);
  const images = [product.image, product.hoverImage ?? card02, card03, card04, card01].filter(Boolean) as string[];

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
