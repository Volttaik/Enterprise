import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package, Edit2, AlertTriangle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: products = [], isLoading } = trpc.products.getProducts.useQuery();

  const filteredProducts = products.filter(
    (product: any) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-1">Asset Catalog</h1>
          <p className="text-muted-foreground">Manage active inventory nodes.</p>
        </div>
        <Button className="gap-2 px-6 rounded-full shadow-soft">
          <Plus className="w-4 h-4" /> Provision Asset
        </Button>
      </div>

      <Card className="bg-card border-border shadow-soft">
        <CardContent className="p-2 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Query asset nomenclature or SKU..."
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
            <h3 className="text-lg font-medium text-foreground mb-2">No Assets Detected</h3>
            <p className="max-w-sm leading-relaxed mb-6">
              The catalog is currently barren. Provision assets to allow the AI to offer them to incoming entities.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((product: any) => (
            <Card key={product.id} className="bg-card border-border shadow-soft hover:border-accent/40 transition-colors group">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-display">{product.name}</CardTitle>
                    <div className="text-xs font-mono text-muted-foreground mt-1 tracking-wider uppercase">
                      {product.sku || "UNASSIGNED-SKU"}
                    </div>
                  </div>
                  {product.isActive ? (
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[10px]">LIVE</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px]">OFFLINE</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {product.description || "No tactical details provided for this asset."}
                </p>

                <div className="flex items-end justify-between bg-background p-3 rounded-lg border border-border">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Valuation</div>
                    <div className="text-xl font-mono font-semibold">${Number(product.price).toLocaleString()}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
