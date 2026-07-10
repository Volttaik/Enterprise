import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Package, Edit2, AlertTriangle, RefreshCw, Trash2, ImagePlus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type ProductForm = {
  id: number | null;
  name: string;
  description: string;
  category: string;
  price: string;
  discountPercent: string;
  sku: string;
  stock: string;
  imageBase64: string | null;
  imageUrl: string | null;
};

const EMPTY_FORM: ProductForm = {
  id: null,
  name: "",
  description: "",
  category: "",
  price: "",
  discountPercent: "0",
  sku: "",
  stock: "0",
  imageBase64: null,
  imageUrl: null,
};

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: products = [], isLoading } = trpc.products.getProducts.useQuery();

  const invalidate = () => utils.products.getProducts.invalidate();

  const createMutation = trpc.products.createProduct.useMutation({
    onSuccess: () => {
      toast.success("Product added.");
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err.message || "Failed to add product."),
  });

  const updateMutation = trpc.products.updateProduct.useMutation({
    onSuccess: () => {
      toast.success("Product updated.");
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err.message || "Failed to update product."),
  });

  const deleteMutation = trpc.products.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success("Product removed.");
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || "Failed to remove product."),
  });

  const filteredProducts = products.filter(
    (product: any) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.includes(searchQuery)
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (product: any) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description || "",
      category: product.category || "",
      price: String(product.price),
      discountPercent: String(product.discountPercent ?? 0),
      sku: product.sku || "",
      stock: String(product.inventory?.quantity ?? 0),
      imageBase64: null,
      imageUrl: product.imageUrl || null,
    });
    setDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageBase64: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.price) {
      toast.error("Name and price are required.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      price: parseFloat(form.price),
      discountPercent: parseInt(form.discountPercent || "0", 10),
      sku: form.sku.trim() || undefined,
      stock: parseInt(form.stock || "0", 10),
      imageBase64: form.imageBase64 || undefined,
    };

    if (form.id) {
      updateMutation.mutate({ productId: form.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-1">Products</h1>
          <p className="text-muted-foreground">Manage the catalog your AI assistant can sell from.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 px-6 rounded-full shadow-soft">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      <Card className="bg-card border-border shadow-soft">
        <CardContent className="p-2 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-background border-border text-base"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="bg-card border-border shadow-soft border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No products yet</h3>
            <p className="max-w-sm leading-relaxed mb-6">
              Add products so the AI assistant can show pricing, availability, and images to customers.
            </p>
            <Button onClick={openCreate} className="gap-2 rounded-full">
              <Plus className="w-4 h-4" /> Add your first product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((product: any) => {
            const lowStock =
              product.inventory && product.inventory.quantity <= product.inventory.lowStockThreshold;
            const discounted =
              product.discountPercent > 0
                ? (Number(product.price) * (1 - product.discountPercent / 100)).toFixed(2)
                : null;
            return (
              <Card key={product.id} className="bg-card border-border shadow-soft hover:border-accent/40 transition-colors group overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-muted/40 flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-display">{product.name}</CardTitle>
                      <div className="text-xs font-mono text-muted-foreground mt-1 tracking-wider uppercase">
                        {product.sku || "NO SKU"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {product.isActive ? (
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[10px]">ACTIVE</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px]">OFFLINE</Badge>
                      )}
                      {lowStock && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] gap-1">
                          <AlertTriangle className="w-3 h-3" /> Low stock
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {product.description || "No description yet."}
                  </p>

                  <div className="flex items-end justify-between bg-background p-3 rounded-lg border border-border">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Price</div>
                      {discounted ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-mono font-semibold">${discounted}</span>
                          <span className="text-xs line-through text-muted-foreground">${Number(product.price).toLocaleString()}</span>
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px]">-{product.discountPercent}%</Badge>
                        </div>
                      ) : (
                        <div className="text-xl font-mono font-semibold">${Number(product.price).toLocaleString()}</div>
                      )}
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Stock: {product.inventory?.quantity ?? 0}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(product)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              Set the name, image, price, discount, and stock the AI can offer to customers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div
              className="w-full h-36 rounded-lg border border-dashed border-border flex items-center justify-center cursor-pointer bg-muted/20 overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {form.imageBase64 || form.imageUrl ? (
                <img src={form.imageBase64 || form.imageUrl || ""} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground text-sm gap-1">
                  <ImagePlus className="w-6 h-6" />
                  Click to upload image
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Wireless Earbuds" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description customers will see"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input id="discount" type="number" min="0" max="100" value={form.discountPercent} onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock quantity</Label>
                <Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (optional)</Label>
                <Input id="sku" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input id="category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              {form.id ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this product?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be hidden from the catalog and the AI will stop offering it. This can't be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate({ productId: deleteTarget })}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
