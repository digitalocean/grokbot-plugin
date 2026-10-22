---
name: digitalocean-networking
description: >-
  Domains, DNS records, certificates, cloud firewalls, load balancers, VPCs, and
  reserved IPs on DigitalOcean. Use for "DNS record", "point my domain",
  "firewall", "load balancer", "SSL cert", or VPC questions.
---
# Networking and DNS (MCP)

Connector: **digitalocean-networking** — connect on first use.

1. Load **digitalocean-safety**.
1. Read current state: `domain-list`, `domain-record-list`, `firewall-list`,
   `vpc-list`, and related list/get tools.

## Firewall and lock-out protection

Before creating or changing cloud firewalls or Droplet networking rules:

- Confirm SSH/admin paths and app health checks still work.
- Prefer additive rules before removals.

## DNS

- Show existing records before add/change/delete.
- Record deletes: name the record type, name, and value (Tier 3 style).

## Certificates and load balancers

- Read certs and LB config before changes.
- Deletes name the resource by name and ID.

Tool families: `domain-*`, `domain-record-*`, `firewall-*`, `lb-*`, `vpc-*`,
`reserved-ip-*`, `certificate-*` per networking MCP.
