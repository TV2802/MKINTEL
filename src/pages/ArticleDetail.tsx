import { useParams, Link } from "react-router-dom";
import { useArticle } from "@/hooks/useArticles";
import { TopicBadge } from "@/components/TopicBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading } = useArticle(id);

  if (isLoading) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-6 h-12 w-full" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </main>
    );
  }

  if (!article) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10 text-center">
        <h1 className="font-display text-2xl font-bold">Article not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">
          ← Back to latest issue
        </Link>
      </main>
    );
  }

  const dateStr = article.published_at
    ? format(new Date(article.published_at), "MMMM d, yyyy")
    : "";

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to latest issue
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <TopicBadge topic={article.topic} />
        {article.source_name && (
          <span className="text-sm font-medium text-muted-foreground">
            {article.source_name}
          </span>
        )}
        {dateStr && (
          <span className="text-sm text-muted-foreground">{dateStr}</span>
        )}
      </div>

      <h1 className="mb-6 font-display text-3xl font-bold leading-tight md:text-5xl">
        {article.title}
      </h1>

      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.title}
          className="mb-8 w-full rounded-lg object-cover"
        />
      )}

      {article.summary && (
        <div className="prose prose-lg max-w-none text-foreground">
          <p>{article.summary}</p>
        </div>
      )}

      <div className="mt-10">
        <Button asChild size="lg" className="gap-2">
          <a href={article.source_url} target="_blank" rel="noopener noreferrer">
            Read Original Article <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </main>
  );
};

export default ArticleDetail;
