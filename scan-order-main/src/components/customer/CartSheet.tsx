import { Link } from "@tanstack/react-router";
import { ShoppingBag, Trash2 } from "lucide-react";
import { BillSummary } from "@/components/shared/BillSummary";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { VegMark } from "@/components/shared/VegMark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatINR } from "@/lib/format";
import type { Totals } from "@/lib/pricing";
import type { MenuItem } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  tableLabel: string;
  lines: { itemId: string; quantity: number; item: MenuItem; price: number }[];
  totals: Totals;
  taxPercent: number;
  onChangeQty: (itemId: string, qty: number) => void;
  onClear: () => void;
}

export function CartSheet({
  open,
  onOpenChange,
  tableId,
  tableLabel,
  lines,
  totals,
  taxPercent,
  onChangeQty,
  onClear,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5 text-left">
          <SheetTitle className="font-display text-2xl">Your order</SheetTitle>
          <p className="text-sm text-muted-foreground">{tableLabel}</p>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="size-12 text-muted-foreground" />
            <p className="font-semibold">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Add a few dishes to get started.</p>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.itemId} className="flex items-center gap-3 py-4">
                  <img
                    src={l.item.image}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    className="size-14 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <VegMark isVeg={l.item.isVeg} className="size-3.5" />
                      <p className="truncate font-semibold">{l.item.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {formatINR(l.price * l.quantity)}
                    </p>
                  </div>
                  <QuantityStepper
                    value={l.quantity}
                    onChange={(q) => onChangeQty(l.itemId, q)}
                    size="sm"
                  />
                </li>
              ))}
            </ul>
            <div className="space-y-4 border-t bg-surface p-5">
              <BillSummary {...totals} taxPercent={taxPercent} />
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear cart">
                  <Trash2 />
                </Button>
                <Button asChild variant="hero" size="xl" className="flex-1">
                  <Link to="/checkout/$tableId" params={{ tableId }}>
                    Checkout · {formatINR(totals.total)}
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
