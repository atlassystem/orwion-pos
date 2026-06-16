# demo.vercel.store — Page Topology

> Source: https://demo.vercel.store (Vercel's open-source Next.js Commerce demo, MIT).
> Extraction method: WebFetch (page content) + known structure of the public template.
> Browser MCP automation was unavailable (org Chrome policy blocked all navigation),
> so computed-style values below are the template's known design values, not live `getComputedStyle()`.
> Per project brief: brand/logo/text are NOT copied — only layout + component quality is
> reproduced with neutral placeholder content; recolored to the POS palette in Faz 0.

## Layout shell (every page)
1. **Navbar** — sticky-ish top bar, flow content. `flex items-center justify-between p-4 lg:px-6`.
   - Left: mobile menu button (`lg:hidden`) · logo square + store name · desktop nav links (All / category links).
   - Center: search input (`hidden md:flex`), placeholder "Search for products...".
   - Right: cart button with item-count badge.
2. **Page content** (`<main>`).
3. **Footer** — top border, logo + nav menu column + "Created by Vercel", bottom copyright bar.

## Homepage content (top → bottom)
1. **ThreeItemGrid** — hero grid. `mx-auto max-w-screen-2xl gap-4 px-4 lg:grid-cols-6 lg:grid-rows-2`.
   - Item 0 (featured): `lg:col-span-4 lg:row-span-2` (large square).
   - Item 1: `lg:col-span-2 lg:row-span-1`.
   - Item 2: `lg:col-span-2 lg:row-span-1`.
   - Each = GridTileImage (aspect-square, bordered, hover blue border + image zoom) with a floating Label pill (title + blue price tag).
2. **Carousel** — full-width horizontally auto-scrolling strip of products (marquee `animate-carousel`, duplicated list). Items `w-2/3 sm:w-1/3 md:w-1/4 lg:w-1/6`, aspect-square GridTileImage.

## Interaction model
- **Static** layout overall.
- **Carousel**: time-driven CSS marquee (infinite translateX), not click/scroll driven.
- **GridTileImage hover**: border → blue, image `scale-105`, CSS transition.
- **Navbar/Cart**: cart opens a slide-over (out of Faz -1 scope; cart is a non-functional button for the base).
- **Dark mode**: palette supports light/dark via `.dark` tokens (already in globals.css).

## Z-index / sticky
- No complex sticky overlays on the homepage. Navbar is normal flow at top.
