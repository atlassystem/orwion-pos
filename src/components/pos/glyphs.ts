import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  Salad,
  Soup,
  Beef,
  Pizza,
  CakeSlice,
  Coffee,
  Sandwich,
  Wine,
  GlassWater,
  CupSoda,
  Utensils,
} from "lucide-react";

/** Kategori id → Lucide ikon (emoji yerine profesyonel ikon seti). */
export const CAT_ICON: Record<string, ComponentType<LucideProps>> = {
  baslangic: Salad,
  corba: Soup,
  izgara: Beef,
  burgerler: Sandwich,
  pizza: Pizza,
  tatli: CakeSlice,
  // İçecekler
  alkollu: Wine,
  alkolsuz: GlassWater,
  soft: CupSoda,
  icecek: Coffee, // (geriye uyum)
};

export const catIcon = (id: string) => CAT_ICON[id] ?? Utensils;
