import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, QrCode, Search, Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { CartBar } from "@/components/customer/CartBar";
import { CartSheet } from "@/components/customer/CartSheet";
import { CategoryTabs } from "@/components/customer/CategoryTabs";
import { MenuItemCard } from "@/components/customer/MenuItemCard";
import { LogoMark } from "@/components/brand/Logo";
import { FullPageMessage, LoadingScreen } from "@/components/shared/FullPageMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  categoriesStore,
  getCartStore,
  hotelStore,
  menuStore,
  ordersStore,
  tablesStore,
} from "@/lib/app-store";
import { cartActions } from "@/lib/cart";
import { calculateTotals, resolveCart } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/menu/$tableId")({
  head: () => ({
    meta: [
      { title: "Menu — SaviRasa" },
      { name: "description", content: "Browse the menu and order straight from your table." },
      { property: "og:title", content: "Menu — SaviRasa" },
      { property: "og:description", content: "Browse the menu and order straight from your table." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { tableId } = Route.useParams();
  const hydrated = useHydrated();
  const hotel = useStore(hotelStore);
  const tables = useStore(tablesStore);
  const categories = useStore(categoriesStore);
  const menu = useStore(menuStore);
  const cart = useStore(getCartStore(tableId));
  const orders = useStore(ordersStore);

  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const table = tables.find((t) => t.id === tableId);
  const actions = useMemo(() => cartActions(tableId), [tableId]);
  const lines = resolveCart(cart, menu);
  const totals = calculateTotals(lines, hotel.taxPercent);
  const qtyOf = (id: string) => cart.find((l) => l.itemId === id)?.quantity ?? 0;

  const activeOrder = hydrated
    ? orders.find((o) => o.tableId === tableId && !["served", "cancelled"].includes(o.status))
    : undefined;

  const filtered = menu.filter((m) => {
    if (vegOnly && !m.isVeg) return false;
    if (query && !`${m.name} ${m.description}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const counts = Object.fromEntries(
    categories.map((c) => [c.id, filtered.filter((m) => m.categoryId === c.id).length]),
  );
  const sections = categories
    .filter((c) => active === "all" || c.id === active)
    .map((c) => ({ category: c, items: filtered.filter((m) => m.categoryId === c.id) }))
    .filter((s) => s.items.length > 0);

  if (!table) {
    if (!hydrated) return <LoadingScreen />;
    return (
      <FullPageMessage
        icon={<QrCode className="size-8" />}
        title="Table not found"
        description="This QR code doesn't match any table. Please ask our staff for help."
        action={
          <Button asChild variant="hero">
            <Link to="/">Go to home</Link>
          </Button>
        }
      />
    );
  }

  const add = (id: string, name: string) => {
    actions.add(id);
    if (qtyOf(id) === 0) toast.success(`${name} added`, { duration: 1200 });
  };

  return (
    <div className="min-h-screen pb-32">
      <header className="relative isolate overflow-hidden border-b">
        <img
          src="/images/hero.jpg"
          alt=""
          width={1600}
          height={1008}
          className="absolute inset-0 -z-10 size-full object-cover opacity-30"
        />
        <div className="absolute inset-0 -z-10 bg-fade" />
        <div className="mx-auto max-w-6xl px-4 pb-6 pt-5">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <LogoMark />
              <span>
                <span className="block font-display text-xl font-semibold leading-tight">{hotel.name}</span>
                <span className="block text-xs text-muted-foreground">{hotel.tagline}</span>
              </span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/60 px-3 py-1.5 text-sm font-semibold text-primary backdrop-blur">
              <MapPin className="size-4" /> {table.label}
            </span>
          </div>

          <h1 className="mt-8 text-4xl font-semibold sm:text-5xl">What would you like today?</h1>
          <p className="mt-1 text-muted-foreground">
            {table.area} · Order from your seat, we'll bring it over.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search biryani, naan, lassi…"
                className="h-11 rounded-full bg-background/70 pl-10 backdrop-blur"
              />
            </div>
            <label className="inline-flex items-center gap-2 self-start rounded-full border bg-background/70 px-4 py-2 text-sm font-semibold backdrop-blur sm:self-auto">
              <Switch checked={vegOnly} onCheckedChange={setVegOnly} aria-label="Veg only" />
              Veg only
            </label>
          </div>
        </div>
      </header>

      {activeOrder && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <Link
            to="/order/$orderId"
            params={{ orderId: activeOrder.id }}
            className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3.5 text-sm transition hover:bg-primary/15"
          >
            <Receipt className="size-5 text-primary" />
            <span className="flex-1">
              Order <b>{activeOrder.id}</b> is in progress — tap to track
            </span>
          </Link>
        </div>
      )}

      <div className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <CategoryTabs categories={categories} active={active} onChange={setActive} counts={counts} />
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-10 px-4 pt-6">
        {sections.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">No dishes match your search.</p>
        )}
        {sections.map(({ category, items }) => (
          <section key={category.id} id={category.id} className="scroll-mt-24">
            <h2 className="mb-4 flex items-baseline gap-2 text-2xl font-semibold">
              <span aria-hidden>{category.icon}</span> {category.name}
              <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={qtyOf(item.id)}
                  onAdd={() => add(item.id, item.name)}
                  onChangeQty={(q) => actions.setQty(item.id, q)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <CartBar count={totals.itemCount} total={totals.total} onOpen={() => setCartOpen(true)} />
      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        tableId={tableId}
        tableLabel={`${table.label} · ${table.area}`}
        lines={lines}
        totals={totals}
        taxPercent={hotel.taxPercent}
        onChangeQty={actions.setQty}
        onClear={actions.clear}
      />
    </div>
  );
}
