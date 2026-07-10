import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, ShieldAlert, User, Activity, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);

  const { data: contacts = [], isLoading } = trpc.contacts.getContacts.useQuery();
  const { data: contactDetails, isLoading: detailsLoading } = trpc.contacts.getContactDetails.useQuery(
    { contactId: selectedContactId! },
    { enabled: !!selectedContactId }
  );

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case "cold": return "bg-muted text-muted-foreground border-border";
      case "warm": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "hot": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "qualified": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "customer": return "bg-accent/10 text-accent border-accent/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-1">CRM Registry</h1>
          <p className="text-muted-foreground">Manage leads and customer intelligence.</p>
        </div>
        <Button className="gap-2 px-6 rounded-full shadow-soft">
          <Plus className="w-4 h-4" /> Add Record
        </Button>
      </div>

      <Card className="bg-card border-border shadow-soft">
        <CardContent className="p-2 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Query by designation, comms channel, or address..."
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
                <TableHead className="w-[250px]">Designation</TableHead>
                <TableHead>Comms Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>LTV</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <User className="w-8 h-8 mb-2 opacity-50" />
                      <p>No records located in the registry.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      {contact.name || "Unknown Entity"}
                      {contact.email && <div className="text-xs text-muted-foreground font-normal mt-0.5">{contact.email}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{contact.phoneNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getLeadStatusColor(contact.leadStatus)} uppercase tracking-wider text-[10px] px-2 py-0.5`}>
                        {contact.leadStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      ${Number(contact.lifetimeValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-accent hover:text-accent hover:bg-accent/10"
                        onClick={() => setSelectedContactId(contact.id)}
                      >
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

      <Dialog open={!!selectedContactId} onOpenChange={(open) => !open && setSelectedContactId(null)}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Record Intelligence</DialogTitle>
            <DialogDescription>Detailed dossier for selected entity.</DialogDescription>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status</div>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Active</Badge>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Order History</div>
                  <div className="font-mono text-sm">{contactDetails?.orders?.length || 0} Transactions</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Activity className="w-4 h-4" /> Initialize Sequence
                </Button>
                <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-border">
                  <ShieldAlert className="w-4 h-4 mr-2" /> Purge
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
