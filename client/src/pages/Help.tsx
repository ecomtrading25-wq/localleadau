import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, HelpCircle } from "lucide-react";
import { Link } from "wouter";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { data: categories } = trpc.help.categories.useQuery();
  const { data: articles } = trpc.help.list.useQuery({ 
    category: selectedCategory,
    published: true 
  });
  const { data: searchResults } = trpc.help.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const displayArticles = searchQuery.length > 2 ? searchResults : articles;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Link href="/">
            <a className="flex items-center gap-2 text-xl font-bold text-blue-600">
              <BookOpen className="h-6 w-6" />
              Local Lead AU
            </a>
          </Link>
          <Link href="/">
            <Button variant="outline">Back to App</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-16 text-white">
        <div className="container mx-auto text-center">
          <HelpCircle className="mx-auto mb-4 h-16 w-16" />
          <h1 className="mb-4 text-4xl font-bold">How can we help you?</h1>
          <p className="mb-8 text-lg text-blue-100">
            Search our knowledge base for answers to common questions
          </p>

          {/* Search Bar */}
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="container mx-auto py-12">
        <Tabs value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}>
          <TabsList className="mb-8">
            <TabsTrigger value="all">All Articles</TabsTrigger>
            {categories?.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory || "all"}>
            {displayArticles && displayArticles.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayArticles.map((article) => (
                  <Link key={article.id} href={`/help/${article.slug}`}>
                    <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <CardDescription className="capitalize">
                          {article.category.replace(/-/g, " ")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-3 text-sm text-gray-600">
                          {article.body.substring(0, 150)}...
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  {searchQuery.length > 2
                    ? "No articles found matching your search."
                    : "No articles available in this category."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto text-center text-sm text-gray-600">
          <p>Still need help? <Link href="/contact"><a className="text-blue-600 hover:underline">Contact Support</a></Link></p>
        </div>
      </footer>
    </div>
  );
}
