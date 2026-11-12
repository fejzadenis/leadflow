# Lead clean-up - Example export

Run 2026-11-12 on `before.csv` (12 data rows read).
The cleaned list is attached as `before-cleaned.csv`.

## What came out

| | |
|---|---|
| rows read | 12 |
| usable leads | 7 |
| removed (reason below) | 5 |
| addresses rewritten to ASCII | 0 |
| candidate email patterns | 31 |
| first-touch drafts written | 7 |
| emails sent by this tool | 0 |
| network calls / credentials | 0 / none |

## The cleaned list

| Name | Email | Company | Topic |
|---|---|---|---|
| Marko Petrović | marko.petrovic@petroco.rs | PetroCo | invoice reminders |
| Ana Jovanović | ana@nova.rs | Nova Design | brand refresh, Q1 |
| Nikola Ilić | nikola@ilic.rs | Ilić | upsell |
| Petar | petar@firma.rs | Firma | - |
| Ivana Marić | ivana@maric.rs | Maric | onboarding |
| Luka Stanković | luka@stankovic.rs | Stanković | - |
| Jelena Popović | jelena@popovic.rs | Popović Consulting | retainer renewal |

## Removed, and why

- **marko petrovic** - duplicate of existing lead (marko.petrovic@petroco.rs)
- **Ana Jovanovic** - duplicate of existing lead (ana@nova.rs)
- **Stefan Đokić** - no usable email: "stefan(at)dokic.rs"
- **Mila Šarić** - no usable email: "mila.saric@"
- **ivana maric** - duplicate of existing lead (ivana@maric.rs)

## Candidate email patterns - verify before sending

Generated from the name + domain, not looked up. Candidates, not confirmed addresses.

- **Marko Petrović** - marko.petrovic@petroco.rs, markopetrovic@petroco.rs, m.petrovic@petroco.rs, mpetrovic@petroco.rs, marko@petroco.rs
- **Ana Jovanović** - ana.jovanovic@nova.rs, anajovanovic@nova.rs, a.jovanovic@nova.rs, ajovanovic@nova.rs, ana@nova.rs
- **Nikola Ilić** - nikola.ilic@ilic.rs, nikolailic@ilic.rs, n.ilic@ilic.rs, nilic@ilic.rs, nikola@ilic.rs
- **Petar** - petar@firma.rs
- **Ivana Marić** - ivana.maric@maric.rs, ivanamaric@maric.rs, i.maric@maric.rs, imaric@maric.rs, ivana@maric.rs
- **Luka Stanković** - luka.stankovic@stankovic.rs, lukastankovic@stankovic.rs, l.stankovic@stankovic.rs, lstankovic@stankovic.rs, luka@stankovic.rs
- **Jelena Popović** - jelena.popovic@popovic.rs, jelenapopovic@popovic.rs, j.popovic@popovic.rs, jpopovic@popovic.rs, jelena@popovic.rs

## Drafts - you send these yourself

Each draft ends in [your name] - whoever sends them fills that in once.

### Marko Petrović <marko.petrovic@petroco.rs>

**Subject:** invoice reminders at PetroCo - one question

Hi Marko,

I saw PetroCo and wanted to ask about invoice reminders - is that still handled by hand?

I put together four n8n workflows that take a lead CSV or webhook and turn it into a cleaned, deduped list with drafted first-touch emails. They install in about 15 minutes and never send anything on their own.

Worth a look, or has PetroCo already solved this?

Best,
[your name]

### Ana Jovanović <ana@nova.rs>

**Subject:** brand refresh, Q1 at Nova Design - one question

Hi Ana,

I saw Nova Design and wanted to ask about brand refresh, Q1 - is that still handled by hand?

I put together four n8n workflows that take a lead CSV or webhook and turn it into a cleaned, deduped list with drafted first-touch emails. They install in about 15 minutes and never send anything on their own.

Worth a look, or has Nova Design already solved this?

Best,
[your name]

### Nikola Ilić <nikola@ilic.rs>

**Subject:** upsell at Ilić - one question

Hi Nikola,

I saw Ilić and wanted to ask about upsell - is that still handled by hand?

I put together four n8n workflows that take a lead CSV or webhook and turn it into a cleaned, deduped list with drafted first-touch emails. They install in about 15 minutes and never send anything on their own.

Worth a look, or has Ilić already solved this?

Best,
[your name]

_Drafts are written for the first 3 leads so the report stays readable. The subject line and structure are the same for the rest - say the word and I will generate all 7._

## What this is not

- No scraping and no verified-email lookup: the patterns are candidates, and nothing was sent.
- No file kept: it was read into memory once; the cleaned CSV is the only artifact.
