import { cn } from "@/lib/utils";

export function Price({
  amount,
  currencyCode = "USD",
  className,
  currencyCodeClassName,
}: {
  amount: string;
  currencyCode?: string;
  className?: string;
  currencyCodeClassName?: string;
}) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol",
  }).format(parseFloat(amount));

  return (
    <p suppressHydrationWarning className={className}>
      {formatted}
      <span className={cn("ml-1 inline", currencyCodeClassName)}>
        {currencyCode}
      </span>
    </p>
  );
}
