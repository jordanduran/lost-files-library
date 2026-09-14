# File Directory theme

The 90s File Directory theme is now the main homepage and shared visual theme for all app routes and newly generated purchase emails. Original homepage: /preview/original. The saved original Git tag is design/archive-before-file-directory-20260914.

Producers: free rotation starts even when an account has a saved vote. Hover/focus briefly targets a city; leaving or after 3.5 seconds resumes scanning. Drag and keyboard rotation remain available. Reduced motion disables idle animation.

Run supabase/migrations/202609140002_remove_city_vote.sql once to enable removal of an account's own vote. Existing votes are preserved. The new Remove My Vote control deletes only the authenticated account's vote.

Already sent emails and retry payloads retain their original appearance. New purchase emails use the file-directory header, monochrome green palette, monospace type, and download button. No payment or email provider settings change.
