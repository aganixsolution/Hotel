import { cn } from "@/lib/utils";

/** Standard Indian veg (green) / non-veg (red) food symbol. */
export function VegMark({ isVeg, className }: { isVeg: boolean; className?: string }) {
  return (
    <span
      title={isVeg ? "Vegetarian" : "Non-vegetarian"}
      className={cn(
        "inline-grid size-4 shrink-0 place-items-center rounded-[3px] border-[1.5px] bg-background/80",
        isVeg ? "border-veg" : "border-nonveg",
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", isVeg ? "bg-veg" : "bg-nonveg")} />
      <span className="sr-only">{isVeg ? "Veg" : "Non-veg"}</span>
    </span>
  );
}
