import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Target, Mail, DollarSign, TrendingUp, Briefcase, CreditCard } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  // Get user's organisations
  const { data: organisations, isLoading: orgsLoading } = trpc.organisation.list.useQuery();

  // Set the first organisation as selected by default
  useEffect(() => {
    if (organisations && organisations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organisations[0].id);
    }
  }, [organisations, selectedOrgId]);

  // Get dashboard stats
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(
    { organisationId: selectedOrgId! },
    { enabled: !!selectedOrgId }
  );

  if (orgsLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!organisations || organisations.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Organisation Found</CardTitle>
            <CardDescription>
              You don't have access to any organisations yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const selectedOrg = organisations.find(o => o.id === selectedOrgId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                {selectedOrg?.name || "Welcome back"}
              </p>
            </div>
            {organisations.length > 1 && (
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedOrgId || ""}
                onChange={(e) => setSelectedOrgId(parseInt(e.target.value))}
              >
                {organisations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.newLeads || 0} new this week
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Prospects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prospects</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalProspects || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.qualifiedProspects || 0} qualified
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Campaigns */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Running now
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${(stats?.totalRevenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.wonLeads || 0} jobs won
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/prospects">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Find Prospects</CardTitle>
                </div>
                <CardDescription>
                  Search Google Maps for new business leads in your area
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/leads">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Manage Leads</CardTitle>
                </div>
                <CardDescription>
                  View and update your lead pipeline
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/campaigns">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Create Campaign</CardTitle>
                </div>
                <CardDescription>
                  Set up automated email/SMS sequences
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/billing">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Billing & Plans</CardTitle>
                </div>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Welcome Message for New Users */}
        {stats && stats.totalLeads === 0 && stats.totalProspects === 0 && (
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl">Welcome to Local Lead AU! 🎉</CardTitle>
              <CardDescription className="text-base">
                You're all set up. Here's how to get started:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Find Your First Prospects</p>
                  <p className="text-sm text-muted-foreground">
                    Use our Google Maps scraper to find businesses in your niche and area
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Qualify & Convert</p>
                  <p className="text-sm text-muted-foreground">
                    Review prospects, mark qualified ones, and convert them to leads
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Launch a Campaign</p>
                  <p className="text-sm text-muted-foreground">
                    Create email/SMS sequences to automatically engage your leads
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
