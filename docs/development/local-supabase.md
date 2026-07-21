# Local Supabase Development

This guide establishes an isolated Supabase stack for CCM Assistant on Windows. It is intentionally local-only: no login, hosted project link, remote database URL, or hosted migration command is required.

## Current workstation status

Verified July 20, 2026 after Gate 2 initialization.

| Component | Status | Detail |
| --- | --- | --- |
| Windows | Ready | Windows 11 23H2, build 22631, 64-bit |
| Hardware virtualization | Ready | Windows reports a hypervisor present |
| RAM | Ready | 31.6 GB installed |
| Storage | Ready | 182.9 GB free on `C:` |
| WSL2 | Ready | WSL `2.7.10.0`; default version 2 |
| Docker Desktop | Ready | Per-user Windows installation using the WSL2 Linux backend |
| Docker Engine | Ready | Client/server `29.6.2`; active context `desktop-linux` |
| Docker Compose | Ready | `v5.3.1` |
| Supabase CLI | Ready | Stable `2.109.1`, installed at `%LOCALAPPDATA%\Programs\Supabase` with its release checksum verified |
| PostgreSQL tools | Optional/missing | No `psql`, `postgres`, `pg_ctl`, `initdb`, or PostgreSQL Windows service detected; the local Supabase Docker image supplies PostgreSQL |
| Node.js | Ready | `24.18.0`, satisfying the repository's `24.x` engine |
| npm | Present | `10.5.0`; the repository does not declare an npm engine, although the prior handoff was validated with npm 11.x |

Docker reports kernel `6.18.33.2-microsoft-standard-WSL2`, 20 CPUs, and 15.43 GiB allocated memory. A general-purpose Linux distribution is not required because Docker Desktop manages its own WSL2 environment.

## Prerequisites and founder approval gates

Do not combine these gates. Confirm and verify each one before continuing to the next.

### Gate 1: enable or update WSL2

Docker Desktop's recommended per-user Windows installation uses the WSL2 backend. In **PowerShell run as Administrator**:

```powershell
wsl --install --no-distribution
```

Restart Windows if prompted. Then, in an Administrator PowerShell:

```powershell
wsl --update
wsl --set-default-version 2
wsl --version
wsl --status
```

The required result is WSL version `2.1.5` or later. A general-purpose Linux distribution is not required for Docker Desktop; it manages its own WSL distributions. If the install command fails, follow Microsoft's [WSL installation guide](https://learn.microsoft.com/windows/wsl/install) rather than enabling unrelated Windows features manually.

### Gate 2: install Docker Desktop

1. Download Docker Desktop only from the [official Windows installation page](https://docs.docker.com/desktop/setup/install/windows-install/).
2. Choose the recommended **per-user** installation.
3. Keep **Use WSL 2 instead of Hyper-V** selected.
4. Start Docker Desktop and accept its license only after reviewing whether the organization qualifies for free Docker Desktop use.
5. In Docker Desktop settings, allocate at least 7 GB RAM to the WSL/Docker environment.

Verify in a fresh PowerShell window:

```powershell
docker version
docker compose version
docker info
```

All three commands must succeed, and `docker version` must show both Client and Server sections.

### Gate 3: install the stable Supabase CLI

Supabase supports Scoop and its official standalone release binary on Windows. This workstation uses the standalone stable binary because installing Scoop would have required a persistent PowerShell execution-policy change. Do not use `npm install -g supabase`; global npm installation is unsupported.

For a future update, download the stable Windows AMD64 archive from the [official Supabase CLI releases](https://github.com/supabase/cli/releases), verify its published SHA-256 digest, replace `%LOCALAPPDATA%\Programs\Supabase\supabase.exe`, and verify:

```powershell
supabase --version
supabase --help
```

Use the stable package, not `supabase-beta`.

An alternative is a pinned project dev dependency (`npm install --save-dev supabase` and `npx supabase ...`), but that changes `package.json` and the lockfile. It is not part of this infrastructure-only, no-application-change phase.

### Gate 4: align the project runtime

Install Node.js 24.x before running the application's regression suite or production build. Confirm:

```powershell
node --version
npm --version
```

The Node result must begin with `v24.`. Supabase CLI installed through Scoop does not depend on this Node upgrade, but CCM Assistant validation does.

## Resource budget

- **RAM:** Supabase recommends at least 7 GB allocated for all local services; Docker Desktop itself requires an 8 GB-capable system. This machine has 31.6 GB. Budget roughly 7-10 GB for Docker/WSL while the complete stack is running, then measure actual use in Docker Desktop.
- **Disk:** Docker Desktop, WSL support, Supabase images, and local volumes vary by released image. Budget **10-20 GB** for the initial permanent setup. The first `supabase start` downloads the entire stack plus support images. Confirm actual use afterward with `docker system df`; do not prune volumes casually.
- **Network:** The first start downloads several container images. Later starts reuse them.

Disk and running-memory figures are capacity estimates, not fixed vendor guarantees. The CLI version and enabled services determine actual use.

## One-time local initialization

After Gates 1-4 pass:

```powershell
Set-Location C:\Users\pauld\Desktop\CCMAssistant
supabase init
```

The repository already contains `supabase/migrations/001_...sql` through `027_...sql`; initialization should add `supabase/config.toml` without editing any migration. Review the generated config before starting. Keep Auth, Storage, API, Studio, Mailpit, and the database enabled.

Gate 2 was initialized with Supabase CLI `2.109.1`. The CLI generated:

- `supabase/config.toml`, the version-controlled local service configuration;
- `supabase/.gitignore`, which excludes CLI runtime state and local environment files;
- ignored `.temp/` and `.branches/` runtime directories after startup.

The generated Windows Analytics service was disabled in `config.toml`. It is not required by CCM Assistant and otherwise requires exposing the Docker daemon on unauthenticated TCP port 2375. PostgreSQL, Auth, REST, Storage, Studio, Mailpit, Realtime, and Edge Runtime remain enabled.

### Infrastructure-only first boot

`supabase start` normally applies project migrations and seeds on a brand-new database. When a new workstation must stop before migration validation, temporarily set both controls to `false`:

```toml
[db.migrations]
enabled = false

[db.seed]
enabled = false
```

Run `supabase start`, verify the empty database, then restore both controls to `true`. A later start against the preserved volume does not replay migrations; Gate 3 must invoke `supabase db reset --local --no-seed` explicitly. On this workstation, the migration-history table is absent and the `public` schema contains zero tables, confirming that migrations `001–027` have not run.

Local-only safety rules:

- Do **not** run `supabase login` or `supabase link`.
- Do **not** put `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, or a hosted project reference in the local workflow.
- Use `--local` on database mutation and inspection commands where that flag exists.
- Never use `--linked`, `--db-url`, `db push`, `config push`, or any hosted branch command in this workflow.
- Never expose the development stack to the internet. Supabase CLI `2.109.1` publishes its Windows Docker ports on `0.0.0.0`; the displayed URLs use `127.0.0.1`, but the listeners are network-accessible. Use only a trusted network and Windows Firewall, and never create router forwarding rules for ports `54321–54324` or `54327`.

Start the stack for the first time:

```powershell
supabase start
supabase status
```

Use the values printed by `supabase status` in an uncommitted `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local publishable/anon key printed by supabase status>
SUPABASE_SERVICE_ROLE_KEY=<local secret/service-role key printed by supabase status>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

These must be local keys only. Never copy hosted development or production keys into this setup.

## Local URLs

Default ports created by `supabase init` are:

| Service | URL |
| --- | --- |
| API gateway | `http://127.0.0.1:54321` |
| Auth | `http://127.0.0.1:54321/auth/v1` |
| REST | `http://127.0.0.1:54321/rest/v1` |
| GraphQL | `http://127.0.0.1:54321/graphql/v1` |
| Storage | `http://127.0.0.1:54321/storage/v1` |
| Edge Functions | `http://127.0.0.1:54321/functions/v1` |
| MCP | `http://127.0.0.1:54321/mcp` |
| PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio | `http://127.0.0.1:54323` |
| Mailpit | `http://127.0.0.1:54324` |
| CCM Assistant | `http://localhost:3000` |

Treat the database password and local API keys as development-only credentials even though they are not hosted secrets.

## Fresh migration validation

The repository has 27 ordered SQL migrations (`001` through `027`), a working local stack, and four pgTAP contract files under `supabase/tests`. Gate 3 replayed the migrations from an empty local database and passed 66 database assertions. The suite covers:

- every expected migration is recorded in order;
- required tables, columns, primary keys, foreign keys, unique constraints, checks, and indexes exist;
- RLS is enabled on every tenant or patient-data table;
- expected policies exist and deny cross-practice and unauthenticated access;
- `anon`, `authenticated`, and `service_role` grants match least-privilege expectations;
- every security-definer function has an explicit safe `search_path`, intended owner, intended execute grants, and tenant checks;
- positive and negative authorization cases for the implemented owner, administrator, provider, coordinator, patient-scope, anonymous, authenticated, and service-role boundaries.

Once those tests exist, this is the single repeatable clean validation sequence:

```powershell
Set-Location C:\Users\pauld\Desktop\CCMAssistant
supabase start
supabase db reset --local --no-seed
supabase migration list --local
supabase db lint --local --level warning --fail-on error
supabase test db --local
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --check
```

`supabase db reset --local --no-seed` recreates only the local database and replays every file in `supabase/migrations` in filename order. It must never be changed to `--linked` or supplied a hosted `--db-url`.

Acceptance requires:

- reset output shows `001` through `027`, in order, with no skipped or failed migration;
- local migration history contains exactly the expected migration versions;
- database lint exits successfully and all pgTAP assertions pass;
- TypeScript, ESLint, the full regression suite, and production build pass;
- `git diff --check` reports no whitespace errors;
- no hosted project is linked and no persistent hosted resource is touched.

## Daily commands

Start local Supabase and the application:

```powershell
Set-Location C:\Users\pauld\Desktop\CCMAssistant
supabase start
supabase status
npm.cmd run env:check:local
npm.cmd run dev
```

Stop while preserving the local database:

```powershell
supabase stop
```

Reset and replay all migrations locally:

```powershell
supabase db reset --local --no-seed
```

Run the complete validation sequence using the commands in **Fresh migration validation**.

Delete only this project's local Docker data when a truly empty volume is required:

```powershell
supabase stop --no-backup
supabase start
supabase db reset --local --no-seed
```

`--no-backup` permanently deletes this project's local Supabase volume. Never add `--all`.

## Source-control boundaries

Commit when the infrastructure release is approved:

- `supabase/config.toml`
- `supabase/.gitignore`
- `docs/development/local-supabase.md`
- existing migration files only through their separately reviewed feature commits

Keep ignored and never stage:

- `supabase/.temp/`
- `supabase/.branches/`
- `supabase/.env.local` and other local environment files
- Docker images, containers, volumes, and Desktop state
- `%USERPROFILE%\.supabase\` CLI state

The default `config.toml` contains environment-variable references but no embedded hosted credentials. Never replace an `env(...)` reference with a secret value.

## Docker maintenance

Inspect the local project without changing it:

```powershell
docker ps --filter "name=supabase_"
docker stats --no-stream
docker system df
docker volume ls --filter "label=com.supabase.cli.project=ccmassistant"
```

Routine shutdown should use `supabase stop`, not Docker Desktop deletion controls. Do not run `docker system prune`, `docker volume prune`, or manually remove CCM Assistant containers/volumes during ordinary maintenance. Those commands can destroy local database state and unrelated projects.

After a Supabase CLI upgrade, stop the stack first and review current release notes before restarting. If a clean image/volume transition is explicitly required, export any needed local-only work before using `supabase stop --no-backup`.

## Common commands

```powershell
supabase status
supabase start
supabase stop
supabase migration list --local
supabase db lint --local --level warning --fail-on error
supabase test db --local
```

Do not use `supabase login`, `supabase link`, `--linked`, `db push`, or `config push` for the permanent local-only workflow.

## Troubleshooting

**`wsl --version` prints help or no version details**

Modern WSL is not installed. Complete Gate 1 and restart Windows. Docker requires WSL 2.1.5 or later.

**`docker version` shows Client but not Server**

Start Docker Desktop and wait for the Linux engine health check. Confirm WSL2 integration and retry `docker info`.

**`supabase start` reports insufficient resources or unhealthy containers**

Allocate at least 7 GB RAM to Docker/WSL, check free disk space, then run `supabase stop` followed by `supabase start`. Do not bypass health checks in the permanent workflow.

**Windows warns that Analytics requires Docker TCP port 2375**

Keep `[analytics].enabled = false`. Do not enable Docker's unauthenticated TCP daemon merely to collect local service logs. The required CCM Assistant services do not depend on Analytics.

**CLI reports that services bind to `0.0.0.0`**

This is a current local CLI behavior. Keep Windows Firewall enabled, use trusted networks, and never forward Supabase ports from a router or expose them through a tunnel. Stop the stack when it is not in use.

**A migration fails during reset**

Record the exact migration filename and SQL error. Do not edit migration history as part of environment setup. Stop and review the compatibility issue separately.

**Port 54321-54324 is already in use**

Use `Get-NetTCPConnection` to identify the owner. Stop the conflicting local process or deliberately revise `supabase/config.toml`; do not expose the ports publicly.

**The application connects to hosted Supabase**

Stop the application immediately. Confirm `.env.local` uses `127.0.0.1:54321` and the keys from local `supabase status`, then restart Next.js.

## Primary references

- [Supabase CLI installation and local stack](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Supabase CLI reference](https://supabase.com/docs/reference/cli/usage)
- [Supabase local workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase database testing](https://supabase.com/docs/guides/local-development/testing/overview)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Microsoft WSL installation](https://learn.microsoft.com/windows/wsl/install)
