import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Database, Upload, FileText, Bot, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function KnowledgeBase() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const utils = trpc.useUtils();
  const { data: entries, isLoading } = trpc.knowledgeBase.getEntries.useQuery();
  const createEntryMutation = trpc.knowledgeBase.createEntry.useMutation({
    onSuccess: () => {
      toast.success("Intelligence injected into the knowledge core.");
      setIsAddOpen(false);
      setTitle("");
      setContent("");
      utils.knowledgeBase.getEntries.invalidate();
    },
    onError: () => {
      toast.error("Failed to inject intelligence.");
    },
  });

  const handleAdd = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    createEntryMutation.mutate({ title, content });
  };

  const totalVectors = entries?.reduce((sum, e) => sum + (e.chunks?.length ?? 0), 0) ?? 0;
  const lastSync = entries && entries.length > 0
    ? new Date(
        entries.reduce((latest, e) => (new Date(e.updatedAt) > new Date(latest) ? e.updatedAt : latest), entries[0].updatedAt)
      ).toLocaleString()
    : "Never";

  return (
    <div className="space-y-6 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-1">Knowledge Core</h1>
          <p className="text-muted-foreground">Upload raw intelligence. The AI learns automatically.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 px-6 rounded-full shadow-sm bg-accent text-accent-foreground hover:bg-accent/90">
          <Upload className="w-4 h-4" /> Inject Intelligence
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {isLoading ? (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="flex items-center justify-center p-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : !entries || entries.length === 0 ? (
            <Card className="bg-card border-border shadow-sm border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Core is Empty</h3>
                <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
                  Inject unstructured documents or direct text. The system will chunk the data, making it immediately accessible to your autonomous agent.
                </p>
                <Button variant="outline" className="border-border hover:bg-muted" onClick={() => setIsAddOpen(true)}>
                  Add First Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Neural Index Status</h3>
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 rounded-lg bg-card border border-border flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center border border-border">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{entry.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{entry.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <Card className="bg-card border-border shadow-sm sticky top-24">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Agent Status</div>
                  <div className="text-xs text-muted-foreground">Learning module active</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Entries</div>
                  <div className="text-2xl font-mono font-semibold">{entries?.length ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Vectors</div>
                  <div className="text-2xl font-mono font-semibold">{totalVectors}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Last Sync</div>
                  <div className="text-sm font-medium">{lastSync}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded text-xs text-muted-foreground leading-relaxed">
                  Documents are encoded into the vector space upon injection. The agent retrieves relevant chunks to answer queries accurately based solely on provided intel.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Inject Intelligence</DialogTitle>
            <DialogDescription>Add a document or note the AI can reference when answering customers.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Title</Label>
              <Input
                placeholder="e.g. Return policy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Content</Label>
              <Textarea
                placeholder="Paste the text the AI should learn from..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-background min-h-32"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createEntryMutation.isPending} className="bg-accent text-accent-foreground">
              {createEntryMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Inject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
