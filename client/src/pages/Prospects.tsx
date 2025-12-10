import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, Loader2, MapPin, Phone, Globe, Star, CheckCircle, XCircle, ArrowRight } from "lucide-react";

export default function Prospects() {
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [maxResults, setMaxResults] = useState(50);
  const [statusFilter, setStatusFilter] = useState<"all" | "unqualified" | "qualified" | "excluded" | "converted">("all");

  // Get user's organisations
  const { data: organisations } = trpc.organisation.list.useQuery();

  // Set the first organisation as selected by default
  useEffect(() => {
    if (organisations && organisations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organisations[0].id);
      // Pre-fill location with org city
      if (organisations[0].city && organisations[0].state) {
        setLocation(`${organisations[0].city}, ${organisations[0].state}`);
      }
    }
  }, [organisations, selectedOrgId]);

  // Get prospects
  const { data: prospects, isLoading: prospectsLoading, refetch: refetchProspects } = trpc.prospecting.listProspects.useQuery(
    {
      organisationId: selectedOrgId!,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 100,
    },
    { enabled: !!selectedOrgId }
  );

  // Create scrape job mutation
  const createScrapeJobMutation = trpc.prospecting.createScrapeJob.useMutation({
    onSuccess: (data) => {
      toast.success("Scraping started! This may take a few minutes.");
      setSearchDialogOpen(false);
      setSearchQuery("");
      // Poll for job completion
      pollJobStatus(data.jobId);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start scraping");
    },
  });

  // Update prospect status mutation
  const updateStatusMutation = trpc.prospecting.updateProspectStatus.useMutation({
    onSuccess: () => {
      toast.success("Prospect status updated");
      refetchProspects();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  // Convert to lead mutation
  const convertToLeadMutation = trpc.prospecting.convertToLead.useMutation({
    onSuccess: () => {
      toast.success("Prospect converted to lead!");
      refetchProspects();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to convert prospect");
    },
  });

  const utils = trpc.useUtils();

  const pollJobStatus = (jobId: number) => {
    const interval = setInterval(async () => {
      try {
        const job = await utils.prospecting.getScrapeJobStatus.fetch({ jobId });
        if (job?.status === "completed") {
          toast.success(`Found ${job.prospectsCreated} new prospects!`);
          refetchProspects();
          clearInterval(interval);
        } else if (job?.status === "failed") {
          toast.error("Scraping failed: " + (job.errorMessage || "Unknown error"));
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleStartScraping = () => {
    if (!searchQuery.trim() || !location.trim()) {
      toast.error("Please enter both search query and location");
      return;
    }

    if (!selectedOrgId) {
      toast.error("No organisation selected");
      return;
    }

    createScrapeJobMutation.mutate({
      organisationId: selectedOrgId,
      searchQuery: searchQuery.trim(),
      location: location.trim(),
      maxResults,
    });
  };

  const handleUpdateStatus = (prospectId: number, status: "unqualified" | "qualified" | "excluded" | "converted") => {
    updateStatusMutation.mutate({ prospectId, status });
  };

  const handleConvertToLead = (prospectId: number) => {
    if (!selectedOrgId) return;
    convertToLeadMutation.mutate({
      prospectId,
      organisationId: selectedOrgId,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "qualified":
        return <Badge className="bg-green-500">Qualified</Badge>;
      case "excluded":
        return <Badge variant="destructive">Excluded</Badge>;
      case "converted":
        return <Badge className="bg-blue-500">Converted</Badge>;
      default:
        return <Badge variant="secondary">Unqualified</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Prospects</h1>
              <p className="text-muted-foreground mt-1">
                Find and qualify local businesses
              </p>
            </div>
            <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Search className="mr-2 h-4 w-4" />
                  Find Prospects
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Search Google Maps</DialogTitle>
                  <DialogDescription>
                    Find businesses in your area that match your target market
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchQuery">What are you looking for?</Label>
                    <Input
                      id="searchQuery"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., plumbers, electricians, cafes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Sydney, NSW"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxResults">Maximum results</Label>
                    <Input
                      id="maxResults"
                      type="number"
                      value={maxResults}
                      onChange={(e) => setMaxResults(parseInt(e.target.value) || 50)}
                      min="1"
                      max="500"
                    />
                    <p className="text-xs text-muted-foreground">
                      More results take longer to process
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleStartScraping}
                    disabled={createScrapeJobMutation.isPending}
                  >
                    {createScrapeJobMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Start Scraping
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
              variant={statusFilter === "unqualified" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("unqualified")}
            >
              Unqualified
            </Button>
            <Button
              variant={statusFilter === "qualified" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("qualified")}
            >
              Qualified
            </Button>
            <Button
              variant={statusFilter === "excluded" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("excluded")}
            >
              Excluded
            </Button>
            <Button
              variant={statusFilter === "converted" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("converted")}
            >
              Converted
            </Button>
          </div>
        </div>
      </div>

      {/* Prospects Table */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {prospects?.length || 0} Prospects
            </CardTitle>
            <CardDescription>
              Review and qualify prospects from your searches
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prospectsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : prospects && prospects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.map((prospect) => (
                    <TableRow key={prospect.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{prospect.businessName}</div>
                          {prospect.category && (
                            <div className="text-sm text-muted-foreground">{prospect.category}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {prospect.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {prospect.phone}
                            </div>
                          )}
                          {prospect.website && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {prospect.city && prospect.state ? `${prospect.city}, ${prospect.state}` : prospect.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        {prospect.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{prospect.rating}</span>
                            {prospect.reviewCount && (
                              <span className="text-xs text-muted-foreground">({prospect.reviewCount})</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(prospect.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {prospect.status === "unqualified" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(prospect.id, "qualified")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Qualify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(prospect.id, "excluded")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Exclude
                              </Button>
                            </>
                          )}
                          {prospect.status === "qualified" && (
                            <Button
                              size="sm"
                              onClick={() => handleConvertToLead(prospect.id)}
                              disabled={convertToLeadMutation.isPending}
                            >
                              <ArrowRight className="h-4 w-4 mr-1" />
                              Convert to Lead
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No prospects yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by searching Google Maps for businesses in your area
                </p>
                <Button onClick={() => setSearchDialogOpen(true)}>
                  <Search className="mr-2 h-4 w-4" />
                  Find Your First Prospects
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
