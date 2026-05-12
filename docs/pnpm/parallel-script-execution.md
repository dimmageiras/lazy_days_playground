# Running scripts in parallel with pnpm

pnpm has built-in support for running multiple `package.json` scripts at once — no need to add `concurrently`, `npm-run-all`, or similar wrappers for common cases. This doc summarises the flags, the regex-pattern feature, the trade-offs against external orchestrators, and the pnpm v11 behaviours that affect this workflow.

## Selecting multiple scripts at once

`pnpm run` accepts a regex literal as the script name. All scripts whose names match the pattern are executed:

```sh
pnpm run "/<regex>/"
```

Common shapes:

| Pattern | Selects |
| --- | --- |
| `"/^dev:/"` | every script whose name starts with `dev:` |
| `"/^(dev\|test):/"` | every script starting with `dev:` or `test:` |
| `"/:watch$/"` | every script ending in `:watch` |

The regex syntax is standard JavaScript regex inside the leading/trailing `/` delimiters.

By itself, this runs the matched scripts **sequentially** in name order. Add `--parallel` (next section) to run them concurrently.

## Parallel execution

```sh
pnpm --parallel run "/^dev:/"
```

`--parallel` removes any ordering constraint and runs all matched scripts at the same time, with no cap on concurrency. For a small set of independent dev processes (e.g. one server, one client) this is the simplest possible orchestrator: pnpm spawns each, forwards Ctrl+C to all of them, and reports their output interleaved on the terminal.

### Two reasons to skip `--parallel`

1. **Order matters.** If one script produces artefacts another consumes (e.g. a build that another step relies on), parallel execution will race them.
2. **You want bounded concurrency.** `--parallel` is "as many as match". For a capped pool, use `--workspace-concurrency` (monorepo only — see below).

## Output handling

Output from multiple parallel scripts can get noisy. pnpm offers two knobs:

### `--aggregate-output`

```sh
pnpm --parallel --aggregate-output run "/^lint:/"
```

Each script's stdout is buffered and printed as one contiguous block when the script finishes (or flushes). Pros: clean, grouped logs. Cons: you don't see live progress.

**Don't use this for long-lived watch processes.** A watch process never exits in dev, so its output never flushes — you'll see nothing until you Ctrl+C. Reserve `--aggregate-output` for CI or one-shot tasks.

### `--reporter=<name>`

```sh
pnpm --parallel --reporter=append-only run "/^dev:/"
```

Alternative output modes (e.g. `append-only`, `default`). Useful when the default interleaving is too chaotic but you don't want full aggregation.

## Monorepo-specific flags

These apply when the project is a pnpm workspace (multiple packages) and don't affect single-package projects.

| Flag | Effect |
| --- | --- |
| `-r` / `--recursive` | Run the script in every workspace package; respect the dependency graph (topological order); default concurrency is 4 |
| `--parallel` | Override the topological order and run with unbounded concurrency |
| `--workspace-concurrency=N` | Cap concurrent processes. Positive `N` = exact limit. Non-positive `N` = `cores - abs(N)` (e.g. `-1` reserves one core). `Infinity` = no cap |

### The monorepo gotcha

**Don't combine `--parallel` with scripts that depend on each other's build artefacts.** Example: if package A imports the compiled output of package B, parallel mode may start A before B finishes, leading to non-deterministic failures. Use `-r` without `--parallel` (or with `--workspace-concurrency=N`) so the dependency graph is honoured.

In a single-package project, this gotcha doesn't apply — there is no inter-package graph to honour.

## When to reach for an external orchestrator

pnpm's built-in parallelism covers most cases. Reach for `concurrently` (or similar) only when:

- You need **named, coloured output prefixes** to tell streams apart visually. pnpm prefixes each line with the originating script name but doesn't colour-code.
- You need **fail-fast semantics**: kill all sibling scripts as soon as one exits non-zero. `concurrently --kill-others-on-fail` does this.
- You're integrating with a complex multi-process workflow where you need ordering primitives (e.g. "wait until process A logs `ready`, then start B"). `concurrently` doesn't do this either; reach for a proper process manager.

For "start two or three independent dev processes and Ctrl+C them together", pnpm's regex + `--parallel` is sufficient and adds no dependencies.

## pnpm v11 behaviours worth knowing

pnpm v11 didn't change the parallel-script syntax — `pnpm --parallel run "/<regex>/"` works the same as in v9 and v10. But several v11 defaults can surprise you.

### Cleaner script output

Parallel runs are easier to read in v11 — the formatting of interleaved output got a clarity pass. If you stayed on pnpm 10 and remembered the output as messy, try v11 before reaching for `concurrently`.

### Node 22 or newer required

pnpm v11 is pure ESM internally and drops Node 18-21. If your runtime is Node 22+, you're fine.

### Configuration migration

pnpm-specific settings moved out of `.npmrc`:

- `.npmrc` is now **registry/auth only** (`registry`, `_authToken`, `always-auth`, etc.)
- pnpm-specific settings live in `pnpm-workspace.yaml` (even in single-package projects) or a global file at `~/.config/pnpm/config.yaml`
- Environment variable prefix changed from `npm_config_*` to `pnpm_config_*`

If a setting silently stops working after upgrading, this migration is the most likely cause.

### `minimumReleaseAge: 1440` default

By default, pnpm refuses to install packages published less than 24 hours ago. This is a supply-chain defence: a freshly-published malicious version doesn't propagate to installs immediately. To override:

```sh
pnpm add some-package --allow-new
```

Or lower the threshold globally in the new config file. In CI, watch for confusing "package not found" errors that are actually "package too young" rejections.

### `blockExoticSubdeps: true` default

pnpm v11 refuses to install transitive dependencies declared with non-registry specifiers (git URLs, file paths, etc.) unless the project explicitly allowed them. Rarely bites real-world dependency trees; if it does, the failure message tells you which subdep was blocked and how to allow it.

### Build-script consolidation

The fragmented settings — `onlyBuiltDependencies`, `neverBuiltDependencies`, etc. — collapsed into a single `allowBuilds` map. If you had any of the old settings, they'll keep working but you'll see deprecation notices guiding you to the new shape.

### SQLite-backed store index

The package index is now a SQLite database instead of millions of JSON files. Transparent: no behavioural change, just faster. Affects pnpm's internal storage; nothing you write changes.

## Decision matrix

A practical guide for picking the right orchestration shape:

| Situation | Recommended setup |
| --- | --- |
| Two or three independent dev processes in a single package | `pnpm --parallel run "/^dev:/"` |
| Same as above, in CI with one-shot scripts | `pnpm --parallel --aggregate-output run "/^lint:/"` |
| Multiple packages in a monorepo, ordering matters | `pnpm -r run build` (no `--parallel`) |
| Multiple packages, ordering doesn't matter | `pnpm -r --parallel run lint` |
| Need to kill all on first failure | `concurrently --kill-others-on-fail` |
| Need coloured per-stream labels | `concurrently -n a,b -c blue,green` |

## References

- pnpm CLI docs: <https://pnpm.io/cli/run>
- pnpm v11 release notes: <https://pnpm.io/blog/releases/11.0>
