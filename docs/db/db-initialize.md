# Database Initialization (Local Development)

Bring up a fresh local Gel database for development. Run all commands from the project root.

## Prerequisites

- Docker Desktop running
- [Gel CLI](https://www.geldata.com/install) installed (`gel --version` should print a version). Gel is the database; the CLI talks to it from your host.

## About the env file

Both Docker Compose and Vite auto-load a file named `.env` from the project root, so a single `.env` is the source of truth for the `gel_db` container, the app, and — once loaded as shown in section 5 — the host Gel CLI. No `--env-file` flag needed. The repo ignores everything except an explicit allowlist (see `.gitignore`), so `.env` is never tracked. The app's dev process additionally layers a `.env.dev.local` on top of this `.env` when present (the pattern the project README describes for dev-only overrides); the root `.env` on its own is enough to bring everything up.

## 1) Create your env file

Copy the template and set a real `VITE_APP_DB_PASSWORD`:

**PowerShell / cmd:**

```
copy sample.env .env
```

**Bash / zsh:**

```
cp sample.env .env
```

## 2) Required variables

Every database entry is named `VITE_APP_DB_*` — the app reads only variables under the `VITE_APP_` prefix (established by [ADR-0009](../adr/0009-environment-validation-gate.md), extended to the database fields by [ADR-0021](../adr/0021-database-connection-contract.md)). One `.env` serves three consumers, each reading it its own way:

- **Docker Compose** interpolates `${VITE_APP_DB_*}` and maps the values onto the container's native `GEL_SERVER_*` names — the names needn't match, so the prefix is harmless here.
- **The app** reads the validated values and passes them to the Gel client explicitly.
- **The host `gel` CLI** understands only its own `GEL_*` names, so section 5 loads `.env` and swaps the `VITE_APP_DB_` prefix for `GEL_`.

`.env` must define:

| Variable                          | Read by           | Purpose                                                                                                                                                                    |
| --------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_APP_DB_PASSWORD`            | Compose, app, CLI | Admin password. Compose maps it to the container's `GEL_SERVER_PASSWORD`; the CLI reads it as `GEL_PASSWORD`.                                                              |
| `VITE_APP_DB_PORT`                | Compose, app, CLI | Host port published as `${VITE_APP_DB_PORT}:5656` (the container always listens on 5656 internally). The CLI reads it as `GEL_PORT`.                                       |
| `VITE_APP_DB_SERVER_SECURITY`     | Compose           | Server enforcement mode, mapped to the container's `GEL_SERVER_SECURITY`. `insecure_dev_mode` relaxes TLS and loopback password auth for local dev; other value: `strict`. |
| `VITE_APP_DB_HOST`                | app, CLI          | Where the client connects. The CLI reads it as `GEL_HOST`.                                                                                                                 |
| `VITE_APP_DB_BRANCH`              | app, CLI          | Branch to connect to (see [Branch (Gel)](../../CONTEXT.md#branch-gel)). The CLI reads it as `GEL_BRANCH`.                                                                  |
| `VITE_APP_DB_CLIENT_TLS_SECURITY` | app, CLI          | Client cert verification. Use `insecure` to accept the self-signed cert produced in dev mode. The CLI reads it as `GEL_CLIENT_TLS_SECURITY`.                               |
| `VITE_APP_DB_NAME`                | app               | Logging label only — not part of the connection.                                                                                                                           |

Leave values unquoted unless they contain whitespace or special characters — Compose and the CLI handle quotes differently, so the two sides can end up with different strings.

Confirm Compose resolves the password:

```
docker compose config
```

Look for `GEL_SERVER_PASSWORD: <your-password>` in the output. Blank means `VITE_APP_DB_PASSWORD` is missing.

## 3) Start the container

```
docker compose up -d gel_db
```

On a fresh volume, Gel runs a two-phase bootstrap: an init container creates the `main` branch, sets the admin password, and generates a self-signed TLS cert; then it shuts down (the "graceful shutdown of the bootstrap server instance" log line is expected) and the real server starts on `:5656`.

Expect ~10 seconds on a warm image, ~1 minute on the first pull.

## 4) Confirm the server is ready

```
curl.exe -k https://localhost:<VITE_APP_DB_PORT>/server/status/ready
```

Use the host port you published in `VITE_APP_DB_PORT` — `5656` is only the container-internal listener (see section 2), so a hardcoded `5656` gives a false "not ready" signal whenever you publish a different host port. `HTTP 200` means it's accepting connections. `-k` skips cert validation since the cert is self-signed. Use `curl.exe`, not bare `curl` — in PowerShell 5.1, `curl` is an alias for `Invoke-WebRequest`, which doesn't accept `-k`.

## 5) Confirm host-side authentication

Load the database vars into your shell under the `GEL_*` names the CLI expects, then list branches. Each snippet reads `.env` and swaps the `VITE_APP_DB_` prefix for `GEL_`.

**PowerShell:**

```powershell
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*VITE_APP_DB_([A-Z_]+)=(.*)$') {
    $value = $Matches[2] -replace '^"(.*)"$|^''(.*)''$', '$1$2'
    Set-Item "env:GEL_$($Matches[1])" $value
  }
}
gel branch list
```

**Bash / zsh:**

```bash
while IFS='=' read -r key value; do
  case "$key" in
    VITE_APP_DB_*) export "GEL_${key#VITE_APP_DB_}=$value" ;;
  esac
done < .env
gel branch list
```

The snippet derives those names from the `VITE_APP_DB_*` entries by swapping the prefix; the CLI reads the ones it recognizes (`GEL_HOST`, `GEL_PORT`, `GEL_PASSWORD`, `GEL_BRANCH`, `GEL_CLIENT_TLS_SECURITY`) and ignores the rest — no flags or DSN needed. On a fresh instance you'll see a single branch, `main`.

## Wiping and starting over

```
docker compose down -v
docker compose up -d gel_db
```

`-v` removes the `lazy_days_playground_gel_data` volume. Without it, data persists across recreates.

## Common issues

**`The "VITE_APP_DB_PASSWORD" variable is not set`**
The variable is missing from `.env`, or Compose was run from a directory other than the project root (it auto-loads `.env` from the working directory).

**Orphan `full_stack` container** (only relevant if you set up the repo before the Gel migration)
Left over from the previous project setup. Once no one is carrying that container forward, this entry is safe to delete. Remove it:

```
docker compose down --remove-orphans
```

**`gel branch list` fails with auth error**
The password is baked into the volume at first start, so changing `VITE_APP_DB_PASSWORD` later has no effect on the existing container. Run `down -v` then `up -d` to rebuild against the current value.

**Auth still fails after `down -v`**
Check `.env` for stray quotes around values (see section 2).
