import Link from "next/link";
import { FEATURED } from "@/lib/placeholder-data";
import type { Product } from "@/types";
import { GridTileImage } from "./tile";

function ThreeItemGridItem({
  product,
  size,
}: {
  product: Product;
  size: "full" | "half";
}) {
  return (
    <div
      className={
        size === "full"
          ? "md:col-span-4 md:row-span-2"
          : "md:col-span-2 md:row-span-1"
      }
    >
      <Link
        className="relative block aspect-square h-full w-full"
        href={`/product/${product.handle}`}
        prefetch={true}
      >
        <GridTileImage
          gradient={product.gradient}
          emoji={product.emoji}
          label={{
            position: size === "full" ? "center" : "bottom",
            title: product.title,
            amount: product.price.amount,
            currencyCode: product.price.currencyCode,
          }}
        />
      </Link>
    </div>
  );
}

export function ThreeItemGrid() {
  const [first, second, third] = FEATURED;
  if (!first || !second || !third) return null;

  return (
    <section className="mx-auto grid max-w-screen-2xl gap-4 px-4 pb-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[calc(100vh-200px)]">
      <ThreeItemGridItem size="full" product={first} />
      <ThreeItemGridItem size="half" product={second} />
      <ThreeItemGridItem size="half" product={third} />
    </section>
  );
}
