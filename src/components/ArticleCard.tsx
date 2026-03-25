import { FeedbackButtons } from "./FeedbackButtons";
import { BookmarkButton } from "./BookmarkButton";
import { Clock } from "lucide-react";
import type { Article } from "@/hooks/useArticles";
import { format } from "date-fns";
import { stripHtml } from "@/lib/utils";
import { getTagToken } from "@/lib/tags";

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
  onSelect?: (article: Article) => void;
}

function estimateReadTime(text: string | null): string {
  if (!text) return "1 min";
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min`;
}

function TagPills({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 5).map((tag) => {
        const token = getTagToken(tag);
        return (
          <span
            key={tag}
            className="rounded-full px-2 py-0.5 font-mono text-[9px] font-medium tracking-wider"
            style={{
              backgroundColor: `hsl(var(--energy-${token}) / 0.15)`,
              color: `hsl(var(--energy-${token}))`,
            }}
          >
            {tag}
          </span>
        );
      })}
      {tags.length > 5 && (
        <span className="rounded-full px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
          +{tags.length - 5}
        </span>
      )}
    </div>
  );
}

export function ArticleCard({ article, featured = false, onSelect }: ArticleCardProps) {
  const dateStr = article.published_at
    ? format(new Date(article.published_at), "MMM d, yyyy")
    : "";
  const readTime = estimateReadTime(stripHtml(article.summary));
  const handleClick = () => onSelect?.(article);
  const articleTags: string[] = (article as any).tags ?? [];
  const primaryToken = articleTags.length > 0 ? getTagToken(articleTags[0]) : "policy";

  if (featured) {
    return (
      <article
        onClick={handleClick}
        className="group relative cursor-pointer overflow-hidden rounded-md border-l-[5px] bg-card transition-all duration-300 hover:shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.3)] hover:-translate-y-0.5"
        style={{ borderLeftColor: `hsl(var(--energy-${primaryToken}))` }}
      >
        <div className="p-6 md:p-8">
          <div className="mb-4 flex items-start justify-between">
            <TagPills tags={articleTags} />
            <BookmarkButton articleId={article.id} />
          </div>

          <h2 className="mb-3 font-display text-2xl font-extrabold leading-[1.1] text-card-foreground md:text-4xl">
            {article.title}
          </h2>

        <p className="mb-6 text-base leading-[1.7] text-muted-foreground line-clamp-4">
          {stripHtml(article.summary) || article.title.slice(0, 150)}
        </p>

          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
              {article.source_name && (
                <span className="font-medium text-foreground/60">{article.source_name}</span>
              )}
              {article.source_name && dateStr && <span className="opacity-30">·</span>}
              {dateStr && <span>{dateStr}</span>}
              <span className="opacity-30">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {readTime}
              </span>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <FeedbackButtons articleId={article.id} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={handleClick}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-md border-l-[5px] bg-card transition-all duration-300 hover:shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.2)] hover:-translate-y-0.5"
      style={{ borderLeftColor: `hsl(var(--energy-${primaryToken}))` }}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between">
          <TagPills tags={articleTags} />
          <BookmarkButton articleId={article.id} />
        </div>

        <h3 className="mb-2 font-display text-lg font-bold leading-snug text-card-foreground md:text-xl">
          {article.title}
        </h3>

        {article.summary && (
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {stripHtml(article.summary)}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            {article.source_name && (
              <span className="font-medium text-foreground/60">{article.source_name}</span>
            )}
            {article.source_name && dateStr && <span className="opacity-30">·</span>}
            {dateStr && <span>{dateStr}</span>}
            <span className="opacity-30">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {readTime}
            </span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FeedbackButtons articleId={article.id} />
          </div>
        </div>
      </div>
    </article>
  );
}
