import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Edit2, Trash2, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const contactsQuery = trpc.contacts.getContacts.useQuery();
  const contacts = contactsQuery.data || [];

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLeadStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      cold: "bg-slate-500",
      warm: "bg-yellow-500",
      hot: "bg-orange-500",
      qualified: "bg-blue-500",
      customer: "bg-green-500",
      inactive: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Contacts Management</h1>
          <p className="text-muted-foreground">Manage your CRM contacts and customer relationships</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="card-gradient">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>{filteredContacts.length} contacts found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lead Score</TableHead>
                  <TableHead>Last Interaction</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No contacts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-white/5">
                      <TableCell className="font-medium">{contact.name || "Unknown"}</TableCell>
                      <TableCell>{contact.phoneNumber}</TableCell>
                      <TableCell>{contact.email || "-"}</TableCell>
                      <TableCell>
                        <Badge className={`${getLeadStatusColor(contact.leadStatus)} text-white`}>
                          {contact.leadStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-400 to-cyan-400"
                              style={{ width: `${contact.leadScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{contact.leadScore}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contact.lastInteraction
                          ? new Date(contact.lastInteraction).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedContact(contact);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
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

      {/* Contact Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="card-gradient">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>View and edit contact information</DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-muted-foreground">{selectedContact.name || "Unknown"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <p className="text-muted-foreground">{selectedContact.phoneNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-muted-foreground">{selectedContact.email || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Lead Status</label>
                <p className="text-muted-foreground capitalize">{selectedContact.leadStatus}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Lead Score</label>
                <p className="text-muted-foreground">{selectedContact.leadScore}/100</p>
              </div>
              <div>
                <label className="text-sm font-medium">Lifetime Value</label>
                <p className="text-muted-foreground">${selectedContact.lifetimeValue}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedContact.tags && selectedContact.tags.length > 0 ? (
                    selectedContact.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No tags</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
