import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "wouter";

interface UsageWidgetProps {
  organisationId: number;
}

export function UsageWidget({ organisationId }: UsageWidgetProps) {
  const { data: stats, isLoading } = trpc.usage.getUsageStats.useQuery(
    { organisationId },
    { enabled: !!organisationId, refetchInterval: 30000 } // Refetch every 30s
  );

  if (isLoading || !stats) {
    return null;
  }

  const { usage, limits, percentages, warnings, exceeded } = stats;

  const hasAnyWarning = warnings.prospects || warnings.leads || warnings.campaigns;
  const hasAnyExceeded = exceeded.prospects || exceeded.leads || exceeded.campaigns;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usage & Limits</CardTitle>
            <CardDescription>
              Current billing period usage
            </CardDescription>
          </div>
          {(hasAnyWarning || hasAnyExceeded) && (
            <Link href="/billing">
              <Button size="sm" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prospects */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Prospects</span>
            <span className="text-sm text-muted-foreground">
              {usage.prospects} / {limits.maxProspects === -1 ? "Unlimited" : limits.maxProspects}
            </span>
          </div>
          {limits.maxProspects !== -1 && (
            <>
              <Progress 
                value={percentages.prospects} 
                className={exceeded.prospects ? "bg-red-100" : warnings.prospects ? "bg-yellow-100" : ""}
              />
              {exceeded.prospects && (
                <p className="text-xs text-red-600 mt-1">Limit exceeded</p>
              )}
              {warnings.prospects && !exceeded.prospects && (
                <p className="text-xs text-yellow-600 mt-1">Approaching limit</p>
              )}
            </>
          )}
        </div>

        {/* Leads (Monthly) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Leads (This Month)</span>
            <span className="text-sm text-muted-foreground">
              {usage.leads} / {limits.maxLeads === -1 ? "Unlimited" : limits.maxLeads}
            </span>
          </div>
          {limits.maxLeads !== -1 && (
            <>
              <Progress 
                value={percentages.leads} 
                className={exceeded.leads ? "bg-red-100" : warnings.leads ? "bg-yellow-100" : ""}
              />
              {exceeded.leads && (
                <p className="text-xs text-red-600 mt-1">Monthly limit exceeded</p>
              )}
              {warnings.leads && !exceeded.leads && (
                <p className="text-xs text-yellow-600 mt-1">Approaching monthly limit</p>
              )}
            </>
          )}
        </div>

        {/* Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Active Campaigns</span>
            <span className="text-sm text-muted-foreground">
              {usage.campaigns} / {limits.maxCampaigns === -1 ? "Unlimited" : limits.maxCampaigns}
            </span>
          </div>
          {limits.maxCampaigns !== -1 && (
            <>
              <Progress 
                value={percentages.campaigns} 
                className={exceeded.campaigns ? "bg-red-100" : warnings.campaigns ? "bg-yellow-100" : ""}
              />
              {exceeded.campaigns && (
                <p className="text-xs text-red-600 mt-1">Limit exceeded</p>
              )}
              {warnings.campaigns && !exceeded.campaigns && (
                <p className="text-xs text-yellow-600 mt-1">Approaching limit</p>
              )}
            </>
          )}
        </div>

        {/* Warning Alert */}
        {hasAnyExceeded && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You've exceeded one or more plan limits. Upgrade your plan to continue using all features.
            </AlertDescription>
          </Alert>
        )}

        {hasAnyWarning && !hasAnyExceeded && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You're approaching your plan limits. Consider upgrading to avoid interruptions.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
