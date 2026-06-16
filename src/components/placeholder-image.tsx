import { cn } from "@/lib/utils";

/**
 * Offline placeholder used instead of brand product photos.
 * Renders a gradient field with a centered emoji — fully self-contained,
 * no network assets. Mirrors the gradient+emoji fallback used in the POS design.
 */
export function PlaceholderImage({
  gradient,
  emoji,
  className,
}: {
  gradient: string;
  emoji: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      style={{ background: gradient }}
    >
      <span className="select-none text-5xl drop-shadow-sm">{emoji}</span>
    </div>
  );
}
