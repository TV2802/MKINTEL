import { useState, useMemo } from "react";
import { HeroBanner } from "@/components/HeroBanner";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleDrawer } from "@/components/ArticleDrawer";
import { TagFilterBar } from "@/components/TagFilterBar";
import { useLatestIssue, useIssueArticles, useIssue, useAllIssues } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import type { Article } from "@/hooks/useArticles";

const Index = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const { data: latestIssue, isLoading: latestLoading } = useLatestIssue();
  const { data: allIssues } = useAllIssues();
  const { data: manualIssue } = useIssue(selectedIssueId ?? undefined);

  const issue = selectedIssueId ? manualIssue : latestIssue;
  const { data: articles, isLoading: articlesLoading } = useIssueArticles(issue?.id);
  const isLoading = latestLoading || articlesLoading;

  const sortedArticles = useMemo(() =>
    [...(articles ?? [])]
      .filter((a) => a.topic !== "weekly_digest")
      .sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0)),
    [articles]
  );

  // Collect all available tags from current articles
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const a of sortedArticles) {
      const tags: string[] = (a as any).tags ?? [];
      tags.forEach(t => tagSet.add(t));
    }
    return [...tagSet];
  }, [sortedArticles]);

  const filteredArticles = activeTags.length > 0
    ? sortedArticles.filter((a) => {
        const tags: string[] = (a as any).tags ?? [];
        return activeTags.some(t => tags.includes(t));
      })
    : sortedArticles;

  const handleTagToggle = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <>
      <HeroBanner
        issue={issue ?? null}
        allIssues={allIssues ?? []}
        onIssueChange={setSelectedIssueId}
      />
      <TagFilterBar
        activeTags={activeTags}
        onTagToggle={handleTagToggle}
        onClear={() => setActiveTags([])}
        availableTags={availableTags}
      />

      <main className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Zap className="mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 font-display text-2xl font-bold">No Articles Yet</h2>
            <p className="max-w-md text-muted-foreground">
              The first weekly issue is being curated. Check back soon for the
              latest DER &amp; multifamily energy news.
            </p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No articles match the selected tags.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((a) => (
              <ArticleCard key={a.id} article={a} onSelect={setSelectedArticle} />
            ))}
          </div>
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

export default Index;
