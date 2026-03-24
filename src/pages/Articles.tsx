import { useState, useMemo } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleDrawer } from "@/components/ArticleDrawer";
import { TagFilterBar } from "@/components/TagFilterBar";
import { useAllArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, ChevronLeft, ChevronRight } from "lucide-react";
import type { Article } from "@/hooks/useArticles";

const ARTICLES_PER_PAGE = 12;

const Articles = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const { data: articles, isLoading } = useAllArticles();

  const nonDigestArticles = useMemo(
    () => (articles ?? []).filter((a) => a.topic !== "weekly_digest"),
    [articles]
  );

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const a of nonDigestArticles) {
      const tags: string[] = (a as any).tags ?? [];
      tags.forEach((t) => tagSet.add(t));
    }
    return [...tagSet];
  }, [nonDigestArticles]);

  const filteredArticles =
    activeTags.length > 0
      ? nonDigestArticles.filter((a) => {
          const tags: string[] = (a as any).tags ?? [];
          return activeTags.some((t) => tags.includes(t));
        })
      : nonDigestArticles;

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const handleTagToggle = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };

  return (
    <>
      <header className="relative overflow-hidden border-b border-border bg-background">
        <div className="absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-primary via-secondary to-primary" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="container relative mx-auto flex flex-col items-center px-4 py-12 text-center md:py-16">
          <div className="mb-4 flex items-center gap-3">
            <Zap className="h-7 w-7 text-primary md:h-8 md:w-8" />
            <span className="font-display text-3xl font-black tracking-tight text-foreground md:text-5xl">
              PULSE
            </span>
          </div>
          <p className="max-w-lg font-mono text-sm tracking-wide text-muted-foreground">
            Curated DER intelligence for multifamily solar + storage developers
          </p>
        </div>
      </header>

      <TagFilterBar
        activeTags={activeTags}
        onTagToggle={handleTagToggle}
        onClear={() => {
          setActiveTags([]);
          setPage(1);
        }}
        availableTags={availableTags}
      />

      <main className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Zap className="mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 font-display text-2xl font-bold">No Articles Found</h2>
            <p className="max-w-md text-muted-foreground">
              {activeTags.length > 0
                ? "No articles match the selected tags."
                : "The first articles are being curated. Check back soon."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedArticles.map((a) => (
                <ArticleCard key={a.id} article={a} onSelect={setSelectedArticle} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-full border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <span className="font-mono text-xs text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-full border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <ArticleDrawer
        article={selectedArticle}
        open={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </>
  );
};

export default Articles;
