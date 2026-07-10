import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign, RefreshCw, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Payments() {
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [formData, setFormData] = useState({
    orderId: "",
    amount: "",
    paymentMethod: "bank_transfer",
  });

  const recordPaymentMutation = trpc.payments.recordPayment.useMutation({
    onSuccess: () => {
      toast.success("Capital transfer verified.");
      setIsRecordOpen(false);
      setFormData({ orderId: "", amount: "", paymentMethod: "bank_transfer" });
    },
    onError: () => {
      toast.error("Capital transfer verification failed.");
    }
  });

  const handleRecord = () => {
    if (!formData.orderId || !formData.amount) {
      toast.error("Missing required parameters.");
      return;
    }
    
    recordPaymentMutation.mutate({
      orderId: parseInt(formData.orderId, 10),
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
    });
  };

  return (
    <div className="space-y-6 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-1">Capital Ledger</h1>
          <p className="text-muted-foreground">Track and authenticate financial influx.</p>
        </div>
        <Button onClick={() => setIsRecordOpen(true)} className="gap-2 px-6 rounded-full shadow-soft">
          <Plus className="w-4 h-4" /> Authenticate Transfer
        </Button>
      </div>

      <Card className="bg-card border-border shadow-soft border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <DollarSign className="w-12 h-12 mb-4 opacity-50 text-accent" />
          <h3 className="text-lg font-medium text-foreground mb-2">Ledger Sync Pending</h3>
          <p className="max-w-sm leading-relaxed mb-6">
            The master ledger is empty. Authenticate incoming transfers to construct the financial history.
          </p>
          <Button onClick={() => setIsRecordOpen(true)} variant="outline" className="border-border hover:bg-muted">
            Initiate First Entry
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              Transfer Authentication
            </DialogTitle>
            <DialogDescription>Manually link capital to a logistics record.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Logistics Identifier (Order ID)</Label>
              <Input 
                placeholder="Numeric ID" 
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="bg-background font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-foreground">Verified Capital ($)</Label>
              <Input 
                placeholder="0.00" 
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="bg-background font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Vector</Label>
              <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select vector" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card / Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-3 bg-muted/50 border border-border rounded-lg flex gap-3 mt-4">
              <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                Authenticating this transfer will securely lock the capital against the designated order record.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecordOpen(false)}>Abort</Button>
            <Button onClick={handleRecord} disabled={recordPaymentMutation.isPending} className="bg-accent text-accent-foreground">
              {recordPaymentMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Authenticate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
