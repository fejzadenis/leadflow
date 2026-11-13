# LeadFlow - compliant lead generation in n8n

**Live demo: https://fejzadenis.github.io/leadflow/demo.html** - runs in your browser, nothing installed, no network requests.
**Shipped docs, unedited: https://fejzadenis.github.io/leadflow/docs.html** - the pack's README, setup steps, demo script and troubleshooting page, published before you pay.
**Free tool: https://fejzadenis.github.io/leadflow/studio.html** - drop a whole lead CSV in and take the cleaned file, the candidate patterns and a written reason for every rejected row. No install, no upload, no account.

**Buy the pack - $49 launch ($79 after launch): [pay $49 with PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=dragana.karans%40gmail.com&item_name=LeadFlow%20Automation%20Pack&amount=49.00&currency_code=USD&return=https%3A%2F%2Ffejzadenis.github.io%2Fleadflow%2Fthanks.html&cancel_return=https%3A%2F%2Ffejzadenis.github.io%2Fleadflow%2F)** - the receipt page hands you the ZIP (four workflows, the guide, the license) immediately, with no email round-trip and no account to create. 14-day refund on request. Prefer it mailed, or want to ask something first? Write to perun.intelligence@gmail.com - a person answers, and the first answer is free.

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

Two more free reads, for the case where the file itself is the problem: **[n8n put the whole CSV in one column](https://fejzadenis.github.io/leadflow/csv-one-column-n8n.html)** (semicolon/tab exports, with the delimiter sniffer) and **[names arrive as ???? or Ã©](https://fejzadenis.github.io/leadflow/fix-csv-question-marks.html)** (the encoding fix). When it is one file and not a workflow you need, the same pages sell a one-file repair: $49 to 5,000 rows, $79 to 25,000, $99 to 100,000, back within 24 hours.

## The full pack - $49 launch ($79 after launch)

Four workflows that run start to finish (CSV -> clean leads, webhook capture, outreach draft, email
patterns), plus the zero-setup demo workflow, the first-run guide, a troubleshooting page written from
real failures, and a commercial-use license. One-time payment, 14-day refund on request.

**[Pay $49 with PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=dragana.karans%40gmail.com&item_name=LeadFlow%20Automation%20Pack&amount=49.00&currency_code=USD&return=https%3A%2F%2Ffejzadenis.github.io%2Fleadflow%2Fthanks.html&cancel_return=https%3A%2F%2Ffejzadenis.github.io%2Fleadflow%2F)** - one-time, card or PayPal balance, no account with us to create. The receipt page delivers the ZIP at once; if you would rather have it mailed, or you want to ask a question before paying, write to **perun.intelligence@gmail.com** (or open an issue on this repo). The charge appears as our billing account, `dragana.karans@gmail.com` - that is this site. 14-day refund on request, no explanation needed.

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
