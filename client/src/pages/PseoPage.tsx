import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin, Phone, Mail } from "lucide-react";
import { Streamdown } from "streamdown";

export default function PseoPage() {
  const [, params] = useRoute("/:slug");
  const slug = params?.slug || "";

  const { data: page, isLoading, error } = trpc.pseo.getPageBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist.
          </p>
          <Button onClick={() => window.location.href = "/"}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold">
              Local Lead AU
            </a>
            <nav className="hidden md:flex gap-6">
              <a href="/#how-it-works" className="hover:underline">How It Works</a>
              <a href="/#pricing" className="hover:underline">Pricing</a>
              <a href="/login" className="hover:underline">Login</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {page.title}
            </h1>
            {page.metaDescription && (
              <p className="text-xl text-gray-600 mb-8">
                {page.metaDescription}
              </p>
            )}
            <Button size="lg" className="text-lg px-8 py-6">
              Get Free Quotes Now
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              {page.contentOverride ? (
                <Streamdown>{page.contentOverride}</Streamdown>
              ) : (
                <Streamdown>{generateDefaultContent(page)}</Streamdown>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Connect with verified local businesses in minutes
            </p>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Request Free Quotes
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Local Lead AU</h3>
              <p className="text-gray-400">
                Connecting Australian businesses with local customers
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white">About Us</a></li>
                <li><a href="/how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white">Help Center</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  hello@locallead.au
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  1300 LEADS AU
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Local Lead AU. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function generateDefaultContent(page: any) {
  return `
# ${page.title}

Looking for trusted local services? Local Lead AU connects you with verified businesses in your area.

## Why Choose Local Services?

- **Fast Response**: Local businesses respond quickly to your needs
- **Community Trust**: Established reputation in your area
- **Competitive Pricing**: Fair prices from local competition
- **Quality Service**: Verified and reviewed providers

## How It Works

1. Submit your request
2. Get matched with local providers
3. Compare quotes
4. Choose the best option

## Get Started

Ready to connect with local businesses? Request your free quotes today.
`;
}
