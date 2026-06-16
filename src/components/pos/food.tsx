"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FoodProps {
  img?: string;
  emoji: string;
  grad: string;
  className?: string;
}

/** Yüklenince fotoğraf, yüklenemezse degrade + emoji fallback. */
export function Food({ img, emoji, grad, className }: FoodProps) {
  const [ok, setOk] = useState(false);
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: grad }}
    >
      <div className="absolute inset-0 flex items-center justify-center text-3xl select-none">
        {emoji}
      </div>
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt=""
          loading="lazy"
          onLoad={() => setOk(true)}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className={cn(
            "fade-img absolute inset-0 h-full w-full object-cover",
            ok && "on",
          )}
        />
      )}
    </div>
  );
}
