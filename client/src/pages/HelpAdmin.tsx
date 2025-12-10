import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function HelpAdmin() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    body: "",
    category: "",
    published: false,
  });

  const utils = trpc.useUtils();
  const { data: articles } = trpc.help.list.useQuery({ published: undefined });
  const { data: categories } = trpc.help.categories.useQuery();

  const createMutation = trpc.help.create.useMutation({
    onSuccess: () => {
      toast.success("Article created successfully");
      utils.help.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.help.update.useMutation({
    onSuccess: () => {
      toast.success("Article updated successfully");
      utils.help.list.invalidate();
      setEditingArticle(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.help.delete.useMutation({
    onSuccess: () => {
      toast.success("Article deleted successfully");
      utils.help.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      body: "",
      category: "",
      published: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingArticle) {
      updateMutation.mutate({
        id: editingArticle,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (article: any) => {
    setFormData({
      title: article.title,
      slug: article.slug,
      body: article.body,
      category: article.category,
      published: article.published,
    });
    setEditingArticle(article.id);
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this article?")) {
      deleteMutation.mutate({ id });
    }
  };

  const togglePublished = (article: any) => {
    updateMutation.mutate({
      id: article.id,
      published: !article.published,
    });
  };

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Help Center Admin</h1>
            <p className="text-gray-600">Manage help articles and documentation</p>
          </div>
          <div className="flex gap-2">
            <Link href="/help">
              <Button variant="outline">View Help Center</Button>
            </Link>
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) {
                setEditingArticle(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editingArticle ? "Edit Article" : "Create New Article"}</DialogTitle>
                  <DialogDescription>
                    {editingArticle ? "Update the article details below" : "Add a new help article to your knowledge base"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="body">Content (Markdown supported)</Label>
                    <Textarea
                      id="body"
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      rows={12}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="published"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    />
                    <Label htmlFor="published">Publish immediately</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setEditingArticle(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingArticle ? "Update Article" : "Create Article"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Articles</CardTitle>
            <CardDescription>
              {articles?.length || 0} articles in your knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles && articles.length > 0 ? (
                  articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell className="capitalize">{article.category.replace(/-/g, " ")}</TableCell>
                      <TableCell>
                        {article.published ? (
                          <span className="text-green-600">Published</span>
                        ) : (
                          <span className="text-gray-500">Draft</span>
                        )}
                      </TableCell>
                      <TableCell>{article.viewCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePublished(article)}
                            title={article.published ? "Unpublish" : "Publish"}
                          >
                            {article.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(article)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(article.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      No articles yet. Create your first article to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
