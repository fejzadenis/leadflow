# LeadFlow - compliant lead generation in n8n

**Live demo: https://fejzadenis.github.io/leadflow/demo.html** - runs in your browser, nothing installed, no network requests.
**Shipped docs, unedited: https://fejzadenis.github.io/leadflow/docs.html** - the pack's README, setup steps, demo script and troubleshooting page, published before you pay.
**Free tool: https://fejzadenis.github.io/leadflow/studio.html** - drop a whole lead CSV in and take the cleaned file, the candidate patterns and a written reason for every rejected row. No install, no upload, no account.

Most "lead generation automation" means scraping LinkedIn or buying a list. That is how accounts get
restricted and inboxes get burned. LeadFlow works on data you already have: a CSV export, or a form
posting to a webhook. It never sends an email by itself - you stay the sender.

## What is here (free)

| File | What it does |
|---|---|
| `free/leadflow-free-lead-dedupe.json` | Removes duplicate leads from a CSV by email identity |
| `free/leadflow-free-clean-csv.json` | Cleans a messy export: header variants, stray spaces, casing; reports every dropped row with a reason |
| `free/leadflow-free-email-patterns.json` | Generates candidate email addresses from name + company domain, with diacritics folded |

Import any of them into n8n (Workflows -> Import from File), press **Execute workflow**. Each reads
synthetic sample rows from a "Sample data (edit me)" node, so you can see real output before touching
your own data. Swap that node for your CSV / Sheets / webhook when you are ready.

## The full pack - $49 launch ($79 after launch)

Four workflows that run start to finish (CSV -> clean leads, webhook capture, outreach draft, email
patterns), plus the zero-setup demo workflow, the first-run guide, a troubleshooting page written from
real failures, and a commercial-use license. One-time payment, 14-day refund on request.

Order or ask a question: open an issue on this repo, or reply on the post/message that brought you here.

## Honest limits

- Patterns are **candidates**, not verified addresses. You confirm each one before sending.
- The draft in the free workflows is a template, not AI. Workflow 03 in the pack adds an optional
  AI-written draft using your own API key.
- No scraping, no data broker lists, no bulk sending. If you want volume-at-any-cost, this is the
  wrong product.
- n8n has to be installed (desktop app, Docker, or n8n Cloud) and Google Sheets needs your own
  Google account.

## License

Free workflows: use them, modify them, ship them inside your own automations. Do not resell them as a
template pack. The paid pack is licensed for one buyer's commercial use.
