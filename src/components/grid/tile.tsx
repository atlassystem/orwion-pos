import { cn } from "@/lib/utils";
import { Price } from "@/components/price";
import { PlaceholderImage } from "@/components/placeholder-image";

type LabelProps = {
  title: string;
  amount: string;
  currencyCode: string;
  position?: "bottom" | "center";
};

function Label({ title, amount, currencyCode, position = "bottom" }: LabelProps) {
  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 flex w-full px-4 pb-4",
        position === "center" && "lg:px-20 lg:pb-[35%]",
      )}
    >
      <div className="flex items-center rounded-full border bg-white/70 p-1 text-xs font-semibold text-black backdrop-blur-md dark:border-neutral-800 dark:bg-black/70 dark:text-white">
        <h3 className="mr-4 line-clamp-2 grow pl-2 leading-none tracking-tight">
          {title}
        </h3>
        <Price
          className="flex-none rounded-full bg-blue-600 p-2 text-white"
          amount={amount}
          currencyCode={currencyCode}
          currencyCodeClassName="hidden md:inline"
        />
      </div>
    </div>
  );
}

export function GridTileImage({
  gradient,
  emoji,
  isInteractive = true,
  active,
  label,
}: {
  gradient: string;
  emoji: string;
  isInteractive?: boolean;
  active?: boolean;
  label?: LabelProps;
}) {
  return (
    <div
      className={cn(
        "group relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-white dark:bg-black",
        active
          ? "border-blue-600"
          : "border-neutral-200 dark:border-neutral-800",
        isInteractive && "hover:border-blue-600",
      )}
    >
      <PlaceholderImage
        gradient={gradient}
        emoji={emoji}
        className={cn(
          "relative h-full w-full transition duration-300 ease-in-out",
          isInteractive && "group-hover:scale-105",
        )}
      />
      {label ? (
        <Label
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </div>
  );
}
