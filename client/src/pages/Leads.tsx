import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Phone, Mail, Globe, DollarSign, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function Leads() {
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "contacted" | "qualified" | "proposal" | "won" | "lost">("all");
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");

  // Get user's organisations
  const { data: organisations } = trpc.organisation.list.useQuery();

  // Set the first organisation as selected by default
  useEffect(() => {
    if (organisations && organisations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organisations[0].id);
    }
  }, [organisations, selectedOrgId]);

  // Get leads
  const { data: leads, isLoading: leadsLoading, refetch: refetchLeads } = trpc.leads.list.useQuery(
    {
      organisationId: selectedOrgId!,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 100,
    },
    { enabled: !!selectedOrgId }
  );

  // Get selected lead details
  const { data: leadDetails } = trpc.leads.get.useQuery(
    { leadId: selectedLead! },
    { enabled: !!selectedLead }
  );

  // Get lead interactions
  const { data: interactions, refetch: refetchInteractions } = trpc.leads.getInteractions.useQuery(
    { leadId: selectedLead! },
    { enabled: !!selectedLead }
  );

  // Update status mutation
  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Lead status updated");
      refetchLeads();
      if (selectedLead) {
        refetchInteractions();
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  // Add note mutation
  const addNoteMutation = trpc.leads.addInteraction.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      setNoteDialogOpen(false);
      setNoteContent("");
      refetchInteractions();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add note");
    },
  });

  const handleStatusChange = (leadId: number, newStatus: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost") => {
    updateStatusMutation.mutate({ leadId, status: newStatus });
  };

  const handleAddNote = () => {
    if (!selectedLead || !noteContent.trim()) {
      toast.error("Please enter a note");
      return;
    }

    addNoteMutation.mutate({
      leadId: selectedLead,
      type: "note",
      content: noteContent.trim(),
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      new: { className: "bg-blue-500", label: "New" },
      contacted: { className: "bg-purple-500", label: "Contacted" },
      qualified: { className: "bg-green-500", label: "Qualified" },
      proposal: { className: "bg-yellow-500", label: "Proposal" },
      won: { className: "bg-emerald-600", label: "Won" },
      lost: { className: "bg-gray-500", label: "Lost" },
    };

    const variant = variants[status] || variants.new;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "call":
        return <Phone className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      case "note":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
              <p className="text-muted-foreground mt-1">
                Manage your sales pipeline
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex items-center gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "new" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("new")}
            >
              New
            </Button>
            <Button
              variant={statusFilter === "contacted" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("contacted")}
            >
              Contacted
            </Button>
            <Button
              variant={statusFilter === "qualified" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("qualified")}
            >
              Qualified
            </Button>
            <Button
              variant={statusFilter === "proposal" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("proposal")}
            >
              Proposal
            </Button>
            <Button
              variant={statusFilter === "won" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("won")}
            >
              Won
            </Button>
            <Button
              variant={statusFilter === "lost" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("lost")}
            >
              Lost
            </Button>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leads List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {leads?.length || 0} Leads
                </CardTitle>
                <CardDescription>
                  Track and manage your sales opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : leads && leads.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow
                          key={lead.id}
                          className={selectedLead === lead.id ? "bg-muted" : "cursor-pointer hover:bg-muted/50"}
                          onClick={() => setSelectedLead(lead.id)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{lead.businessName}</div>
                              {lead.contactName && (
                                <div className="text-sm text-muted-foreground">{lead.contactName}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              {lead.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </div>
                              )}
                              {lead.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {lead.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.estimatedValue && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                ${(lead.estimatedValue / 100).toFixed(0)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(lead.status)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={lead.status}
                              onValueChange={(value) => handleStatusChange(lead.id, value as any)}
                            >
                              <SelectTrigger className="w-[140px]" onClick={(e) => e.stopPropagation()}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="proposal">Proposal</SelectItem>
                                <SelectItem value="won">Won</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Convert prospects to leads to start managing your pipeline
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lead Details & Activity */}
          <div>
            {selectedLead && leadDetails ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{leadDetails.businessName}</CardTitle>
                  <CardDescription>Lead Details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    {leadDetails.contactName && (
                      <div className="text-sm">
                        <span className="font-medium">Contact:</span> {leadDetails.contactName}
                      </div>
                    )}
                    {leadDetails.phone && (
                      <div className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {leadDetails.phone}
                      </div>
                    )}
                    {leadDetails.email && (
                      <div className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {leadDetails.email}
                      </div>
                    )}
                    {leadDetails.website && (
                      <div className="text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <a href={leadDetails.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Add Note Button */}
                  <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Note</DialogTitle>
                        <DialogDescription>
                          Add a note to this lead's timeline
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="note">Note</Label>
                          <Textarea
                            id="note"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Enter your note..."
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddNote} disabled={addNoteMutation.isPending}>
                          Add Note
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Activity Timeline */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Activity Timeline</h4>
                    <div className="space-y-3">
                      {interactions && interactions.length > 0 ? (
                        interactions.map((interaction) => (
                          <div key={interaction.id} className="flex gap-3 text-sm">
                            <div className="mt-1">
                              {getInteractionIcon(interaction.type)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium capitalize">{interaction.type}</div>
                              {interaction.content && (
                                <div className="text-muted-foreground">{interaction.content}</div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(interaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No activity yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a lead to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
