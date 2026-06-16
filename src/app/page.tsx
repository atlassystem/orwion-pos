import { ThreeItemGrid } from "@/components/grid/three-items";
import { Carousel } from "@/components/carousel";

export const metadata = {
  description: "A clean storefront base scaffolded for Lezzet POS.",
};

export default function HomePage() {
  return (
    <>
      <ThreeItemGrid />
      <Carousel />
    </>
  );
}
