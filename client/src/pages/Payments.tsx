import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Eye, Download, CheckCircle, Clock, XCircle } from "lucide-react";

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Mock data
  const payments = [
    {
      id: 1,
      orderId: "ORD-1234567890",
      amount: 1500,
      method: "Bank Transfer",
      status: "completed",
      date: new Date("2026-01-15"),
      customer: "John Doe",
      reference: "TXN-001-2026",
    },
    {
      id: 2,
      orderId: "ORD-1234567891",
      amount: 2500,
      method: "Mobile Money",
      status: "pending",
      date: new Date("2026-01-16"),
      customer: "Jane Smith",
      reference: "TXN-002-2026",
    },
    {
      id: 3,
      orderId: "ORD-1234567892",
      amount: 800,
      method: "Bank Transfer",
      status: "completed",
      date: new Date("2026-01-17"),
      customer: "Mike Johnson",
      reference: "TXN-003-2026",
    },
  ];

  const filteredPayments = payments.filter(
    (payment) =>
      payment.reference.includes(searchQuery) ||
      payment.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderId.includes(searchQuery)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-500",
      pending: "bg-yellow-500",
      failed: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Payments Management</h1>
          <p className="text-muted-foreground">Track and verify customer payments</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Record Payment
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed payments</p>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">${pendingPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{payments.filter((p) => p.status === "pending").length} payments</p>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">{payments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="card-gradient">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference, customer, or order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>{filteredPayments.length} transactions found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-white/5">
                      <TableCell className="font-mono font-medium">{payment.reference}</TableCell>
                      <TableCell>{payment.customer}</TableCell>
                      <TableCell className="font-mono text-sm">{payment.orderId}</TableCell>
                      <TableCell className="font-semibold text-gradient">${payment.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{payment.method}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <Badge className={`${getStatusColor(payment.status)} text-white`}>
                            {payment.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.date.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="card-gradient">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Transaction #{selectedPayment?.reference}</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Reference</label>
                  <p className="text-muted-foreground font-mono">{selectedPayment.reference}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Order</label>
                  <p className="text-muted-foreground font-mono">{selectedPayment.orderId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Customer</label>
                  <p className="text-muted-foreground">{selectedPayment.customer}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <p className="text-lg font-semibold text-gradient">${selectedPayment.amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <p className="text-muted-foreground">{selectedPayment.method}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedPayment.status)}
                    <Badge className={`${getStatusColor(selectedPayment.status)} text-white`}>
                      {selectedPayment.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Date</label>
                <p className="text-muted-foreground">{selectedPayment.date.toLocaleString()}</p>
              </div>

              {selectedPayment.status === "pending" && (
                <div className="flex gap-2">
                  <Button className="flex-1">Mark as Paid</Button>
                  <Button variant="outline" className="flex-1">
                    Mark as Failed
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
