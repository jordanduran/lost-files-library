# Producers atlas

/producers contains the interactive globe moved from the homepage. Drag horizontally or vertically, use arrow keys while focused, or focus/hover city buttons to center a city. Clicking a marker, label, or city button submits a vote. Reduced motion disables automatic rotation and makes city targeting immediate.

Run supabase/migrations/202609140001_producer_city_votes.sql once in the Supabase SQL Editor to enable voting. No environment changes are required. Until applied, the atlas works but authenticated votes return a temporary-unavailability message.

Votes require login. Each account has one stored city and can change its vote. Row-level security prevents reading or changing another account's vote. No public totals or invented producer profiles are displayed.

To review results in the Supabase SQL Editor:

SELECT city, count(*) AS votes FROM public.producer_city_votes GROUP BY city ORDER BY votes DESC;

Validation: npm run test:database; npm run build; npx playwright test tests/globe.spec.ts tests/intro.spec.ts.
