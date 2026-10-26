import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ordersStore } from "@/lib/app-store";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, X, DollarSign, CreditCard, Loader2, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { Order } from "@/types";

export const Route = createFileRoute("/admin/payments/")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const orders = useStore(ordersStore);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<"all" | "online" | "counter">("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "thisWeek">("all");
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Dialog states for recording counter payment
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [orderToMarkPaid, setOrderToMarkPaid] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const isOnline = order.paymentMethod !== "counter";
    const matchesSearch =
      order.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      order.tableLabel.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (order.customerName && order.customerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (order.phone && order.phone.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

    const matchesPaymentMethod =
      filterPaymentMethod === "all" ||
      (filterPaymentMethod === "online" && isOnline) ||
      (filterPaymentMethod === "counter" && order.paymentMethod === "counter");

    const matchesPaymentStatus =
      filterPaymentStatus === "all" || order.paymentStatus === filterPaymentStatus;

    const orderDate = new Date(order.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());

    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "today" && orderDate.toDateString() === today.toDateString()) ||
      (dateFilter === "yesterday" && orderDate.toDateString() === yesterday.toDateString()) ||
      (dateFilter === "thisWeek" && orderDate >= thisWeekStart);

    return matchesSearch && matchesPaymentMethod && matchesPaymentStatus && matchesDate;
  });

  const handleMarkAsPaid = (orderId: string) => {
    setOrderToMarkPaid(orderId);
    setRecordPaymentOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToMarkPaid) return;

    setIsLoading(true);
    try {
      ordersStore.update((ordersList: Order[]) => {
        return ordersList.map((order) =>
          order.id === orderToMarkPaid
            ? { ...order, paymentStatus: "paid", updatedAt: Date.now() }
            : order
        );
      });
      setRecordPaymentOpen(false);
      setOrderToMarkPaid(null);
    } catch (err) {
      console.error("Failed to mark order as paid:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Payment statistics
  const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const paidAmount = filteredOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, order) => sum + order.total, 0);
  const unpaidAmount = filteredOrders
    .filter((o) => o.paymentStatus === "unpaid")
    .reduce((sum, order) => sum + order.total, 0);
  const unpaidOrders = filteredOrders.filter((o) => o.paymentStatus === "unpaid").length;
  const onlinePayments = filteredOrders.filter((o) => o.paymentMethod !== "counter").length;
  const counterPayments = filteredOrders.filter((o) => o.paymentMethod === "counter").length;

  return (
    <AdminLayout
      title="Payment Tracking & Settlements"
      description="Track cash collection at the counter and digital payment statuses"
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders Value
              </CardTitle>
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <IndianRupee className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">₹{totalAmount.toFixed(2)}</div>
              <p className="mt-1 text-xs text-muted-foreground">{filteredOrders.length} orders total</p>
            </CardContent>
          </Card>

          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Settled & Paid
              </CardTitle>
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-emerald-600">
                ₹{paidAmount.toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Gateway & counter verified</p>
            </CardContent>
          </Card>

          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Collection
              </CardTitle>
              <div className="rounded-full bg-rose-500/10 p-2 text-rose-600">
                <X className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-rose-600">
                ₹{unpaidAmount.toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{unpaidOrders} counter orders unpaid</p>
            </CardContent>
          </Card>

          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Payment Channel
              </CardTitle>
              <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">
                <CreditCard className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold mt-1">
                Online: {onlinePayments} · Counter: {counterPayments}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">UPI / Cards vs Cash Desk</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setFilterPaymentMethod("all");
              setFilterPaymentStatus("all");
              setDateFilter("all");
            }}
          >
            Reset Filters
          </Button>

          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="Search by order, table, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[240px]"
            />
            <Select
              value={filterPaymentMethod}
              onValueChange={(val) => setFilterPaymentMethod(val as any)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="online">Online (UPI)</SelectItem>
                <SelectItem value="counter">Counter Cash</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterPaymentStatus}
              onValueChange={(val) => setFilterPaymentStatus(val as any)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={dateFilter}
              onValueChange={(val) => setDateFilter(val as any)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {filteredOrders.length === 0 && !isLoading && (
          <div className="text-center py-12 rounded-2xl border bg-card/50">
            <p className="text-muted-foreground font-medium">No payment records found.</p>
          </div>
        )}

        {!isLoading && filteredOrders.length > 0 && (
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-semibold">{order.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.tableLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{order.customerName || "Guest"}</div>
                        {order.phone && <div className="text-xs text-muted-foreground">{order.phone}</div>}
                      </TableCell>
                      <TableCell className="text-right font-semibold">₹{order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-[10px]">
                          {order.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${
                            order.paymentStatus === "paid"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                              : "bg-rose-500/10 text-rose-600 border-rose-300"
                          }`}
                        >
                          {order.paymentStatus.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {order.paymentRef || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.paymentMethod === "counter" && order.paymentStatus === "unpaid" ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkAsPaid(order.id)}
                            className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Collect Cash</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Verified</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Record Payment Dialog */}
        <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Record Counter Cash Payment</DialogTitle>
              <DialogDescription>
                Confirm that the guest has paid the bill at the counter.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConfirmPayment}>
              <div className="py-3 text-sm text-muted-foreground">
                Order <span className="font-mono font-semibold text-foreground">{orderToMarkPaid}</span> will be marked as paid.
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRecordPaymentOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Confirm Payment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}