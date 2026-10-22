# Anonymous belief counter (Cloudflare Worker + D1)

Not deployed yet. It needs a Cloudflare account (free plan is enough: 100,000 requests a day).

What it stores: one row per card with two numbers (how many said "yes", how many answered). Nothing else. No cookies, no IP addresses, no user IDs. Request logs ("observability") are switched off in `wrangler.toml`.

## Deploy (about 5 minutes)

```bash
cd worker
npx wrangler login
npx wrangler d1 create the-record-counter        # copy the database_id into wrangler.toml
npx wrangler d1 execute the-record-counter --remote --file=schema.sql
npx wrangler deploy                               # prints https://the-record-counter.<you>.workers.dev
```

Then put that URL into `counterEndpoint` in `../site.config.json` (and add your final domain to `ALLOWED_ORIGINS`), push, and the "Did you believe this?" box appears on every card. While `counterEndpoint` is empty, the site hides the box completely.

Limits: votes are deduplicated per browser only (local storage), so a determined person could inflate a count. Add a Cloudflare rate-limiting rule on `/vote` if that becomes a problem.
