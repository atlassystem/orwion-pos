export type Money = {
  amount: string;
  currencyCode: string;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: Money;
  /** CSS gradient used as an offline placeholder image. */
  gradient: string;
  emoji: string;
};

export type MenuItem = {
  title: string;
  path: string;
};
