import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  subtotal: number;
  tax: number;
  total: number;
  taxPercent: number;
  className?: string;
}

export function BillSummary({ subtotal, tax, total, taxPercent, className }: Props) {
  return (
    <dl className={cn("space-y-2 text-sm", className)}>
      <div className="flex justify-between text-muted-foreground">
        <dt>Item total</dt>
        <dd className="tabular-nums">{formatINR(subtotal)}</dd>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <dt>GST ({taxPercent}%)</dt>
        <dd className="tabular-nums">{formatINR(tax)}</dd>
      </div>
      <div className="flex justify-between border-t border-dashed pt-3 text-base font-bold">
        <dt>To pay</dt>
        <dd className="tabular-nums text-primary">{formatINR(total)}</dd>
      </div>
    </dl>
  );
}
