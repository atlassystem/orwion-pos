import type { MenuItem, Product } from "@/types";

const G = {
  slate: "linear-gradient(135deg,#1f2937,#475569)",
  blue: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
  stone: "linear-gradient(135deg,#44403c,#78716c)",
  rose: "linear-gradient(135deg,#9f1239,#e11d48)",
  amber: "linear-gradient(135deg,#b45309,#f59e0b)",
  emerald: "linear-gradient(135deg,#065f46,#10b981)",
  violet: "linear-gradient(135deg,#5b21b6,#8b5cf6)",
};

const price = (amount: string): Product["price"] => ({
  amount,
  currencyCode: "USD",
});

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    handle: "circles-t-shirt",
    title: "Circles T-Shirt",
    description: "Soft cotton tee with a minimalist circles print.",
    price: price("20.00"),
    gradient: G.slate,
    emoji: "👕",
  },
  {
    id: "p2",
    handle: "drawstring-bag",
    title: "Drawstring Bag",
    description: "Lightweight everyday drawstring bag.",
    price: price("12.00"),
    gradient: G.amber,
    emoji: "🎒",
  },
  {
    id: "p3",
    handle: "cup",
    title: "Ceramic Cup",
    description: "Matte ceramic cup for your morning brew.",
    price: price("15.00"),
    gradient: G.stone,
    emoji: "🥤",
  },
  {
    id: "p4",
    handle: "mug",
    title: "Classic Mug",
    description: "Sturdy stoneware mug.",
    price: price("15.00"),
    gradient: G.blue,
    emoji: "☕",
  },
  {
    id: "p5",
    handle: "hoodie",
    title: "Pullover Hoodie",
    description: "Fleece-lined pullover hoodie.",
    price: price("50.00"),
    gradient: G.violet,
    emoji: "🧥",
  },
  {
    id: "p6",
    handle: "baby-onesie",
    title: "Baby Onesie",
    description: "Snug cotton onesie for the little ones.",
    price: price("10.00"),
    gradient: G.rose,
    emoji: "👶",
  },
  {
    id: "p7",
    handle: "baby-cap",
    title: "Baby Cap",
    description: "Soft knit cap.",
    price: price("10.00"),
    gradient: G.emerald,
    emoji: "🧢",
  },
];

/** The 3 hero products shown in the homepage ThreeItemGrid. */
export const FEATURED = [PRODUCTS[0], PRODUCTS[1], PRODUCTS[2]];

export const NAV_MENU: MenuItem[] = [
  { title: "All", path: "/search" },
  { title: "Apparel", path: "/search/apparel" },
  { title: "Accessories", path: "/search/accessories" },
];

export const FOOTER_MENU: MenuItem[] = [
  { title: "Home", path: "/" },
  { title: "About", path: "/about" },
  { title: "Terms & Conditions", path: "/terms" },
  { title: "Shipping & Return Policy", path: "/shipping" },
  { title: "Privacy Policy", path: "/privacy" },
  { title: "FAQ", path: "/faq" },
];

export const STORE_NAME = "Demo Store";
