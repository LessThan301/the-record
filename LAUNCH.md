# Going live: step by step

This guide takes The Record from the hidden preview to a public site on your own domain. Do the steps in order. You only edit files on github.com in your browser. You don't need any programs on your computer.

How to edit a file on GitHub: open the repo `LessThan301/the-record`, click the file, click the pencil icon (top right), make the change, then click **Commit changes** and **Commit changes** again. About 2 minutes later the site rebuilds by itself. You can watch it under the **Actions** tab (green tick = done).

---

## Step 1. Fill in `site.config.json`

Open `site.config.json`. It looks like this:

```json
{
  "siteName": "The Record",
  "repo": "LessThan301/the-record",
  "preview": true,
  "counterEndpoint": "",
  "donationUrl": "",
  "operator": { "name": "", "street": "", "city": "", "email": "" },
  "cloudflareAnalyticsToken": ""
}
```

Fill in what you need. Keep the quote marks. Leave a field as `""` to switch that feature off.

**Imprint (Impressum), required in Germany:**
- `"name"`: your full legal name, for example `"Alexander Muster"`.
- `"street"`: a street address where post reaches you, for example `"Musterstraße 1"`. A PO box is not allowed.
- `"city"`: postcode and city, for example `"10115 Berlin"`.
- `"email"`: an email address you read.
- You can also add `"policyDate": "22. Oktober 2026"` inside `operator`. It is the date shown under the privacy policy.

Until these are filled in, the Imprint and Privacy pages show yellow placeholders and a "Draft" notice. Do not go public with the placeholders still showing. If you are unsure about the legal text, have it checked once by a lawyer or an online Impressum generator. This guide is not legal advice.

**Donation button:** put your link in `"donationUrl"`, for example `"https://ko-fi.com/yourname"`. Empty means the button shows "coming soon" and does nothing.

**"Did you believe this?" counter:** this needs the Cloudflare Worker in the `worker/` folder (see `worker/README.md`). After you deploy it, put its address in `"counterEndpoint"`, for example `"https://the-record-counter.yourname.workers.dev"`. Empty means the yes/no buttons are hidden and the privacy page doesn't mention the counter.

**Visitor statistics (Cloudflare Web Analytics, no cookies):**
1. Log in to dash.cloudflare.com, then go to **Analytics & Logs → Web Analytics → Add a site**.
2. Enter your domain and choose the manual JavaScript snippet.
3. In the snippet, copy only the token, the value after `"token":`. It is a long string of letters and numbers.
4. Paste it into `"cloudflareAnalyticsToken"`.

Statistics only load when a token is set AND preview mode is off. The privacy page then adds a section about it on its own. If your domain's DNS is on Cloudflare with the orange cloud (proxy) on, you can also turn on Web Analytics there with one click and leave the token empty.

## Step 2. Turn off preview mode

Preview mode hides the site from Google (noindex), blocks robots, and shows the yellow "Preview" badge. To turn it off, you change two files.

1. In `site.config.json`, change `"preview": true` to `"preview": false`.
2. In `.github/workflows/deploy.yml`, find this block:
   ```yaml
   env:
     BASE: /the-record
     SITE_ORIGIN: https://lessthan301.github.io
     PREVIEW: "1"
   ```
   Change it to (use your real domain):
   ```yaml
   env:
     BASE: ""
     SITE_ORIGIN: https://www.your-domain.com
     PREVIEW: "0"
   ```
   `BASE` becomes empty because on your own domain the site lives at the root, not under `/the-record`.

Do Step 2 and Step 3 together, on the same day. Otherwise links point to a domain that doesn't work yet.

After the rebuild, check:
- The yellow "Preview" badge is gone.
- `https://www.your-domain.com/robots.txt` says `Allow: /` and lists the sitemap.

## Step 3. Your own domain (GitHub Pages + Cloudflare DNS)

You need a domain you have bought (for example at Cloudflare Registrar, INWX or IONOS). These steps assume its DNS is managed in Cloudflare. If it isn't yet, go to Cloudflare, click **Add a site**, and follow the steps to change the nameservers at your registrar. This can take a few hours.

**A. Tell GitHub the domain**
1. In the repo, go to **Settings → Pages**.
2. Under **Custom domain**, enter `www.your-domain.com` and click **Save**.

**B. Add DNS records in Cloudflare** (your domain → **DNS → Records → Add record**)
- `CNAME`, name `www`, target `lessthan301.github.io`.
- For the bare domain (without www), add four `A` records, name `@`:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- Set all of them to **DNS only** (grey cloud) at first, so GitHub can issue the HTTPS certificate.

**C. Turn on HTTPS**
1. Wait until GitHub Settings → Pages shows "DNS check successful". This can take minutes to a few hours.
2. Tick **Enforce HTTPS**.
3. Optional, afterwards: switch the records to **Proxied** (orange cloud). Then set **SSL/TLS → Overview** to **Full**.

**D. Recommended:** under **Settings → Pages**, click **Verify** next to your domain (GitHub → your profile → Settings → Pages → Add a domain). This stops anyone else from taking over the domain on GitHub.

**Planned option: record.synoikon.com (recommended, no new domain to buy).** The Record is part of the Synoikon umbrella. Instead of A to D above, use the subdomain:
1. In Cloudflare, open **synoikon.com → DNS → Records → Add record**: type `CNAME`, name `record`, target `lessthan301.github.io`, **DNS only** (grey cloud). No A records are needed.
2. In this repo, **Settings → Pages → Custom domain**: enter `record.synoikon.com`, click **Save**, wait for "DNS check successful", then tick **Enforce HTTPS**.
3. In Step 2, use `SITE_ORIGIN: https://record.synoikon.com` (BASE empty).
4. In `site.config.json`, set `"umbrellaUrl": "https://synoikon.com/"`. In the Synoikon repo (branch `app`), set `recordUrl` in `home/home.config.json` to `https://record.synoikon.com/`.
5. The verified domain from D (`synoikon.com`) also covers this subdomain.

**One Impressum for everything (done, 2026-10-23).** The Record now links to the shared Synoikon pages via `impressumUrl` / `privacyUrl` in `site.config.json` (its own /imprint/ and /privacy/ just redirect there). At launch set them to `https://synoikon.com/impressum/` and `https://synoikon.com/datenschutz/`. Older note: Synoikon and The Record have the same operator, so keep the Imprint and Privacy details identical in both places (same name, address, email). When one changes, change the other on the same day.

## Step 4. Google Search Console

1. Go to search.google.com/search-console and click **Add property**.
2. Choose **Domain** and enter `your-domain.com`.
3. Google shows a `TXT` record. Add it in Cloudflare DNS (type `TXT`, name `@`, paste the value), then click **Verify** in Google.
4. In Search Console, open **Sitemaps** and enter `sitemap.xml`, then click **Submit**.
5. Optional: open **URL inspection**, paste your home page address, and click **Request indexing**.

It can take a few days to a few weeks before pages show up in Google. The sitemap already lists all 9 languages, so Google shows people the right language.

## Final checklist before you announce it

- [ ] Imprint and Privacy show your real details, with no yellow placeholders.
- [ ] No "Preview" badge.
- [ ] The site opens over https on your domain, with and without www.
- [ ] Sharing a card on WhatsApp, X or Signal shows the picture.
- [ ] `robots.txt` allows indexing and the sitemap is submitted.
- [ ] Read `FACT-CHECK.md` and decide on the cards listed under "needs your judgment".
