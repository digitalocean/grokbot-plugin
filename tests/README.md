# Test assets

Run **write-path** scripts only in a dedicated DigitalOcean test team with tagged
resources (for example `grokbot-test`). A human operator runs writes; agents do
not run them unattended.

## Read-only smoke prompts

See `smoke/` — one file per connector with example agent prompts and expected tools.

## Skill trigger evals

See `skill-triggers.jsonl` — prompt in, expected skill (and optional tool) out.

## Approval checks

For Droplets Tier 2–4 tools, confirm the agent follows `policy/approval-tiers-droplets.json`
and **digitalocean-safety** before calling MCP write tools.
