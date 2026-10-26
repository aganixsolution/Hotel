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
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        status === "paid"
          ? "border-success/40 text-success"
          : "border-warning/40 text-warning",
      )}
    >
      {status === "paid" ? "Paid" : "Unpaid"}
    </span>
  );
}
