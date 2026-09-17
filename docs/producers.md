# Producer directory and Discover city voting

`/producers` lists producers and links to their profiles and packs. The globe and city-voting experience lives at `/discover`. City votes are account-backed; homepage producer and pack unlocks use separate browser-local demo state. See [pack management](pack-management.md) for the catalog flow.

The globe rotates freely between city interactions. Drag or use arrow keys to rotate; hover/focus a city to target it. Each city button displays its vote count, competition rank (ties share a rank), and share of total votes. Unvoted cards use a soft blue border glow on desktop hover or keyboard focus; voted cards keep their selected fill. A brief pulse confirms a successful save/removal and the standings bar animates to its updated share. Success messages clear after five seconds; errors remain visible. Voting remains reversible. Reduced motion removes animation.

## Migration

After the original producer_city_votes table exists, run supabase/migrations/202609140003_city_vote_standings.sql once in Supabase SQL Editor. It preserves existing votes, changes the primary key to (user_id, city), grants owner-only deletion, and exposes a counts-only standings function. It includes deletion permissions even if migration 002 was not run; do not run 002 afterward.

Each account can vote for every city once. Clicking an already-voted city removes that city's vote. Insert retries use ON CONFLICT DO NOTHING, so repeated requests do not increase counts. Other accounts' votes cannot be read or modified. Anonymous visitors can read aggregate standings but cannot vote.

Standings refresh on page load and after voting, not through a realtime subscription. If standings cannot be loaded, the UI says unavailable instead of showing invented zero counts. The update requires the migration before votes can be written.

Validation: npm run test:database, npm run test:session, npm run build, and npx playwright test tests/globe.spec.ts.
