import type { SVGProps } from "react";

/** Neutral square logo mark (not copied from the reference brand). */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 24 L16 6 L26 24" />
      <path d="M11 24 L16 15 L21 24" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx={11} cy={11} r={7} />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function CartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 4h2l2.4 12.3a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 8H6" />
      <circle cx={9} cy={20} r={1.3} />
      <circle cx={18} cy={20} r={1.3} />
    </svg>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
