import Link from "next/link";
import { PRODUCTS } from "@/lib/placeholder-data";
import { GridTileImage } from "./grid/tile";

export function Carousel() {
  if (!PRODUCTS.length) return null;

  // Render the list twice so the -50% marquee keyframe loops seamlessly.
  const carouselProducts = [...PRODUCTS, ...PRODUCTS];

  return (
    <div className="w-full overflow-x-auto pb-6 pt-1">
      <ul className="flex animate-carousel gap-4">
        {carouselProducts.map((product, i) => (
          <li
            key={`${product.handle}-${i}`}
            className="relative aspect-square h-[30vh] max-h-[275px] w-2/3 max-w-[475px] flex-none md:w-1/3"
          >
            <Link
              href={`/product/${product.handle}`}
              prefetch={true}
              className="relative block h-full w-full"
            >
              <GridTileImage
                gradient={product.gradient}
                emoji={product.emoji}
                label={{
                  title: product.title,
                  amount: product.price.amount,
                  currencyCode: product.price.currencyCode,
                }}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
