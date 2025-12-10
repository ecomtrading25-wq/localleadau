import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { ArrowRight, Target, Mail, TrendingUp, MapPin, Zap, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Local Lead AU</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Get More Local Leads,
          <br />
          <span className="text-primary">Grow Your Business</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          The all-in-one platform for Australian tradies and service businesses to find, qualify, and convert local leads automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8" asChild>
            <a href={getLoginUrl()}>
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8">
            Watch Demo
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Win More Work</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <MapPin className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Google Maps Prospecting</CardTitle>
              <CardDescription>
                Find businesses in your area that need your services. Scrape Google Maps for phone numbers, emails, and addresses automatically.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Mail className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Automated Campaigns</CardTitle>
              <CardDescription>
                Build email and SMS sequences that run on autopilot. Follow up with prospects without lifting a finger.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Lead Pipeline</CardTitle>
              <CardDescription>
                Track every lead from first contact to job completion. Never lose track of a potential customer again.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Instant Notifications</CardTitle>
              <CardDescription>
                Get notified via email or SMS the moment a new lead comes in. Respond faster than your competitors.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Smart Qualification</CardTitle>
              <CardDescription>
                Filter and qualify prospects based on your criteria. Focus only on the leads most likely to convert.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Australian-First</CardTitle>
              <CardDescription>
                Built specifically for Australian businesses. Optimized for local markets, regulations, and business practices.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Trusted by Australian Businesses</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Active Businesses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Leads Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$2.5M+</div>
              <div className="text-muted-foreground">Revenue Created</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Grow Your Business?</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Join hundreds of Australian tradies and service businesses using Local Lead AU to win more work.
        </p>
        <Button size="lg" className="text-lg px-8" asChild>
          <a href={getLoginUrl()}>
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Local Lead AU. All rights reserved.</p>
          <p className="mt-2">Made with ❤️ for Australian businesses</p>
        </div>
      </footer>
    </div>
  );
}
