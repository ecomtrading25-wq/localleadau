import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Mail, Plus, Play, Pause, CheckCircle, Clock } from "lucide-react";

export default function Campaigns() {
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");

  // Get user's organisations
  const { data: organisations } = trpc.organisation.list.useQuery();

  // Set the first organisation as selected by default
  useEffect(() => {
    if (organisations && organisations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organisations[0].id);
    }
  }, [organisations, selectedOrgId]);

  // Get campaigns
  const { data: campaigns, isLoading: campaignsLoading, refetch: refetchCampaigns } = trpc.campaigns.list.useQuery(
    {
      organisationId: selectedOrgId!,
      isTemplate: false,
    },
    { enabled: !!selectedOrgId }
  );

  // Create campaign mutation
  const createCampaignMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Campaign created!");
      setCreateDialogOpen(false);
      setCampaignName("");
      setCampaignDescription("");
      refetchCampaigns();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create campaign");
    },
  });

  // Update status mutation
  const updateStatusMutation = trpc.campaigns.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Campaign status updated");
      refetchCampaigns();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const handleCreateCampaign = () => {
    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }

    if (!selectedOrgId) {
      toast.error("No organisation selected");
      return;
    }

    createCampaignMutation.mutate({
      organisationId: selectedOrgId,
      name: campaignName.trim(),
      description: campaignDescription.trim() || undefined,
    });
  };

  const handleStatusChange = (campaignId: number, status: "draft" | "active" | "paused" | "completed") => {
    updateStatusMutation.mutate({ campaignId, status });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string; icon: any }> = {
      draft: { className: "bg-gray-500", label: "Draft", icon: Clock },
      active: { className: "bg-green-500", label: "Active", icon: Play },
      paused: { className: "bg-yellow-500", label: "Paused", icon: Pause },
      completed: { className: "bg-blue-500", label: "Completed", icon: CheckCircle },
    };

    const variant = variants[status] || variants.draft;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage email & SMS sequences
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Campaign</DialogTitle>
                  <DialogDescription>
                    Set up a new email or SMS campaign sequence
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                      id="name"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="e.g., Welcome Sequence"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={campaignDescription}
                      onChange={(e) => setCampaignDescription(e.target.value)}
                      placeholder="Describe the purpose of this campaign..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={createCampaignMutation.isPending}
                  >
                    Create Campaign
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {campaignsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      {campaign.description && (
                        <CardDescription className="mt-1">
                          {campaign.description}
                        </CardDescription>
                      )}
                    </div>
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(campaign.status)}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Recipients</div>
                        <div className="text-2xl font-bold">{campaign.totalRecipients}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Sent</div>
                        <div className="text-2xl font-bold">{campaign.totalSent}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Opened</div>
                        <div className="text-2xl font-bold">{campaign.totalOpened}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Replied</div>
                        <div className="text-2xl font-bold">{campaign.totalReplied}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Select
                        value={campaign.status}
                        onValueChange={(value) => handleStatusChange(campaign.id, value as any)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => toast("Campaign editor coming soon!")}>
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first campaign to start nurturing leads
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Campaign
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
