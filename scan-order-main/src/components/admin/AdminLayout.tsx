import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { sessionStore } from "@/lib/app-store";
import { logout } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Grid,
  CreditCard,
  BarChart3,
  LogOut,
  ExternalLink,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Live Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Menu", href: "/admin/menu", icon: UtensilsCrossed },
  { label: "Tables & QR", href: "/admin/tables", icon: Grid },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

export function AdminLayout({ children, title, description, actions }: AdminLayoutProps) {
  const navigate = useNavigate();
  const session = useStore(sessionStore);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const s = sessionStore.get();
    if (!s) {
      navigate({ to: "/admin/login" });
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/admin/login" });
  };

  // Prevent flicker during SSR before hydration check
  if (isClient && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="flex items-center gap-2">
              <Logo />
              <span className="hidden text-xs font-semibold uppercase tracking-wider text-primary sm:inline-block bg-primary/10 px-2 py-0.5 rounded">
                Admin
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? currentPath === "/admin" || currentPath === "/admin/"
                    : currentPath.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex gap-1.5">
              <Link to="/">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Guest View</span>
              </Link>
            </Button>

            {session && (
              <span className="hidden lg:inline-block text-xs text-muted-foreground font-mono bg-muted/60 px-2.5 py-1 rounded-md border">
                {session.email}
              </span>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden border-t px-2 py-1.5 overflow-x-auto flex gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? currentPath === "/admin" || currentPath === "/admin/"
                : currentPath.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {(title || actions) && (
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {title && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            )}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
