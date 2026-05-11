# Database Initialization (Local Development)

Bring up a fresh local Gel database for development. Run all commands from the project root.

## Prerequisites

- Docker Desktop running
- [Gel CLI](https://www.geldata.com/install) installed (`gel --version` should print a version). Gel is the database; the CLI talks to it from your host.

## About `--env-file`

Docker Compose only auto-loads a file named `.env`. We use `.env.local.dev`, so every Compose command needs `--env-file .env.local.dev`. This keeps one env file as the source of truth for both Compose and Node. Skip the flag and variables resolve to blank, leaving the container broken.

## 1) Create your env file

Copy the template and set a real `GEL_PASSWORD`:

```
copy sample.env .env.local.dev
```

`.env.local.dev` is gitignored.

## 2) Required variables

`.env.local.dev` is read by both Compose (server side) and the Gel CLI/SDK (client side, on your host). It must define:

| Variable                  | Side   | Purpose                                                                                                                                                                    |
| ------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GEL_PASSWORD`            | Both   | Admin password. Compose forwards it to the container as `GEL_SERVER_PASSWORD`; the CLI/SDK read `GEL_PASSWORD` directly.                                                   |
| `GEL_PORT`                | Server | Host port published as `${GEL_PORT}:5656`. The container always listens on 5656 internally.                                                                                |
| `GEL_SERVER_SECURITY`     | Server | Server enforcement mode. `insecure_dev_mode` relaxes TLS and loopback password auth for local dev. Other value: `strict`.                                                  |
| `GEL_HOST`                | Client | Where the client connects.                                                                                                                                                 |
| `GEL_BRANCH`              | Client | Default branch. A **branch** is Gel's unit of schema/data isolation, similar to a database. Older Gel/EdgeDB docs may call it a database.                                  |
| `GEL_CLIENT_TLS_SECURITY` | Client | Client cert verification. Must be `insecure` to accept the self-signed cert produced in dev mode. Note the `CLIENT_` prefix — the JS SDK does not read `GEL_TLS_SECURITY`. |

Leave values unquoted unless they contain whitespace or special characters — Compose and the CLI handle quotes differently, so the two sides can end up with different strings.

Confirm Compose resolves the password:

```
docker compose --env-file .env.local.dev config
```

Look for `GEL_SERVER_PASSWORD: <your-password>` in the output. Blank means `GEL_PASSWORD` is missing.

## 3) Start the container

```
docker compose --env-file .env.local.dev up -d gel_db
```

On a fresh volume, Gel runs a two-phase bootstrap: an init container creates the `main` branch, sets the admin password, and generates a self-signed TLS cert; then it shuts down (the "graceful shutdown of the bootstrap server instance" log line is expected) and the real server starts on `:5656`.

Expect ~10 seconds on a warm image, ~1 minute on the first pull.

## 4) Confirm the server is ready

```
curl.exe -k https://localhost:5656/server/status/ready
```

`HTTP 200` means it's accepting connections. `-k` skips cert validation since the cert is self-signed. Use `curl.exe`, not bare `curl` — in PowerShell 5.1, `curl` is an alias for `Invoke-WebRequest`, which doesn't accept `-k`.

## 5) Confirm host-side authentication

Load the `GEL_*` vars into your shell, then list branches.

**PowerShell:**

```powershell
Get-Content .env.local.dev | ForEach-Object {
  if ($_ -match '^(GEL_[A-Z_]+)=(.*)$') {
    Set-Item "env:$($Matches[1])" ($Matches[2] -replace '^"(.*)"$|^''(.*)''$', '$1$2')
  }
}
gel branch list
```

**Bash / zsh:**

```bash
set -a; source .env.local.dev; set +a
gel branch list
```

The CLI auto-reads `GEL_HOST`, `GEL_PORT`, `GEL_PASSWORD`, `GEL_BRANCH`, and `GEL_CLIENT_TLS_SECURITY` from the environment — no flags or DSN needed. On a fresh instance you'll see a single branch, `main`.

## Wiping and starting over

```
docker compose --env-file .env.local.dev down -v
docker compose --env-file .env.local.dev up -d gel_db
```

`-v` removes the `lazy_days_playground_gel_data` volume. Without it, data persists across recreates.

## Common issues

**`The "GEL_PASSWORD" variable is not set`**
The variable is missing from the env file, or you forgot `--env-file`.

**Orphan `full_stack` container**
Left over from the previous project setup. Remove it:

```
docker compose --env-file .env.local.dev down --remove-orphans
```

**`gel branch list` fails with auth error**
The password is baked into the volume at first start, so changing `GEL_PASSWORD` later has no effect on the existing container. Run `down -v` then `up -d` to rebuild against the current value.

**Auth still fails after `down -v`**
Check `.env.local.dev` for stray quotes around values (see section 2).
