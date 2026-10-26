import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ordersStore, menuStore } from "@/lib/app-store";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { CheckCircle2, DollarSign, CreditCard, List, IndianRupee, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/reports/")({
  component: ReportsPage,
});

function ReportsPage() {
  const orders = useStore(ordersStore);
  const [dateRange, setDateRange] = useState<"today" | "yesterday" | "thisWeek" | "thisMonth" | "all">("thisWeek");
  const [isLoading, setIsLoading] = useState(false);

  // Date filtering logic
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = [...orders];
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = now;

    switch (dateRange) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "yesterday":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "thisWeek":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        break;
      case "thisMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "all":
        start = null;
        break;
    }

    if (start && end) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    }

    return filtered;
  }, [orders, dateRange]);

  // Calculate report data
  const reportData = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalSales = filteredOrders.reduce(
      (sum, order) => sum + (order.paymentStatus === "paid" ? order.total : 0),
      0
    );
    const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const paidOrders = filteredOrders.filter((o) => o.paymentStatus === "paid").length;
    const unpaidOrders = filteredOrders.filter((o) => o.paymentStatus === "unpaid").length;
    const onlineOrders = filteredOrders.filter((o) => o.paymentMethod !== "counter").length;
    const counterOrders = filteredOrders.filter((o) => o.paymentMethod === "counter").length;

    // Status breakdown
    const statusBreakdown = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Popular items
    const itemPopularity: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredOrders.forEach((order) => {
      order.lines.forEach((line) => {
        if (!itemPopularity[line.itemId]) {
          itemPopularity[line.itemId] = { name: line.name, quantity: 0, revenue: 0 };
        }
        itemPopularity[line.itemId].quantity += line.quantity;
        itemPopularity[line.itemId].revenue += line.quantity * line.price;
      });
    });

    const popularItems = Object.entries(itemPopularity)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      totalOrders,
      totalSales,
      totalAmount,
      paidOrders,
      unpaidOrders,
      onlineOrders,
      counterOrders,
      statusBreakdown,
      popularItems,
    };
  }, [filteredOrders]);

  return (
    <AdminLayout
      title="Reports & Analytics"
      description="Performance metrics, revenue summary, and popular dishes analysis"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="date-range" className="text-sm font-medium">Time Horizon:</Label>
            <Select
              value={dateRange}
              onValueChange={(val) => setDateRange(val as any)}
            >
              <SelectTrigger id="date-range" className="w-[180px]">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange("thisWeek")}
          >
            Reset to This Week
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders Placed
              </CardTitle>
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <List className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{reportData.totalOrders}</div>
              <p className="mt-1 text-xs text-muted-foreground">In selected time range</p>
            </CardContent>
          </Card>

          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Settled Revenue
              </CardTitle>
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                <IndianRupee className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-emerald-600">
                ₹{reportData.totalSales.toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">From {reportData.paidOrders} paid orders</p>
            </CardContent>
          </Card>

          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Gross Value
              </CardTitle>
              <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">
                ₹{reportData.totalAmount.toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                ₹{(reportData.totalAmount - reportData.totalSales).toFixed(2)} pending collection
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Order Settlement Rate
              </CardTitle>
              <div className="rounded-full bg-purple-500/10 p-2 text-purple-500">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">
                {reportData.totalOrders > 0
                  ? `${Math.round((reportData.paidOrders / reportData.totalOrders) * 100)}%`
                  : "0%"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {reportData.paidOrders} paid / {reportData.unpaidOrders} unpaid
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status Breakdown */}
          <Card className="border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Kitchen Fulfillment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.keys(reportData.statusBreakdown).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders in this period.</p>
                ) : (
                  Object.entries(reportData.statusBreakdown).map(([status, count]) => {
                    const max = Math.max(...Object.values(reportData.statusBreakdown), 1);
                    const pct = Math.round((count / max) * 100);
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="capitalize">{status}</span>
                          <span className="text-muted-foreground">{count} orders</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Distribution */}
          <Card className="border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Payment Method Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-semibold">Online Payment (UPI / Card)</div>
                      <div className="text-xs text-muted-foreground">Paid directly by guest on mobile</div>
                    </div>
                  </div>
                  <div className="text-right font-bold text-foreground">
                    {reportData.onlineOrders} orders
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                    <div>
                      <div className="text-sm font-semibold">Counter Cash / POS</div>
                      <div className="text-xs text-muted-foreground">Settled with staff at reception desk</div>
                    </div>
                  </div>
                  <div className="text-right font-bold text-foreground">
                    {reportData.counterOrders} orders
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Items */}
        <Card className="border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Top Selling Dishes</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.popularItems.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">
                No item sales recorded for the selected period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dish</TableHead>
                      <TableHead className="text-center">Units Sold</TableHead>
                      <TableHead className="text-right">Revenue Generated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.popularItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                        <TableCell className="text-center font-bold text-primary">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{item.revenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}