import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { menuStore, categoriesStore } from "@/lib/app-store";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CheckCircle2, UtensilsCrossed } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { MenuItem } from "@/types";

export const Route = createFileRoute("/admin/menu/")({
  component: MenuManagement,
});

function MenuManagement() {
  const menuItems = useStore(menuStore);
  const categories = useStore(categoriesStore);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editedItem, setEditedItem] = useState<MenuItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    categoryId: "",
    image: "",
    isVeg: false,
    isAvailable: true,
    isBestseller: false,
    spiceLevel: 1 as 0 | 1 | 2 | 3,
  });

  // Filter menu items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handle submitting the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (dialogMode === "add") {
        const newItem: MenuItem = {
          id: `item-${Date.now()}`,
          name: formData.name,
          description: formData.description,
          price: Number(formData.price),
          categoryId: formData.categoryId || (categories[0]?.id ?? "mains"),
          image: formData.image || "/images/butter-chicken.jpg",
          isVeg: formData.isVeg,
          isAvailable: formData.isAvailable,
          isBestseller: formData.isBestseller,
          spiceLevel: formData.spiceLevel,
        };

        menuStore.update((items: MenuItem[]) => [...items, newItem]);
      } else if (dialogMode === "edit" && editedItem) {
        const updatedItem: MenuItem = {
          ...editedItem,
          name: formData.name,
          description: formData.description,
          price: Number(formData.price),
          categoryId: formData.categoryId,
          image: formData.image,
          isVeg: formData.isVeg,
          isAvailable: formData.isAvailable,
          isBestseller: formData.isBestseller,
          spiceLevel: formData.spiceLevel,
        };

        menuStore.update((items: MenuItem[]) =>
          items.map((item) => (item.id === editedItem.id ? updatedItem : item))
        );
      }

      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to save menu item:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      menuStore.update((items: MenuItem[]) => items.filter((item) => item.id !== id));
    }
  };

  const handleToggleAvailable = (id: string, current: boolean) => {
    menuStore.update((items: MenuItem[]) =>
      items.map((item) => (item.id === id ? { ...item, isAvailable: !current } : item))
    );
  };

  const handleEdit = (item: MenuItem) => {
    setDialogMode("edit");
    setEditedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.categoryId,
      image: item.image,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      isBestseller: item.isBestseller ?? false,
      spiceLevel: (item.spiceLevel ?? 1) as 0 | 1 | 2 | 3,
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setDialogMode("add");
    setEditedItem(null);
    setFormData({
      name: "",
      description: "",
      price: 199,
      categoryId: categories[0]?.id ?? "starters",
      image: "",
      isVeg: true,
      isAvailable: true,
      isBestseller: false,
      spiceLevel: 1,
    });
    setDialogOpen(true);
  };

  return (
    <AdminLayout
      title="Menu Management"
      description="Add dishes, modify pricing, and toggle live item availability"
      actions={
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Dish</span>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
          >
            Reset Filters
          </Button>

          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="Search dishes or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[240px]"
            />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border bg-card/50">
            <p className="text-muted-foreground font-medium">No menu items match the current filters.</p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Photo</TableHead>
                    <TableHead>Dish Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Diet</TableHead>
                    <TableHead className="text-center">Spice</TableHead>
                    <TableHead className="text-center">Bestseller</TableHead>
                    <TableHead className="text-center">Available</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMenuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-10 w-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{item.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[240px]">
                          {item.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categories.find((c) => c.id === item.categoryId)?.name || item.categoryId}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{item.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            item.isVeg
                              ? "border-emerald-500 text-emerald-600 bg-emerald-500/10"
                              : "border-rose-500 text-rose-600 bg-rose-500/10"
                          }
                        >
                          {item.isVeg ? "Veg" : "Non-Veg"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {"🌶️".repeat(item.spiceLevel ?? 0) || "Mild"}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isBestseller ? (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-300">
                            ★ Star
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={item.isAvailable ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => handleToggleAvailable(item.id, item.isAvailable)}
                          className={`h-7 text-xs ${item.isAvailable ? "text-emerald-600 border-emerald-300" : "text-muted-foreground"}`}
                        >
                          {item.isAvailable ? "In Stock" : "Sold Out"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "add" ? "Add New Dish" : "Edit Dish"}
              </DialogTitle>
              <DialogDescription>
                Configure item details shown on the guest menu.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="dish-name">Dish Name</Label>
                <Input
                  id="dish-name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dish-price">Price (₹)</Label>
                  <Input
                    id="dish-price"
                    type="number"
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData((p) => ({ ...p, price: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dish-category">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(val) => setFormData((p) => ({ ...p, categoryId: val }))}
                  >
                    <SelectTrigger id="dish-category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dish-desc">Description</Label>
                <Textarea
                  id="dish-desc"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dish-image">Image URL</Label>
                <Input
                  id="dish-image"
                  placeholder="/images/paneer-tikka.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData((p) => ({ ...p, image: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <Checkbox
                    checked={formData.isVeg}
                    onCheckedChange={(checked) =>
                      setFormData((p) => ({ ...p, isVeg: Boolean(checked) }))
                    }
                  />
                  <span>Pure Veg</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <Checkbox
                    checked={formData.isBestseller}
                    onCheckedChange={(checked) =>
                      setFormData((p) => ({ ...p, isBestseller: Boolean(checked) }))
                    }
                  />
                  <span>Bestseller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <Checkbox
                    checked={formData.isAvailable}
                    onCheckedChange={(checked) =>
                      setFormData((p) => ({ ...p, isAvailable: Boolean(checked) }))
                    }
                  />
                  <span>Available</span>
                </label>
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
                  {isLoading ? "Saving..." : "Save Dish"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}