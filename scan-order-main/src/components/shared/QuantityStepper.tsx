import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (next: number) => void;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityStepper({ value, onChange, size = "md", className }: Props) {
  const btn = size === "sm" ? "size-7" : "size-9";
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-brass p-0.5 text-primary-foreground shadow-brass",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(value - 1)}
        className={cn(btn, "grid place-items-center rounded-full transition hover:bg-background/15")}
      >
        <Minus className="size-4" />
      </button>
      <span key={value} className="min-w-6 animate-pop text-center text-sm font-bold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        className={cn(btn, "grid place-items-center rounded-full transition hover:bg-background/15")}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
