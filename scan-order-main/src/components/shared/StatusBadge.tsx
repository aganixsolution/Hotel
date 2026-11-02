import { cva } from "class-variance-authority";
import { STATUS_LABEL } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/types";

const statusStyles = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      status: {
        pending: "bg-warning/15 text-warning",
        accepted: "bg-info/15 text-info",
        preparing: "bg-primary/15 text-primary",
        ready: "bg-success/15 text-success",
        served: "bg-muted text-muted-foreground",
        cancelled: "bg-destructive/15 text-destructive",
      },
    },
  },
);

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn(statusStyles({ status }), className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  let badgeStyle = "border-warning/40 text-warning bg-warning/5";
  let label = "Unpaid";

  if (status === "paid") {
    badgeStyle = "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    label = "Paid";
  } else if (status === "awaiting_verification") {
    badgeStyle = "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10";
    label = "Awaiting Verification";
  } else if (status === "failed") {
    badgeStyle = "border-destructive/40 text-destructive bg-destructive/5";
    label = "Payment Failed";
  } else if (status === "pending") {
    badgeStyle = "border-muted text-muted-foreground";
    label = "Pending";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        badgeStyle,
      )}
    >
      {label}
    </span>
  );
}
