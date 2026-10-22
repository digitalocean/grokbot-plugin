---
name: digitalocean-costs
description: >-
  Price DigitalOcean changes before billable actions, and read balance, invoices,
  and billing history. Use for "how much will this cost", "my DO bill", "invoice",
  or "balance".
---

# DigitalOcean costs and billing

Load **digitalocean-safety** before any write. This skill is read-heavy; writes
to billing are rare.

## Connectors

- **digitalocean-accounts:** `balance-get`, `billing-history-list`, `invoice-list`,
  `get-invoice`, `account-get-information`
- **digitalocean-droplets:** `size-list`, `region-list` (pricing inputs for Droplets)

Ensure **digitalocean-accounts** is connected; connect **digitalocean-droplets**
for size/region pricing.

## Price-before-create workflow (Tier 4)

1. Call `size-list` (and `region-list` if region matters).
2. Compute or quote **hourly and monthly** for the chosen plan/size and quantity.
3. State that **billing starts immediately** on create/resize/backup enable/snapshot.
4. Only after explicit user confirmation, invoke the Tier 4 tool (see
   `policy/approval-tiers-droplets.json`).

## Invoices and balance

- Summarize invoice line items; do not dump full PDFs into chat unless asked.
- Redact account identifiers if the user is sharing a screen.

## Triggers

Balance, invoices, billing history, and "what will this cost" questions route here
from **digitalocean**.
