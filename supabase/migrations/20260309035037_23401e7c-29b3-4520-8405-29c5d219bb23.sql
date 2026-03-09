-- Create a function to strip HTML from text, then use it to clean articles
CREATE OR REPLACE FUNCTION pg_temp.strip_html(input text) RETURNS text AS $$
DECLARE
  result text;
BEGIN
  result := regexp_replace(input, '<[^>]*>', '', 'g');
  result := regexp_replace(result, '&amp;', chr(38), 'g');
  result := regexp_replace(result, '&lt;', '<', 'g');
  result := regexp_replace(result, '&gt;', '>', 'g');
  result := regexp_replace(result, '&quot;', '"', 'g');
  result := regexp_replace(result, '&#39;', chr(39), 'g');
  result := regexp_replace(result, '&nbsp;', ' ', 'g');
  result := regexp_replace(result, '&rsquo;', chr(8217), 'g');
  result := regexp_replace(result, '&lsquo;', chr(8216), 'g');
  result := regexp_replace(result, '&rdquo;', chr(8221), 'g');
  result := regexp_replace(result, '&ldquo;', chr(8220), 'g');
  result := regexp_replace(result, '&mdash;', chr(8212), 'g');
  result := regexp_replace(result, '&ndash;', chr(8211), 'g');
  result := regexp_replace(result, '&hellip;', chr(8230), 'g');
  result := regexp_replace(result, '&[a-zA-Z#0-9]+;', '', 'g');
  result := regexp_replace(result, '\s+', ' ', 'g');
  RETURN trim(result);
END;
$$ LANGUAGE plpgsql;

UPDATE articles SET summary = pg_temp.strip_html(summary) WHERE summary IS NOT NULL;