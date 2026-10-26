import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 place-items-center rounded-xl bg-brass font-display text-lg font-bold text-primary-foreground shadow-brass",
        className,
      )}
      aria-hidden
    >
      A
    </span>
  );
}

export function Logo({ className, to = "/" }: { className?: string; to?: "/" }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-lg font-semibold tracking-tight">Aganix</span>
        <span className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          QR Dining
        </span>
      </span>
    </Link>
  );
}
