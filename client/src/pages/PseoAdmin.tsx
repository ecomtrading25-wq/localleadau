import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, RefreshCw, MapPin, Briefcase, FileText } from "lucide-react";

export default function PseoAdmin() {
  const [nicheForm, setNicheForm] = useState({ slug: "", label: "", pluralLabel: "", category: "" });
  const [locationForm, setLocationForm] = useState({ slug: "", city: "", state: "", regionLabel: "" });

  const utils = trpc.useUtils();

  // Queries
  const { data: niches, isLoading: nichesLoading } = trpc.pseo.listNiches.useQuery();
  const { data: locations, isLoading: locationsLoading } = trpc.pseo.listLocations.useQuery();
  const { data: stats } = trpc.pseo.getStats.useQuery();

  // Mutations
  const createNiche = trpc.pseo.createNiche.useMutation({
    onSuccess: () => {
      toast.success("Niche created successfully");
      setNicheForm({ slug: "", label: "", pluralLabel: "", category: "" });
      utils.pseo.listNiches.invalidate();
      utils.pseo.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create niche: ${error.message}`);
    },
  });

  const createLocation = trpc.pseo.createLocation.useMutation({
    onSuccess: () => {
      toast.success("Location created successfully");
      setLocationForm({ slug: "", city: "", state: "", regionLabel: "" });
      utils.pseo.listLocations.invalidate();
      utils.pseo.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create location: ${error.message}`);
    },
  });

  const generatePages = trpc.pseo.generatePages.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.pagesCreated} pages, skipped ${data.pagesSkipped} existing pages`);
      utils.pseo.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to generate pages: ${error.message}`);
    },
  });

  const handleCreateNiche = (e: React.FormEvent) => {
    e.preventDefault();
    createNiche.mutate(nicheForm);
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    createLocation.mutate(locationForm);
  };

  const handleGeneratePages = (regenerate: boolean = false) => {
    generatePages.mutate({ regenerate });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Programmatic SEO Management</h1>
          <p className="text-gray-600 mt-2">
            Manage niches, locations, and generate landing pages for organic traffic
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPages}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.publishedPages} published</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Niches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalNiches}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLocations}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Potential Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.potentialPages}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.potentialPages - stats.totalPages} not generated
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Page Generation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Pages</CardTitle>
            <CardDescription>
              Create landing pages for all niche × location combinations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => handleGeneratePages(false)}
                disabled={generatePages.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Generate New Pages
              </Button>
              <Button
                variant="outline"
                onClick={() => handleGeneratePages(true)}
                disabled={generatePages.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate All Pages
              </Button>
            </div>
            {generatePages.isPending && (
              <p className="text-sm text-gray-600">Generating pages... This may take a moment.</p>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Niches and Locations */}
        <Tabs defaultValue="niches">
          <TabsList>
            <TabsTrigger value="niches">
              <Briefcase className="mr-2 h-4 w-4" />
              Niches
            </TabsTrigger>
            <TabsTrigger value="locations">
              <MapPin className="mr-2 h-4 w-4" />
              Locations
            </TabsTrigger>
          </TabsList>

          {/* Niches Tab */}
          <TabsContent value="niches">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Niche Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Add New Niche</CardTitle>
                  <CardDescription>
                    Create a new service category for SEO pages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateNiche} className="space-y-4">
                    <div>
                      <Label htmlFor="niche-slug">Slug</Label>
                      <Input
                        id="niche-slug"
                        value={nicheForm.slug}
                        onChange={(e) => setNicheForm({ ...nicheForm, slug: e.target.value })}
                        placeholder="plumber"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="niche-label">Label (Singular)</Label>
                      <Input
                        id="niche-label"
                        value={nicheForm.label}
                        onChange={(e) => setNicheForm({ ...nicheForm, label: e.target.value })}
                        placeholder="Plumber"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="niche-plural">Plural Label</Label>
                      <Input
                        id="niche-plural"
                        value={nicheForm.pluralLabel}
                        onChange={(e) => setNicheForm({ ...nicheForm, pluralLabel: e.target.value })}
                        placeholder="Plumbers"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="niche-category">Category (Optional)</Label>
                      <Input
                        id="niche-category"
                        value={nicheForm.category}
                        onChange={(e) => setNicheForm({ ...nicheForm, category: e.target.value })}
                        placeholder="tradies"
                      />
                    </div>
                    <Button type="submit" disabled={createNiche.isPending}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Niche
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Niches List */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Niches</CardTitle>
                  <CardDescription>
                    {niches?.length || 0} niches configured
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {nichesLoading ? (
                    <p className="text-gray-500">Loading...</p>
                  ) : niches && niches.length > 0 ? (
                    <div className="space-y-2">
                      {niches.map((niche: any) => (
                        <div key={niche.id} className="p-3 border rounded-lg">
                          <div className="font-medium">{niche.label}</div>
                          <div className="text-sm text-gray-600">
                            Slug: {niche.slug} | Plural: {niche.pluralLabel}
                          </div>
                          {niche.category && (
                            <div className="text-xs text-gray-500 mt-1">
                              Category: {niche.category}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No niches yet. Add your first niche to get started.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Location Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Add New Location</CardTitle>
                  <CardDescription>
                    Create a new location for SEO pages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateLocation} className="space-y-4">
                    <div>
                      <Label htmlFor="location-slug">Slug</Label>
                      <Input
                        id="location-slug"
                        value={locationForm.slug}
                        onChange={(e) => setLocationForm({ ...locationForm, slug: e.target.value })}
                        placeholder="sydney"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location-city">City</Label>
                      <Input
                        id="location-city"
                        value={locationForm.city}
                        onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                        placeholder="Sydney"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location-state">State</Label>
                      <Input
                        id="location-state"
                        value={locationForm.state}
                        onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                        placeholder="NSW"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location-region">Region Label</Label>
                      <Input
                        id="location-region"
                        value={locationForm.regionLabel}
                        onChange={(e) => setLocationForm({ ...locationForm, regionLabel: e.target.value })}
                        placeholder="Greater Sydney"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={createLocation.isPending}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Location
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Locations List */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Locations</CardTitle>
                  <CardDescription>
                    {locations?.length || 0} locations configured
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {locationsLoading ? (
                    <p className="text-gray-500">Loading...</p>
                  ) : locations && locations.length > 0 ? (
                    <div className="space-y-2">
                      {locations.map((location: any) => (
                        <div key={location.id} className="p-3 border rounded-lg">
                          <div className="font-medium">{location.city}, {location.state}</div>
                          <div className="text-sm text-gray-600">
                            Slug: {location.slug}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Region: {location.regionLabel}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No locations yet. Add your first location to get started.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
