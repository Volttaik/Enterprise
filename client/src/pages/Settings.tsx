import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Save, AlertCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Settings() {
  const { data: config, isLoading } = trpc.config.getConfig.useQuery();
  const updateConfigMutation = trpc.config.updateConfig.useMutation();

  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    aiSystemPrompt: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankPaymentInstructions: "",
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (config && !initializedRef.current) {
      setFormData({
        businessName: config.businessName || "",
        businessDescription: config.businessDescription || "",
        aiSystemPrompt: config.aiSystemPrompt || "",
        bankName: config.bankName || "",
        bankAccountName: config.bankAccountName || "",
        bankAccountNumber: config.bankAccountNumber || "",
        bankPaymentInstructions: config.bankPaymentInstructions || "",
      });
      initializedRef.current = true;
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await updateConfigMutation.mutateAsync(formData);
      toast.success("Configuration updated securely.");
    } catch (error) {
      toast.error("Failed to commit changes.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in-stagger">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">System Configuration</h1>
          <p className="text-muted-foreground">Adjust the operational parameters for your business and AI assistant.</p>
        </div>
        <Button onClick={handleSave} disabled={updateConfigMutation.isPending} className="gap-2 px-6 rounded-full shadow-sm">
          {updateConfigMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Commit Changes
        </Button>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 border border-border rounded-xl">
          <TabsTrigger value="business" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Identity</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">AI Core</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Financial</TabsTrigger>
        </TabsList>

        {/* Identity Settings */}
        <TabsContent value="business" className="mt-6 space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-display">Business Identity</CardTitle>
              <CardDescription>Core information presented to customers during interactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="font-medium text-foreground">Entity Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription" className="font-medium text-foreground">Operational Mandate (Description)</Label>
                <Textarea
                  id="businessDescription"
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleChange}
                  placeholder="We provide..."
                  className="bg-background min-h-[120px] resize-y"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Configuration */}
        <TabsContent value="ai" className="mt-6 space-y-6">
          <Card className="bg-card border-border shadow-sm border-t-4 border-t-accent">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                Neural Persona Directive
              </CardTitle>
              <CardDescription>Directly override the AI's base instructions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground mb-1">Directive Override active</p>
                  <p className="text-muted-foreground leading-relaxed">
                    This prompt is injected before all context. Define tone, boundaries, and rigid rules. (e.g. "Never offer discounts without code XYZ", "Always speak in a formal tone").
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiSystemPrompt" className="font-medium text-foreground">System Prompt</Label>
                <Textarea
                  id="aiSystemPrompt"
                  name="aiSystemPrompt"
                  value={formData.aiSystemPrompt}
                  onChange={handleChange}
                  placeholder="You are an autonomous agent responsible for..."
                  className="bg-background font-mono text-sm min-h-[200px] leading-relaxed resize-y focus-visible:ring-accent"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Details */}
        <TabsContent value="payments" className="mt-6 space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-display">Settlement Targets</CardTitle>
              <CardDescription>Bank details provided to clients for manual transfers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="bankName" className="font-medium text-foreground">Institution Name</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="e.g. Chase Bank"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountName" className="font-medium text-foreground">Beneficiary</Label>
                  <Input
                    id="bankAccountName"
                    name="bankAccountName"
                    value={formData.bankAccountName}
                    onChange={handleChange}
                    placeholder="Exact account name"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber" className="font-medium text-foreground">Account Identifier</Label>
                <Input
                  id="bankAccountNumber"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  placeholder="Account or IBAN"
                  className="bg-background font-mono"
                  type="password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankPaymentInstructions" className="font-medium text-foreground">Transfer Protocols</Label>
                <Textarea
                  id="bankPaymentInstructions"
                  name="bankPaymentInstructions"
                  value={formData.bankPaymentInstructions}
                  onChange={handleChange}
                  placeholder="Include order number in memo..."
                  className="bg-background min-h-[100px] resize-y"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
