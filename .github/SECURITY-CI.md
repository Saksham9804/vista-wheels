# Security CI Pipeline

This repository runs automated security checks on every push and PR to `main` via
`.github/workflows/security.yml`. All jobs are blocking — a merge cannot land if
any job fails.

## Jobs

| Job | What it does | Tool |
| --- | --- | --- |
| **Secret Scanning** | Scans git history & diff for credentials | [Gitleaks](https://github.com/gitleaks/gitleaks) (config: `.github/gitleaks.toml`) |
| **Dependency Audit** | Fails on `high` / `critical` npm vulnerabilities | `better-npm-audit` |
| **RLS & Policy Validation** | Static check that every `public` table has RLS, GRANTs, and a policy; bans hardcoded provider secrets; flags secret logging and `USING (true)` policies | `scripts/validate-security.ts` |
| **Supabase DB Linter** | Live linter against the linked project (RLS off, exposed columns, definer views, etc.) | `supabase db lint` |

## Required configuration

Add these in **GitHub → Settings → Secrets and variables → Actions**:

| Type | Name | Purpose |
| --- | --- | --- |
| Variable | `SUPABASE_PROJECT_ID` | Project ref for the linked Supabase project |
| Secret | `SUPABASE_ACCESS_TOKEN` | Personal access token used by `supabase` CLI |

If `SUPABASE_PROJECT_ID` is not set, the live DB-linter job is skipped (the
other three still run).

## Allowlisted public values

- The Supabase **anon / publishable** JWT in `src/integrations/supabase/client.ts`
  is publishable-by-design and is allowlisted in `.github/gitleaks.toml`.
- The Google Maps browser API key is allowlisted but **must** be restricted by
  HTTP referrer + API in Google Cloud Console.

Service-role keys, Stripe live keys, Twilio tokens, AWS access keys, and any
PEM private key block are always rejected.

## Running locally

```bash
bun run scripts/validate-security.ts      # static checks
bunx gitleaks detect --config .github/gitleaks.toml
npx better-npm-audit audit --level high
```
