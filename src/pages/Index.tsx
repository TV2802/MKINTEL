import { useState } from "react";
import { HeroBanner } from "@/components/HeroBanner";
import { TopicSection } from "@/components/TopicSection";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleDrawer } from "@/components/ArticleDrawer";
import { DigestCard } from "@/components/DigestCard";
import { SectionNav } from "@/components/SectionNav";
import { useLatestIssue, useIssueArticles, useIssue } from "@/hooks/useArticles";
import { ALL_TOPICS } from "@/lib/topics";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { Article } from "@/hooks/useArticles";

const Index = () => {
  const [searchParams] = useSearchParams();
  const issueIdParam = searchParams.get("issue");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const { data: latestIssue, isLoading: latestLoading } = useLatestIssue();
  const { data: selectedIssue, isLoading: selectedLoading } = useIssue(issueIdParam ?? undefined);

  const issue = issueIdParam ? selectedIssue : latestIssue;
  const issueLoading = issueIdParam ? selectedLoading : latestLoading;

  const { data: articles, isLoading: articlesLoading } = useIssueArticles(issue?.id);

  const isLoading = issueLoading || articlesLoading;
  const featured = articles?.find((a) => a.is_featured);
  const byTopic = (topic: string) =>
    articles?.filter((a) => a.topic === topic && a.id !== featured?.id) ?? [];

  return (
    <>
      <HeroBanner issue={issue ?? null} />
      <SectionNav />

      <main className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Zap className="mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 font-display text-2xl font-bold">
              No Articles Yet
            </h2>
            <p className="max-w-md text-muted-foreground">
              The first weekly issue is being curated. Check back soon for the
              latest DER &amp; multifamily energy news.
            </p>
          </div>
        ) : (
          <>
            {/* Weekly Digest */}
            <DigestCard
              issueId={issue?.id}
              digestText={(issue as any)?.digest_text ?? null}
            />

            {/* Featured Article */}
            {featured && (
              <div className="mb-12">
                <ArticleCard article={featured} featured onSelect={setSelectedArticle} />
              </div>
            )}

            {/* Topic Sections */}
            {ALL_TOPICS.filter((t) => t !== "weekly_digest").map((topic) => (
              <TopicSection
                key={topic}
                topic={topic}
                articles={byTopic(topic)}
                onSelectArticle={setSelectedArticle}
              />
            ))}
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

export default Index;
