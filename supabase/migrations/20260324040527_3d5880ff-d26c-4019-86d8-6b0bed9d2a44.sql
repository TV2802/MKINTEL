-- Delete duplicate articles, keeping only the one with the latest created_at per title
DELETE FROM articles
WHERE id NOT IN (
  SELECT DISTINCT ON (title) id
  FROM articles
  ORDER BY title, created_at DESC
);

-- Add a unique constraint on title to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS articles_title_unique ON articles (title);