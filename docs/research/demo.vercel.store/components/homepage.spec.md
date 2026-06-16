# Homepage Storefront — Specification

## Overview
- **Target files:** `src/components/layout/navbar/*`, `src/components/layout/footer.tsx`,
  `src/components/grid/*`, `src/components/carousel.tsx`, `src/app/page.tsx`.
- **Interaction model:** static + time-driven carousel + hover states.
- **Content policy:** neutral placeholder store ("Demo Store"), generic product names,
  offline gradient placeholder images (no brand assets copied).

## Navbar
- Wrapper: `relative flex items-center justify-between p-4 lg:px-6`.
- Logo square: `flex h-10 w-10 items-center justify-center rounded-xl border bg-white dark:bg-black`,
  contains a small logo mark SVG. Next to it: store name `text-sm font-medium uppercase`, `hidden lg:block`.
- Desktop nav: `hidden gap-6 text-sm md:flex` — links "All", "Apparel", "Accessories" (neutral categories).
- Search: `relative w-full max-w-[550px]` input, `rounded-lg border bg-white px-4 py-2 text-sm dark:bg-transparent`,
  magnifier icon absolute right; container `hidden justify-center md:flex md:w-1/3`.
- Cart: button `relative flex h-11 w-11 items-center justify-center rounded-md border bg-white dark:bg-black`,
  cart icon + small badge with count.

## ThreeItemGrid
- `grid gap-4 lg:grid-cols-6 lg:grid-rows-2`, wrapped in `mx-auto max-w-screen-2xl px-4 pb-4`.
- size="full" item → `md:col-span-4 md:row-span-2`. size="half" items → `md:col-span-2 md:row-span-1`.

## GridTileImage
- Container: `group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-white dark:bg-black hover:border-blue-600`.
- Active (current page) border-blue-600, else `border-neutral-200 dark:border-neutral-800`.
- Image area: gradient placeholder, `group-hover:scale-105 transition duration-300 ease-in-out`.
- Label (if title): absolute bottom pill — `bg-white/70 dark:bg-black/70 backdrop-blur-md`, title + price chip `bg-blue-600 text-white`.

## Carousel
- `w-full overflow-x-auto pb-6 pt-1`, inner `ul` `flex animate-carousel gap-4`,
  product list duplicated; items `relative aspect-square h-[30vh] max-h-[275px] w-2/3 ... sm:w-1/3 md:w-1/4 lg:w-1/6`.

## Footer
- `border-t border-neutral-200 dark:border-neutral-700`.
- Inner: `mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-12 md:flex-row md:gap-12`.
- Left: logo square + store name. Middle: menu list (Home, About, Terms & Conditions, Shipping & Return Policy, Privacy Policy, FAQ). Right: "Created by ▲ Vercel"-style credit → replaced with neutral "Built with Next.js".
- Bottom bar: `border-t py-6 text-sm`, copyright `© <years> Demo Store` + GitHub-style source link (neutral).

## Color tokens (base template)
- Light: bg white, text near-black neutral-900; borders neutral-200; accent blue-600 (`#2563eb`).
- Dark: bg near-black (neutral-950), text neutral-100; borders neutral-800.
- (These are recolored to espresso/sand/amber/gold POS palette in Faz 0.)
