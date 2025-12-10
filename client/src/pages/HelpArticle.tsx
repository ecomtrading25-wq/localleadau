import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link, useParams } from "wouter";
import { Streamdown } from "streamdown";

export default function HelpArticle() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: article, isLoading, error } = trpc.help.getBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold">Article Not Found</h1>
        <p className="mb-8 text-gray-600">The article you're looking for doesn't exist.</p>
        <Link href="/help">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Help Center
          </Button>
        </Link>
      </div>
    );
  }

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
          <Link href="/help">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Help
            </Button>
          </Link>
        </div>
      </header>

      {/* Article Content */}
      <article className="container mx-auto max-w-4xl py-12">
        <div className="mb-4 text-sm text-gray-500 capitalize">
          {article.category.replace(/-/g, " ")}
        </div>
        <h1 className="mb-8 text-4xl font-bold">{article.title}</h1>

        <Card>
          <CardContent className="prose prose-blue max-w-none p-8">
            <Streamdown>{article.body}</Streamdown>
          </CardContent>
        </Card>

        {/* Helpful Feedback */}
        <div className="mt-8 text-center">
          <p className="mb-4 text-gray-600">Was this article helpful?</p>
          <div className="flex justify-center gap-4">
            <Button variant="outline">👍 Yes</Button>
            <Button variant="outline">👎 No</Button>
          </div>
        </div>
      </article>
    </div>
  );
}
