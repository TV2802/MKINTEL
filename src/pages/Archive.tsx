import { Link } from "react-router-dom";
import { useAllIssues } from "@/hooks/useArticles";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronRight } from "lucide-react";

const Archive = () => {
  const { data: issues, isLoading } = useAllIssues();

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="mb-8 font-display text-4xl font-bold">Archive</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : !issues || issues.length === 0 ? (
        <p className="text-muted-foreground">No past issues yet.</p>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              to={`/?issue=${issue.id}`}
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-display font-bold">
                  {issue.issue_number}
                </div>
                <div>
                  <p className="font-display font-semibold text-card-foreground">
                    Issue #{issue.issue_number}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(issue.week_start), "MMM d")} –{" "}
                    {format(new Date(issue.week_end), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
};

export default Archive;
