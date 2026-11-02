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
import { Label } from "@/components/ui/label";
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
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<"all" | "paid" | "awaiting_verification" | "unpaid">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "thisWeek">("all");
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Dialog states for recording counter payment
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [orderToMarkPaid, setOrderToMarkPaid] = useState<string | null>(null);

  // Dialog states for verifying UPI payment
  const [verifyUpiOpen, setVerifyUpiOpen] = useState(false);
  const [orderToVerify, setOrderToVerify] = useState<Order | null>(null);
  const [adminUtrNote, setAdminUtrNote] = useState("");

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

  const handleStartVerifyUpi = (order: Order) => {
    setOrderToVerify(order);
    setAdminUtrNote(order.providerTransactionId || "");
    setVerifyUpiOpen(true);
  };

  const handleConfirmVerifyUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToVerify) return;

    setIsLoading(true);
    try {
      ordersStore.update((ordersList: Order[]) => {
        return ordersList.map((order) =>
          order.id === orderToVerify.id
            ? {
                ...order,
                paymentStatus: "paid",
                status: order.status === "pending" ? "accepted" : order.status,
                providerTransactionId: adminUtrNote.trim() || order.providerTransactionId,
                verifiedAt: Date.now(),
                verifiedBy: "Admin",
                updatedAt: Date.now(),
              }
            : order
        );
      });
      setVerifyUpiOpen(false);
      setOrderToVerify(null);
    } catch (err) {
      console.error("Failed to verify UPI payment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Payment statistics
  const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const paidAmount = filteredOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, order) => sum + order.total, 0);
  const awaitingVerificationAmount = filteredOrders
    .filter((o) => o.paymentStatus === "awaiting_verification")
    .reduce((sum, order) => sum + order.total, 0);
  const awaitingCount = filteredOrders.filter((o) => o.paymentStatus === "awaiting_verification").length;
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
                Awaiting Verification
              </CardTitle>
              <div className={`rounded-full p-2 ${awaitingCount > 0 ? "bg-amber-500/10 text-amber-600 animate-pulse" : "bg-muted text-muted-foreground"}`}>
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-display ${awaitingCount > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                ₹{awaitingVerificationAmount.toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {awaitingCount} direct UPI payment{awaitingCount === 1 ? "" : "s"} to verify
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Counter Cash
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
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="awaiting_verification">Awaiting Verification</SelectItem>
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
                        {order.paymentStatus === "paid" ? (
                          <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-300 font-semibold">
                            PAID
                          </Badge>
                        ) : order.paymentStatus === "awaiting_verification" ? (
                          <Badge className="text-xs bg-amber-500/15 text-amber-600 border-amber-300 font-semibold animate-pulse">
                            AWAITING VERIFY
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-rose-500/10 text-rose-600 border-rose-300">
                            UNPAID
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div>{order.upiTransactionReference || order.paymentRef || "—"}</div>
                        {order.providerTransactionId && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            UTR: {order.providerTransactionId}
                          </div>
                        )}
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
                        {order.paymentStatus === "awaiting_verification" ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStartVerifyUpi(order)}
                            className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Verify UPI</span>
                          </Button>
                        ) : order.paymentMethod === "counter" && order.paymentStatus === "unpaid" ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkAsPaid(order.id)}
                            className="h-8 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700"
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Collect Cash</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Verified</span>
                          </span>
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
        {/* Verify UPI Payment Dialog */}
        <Dialog open={verifyUpiOpen} onOpenChange={setVerifyUpiOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Verify Google Pay / UPI Payment</span>
              </DialogTitle>
              <DialogDescription>
                Confirm this transaction against your Google Pay merchant app or bank statement.
              </DialogDescription>
            </DialogHeader>
            {orderToVerify && (
              <form onSubmit={handleConfirmVerifyUpi} className="space-y-4 pt-2">
                <div className="rounded-xl border bg-muted/40 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {orderToVerify.id} ({orderToVerify.tableLabel})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-semibold text-foreground">
                      {orderToVerify.customerName} {orderToVerify.phone ? `(${orderToVerify.phone})` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold text-base text-primary font-display">
                      ₹{orderToVerify.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">UPI Order Ref:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {orderToVerify.upiTransactionReference || orderToVerify.paymentRef || "—"}
                    </span>
                  </div>
                  {orderToVerify.providerTransactionId && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Customer Submitted UTR:</span>
                      <span className="font-mono font-bold">{orderToVerify.providerTransactionId}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-utr" className="text-xs font-medium">
                    12-digit Bank UTR / Reference (Optional confirmation)
                  </Label>
                  <Input
                    id="admin-utr"
                    placeholder="Enter or confirm bank UTR"
                    value={adminUtrNote}
                    onChange={(e) => setAdminUtrNote(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Matches the 12-digit number in your Google Pay transaction statement.
                  </p>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setVerifyUpiOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isLoading ? "Verifying..." : "Verify & Mark Paid"}</span>
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}