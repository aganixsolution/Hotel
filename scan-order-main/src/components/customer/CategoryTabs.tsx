import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface Props {
  categories: Category[];
  active: string;
  onChange: (id: string) => void;
  counts: Record<string, number>;
}

export function CategoryTabs({ categories, active, onChange, counts }: Props) {
  const all = [{ id: "all", name: "All", icon: "✨" }, ...categories];
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {all.map((c) => {
        const isActive = c.id === active;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition",
              isActive
                ? "border-transparent bg-brass text-primary-foreground shadow-brass"
                : "bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            <span aria-hidden>{c.icon}</span>
            {c.name}
            {c.id !== "all" && (
              <span className={cn("text-xs", isActive ? "opacity-70" : "opacity-50")}>
                {counts[c.id] ?? 0}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
