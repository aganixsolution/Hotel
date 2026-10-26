import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { ordersStore, menuStore, tablesStore, resetDemoData } from "@/lib/app-store";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  IndianRupee,
  Grid,
  UtensilsCrossed,
  Clock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const orders = useStore(ordersStore);
  const menuItems = useStore(menuStore);
  const tables = useStore(tablesStore);

  // Stats calculations
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const activeOrdersCount = pendingOrders.length + preparingOrders.length + readyOrders.length;

  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

  const unpaidCounterOrders = orders.filter(
    (o) => o.paymentMethod === "counter" && o.paymentStatus === "unpaid"
  );

  const handleUpdateStatus = (orderId: string, nextStatus: any) => {
    ordersStore.update((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus, updatedAt: Date.now() } : o))
    );
  };

  const handleResetData = () => {
    if (window.confirm("Reset all demo orders, tables and menu back to defaults?")) {
      resetDemoData();
    }
  };

  return (
    <AdminLayout
      title="Admin Dashboard"
      description="Live kitchen operations, revenue overview, and restaurant management"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetData}
          className="text-muted-foreground hover:text-foreground gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Demo Data</span>
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Top Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Orders
              </CardTitle>
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{activeOrdersCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {pendingOrders.length} pending · {preparingOrders.length} preparing · {readyOrders.length} ready
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <div className="rounded-full bg-success/10 p-2 text-success">
                <IndianRupee className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">₹{totalRevenue.toFixed(2)}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {paidOrders.length} paid orders ({unpaidCounterOrders.length} unpaid at counter)
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dining Tables
              </CardTitle>
              <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">
                <Grid className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{tables.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Configured with printable QR codes
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Menu Dishes
              </CardTitle>
              <div className="rounded-full bg-amber-500/10 p-2 text-amber-500">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{menuItems.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {menuItems.filter((m) => m.isAvailable).length} currently available
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation Panels */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-foreground">Quick Management</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/admin/orders"
              className="group block p-5 rounded-2xl border bg-card hover:border-primary/60 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                {pendingOrders.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {pendingOrders.length} New
                  </Badge>
                )}
              </div>
              <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Live Kitchen Orders</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Accept incoming orders, update cooking stages, and notify servers.
              </p>
            </Link>

            <Link
              to="/admin/menu"
              className="group block p-5 rounded-2xl border bg-card hover:border-primary/60 hover:shadow-md transition-all"
            >
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500 w-fit">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Menu & Pricing</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add new dishes, set prices, toggle item stock and food categories.
              </p>
            </Link>

            <Link
              to="/admin/tables"
              className="group block p-5 rounded-2xl border bg-card hover:border-primary/60 hover:shadow-md transition-all"
            >
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500 w-fit">
                <Grid className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Tables & QR Codes</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage dining sections, view generated table QR codes, and seat counts.
              </p>
            </Link>

            <Link
              to="/admin/payments"
              className="group block p-5 rounded-2xl border bg-card hover:border-primary/60 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-success/10 p-2.5 text-success">
                  <IndianRupee className="h-5 w-5" />
                </div>
                {unpaidCounterOrders.length > 0 && (
                  <Badge variant="outline" className="border-warning text-warning">
                    {unpaidCounterOrders.length} Unpaid
                  </Badge>
                )}
              </div>
              <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Payment Tracking</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Verify UPI online payments and record cash collected at counter.
              </p>
            </Link>

            <Link
              to="/admin/reports"
              className="group block p-5 rounded-2xl border bg-card hover:border-primary/60 hover:shadow-md transition-all"
            >
              <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500 w-fit">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Reports & Analytics</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Inspect top-selling dishes, daily revenue breakdown, and order volume.
              </p>
            </Link>
          </div>
        </div>

        {/* Live Orders Overview */}
        <Card className="border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <CardDescription>Latest orders placed from tables</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/orders">View All Orders</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders placed yet. Place an order from the guest menu to see it here!
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-background/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {order.id}
                        </span>
                        <Badge variant="outline" className="font-sans font-medium">
                          {order.tableLabel}
                        </Badge>
                        <Badge
                          className={
                            order.status === "pending"
                              ? "bg-amber-500/10 text-amber-600 border-amber-300"
                              : order.status === "preparing"
                                ? "bg-blue-500/10 text-blue-600 border-blue-300"
                                : order.status === "ready"
                                  ? "bg-purple-500/10 text-purple-600 border-purple-300"
                                  : order.status === "served"
                                    ? "bg-green-500/10 text-green-600 border-green-300"
                                    : "bg-muted text-muted-foreground"
                          }
                        >
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.lines.map((l) => `${l.quantity}x ${l.name}`).join(", ")}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          ₹{order.total.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {order.paymentMethod} · {order.paymentStatus}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, "preparing")}
                            className="h-8 text-xs"
                          >
                            Accept
                          </Button>
                        )}
                        {order.status === "preparing" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdateStatus(order.id, "ready")}
                            className="h-8 text-xs"
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === "ready" && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleUpdateStatus(order.id, "served")}
                            className="h-8 text-xs"
                          >
                            Mark Served
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}