
CREATE TABLE public.atb_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  scenario text NOT NULL DEFAULT 'Moderate',
  atb_year integer NOT NULL DEFAULT 2024,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (metric_name, scenario, atb_year)
);

ALTER TABLE public.atb_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atb_cache is publicly readable"
  ON public.atb_cache FOR SELECT
  TO anon, authenticated
  USING (true);
