import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { tablesStore, hotelStore } from "@/lib/app-store";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, QrCode, Grid, CheckCircle2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { useDebounce } from "@/hooks/use-debounce";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { HotelTable } from "@/types";

export const Route = createFileRoute("/admin/tables/")({
  component: TablesManagement,
});

function TablesManagement() {
  const tables = useStore(tablesStore);
  const hotel = useStore(hotelStore);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editedTable, setEditedTable] = useState<HotelTable | null>(null);

  // QR Code preview dialog
  const [qrPreviewTable, setQrPreviewTable] = useState<HotelTable | null>(null);
  const [networkUrl, setNetworkUrl] = useState<string>("");

  useEffect(() => {
    fetch("/api/network-info")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.qrBaseUrl) setNetworkUrl(data.qrBaseUrl);
      })
      .catch(() => {});
  }, []);

  // Form states
  const [formData, setFormData] = useState({
    number: "",
    label: "",
    seats: 4,
    area: "Main Hall",
    isActive: true,
  });

  // Filter tables
  const filteredTables = tables.filter((table) => {
    const matchesSearch =
      table.number.toString().includes(debouncedSearchTerm) ||
      table.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      table.area.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    return matchesSearch;
  });

  const getQrUrl = (tableId: string) => {
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const baseUrl = isLocal ? networkUrl || window.location.origin : window.location.origin;
    return `${hotel.qrBaseUrl || baseUrl}/menu/${tableId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const num = parseInt(formData.number, 10);
      if (dialogMode === "add") {
        const duplicate = tables.some((t) => t.number === num);
        if (duplicate) {
          alert(`Table number ${num} already exists.`);
          setIsLoading(false);
          return;
        }

        const newTable: HotelTable = {
          id: `t${Date.now()}`,
          number: num,
          label: formData.label || `Table ${num}`,
          seats: Number(formData.seats) || 4,
          area: formData.area || "Main Hall",
          isActive: formData.isActive,
        };

        tablesStore.update((items: HotelTable[]) => [...items, newTable]);
      } else if (dialogMode === "edit" && editedTable) {
        const duplicate = tables.some((t) => t.number === num && t.id !== editedTable.id);
        if (duplicate) {
          alert(`Table number ${num} already exists.`);
          setIsLoading(false);
          return;
        }

        const updatedTable: HotelTable = {
          ...editedTable,
          number: num,
          label: formData.label || `Table ${num}`,
          seats: Number(formData.seats) || 4,
          area: formData.area || "Main Hall",
          isActive: formData.isActive,
        };

        tablesStore.update((items: HotelTable[]) =>
          items.map((item) => (item.id === editedTable.id ? updatedTable : item))
        );
      }

      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to save table:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = (id: string, currentActive: boolean = true) => {
    tablesStore.update((items: HotelTable[]) =>
      items.map((item) => (item.id === id ? { ...item, isActive: !currentActive } : item))
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      tablesStore.update((items: HotelTable[]) => items.filter((item) => item.id !== id));
    }
  };

  const handleEdit = (table: HotelTable) => {
    setDialogMode("edit");
    setEditedTable(table);
    setFormData({
      number: table.number.toString(),
      label: table.label,
      seats: table.seats,
      area: table.area,
      isActive: table.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setDialogMode("add");
    setEditedTable(null);
    const nextNum = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
    setFormData({
      number: nextNum.toString(),
      label: `Table ${nextNum}`,
      seats: 4,
      area: "Main Hall",
      isActive: true,
    });
    setDialogOpen(true);
  };

  return (
    <AdminLayout
      title="Dining Tables & QR Codes"
      description="Configure tables, dining sections, and preview/print table QR codes"
      actions={
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Table</span>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchTerm("")}
          >
            Reset Filters
          </Button>

          <Input
            placeholder="Search by number, label, or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[260px]"
          />
        </div>

        {filteredTables.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border bg-card/50">
            <p className="text-muted-foreground font-medium">No tables found.</p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Area / Section</TableHead>
                    <TableHead className="text-center">Seats</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">QR Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTables.map((table) => {
                    const isActive = table.isActive ?? true;
                    return (
                      <TableRow key={table.id}>
                        <TableCell className="font-mono font-bold">#{table.number}</TableCell>
                        <TableCell className="font-semibold text-foreground">{table.label}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{table.area}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{table.seats} seats</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant={isActive ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => handleToggleActive(table.id, isActive)}
                            className={`h-7 text-xs ${
                              isActive ? "text-emerald-600 border-emerald-300" : "text-muted-foreground"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQrPreviewTable(table)}
                            className="h-8 gap-1.5 text-xs"
                          >
                            <QrCode className="h-3.5 w-3.5 text-primary" />
                            <span>View QR</span>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(table)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(table.id)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Add/Edit Table Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "add" ? "Add Dining Table" : "Edit Table"}
              </DialogTitle>
              <DialogDescription>
                Set table number, capacity and restaurant section.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tbl-num">Table Number</Label>
                  <Input
                    id="tbl-num"
                    type="number"
                    min="1"
                    value={formData.number}
                    onChange={(e) => setFormData((p) => ({ ...p, number: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tbl-seats">Seats</Label>
                  <Input
                    id="tbl-seats"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.seats}
                    onChange={(e) => setFormData((p) => ({ ...p, seats: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tbl-label">Display Name / Label</Label>
                <Input
                  id="tbl-label"
                  placeholder="e.g. Table 4 or Window Table"
                  value={formData.label}
                  onChange={(e) => setFormData((p) => ({ ...p, label: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tbl-area">Area / Dining Section</Label>
                <Input
                  id="tbl-area"
                  placeholder="e.g. Main Hall, Courtyard, AC Family"
                  value={formData.area}
                  onChange={(e) => setFormData((p) => ({ ...p, area: e.target.value }))}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Table"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={!!qrPreviewTable} onOpenChange={(open) => !open && setQrPreviewTable(null)}>
          <DialogContent className="max-w-sm text-center">
            {qrPreviewTable && (
              <>
                <DialogHeader>
                  <DialogTitle>{qrPreviewTable.label}</DialogTitle>
                  <DialogDescription>
                    {qrPreviewTable.area} · {qrPreviewTable.seats} seats
                  </DialogDescription>
                </DialogHeader>

                <div className="my-4 flex flex-col items-center justify-center p-6 bg-muted/40 rounded-2xl border">
                  <QRCodeSVG
                    value={getQrUrl(qrPreviewTable.id)}
                    size={200}
                    className="rounded-lg shadow-sm"
                  />
                  <p className="mt-4 text-xs font-mono text-muted-foreground break-all">
                    {getQrUrl(qrPreviewTable.id)}
                  </p>
                </div>

                <DialogFooter className="flex sm:justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(getQrUrl(qrPreviewTable.id), "_blank");
                    }}
                  >
                    Open Menu
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                  >
                    Print QR Code
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}