import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, ShoppingCart, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  const { data: ordersData, isLoading: ordersLoading } = trpc.orders.getOrders.useQuery();
  const { data: accounts } = trpc.whatsapp.getAccounts.useQuery();
  const defaultAccountId = accounts?.[0]?.id;
  const createOrderMutation = trpc.orders.createOrder.useMutation({
    onSuccess: () => {
      toast.success("Order sequence initialized.");
      setIsCreateOpen(false);
    },
    onError: () => {
      toast.error("Failed to compile order.");
    }
  });

  const orders = ordersData?.orders || [];

  const filteredOrders = orders.filter(
    (order: any) =>
      order.orderNumber?.includes(searchQuery) ||
      order.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "processing": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "delivered": return "bg-accent/10 text-accent border-accent/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const handleCreateOrder = () => {
    if (!selectedContactId || !totalAmount) {
      toast.error("Invalid parameters. Verify inputs.");
      return;
    }
    if (!defaultAccountId) {
      toast.error("No WhatsApp account connected yet. Pair one first.");
      return;
    }

    createOrderMutation.mutate({
      contactId: parseInt(selectedContactId, 10),
      whatsappAccountId: defaultAccountId,
      items: [], // Simplified for UI demonstration
      totalAmount: parseFloat(totalAmount),
    });
  };

  return (
    <div className="space-y-6 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-1">Logistics Matrix</h1>
          <p className="text-muted-foreground">Monitor and compile customer transactions.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 px-6 rounded-full shadow-soft">
          <Plus className="w-4 h-4" /> Compile Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inbound</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Awaiting Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-yellow-500">
              {orders.filter((o: any) => o.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cleared</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-accent">
              {orders.filter((o: any) => o.status === "delivered").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-soft">
        <CardContent className="p-2 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Filter by designation or tracking cipher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-background border-border text-base"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Tracking Cipher</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Capital</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ShoppingCart className="w-8 h-8 mb-2 opacity-50" />
                      <p>No active logistics records.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order: any) => (
                  <TableRow key={order.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-sm font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium">{order.contact?.name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{order.contact?.phoneNumber}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      ${Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusStyle(order.status)} uppercase tracking-wider text-[10px] px-2 py-0.5`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent/10">
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Compile Order</DialogTitle>
            <DialogDescription>Manually inject a new logistics record.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Target Entity ID</Label>
              <Input 
                placeholder="Numeric contact identifier" 
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="bg-background font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Capital Requirement ($)</Label>
              <Input 
                placeholder="0.00" 
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="bg-background font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Abort</Button>
            <Button onClick={handleCreateOrder} disabled={createOrderMutation.isPending} className="bg-accent text-accent-foreground">
              {createOrderMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Compile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
