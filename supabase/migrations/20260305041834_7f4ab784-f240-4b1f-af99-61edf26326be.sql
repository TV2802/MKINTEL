
-- Create enum for topic categories
CREATE TYPE public.topic_category AS ENUM (
  'solar',
  'multifamily',
  'battery',
  'built_environment',
  'new_innovations',
  'company_success'
);

-- Create issues table to track weekly issues
CREATE TABLE public.issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_number INTEGER NOT NULL UNIQUE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  source_url TEXT NOT NULL,
  source_name TEXT,
  image_url TEXT,
  topic public.topic_category NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth needed)
CREATE POLICY "Issues are publicly readable" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Articles are publicly readable" ON public.articles FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_articles_issue_id ON public.articles(issue_id);
CREATE INDEX idx_articles_topic ON public.articles(topic);
CREATE INDEX idx_articles_featured ON public.articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_issues_number ON public.issues(issue_number DESC);
