# demo.vercel.store — Behaviors

> Limitation: live interaction sweep not possible (browser blocked by org policy).
> Behaviors below reflect the known Next.js Commerce template design.

## Carousel (time-driven)
- Infinite marquee. Product list is rendered twice; a CSS keyframe translates the track
  from `0` to `-100%` over ~`Ns` linear, looping. No pause control in the base demo.
- Implementation: `animate-carousel` keyframe in globals.css + `ul.flex` track.

## GridTileImage hover
- Default: `border-neutral-200 dark:border-neutral-800`.
- Hover: `border-blue-600`, inner `<img>` gets `scale-105`.
- Transition: `transition duration-300 ease-in-out` on border + transform.

## Label pill
- Floating bottom-left over each tile: `bg-white/70 backdrop-blur-md` (dark: `bg-black/70`),
  rounded-full, border. Title (line-clamp-2) + price chip `bg-blue-600 text-white rounded-full`.

## Responsive
- **Desktop (≥1024px)**: ThreeItemGrid is 6-col / 2-row; carousel items `w-1/6`.
- **Tablet (768–1023px)**: grid collapses toward single column (items stack); search visible (`md:flex`); carousel items `w-1/4`.
- **Mobile (<768px)**: nav links + search hidden; mobile menu button shown; grid items stack full-width; carousel items `w-2/3`.

## Navbar scroll
- No shrink/elevation change on scroll in the base template.
