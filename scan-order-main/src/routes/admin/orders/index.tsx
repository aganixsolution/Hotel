import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ordersStore } from "@/lib/app-store";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, Loader2, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { Order, OrderStatus } from "@/types";

export const Route = createFileRoute("/admin/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  const orders = useStore(ordersStore);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "thisWeek">("all");
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Search by order ID or table label
    const matchesSearch =
      order.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      order.tableLabel.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (order.customerName && order.customerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (order.phone && order.phone.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

    // Filter by status
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;

    // Filter by date
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

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Handle status change
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setIsLoading(true);
    try {
      ordersStore.update((ordersList: Order[]) => {
        return ordersList.map((order) =>
          order.id === orderId ? { ...order, status: newStatus, updatedAt: Date.now() } : order
        );
      });
    } catch (err) {
      console.error("Failed to update order status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Live Kitchen Orders"
      description="Monitor customer orders in real-time, accept kitchen prep, and update delivery status"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setDateFilter("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <Label htmlFor="order-search" className="sr-only">Search</Label>
              <Input
                id="order-search"
                placeholder="Search orders, tables, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[240px]"
              />
            </div>
            <div>
              <Select
                value={filterStatus}
                onValueChange={(val) => setFilterStatus(val as any)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={dateFilter}
                onValueChange={(val) => setDateFilter(val as any)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Dates" />
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
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {filteredOrders.length === 0 && !isLoading && (
          <div className="text-center py-12 rounded-2xl border bg-card/50">
            <p className="text-muted-foreground font-medium">No orders match the current filters.</p>
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
                    <TableHead>Items</TableHead>
                    <TableHead>Instructions</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-semibold">{order.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">{order.tableLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{order.customerName || "Guest"}</span>
                          {order.phone && (
                            <span className="text-xs text-muted-foreground">{order.phone}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {order.lines.map((line) => (
                          <div key={line.itemId} className="flex items-center gap-1.5 text-xs text-foreground/90 py-0.5">
                            <span className="font-semibold text-primary">{line.quantity}x</span>
                            <span className="truncate">{line.name}</span>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="max-w-[150px] text-xs">
                        {order.instructions ? (
                          <span className="text-amber-600 dark:text-amber-400 italic break-words">{order.instructions}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        ₹{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-[10px] w-fit uppercase">
                            {order.paymentMethod}
                          </Badge>
                          <Badge
                            className={`text-[10px] w-fit ${
                              order.paymentStatus === "paid"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                                : "bg-rose-500/10 text-rose-600 border-rose-300"
                            }`}
                          >
                            {order.paymentStatus.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            order.status === "pending"
                              ? "bg-amber-500/10 text-amber-600 border-amber-300"
                              : order.status === "preparing"
                                ? "bg-blue-500/10 text-blue-600 border-blue-300"
                                : order.status === "ready"
                                  ? "bg-purple-500/10 text-purple-600 border-purple-300"
                                  : order.status === "served"
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                                    : "bg-muted text-muted-foreground"
                          }
                        >
                          {order.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            {order.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(order.id, "preparing")}
                                  className="flex items-center gap-2 text-emerald-600"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Accept Order</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(order.id, "cancelled")}
                                  className="flex items-center gap-2 text-rose-600"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject Order</span>
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.status === "preparing" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, "ready")}
                                className="flex items-center gap-2 text-blue-600"
                              >
                                <Clock className="h-3.5 w-3.5" />
                                <span>Mark as Ready</span>
                              </DropdownMenuItem>
                            )}
                            {order.status === "ready" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, "served")}
                                className="flex items-center gap-2 text-emerald-600"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Mark as Served</span>
                              </DropdownMenuItem>
                            )}
                            {order.status === "cancelled" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, "pending")}
                                className="flex items-center gap-2"
                              >
                                <Clock className="h-3.5 w-3.5" />
                                <span>Reset to Pending</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}