import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Settings() {
  const configQuery = trpc.config.getConfig.useQuery();
  const updateConfigMutation = trpc.config.updateConfig.useMutation();

  const [formData, setFormData] = useState({
    businessName: configQuery.data?.businessName || "",
    businessDescription: configQuery.data?.businessDescription || "",
    aiSystemPrompt: configQuery.data?.aiSystemPrompt || "",
    bankName: configQuery.data?.bankName || "",
    bankAccountName: configQuery.data?.bankAccountName || "",
    bankAccountNumber: configQuery.data?.bankAccountNumber || "",
    bankPaymentInstructions: configQuery.data?.bankPaymentInstructions || "",
  });

  const handleSave = async () => {
    try {
      await updateConfigMutation.mutateAsync(formData);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your business and AI assistant</p>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-4">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Your Business Name"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleChange}
                  placeholder="Describe your business..."
                  className="mt-2 min-h-24"
                />
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Configuration */}
        <TabsContent value="ai" className="space-y-4">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>AI Assistant Configuration</CardTitle>
              <CardDescription>Customize your AI assistant behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="aiSystemPrompt">System Prompt</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Define how your AI assistant should behave and respond to customers
                </p>
                <Textarea
                  id="aiSystemPrompt"
                  name="aiSystemPrompt"
                  value={formData.aiSystemPrompt}
                  onChange={handleChange}
                  placeholder="You are a helpful customer service assistant..."
                  className="mt-2 min-h-32 font-mono text-sm"
                />
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-blue-300 mb-1">Pro Tip:</p>
                  <p>Include specific instructions about your products, services, and tone of voice.</p>
                </div>
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="payments" className="space-y-4">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
              <CardDescription>Configure payment information for customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g., First National Bank"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="bankAccountName">Account Holder Name</Label>
                <Input
                  id="bankAccountName"
                  name="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={handleChange}
                  placeholder="Your Business Name"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="bankAccountNumber">Account Number</Label>
                <Input
                  id="bankAccountNumber"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  placeholder="Your Account Number"
                  className="mt-2"
                  type="password"
                />
              </div>

              <div>
                <Label htmlFor="bankPaymentInstructions">Payment Instructions</Label>
                <Textarea
                  id="bankPaymentInstructions"
                  name="bankPaymentInstructions"
                  value={formData.bankPaymentInstructions}
                  onChange={handleChange}
                  placeholder="Additional payment instructions for customers..."
                  className="mt-2 min-h-24"
                />
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Payment Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">New Orders</Label>
                  <p className="text-sm text-muted-foreground">Get notified when customers place orders</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when inventory is low</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Payment Received</Label>
                  <p className="text-sm text-muted-foreground">Get notified when payments are received</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">Receive daily business summary</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Customer Messages</Label>
                  <p className="text-sm text-muted-foreground">Get notified for new customer messages</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button className="gap-2">
                <Save className="w-4 h-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Card className="card-gradient border-red-500/50 bg-red-500/10">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reset All Data</p>
              <p className="text-sm text-muted-foreground">Delete all conversations, orders, and contacts</p>
            </div>
            <Button variant="destructive">Reset</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
