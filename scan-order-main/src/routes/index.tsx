import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChefHat, CreditCard, LayoutDashboard, QrCode, ScanLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { hotelStore, tablesStore } from "@/lib/app-store";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aganix — Scan, Order & Pay at Your Table" },
      {
        name: "description",
        content:
          "Aganix QR ordering for hotels and restaurants: scan the table QR, order from a live menu, pay online or at the counter.",
      },
      { property: "og:title", content: "Aganix — Scan, Order & Pay at Your Table" },
      {
        property: "og:description",
        content: "QR table ordering with live kitchen dashboard, menu management and printable table QR codes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const STEPS = [
  { icon: ScanLine, title: "Scan the table QR", text: "Every table has its own code — no app, no login." },
  { icon: ChefHat, title: "Order from the menu", text: "Browse dishes with photos, prices in ₹ and veg marks." },
  { icon: CreditCard, title: "Pay your way", text: "UPI or card online, or simply pay at the counter." },
  { icon: LayoutDashboard, title: "Kitchen gets it live", text: "Staff accept, prepare and serve from the dashboard." },
];

function Home() {
  const hotel = useStore(hotelStore);
  const tables = useStore(tablesStore);
  const hydrated = useHydrated();
  const firstTable = tables[0];
  const demoUrl = hydrated && firstTable ? `${hotel.qrBaseUrl || window.location.origin}/menu/${firstTable.id}` : "";

  return (
    <div className="min-h-screen">
      <section className="relative isolate overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt="A spread of Indian dishes on brass thalis"
          width={1600}
          height={1008}
          className="absolute inset-0 -z-10 size-full object-cover opacity-55"
        />
        <div className="absolute inset-0 -z-10 bg-fade" />

        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Logo />
          <Button asChild variant="glass" size="sm">
            <Link to="/admin/login">Admin login</Link>
          </Button>
        </header>

        <div className="mx-auto grid max-w-6xl items-end gap-10 px-5 pb-16 pt-16 sm:pt-28 lg:grid-cols-[1.4fr_1fr]">
          <div className="animate-rise">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
              {hotel.name} · {hotel.tagline}
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.02] sm:text-7xl">
              Scan. Order. <span className="text-brass italic">Savour.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-foreground/80">
              A complete QR ordering system for hotels — guests order from their table, your
              kitchen sees it instantly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {firstTable && (
                <Button asChild variant="hero" size="xl">
                  <Link to="/menu/$tableId" params={{ tableId: firstTable.id }}>
                    Try as a guest <ArrowRight />
                  </Link>
                </Button>
              )}
              <Button asChild variant="glass" size="xl">
                <Link to="/admin">Open dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="hidden justify-self-end rounded-3xl border bg-card/70 p-5 text-center backdrop-blur-md lg:block">
            <div className="mx-auto grid size-[180px] place-items-center rounded-2xl bg-foreground p-3 text-background">
              {demoUrl ? (
                <QRCodeSVG value={demoUrl} size={156} bgColor="transparent" fgColor="currentColor" />
              ) : (
                <QrCode className="size-16" />
              )}
            </div>
            <p className="mt-3 text-sm font-semibold">Scan for {firstTable?.label}</p>
            <p className="text-xs text-muted-foreground">Demo QR — opens the guest menu</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <s.icon className="size-6 text-primary" />
                <span className="font-display text-3xl text-muted-foreground/40">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl border bg-ember bg-surface p-6 sm:p-10">
          <h2 className="text-3xl font-semibold">Pick a table to try</h2>
          <p className="mt-2 text-muted-foreground">
            Each link is what a guest sees after scanning that table's QR code.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {tables.map((t) => (
              <Link
                key={t.id}
                to="/menu/$tableId"
                params={{ tableId: t.id }}
                className="group rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary"
              >
                <QrCode className="size-5 text-primary" />
                <p className="mt-3 font-display text-xl font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground">
                  {t.area} · {t.seats} seats
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        {hotel.name} · {hotel.address} · {hotel.phone}
      </footer>
    </div>
  );
}
