import { LogoMark } from "@/components/icons";
import { cn } from "@/lib/utils";

export function LogoSquare({ size }: { size?: "sm" }) {
  return (
    <div
      className={cn(
        "flex flex-none items-center justify-center border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black",
        size === "sm" ? "h-[30px] w-[30px] rounded-lg" : "h-[40px] w-[40px] rounded-xl",
      )}
    >
      <LogoMark
        className={cn(
          "text-black dark:text-white",
          size === "sm" ? "h-[14px] w-[14px]" : "h-[18px] w-[18px]",
        )}
      />
    </div>
  );
}
