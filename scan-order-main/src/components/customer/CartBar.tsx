import { ChevronRight, ShoppingBag } from "lucide-react";
import { formatINR } from "@/lib/format";

export function CartBar({
  count,
  total,
  onOpen,
}: {
  count: number;
  total: number;
  onOpen: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={onOpen}
        className="mx-auto flex w-full max-w-xl animate-rise items-center gap-3 rounded-2xl bg-brass px-5 py-3.5 text-left text-primary-foreground shadow-brass transition hover:brightness-110"
      >
        <span className="relative grid size-10 place-items-center rounded-xl bg-background/15">
          <ShoppingBag className="size-5" />
          <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
            {count}
          </span>
        </span>
        <span className="flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wider opacity-75">
            {count} item{count > 1 ? "s" : ""} added
          </span>
          <span className="block text-lg font-bold tabular-nums">{formatINR(total)}</span>
        </span>
        <span className="flex items-center gap-1 font-bold">
          View cart <ChevronRight className="size-5" />
        </span>
      </button>
    </div>
  );
}
