"use client";

import Image from "next/image";
import { Film } from "lucide-react";
import { useState } from "react";

type MovieImageProps = {
  src: string | null;
  alt: string;
  title?: string;
  sizes: string;
  priority?: boolean;
  variant?: "poster" | "backdrop";
};

export function MovieImage({ src, alt, title, sizes, priority = false, variant = "poster" }: MovieImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const unavailable = !src || failedSrc === src;

  if (unavailable) {
    return (
      <div className={`media-placeholder ${variant}`} role="img" aria-label={alt || "Imagem indisponível"}>
        <Film size={variant === "backdrop" ? 28 : 22} strokeWidth={1.5} />
        {variant === "poster" && title ? <span>{title}</span> : null}
      </div>
    );
  }

  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} onError={() => setFailedSrc(src)} />;
}
