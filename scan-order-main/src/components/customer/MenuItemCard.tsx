import { Flame, Plus, Star } from "lucide-react";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { VegMark } from "@/components/shared/VegMark";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types";

interface Props {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onChangeQty: (q: number) => void;
}

export function MenuItemCard({ item, quantity, onAdd, onChangeQty }: Props) {
  return (
    <article
      className={cn(
        "group flex gap-4 rounded-2xl border bg-card p-3 shadow-card transition hover:border-primary/40 sm:flex-col sm:gap-0 sm:p-0",
        !item.isAvailable && "opacity-60",
      )}
    >
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl sm:aspect-[5/4] sm:w-full sm:rounded-b-none sm:rounded-t-2xl">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          width={912}
          height={736}
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
        {item.isBestseller && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brass px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            <Star className="size-3 fill-current" /> Bestseller
          </span>
        )}
        {!item.isAvailable && (
          <span className="absolute inset-0 grid place-items-center bg-background/70 text-sm font-semibold">
            Sold out
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col sm:p-4">
        <div className="flex items-center gap-2">
          <VegMark isVeg={item.isVeg} />
          {!!item.spiceLevel && (
            <span className="flex text-primary-glow" aria-label={`Spice level ${item.spiceLevel}`}>
              {Array.from({ length: item.spiceLevel }).map((_, i) => (
                <Flame key={i} className="size-3.5" />
              ))}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug">{item.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-lg font-bold tabular-nums">{formatINR(item.price)}</span>
          {item.isAvailable &&
            (quantity > 0 ? (
              <QuantityStepper value={quantity} onChange={onChangeQty} size="sm" />
            ) : (
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-primary/60 px-4 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                <Plus className="size-4" /> Add
              </button>
            ))}
        </div>
      </div>
    </article>
  );
}
