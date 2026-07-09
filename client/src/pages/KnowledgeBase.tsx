import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Plus, Edit2, Trash2, Search, FileText, CheckCircle } from "lucide-react";

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({ title: "", content: "" });

  // Mock data
  const documents = [
    {
      id: 1,
      title: "Product Warranty Policy",
      content: "All products come with a 1-year warranty...",
      type: "policy",
      createdAt: new Date("2026-01-10"),
      chunks: 5,
    },
    {
      id: 2,
      title: "Shipping & Delivery FAQ",
      content: "We ship to all locations within 3-5 business days...",
      type: "faq",
      createdAt: new Date("2026-01-12"),
      chunks: 8,
    },
    {
      id: 3,
      title: "Return & Refund Process",
      content: "Customers can return items within 30 days...",
      type: "process",
      createdAt: new Date("2026-01-14"),
      chunks: 6,
    },
  ];

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDocument = () => {
    setNewDocument({ title: "", content: "" });
    setDialogOpen(true);
  };

  const handleSaveDocument = () => {
    setDialogOpen(false);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      policy: "bg-blue-500",
      faq: "bg-purple-500",
      process: "bg-green-500",
      guide: "bg-orange-500",
    };
    return colors[type] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Knowledge Base</h1>
          <p className="text-muted-foreground">Upload and manage business documents for AI context</p>
        </div>
        <Button className="gap-2" onClick={handleAddDocument}>
          <Plus className="w-4 h-4" />
          Add Document
        </Button>
      </div>

      {/* Upload Area */}
      <Card className="card-gradient border-dashed border-2 border-cyan-500/30">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Upload className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
            <p className="font-medium mb-2">Drag and drop files here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <Button variant="outline">Choose Files</Button>
            <p className="text-xs text-muted-foreground mt-4">Supported: PDF, DOCX, TXT, MD, Excel</p>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card className="card-gradient">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">{documents.length}</div>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">
              {documents.reduce((sum, d) => sum + d.chunks, 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Indexed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{documents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocuments.length === 0 ? (
          <Card className="card-gradient">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No documents found
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="card-gradient hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <FileText className="w-10 h-10 text-cyan-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{doc.title}</h3>
                        <Badge className={`${getTypeColor(doc.type)} text-white text-xs`}>
                          {doc.type}
                        </Badge>
                        <Badge className="bg-green-500/20 text-green-300 text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Indexed
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{doc.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{doc.chunks} chunks</span>
                        <span>{doc.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Document Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="card-gradient">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
            <DialogDescription>Add a new document to your knowledge base</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                placeholder="Document title"
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={newDocument.content}
                onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                placeholder="Paste your document content here..."
                className="mt-2 min-h-32"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSaveDocument}>
                Save Document
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
