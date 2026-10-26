import { Bell, CheckCircle2, ChefHat, ClipboardCheck, UtensilsCrossed } from "lucide-react";
import { STATUS_FLOW } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STEPS: { status: OrderStatus; label: string; hint: string; icon: typeof Bell }[] = [
  { status: "pending", label: "Order placed", hint: "Waiting for the restaurant", icon: Bell },
  { status: "accepted", label: "Accepted", hint: "The kitchen has your order", icon: ClipboardCheck },
  { status: "preparing", label: "Preparing", hint: "Our chefs are cooking", icon: ChefHat },
  { status: "ready", label: "Ready", hint: "On its way to your table", icon: UtensilsCrossed },
  { status: "served", label: "Served", hint: "Enjoy your meal!", icon: CheckCircle2 },
];

export function StatusTracker({ status }: { status: OrderStatus }) {
  const current = STATUS_FLOW.indexOf(status);
  return (
    <ol className="relative space-y-1">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = step.icon;
        return (
          <li key={step.status} className="relative flex gap-4 pb-5 last:pb-0">
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "absolute left-5 top-11 h-[calc(100%-2.75rem)] w-0.5 -translate-x-1/2 rounded-full",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 transition",
                done && "border-primary bg-primary text-primary-foreground",
                active && "animate-pulse-ring border-primary bg-brass text-primary-foreground",
                !done && !active && "border-border bg-card text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="pt-1.5">
              <p className={cn("font-semibold", !done && !active && "text-muted-foreground")}>
                {step.label}
              </p>
              {(active || done) && <p className="text-sm text-muted-foreground">{step.hint}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
