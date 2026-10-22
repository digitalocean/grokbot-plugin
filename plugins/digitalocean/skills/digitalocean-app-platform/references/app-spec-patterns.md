# App spec patterns (MCP-only)

Use with `apps-create-app-from-spec` and `apps-update`.

- Start from DigitalOcean docs via `docs-search` ("App Platform spec reference").
- Name `name`, `region`, and `services` or `static_sites` explicitly.
- Set `instance_size_slug` and `instance_count`; confirm pricing before apply.
- For databases, prefer binding via App Platform rather than echoing credentials.
- Keep secrets in App Platform secret references, not in chat.

## Source: GitHub vs public git URL

| Repo visibility | Spec source                        | DigitalOcean GitHub app                                                        |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| Private         | `github:` (`repo`, `branch`, etc.) | Required — install app and grant repo access on the DO account used for deploy |
| Public          | `git.repo_clone_url`               | Not required                                                                   |
| Public          | `github:`                          | Optional; same grant rules as private if you use `github:`                     |

If `apps-create-app-from-spec` returns `GitHub user not authenticated`, fix GitHub
access in the control panel first (see the app-platform skill), then retry once.

Validate deployment health with `apps-get-deployment-status` after changes.
