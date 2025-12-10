import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, CreditCard, Loader2 } from "lucide-react";

export default function Billing() {
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<number | null>(null);

  // Get user's organisations
  const { data: organisations } = trpc.organisation.list.useQuery();

  // Set the first organisation as selected by default
  useEffect(() => {
    if (organisations && organisations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organisations[0].id);
    }
  }, [organisations, selectedOrgId]);

  // Get billing plans
  const { data: plans, isLoading: plansLoading } = trpc.billing.getPlans.useQuery();

  // Get current subscription
  const { data: currentSubscription, refetch: refetchSubscription } = trpc.billing.getCurrentSubscription.useQuery(
    { organisationId: selectedOrgId! },
    { enabled: !!selectedOrgId }
  );

  // Create checkout session mutation
  const createCheckoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, '_blank');
        toast.success("Redirecting to checkout...");
      }
      setProcessingPlanId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
      setProcessingPlanId(null);
    },
  });

  // Create portal session mutation
  const createPortalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
        toast.success("Opening billing portal...");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to open billing portal");
    },
  });

  const handleSubscribe = (planId: number) => {
    if (!selectedOrgId) {
      toast.error("No organisation selected");
      return;
    }

    setProcessingPlanId(planId);
    createCheckoutMutation.mutate({
      organisationId: selectedOrgId,
      planId,
      billingPeriod: 'monthly',
    });
  };

  const handleManageBilling = () => {
    if (!selectedOrgId) {
      toast.error("No organisation selected");
      return;
    }

    createPortalMutation.mutate({
      organisationId: selectedOrgId,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
              <p className="text-muted-foreground mt-1">
                Choose a plan that fits your business needs
              </p>
            </div>
            {currentSubscription && (
              <Button onClick={handleManageBilling} variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Billing
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Current Subscription */}
      {currentSubscription && currentSubscription.plan && (
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{currentSubscription.plan.name}</h3>
                  <p className="text-muted-foreground">{currentSubscription.plan.description}</p>
                  <div className="mt-2">
                    <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                      {currentSubscription.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {currentSubscription.plan.priceMonthlyFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {plansLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[500px] w-full" />
            ))}
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlan = currentSubscription?.planId === plan.id;
              const isProcessing = processingPlanId === plan.id;

              return (
                <Card key={plan.id} className={isCurrentPlan ? "border-primary shadow-lg" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <CardDescription className="mt-2">{plan.description}</CardDescription>
                      </div>
                      {isCurrentPlan && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Price */}
                    <div className="mb-6">
                      <div className="text-4xl font-bold">{plan.priceMonthlyFormatted}</div>
                      <div className="text-sm text-muted-foreground">per month</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        or {plan.priceAnnualFormatted}/year (save 2 months)
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      {plan.featuresArray.map((feature: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Limits */}
                    <div className="mt-6 pt-6 border-t space-y-2 text-sm text-muted-foreground">
                      <div>
                        <strong>Niches:</strong> {plan.maxNiches === -1 ? 'Unlimited' : plan.maxNiches}
                      </div>
                      <div>
                        <strong>Regions:</strong> {plan.maxRegions === -1 ? 'Unlimited' : plan.maxRegions}
                      </div>
                      <div>
                        <strong>Leads/month:</strong> {plan.maxLeadsPerMonth === -1 ? 'Unlimited' : plan.maxLeadsPerMonth}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {isCurrentPlan ? (
                      <Button className="w-full" variant="outline" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isProcessing || createCheckoutMutation.isPending}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Subscribe to {plan.name}</>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No plans available</h3>
              <p className="text-muted-foreground">
                Please contact support for pricing information
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Billing Info */}
      <div className="max-w-7xl mx-auto px-8 pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>
              All plans include a 14-day free trial. Cancel anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              • All prices are in Australian Dollars (AUD) and exclude GST
            </p>
            <p>
              • Payments are processed securely through Stripe
            </p>
            <p>
              • You can upgrade, downgrade, or cancel your subscription at any time
            </p>
            <p>
              • Annual plans save you 2 months compared to monthly billing
            </p>
            <p>
              • Need a custom plan? <a href="mailto:support@locallead.au" className="text-primary hover:underline">Contact us</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
