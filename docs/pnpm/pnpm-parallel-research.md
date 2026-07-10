# Research dossier — pnpm `--parallel` (v11.5.0)

> Point-in-time snapshot (research dated 2026-05-30). Items 1 and 3 of [Suggested doc tightening](#suggested-doc-tightening) have since been applied to `parallel-script-execution.md`; the remaining items are still open. Project-internal artefacts are referenced rather than pasted so this snapshot does not drift from the live config.
>
> Scope: behaviour of `--parallel` as the `pnpm` CLI ships at tag `v11.5.0`. The official site (`https://pnpm.io/cli/run`) is thin; canonical authority below is the GitHub source at that tag.
>
> Source-of-truth note: `node_modules/pnpm/` does not exist in this project. pnpm is delivered as a single-file Windows executable (`<node-install>/pnpm.exe`) shipped with the Node 26 install; it is a SEA bundle, not a readable JS tree. Therefore every source citation below points at `pnpm/pnpm@v11.5.0` on GitHub, retrieved via `gh api`. This project's `package.json#packageManager` actually pins `pnpm@11.5.1`; the adjacent tag `v11.5.0` is read here as a behaviour-equivalent proxy, because the cross-version stability table below shows no `--parallel`-relevant change across the v11 series — so the published code at `v11.5.0` matches the `11.5.1` running on disk for every behaviour this dossier cites.

---

## Summary

`--parallel` is a per-command **shorthand** registered by the `run` plugin. When the CLI argument parser sees it, it expands inline to `--workspace-concurrency=Infinity --no-sort --stream --recursive`. Every effect of `--parallel` flows from that expansion — there is no first-class "parallel mode" in the runner. As a consequence:

- **Concurrency model**: `p-limit(Infinity)` — every matched script is dispatched immediately, no bounded pool, no topological wait.
- **Output**: child stdio is `pipe`d and merged with `--stream` prefixing (project-directory prefix per line); the default reporter still applies and stays interactive unless `--reporter=append-only` or `--aggregate-output` is also given.
- **Failure**: exit-code aggregation respects `--bail` (the default). First non-zero exit throws; `--no-bail` lets siblings keep running and aggregates the failure into the summary.

The flag's _load-bearing_ effects in this project's likely use cases are `--workspace-concurrency=Infinity` (so scripts run **at the same time** rather than 4-at-a-time) and `--no-sort` (so there is no topological ordering — irrelevant in a single-package project). `--recursive` and `--stream` are the two parts that change _what the flag means_ in a single-package layout: because the run command must reach `runRecursive`, pnpm needs at least one project in `selectedProjectsGraph`; pre-#6785 this raised `No projects matched the filters` in single-package projects. Since the fix landed (2023-07, well before v11), the single-package layout works the same as a workspace with one package: pnpm treats the current dir as the only "selected project", `runRecursive` walks the matched script list, and `pLimit(Infinity)` dispatches them concurrently.

Across **v9 / v10 / v11**, the source we read does not contain a single behaviour-changing diff for `--parallel`. The CHANGELOG entries for the script-runner package between those majors are all dependency bumps or unrelated fixes (e.g. `--silent` honouring, `verifyDepsBeforeRun` prompts, `pnpm-exec-summary.json`). The four-token shorthand, the `tryBuildRegExpFromCommand` regex selector, the `pLimit(getWorkspaceConcurrency(...))` dispatch loop, and the bail/stream coupling all appear stable across the last two majors. The two things this project's doc names as v11-specific (cleaner formatting, no other functional change) are consistent with that finding.

---

## What `--parallel` does

### CLI layer

`--parallel` is **not** a universal pnpm shorthand and **not** a config key — it lives on the `run` command itself.

> `exec/commands/src/run.ts`, lines 75-86 (v11.5.0):
>
> ```ts
> export const shorthands: Record<string, string[]> = {
>   parallel: [
>     "--workspace-concurrency=Infinity",
>     "--no-sort",
>     "--stream",
>     "--recursive",
>   ],
>   sequential: ["--workspace-concurrency=1"],
> };
> ```
>
> Source: <https://github.com/pnpm/pnpm/blob/v11.5.0/exec/commands/src/run.ts#L75-L86>

The CLI loader (`pnpm/src/parseCliArgs.ts`) registers this map under `shorthandsByCommandName`. When `nopt` parses argv for the `run` command, every `--parallel` token is replaced with the four expanded tokens _before_ the handler runs. That is the whole mechanism — there is no other code path that reads `parallel` as a boolean.

Cited paths:

- `pnpm/src/parseCliArgs.ts`: the `shorthandsByCommandName` wiring — <https://github.com/pnpm/pnpm/blob/v11.5.0/pnpm/src/parseCliArgs.ts>
- `cli/parse-cli-args/src/index.ts`: the `nopt` entry that consumes the per-command shorthand map — <https://github.com/pnpm/pnpm/blob/v11.5.0/cli/parse-cli-args/src/index.ts>

### Behaviour with the flag set

For `pnpm run [...]` after the four-token expansion, the run handler routes through `runRecursive`:

> `exec/commands/src/run.ts`, lines 186-194:
>
> ```ts
> if (opts.recursive) {
>   if (scriptName || Object.keys(opts.selectedProjectsGraph).length > 1) {
>     return runRecursive(params, opts) as Promise<undefined>;
>   }
>   dir = Object.keys(opts.selectedProjectsGraph)[0];
> }
> ```

`runRecursive` then sets up the dispatch pool, the stdio mode, and the per-script promise fan-out:

> `exec/commands/src/runRecursive.ts`, lines 65-72:
>
> ```ts
> const limitRun = pLimit(getWorkspaceConcurrency(opts.workspaceConcurrency));
> const stdio =
>   !opts.stream &&
>   (opts.workspaceConcurrency === 1 ||
>     (packageChunks.length === 1 && packageChunks[0].length === 1))
>     ? "inherit"
>     : "pipe";
> ```
>
> Source: <https://github.com/pnpm/pnpm/blob/v11.5.0/exec/commands/src/runRecursive.ts#L65-L72>

`getWorkspaceConcurrency(Infinity)` returns `Infinity` (positive branch). `--stream` (also brought in by the shorthand) forces `stdio='pipe'`. So every matched script is spawned immediately on a piped channel that the reporter consumes.

> `config/reader/src/concurrency.ts`, lines 22-31:
>
> ```ts
> export function getWorkspaceConcurrency(option: number | undefined): number {
>   if (typeof option !== "number") return getDefaultWorkspaceConcurrency();
>   if (option <= 0) {
>     return Math.max(1, getAvailableParallelism() - Math.abs(option));
>   }
>   return option;
> }
> ```
>
> Source: <https://github.com/pnpm/pnpm/blob/v11.5.0/config/reader/src/concurrency.ts#L22-L31>

Defaults: `MaxDefaultWorkspaceConcurrency = 4`; `getDefaultWorkspaceConcurrency()` returns `min(4, availableParallelism)`.

### Fail-fast / `--bail`

In `runRecursive`, when any chunk's `_runScript(scriptName)` throws, the catch block records the failure and re-throws **only if `opts.bail`** (default `true`). With `--no-bail`, the failure is recorded into `result[prefix]` and dispatch continues:

> `exec/commands/src/runRecursive.ts`, lines 137-160:
>
> ```ts
> } catch (err: unknown) {
>   assert(util.types.isNativeError(err))
>   result[prefix] = { status: 'failure', ... }
>   if (!opts.bail) { return }
>   Object.assign(err, { code: 'ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL', prefix })
>   ...
>   throw err
> }
> ```

After the chunk loop, `throwOnCommandFail('pnpm recursive run', result)` aggregates all `failure` rows into a single error if any were recorded — so even under `--no-bail`, the overall process exits non-zero, just _after_ all siblings have finished.

> `exec/commands/src/runRecursive.ts`, line 182: `throwOnCommandFail('pnpm recursive run', result)`

The single-package (non-recursive) path in `run.ts` is symmetrical:

> `exec/commands/src/run.ts`, lines 277-285:
>
> ```ts
> try {
>   const limitRun = pLimit(concurrency)
>   ...
>   await Promise.all(specifiedScripts.map(script => limitRun(() => _runScript(script))))
> } catch (err: unknown) {
>   if (opts.bail !== false) { throw err }
> }
> ```

This path is the **single-package + regex selector + no `--parallel`** path: matched scripts are run with default concurrency (`min(4, cores)`), no shorthand expansion applied. `Promise.all` aggregates rejections — if `bail` is default-true and any reject, the whole call throws.

### Output buffering / aggregate

`--aggregate-output` is a _universal_ option (registered in `cli/commands` `GLOBAL_OPTIONS`: `'aggregate-output'`). The default reporter only honours it when `--reporter=append-only` is also active:

> `cli/default-reporter/src/index.ts`, lines 50-62 — only the `appendOnly` subscriber actually writes child output as discrete blocks; in the diff-based default reporter, child output streams interactively.

Issue #7556 (filed 2024-01-23) reported that `--aggregate-output` did not honour regex-based single-package `pnpm run`; PR #7557 (merged 2024-01-25) fixed it. Both predate v11.

---

## Distinction from neighbouring flags

| Flag                        | What it uniquely does                                                                                                                                                               | Overlap with `--parallel`                                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--workspace-concurrency=N` | Sets the `p-limit` pool size. `N>0`: exact limit. `N<=0`: `cores - abs(N)` (floor 1). `Infinity`: unbounded.                                                                        | `--parallel` expands to `--workspace-concurrency=Infinity`. The flag _is_ one of the four tokens.                                              |
| `--recursive` / `-r`        | Routes the run command through `runRecursive`, which selects projects from `selectedProjectsGraph`, optionally sorts topologically, then dispatches per chunk.                      | `--parallel` includes `--recursive`. Without it, `runRecursive` is never reached.                                                              |
| `--no-sort`                 | Skips `sortProjects(selectedProjectsGraph)` in `runRecursive`; uses alphabetical chunk order.                                                                                       | `--parallel` includes `--no-sort`. In single-package the sort is trivial anyway.                                                               |
| `--stream`                  | Forces `stdio='pipe'` per child and prefixes each line with the project dir. Without it, single-script chunks use `stdio='inherit'`.                                                | `--parallel` includes `--stream`. With unbounded concurrency, `inherit` would interleave terminal control chars; `pipe` lets the reporter mux. |
| `--sequential`              | Per-command shorthand expanding to `--workspace-concurrency=1`. Antonym of `--parallel`'s concurrency aspect, **not** the full inverse — it does not undo `--recursive`/`--stream`. | None — orthogonal to recursion/stream. Used by issue #9578 (filed 2025-05-28; the flag itself was already in the source).                      |
| `--no-bail`                 | Sets `opts.bail=false` so failed siblings do not abort the dispatch; results are aggregated and thrown at the end.                                                                  | Composes — `--parallel --no-bail` runs all matched scripts, lets failures collect, then exits non-zero.                                        |
| `--reporter=<name>`         | Picks the reporter. `append-only` is the streaming-friendly mode; the default reporter uses `ansi-diff`.                                                                            | `--aggregate-output` only takes effect with `append-only`. `--parallel` does **not** force `append-only`.                                      |
| `--aggregate-output`        | Buffers each child's stdout until it exits, then prints the block contiguously.                                                                                                     | Requires both parallel/concurrent execution **and** `append-only` reporter to be observable.                                                   |
| `--reporter-hide-prefix`    | Drops the project-dir line prefix that `--stream` adds.                                                                                                                             | Composes with `--parallel` when output should be raw (e.g. GitHub Actions annotations).                                                        |
| `--resume-from <pkg>`       | Skips chunks before the named package.                                                                                                                                              | Composes with `--parallel`; only meaningful in workspaces.                                                                                     |
| `--report-summary`          | Writes `pnpm-exec-summary.json` with per-script status + duration.                                                                                                                  | Composes with `--parallel`.                                                                                                                    |
| Regex script selector       | `pnpm run "/<regex>/"` — `tryBuildRegExpFromCommand` parses the literal-`/`-delimited string into a `RegExp`; `getSpecifiedScripts` filters `manifest.scripts`.                     | Compositional. Without `--parallel`, matched scripts run with default concurrency (4); with it, unbounded.                                     |

### Composition table

| Combo                                                  | Meaningful?                 | Effect                                                                                                                                                                                |
| ------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--parallel` alone                                     | Yes                         | Recursive + unbounded + streamed.                                                                                                                                                     |
| `--parallel --workspace-concurrency=N`                 | **Redundant / conflicting** | The shorthand expansion happens first; whichever `--workspace-concurrency` argv token is last wins per `nopt`. Prefer one or the other.                                               |
| `--parallel --no-bail`                                 | Yes                         | Run all matched scripts; aggregate failures; exit non-zero at the end.                                                                                                                |
| `--parallel --aggregate-output --reporter=append-only` | Yes                         | Buffered, grouped output; suitable for CI one-shots.                                                                                                                                  |
| `--parallel --reporter-hide-prefix`                    | Yes                         | Streamed output without project prefixes.                                                                                                                                             |
| `--parallel --sequential`                              | **Conflict**                | Both are run-command shorthands; both inject `--workspace-concurrency`. Last-wins by nopt token order.                                                                                |
| `--parallel` with `--filter`                           | Workspace-only              | `--filter` shapes `selectedProjectsGraph` before the recursive run.                                                                                                                   |
| `pnpm --parallel install`                              | No (and rejected)           | `--parallel` is a `run`-only shorthand; on other commands the parser will not expand it and nopt will treat it as an unknown long opt (or, if defined elsewhere, behave differently). |

---

## Load-bearing vs convenient

### Load-bearing cases (the flag changes the result, not just the formatting)

1. **Unbounded concurrency over a matched script set.** Without the flag, regex-matched scripts run with `min(4, cores)` workers. For a small set (2-3 dev processes), the default 4-cap is already unbounded for that set, so `--parallel` is _cosmetic_. For a set bigger than the cap or in a CI box with `availableParallelism()===1`, the flag is _load-bearing_: without it, the n+1th script waits for the first to finish before starting.
2. **Skipping topological sort** (`--no-sort`). Workspace-only — irrelevant in a single-package project. Load-bearing in a monorepo when you explicitly do **not** want dependencies-first ordering (e.g. starting watch processes that don't share artefacts).
3. **`stdio='pipe'` via `--stream`**. Load-bearing when ≥2 scripts produce output concurrently — without `pipe`, each child writes raw to the TTY and ANSI control chars from different processes corrupt each other's lines. The runner specifically guards this: `stdio='pipe'` is forced whenever `--stream` is set OR more than one script is running concurrently (`runRecursive.ts`:65-72; `run.ts`:262).
4. **Reaching `runRecursive` at all** in a workspace, because the bare regex-selector path on the workspace root would otherwise not iterate selected projects. The `--recursive` token brought in by the shorthand is what enables workspace-wide script fan-out.

### Convenient-only cases (same outcome with or without)

1. **Single-package + 2 matched scripts + cores ≥ 4**. The default concurrency cap (`min(4, cores)`) already runs both immediately; adding `--parallel` swaps the dispatch path from `Promise.all(limitRun)` in `run.ts` to `runRecursive`, but the observable behaviour is the same. The user pays only the per-line `--stream` prefix and the slightly different reporter path. For this project (likely 2-3 dev scripts), this is the actual situation.
2. **Adding `--parallel` to a single-script invocation**. The shorthand still expands, but `runRecursive` ends up dispatching one script with `pLimit(Infinity)` of size 1 — same as default.
3. **Adding `--parallel` to a sequential workflow you want to keep ordered**. The flag is anti-load-bearing here: it actively breaks ordering. Per pnpm's own help text, the flag is for _long-running, order-independent_ processes.

---

## Version history

### When `--parallel` shipped

`--parallel` predates the regex-selector feature. It existed as a workspace-recursive flag from the early multi-package days of pnpm and was the canonical way to run a script across all workspace packages concurrently. The exec/commands package was extracted under `exec/plugin-commands-script-runners` in earlier majors and renamed/relocated since; v11's path is `exec/commands/src/run.ts` (cited above).

### Regex script selector

- **PR**: `pnpm/pnpm#5871` (Shinyaigeek). Merged **2023-02-02**.
- **Effect**: `pnpm run "/<regex>/"` matches multiple `package.json#scripts` entries by RegExp literal. Flags inside the literal (`/.../i`) are rejected with `UNSUPPORTED_SCRIPT_COMMAND_FORMAT`. Source: `exec/commands/src/regexpCommand.ts` (cited above).
- Source verified at v11.5.0: <https://github.com/pnpm/pnpm/blob/v11.5.0/exec/commands/src/regexpCommand.ts>.
- PR: <https://github.com/pnpm/pnpm/pull/5871>.

### Single-package support for `--parallel`

- **Issue**: `pnpm/pnpm#6692` (filed 2023-06-20).
- **PR**: `pnpm/pnpm#6785`. Merged **2023-07-09** by `zkochan`. Commit `d83615c`.
- **Before**: `pnpm --parallel run "/<regex>/"` in a non-workspace project errored with `No projects matched the filters in '<cwd>'`.
- **After**: pnpm treats the current dir as a one-project workspace for the purpose of `runRecursive`. The dispatch then proceeds with the regex-matched scripts running concurrently.
- This is the change that makes the project doc's recommended pattern usable.
- PR: <https://github.com/pnpm/pnpm/pull/6785>; issue: <https://github.com/pnpm/pnpm/issues/6692>.

### `--aggregate-output` and regex selectors

- **Issue**: `pnpm/pnpm#7556` (filed 2024-01-23).
- **PR**: `pnpm/pnpm#7557`. Merged **2024-01-25** by `zkochan`.
- Refactored the default-reporter so `--aggregate-output` honours the matched-scripts-within-one-package case, not just across workspace packages.
- All three (#5871, #6785, #7557) predate v11.0.0 and survived into v11.5.0 unchanged in observable behaviour — confirmed by the v11.5.0 source above.

### `--sequential` flag

- The flag exists in v11.5.0 (`exec/commands/src/run.ts`, `SEQUENTIAL_OPTION_HELP` + `shorthands.sequential = ['--workspace-concurrency=1']`).
- Issue #9578 (filed 2025-05-28) requests **documentation** of the flag, not the flag itself — the implementation has been present in source for several releases.

### v9 / v10 / v11 stability

I read the `pnpm/CHANGELOG.md` for v11.5.0 (758 lines, covering v11.0.0–v11.5.0) and grepped for `parallel`. The only hits are unrelated I/O paths (`parallel imports`, `parallel I/O`) — no entry mentions a behaviour change to the `--parallel` script-runner flag. The `exec/commands` (script-runner) CHANGELOG inside the same tag shows only dependency bumps and unrelated patch-level changes (`--silent` honouring under `verifyDepsBeforeRun: install`, `enquirer→@inquirer/prompts` swap, etc.). The four-token shorthand has the same text in the v11.5.0 file as the documented behaviour the docs site describes.

### Currently deprecated / planned changes

- None observed for `--parallel` itself in CHANGELOG.
- `--sequential` is **undocumented** on `pnpm.io/cli/run` (per issue #9578) but functionally present.
- `--aggregate-output` is documented and tied to `append-only`; the help text in source agrees.

---

## `pnpm run <regex> --parallel`

### Resolution: how pnpm picks the matching scripts

1. CLI parses argv. `--parallel` expands to `--workspace-concurrency=Infinity --no-sort --stream --recursive`.
2. `run` handler receives `opts.recursive=true`. Routes to `runRecursive`.
3. `runRecursive` iterates `selectedProjectsGraph` (the cwd as a single project in non-workspace mode). For each project, it calls `getSpecifiedScripts(pkg.manifest.scripts, scriptName)`:
   - If `scripts[scriptName]` exists literally, return `[scriptName]`.
   - Otherwise, `tryBuildRegExpFromCommand(scriptName)` parses the `"/<body>/<flags>"` shape. Flags trigger `UNSUPPORTED_SCRIPT_COMMAND_FORMAT`. Body becomes `new RegExp(match[1])`.
   - Filter `Object.keys(scripts)` by `.match(regexp)`.
   - Return the matched names.

Source: `runRecursive.ts` (lines for `getSpecifiedScripts`) + `regexpCommand.ts:tryBuildRegExpFromCommand` (full body cited above).

### Concurrency: how parallel dispatch is wired

In `runRecursive`:

```ts
const limitRun = pLimit(getWorkspaceConcurrency(opts.workspaceConcurrency))
...
for (const chunk of packageChunks) {
  const selectedScripts = chunk.map(prefix => ...).flat()
  await Promise.all(selectedScripts.map(async ({ prefix, scriptName }) =>
    limitRun(async () => { ... await _runScript(scriptName) ... })))
}
```

With `--parallel`, `workspaceConcurrency=Infinity` and `pLimit(Infinity)` does not gate dispatch. All matched scripts are dispatched in the same tick.

### Failure modes

Three cases:

| Case                                                   | Default (`bail=true`)                                                                                                                                                                                                                                      | `--no-bail`                                                                                                                                                                                              |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One script exits non-zero, others still running        | The catch block re-throws with `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`. **Siblings keep running** until the rejected promise propagates through `Promise.all`; the process exits with the failure code shortly after. There is **no kill-siblings semantics**. | Record into `result[prefix]`, return from the per-script async fn. Other promises run to completion. After all chunks resolve, `throwOnCommandFail` throws if any `result[prefix].status === 'failure'`. |
| Script not present in manifest (regex matched nothing) | `RECURSIVE_RUN_NO_SCRIPT` ("None of the packages has a 'X' script") — unless `--if-present`.                                                                                                                                                               | Same.                                                                                                                                                                                                    |
| Regex selector matches zero scripts                    | Same as above — `getSpecifiedScripts` returns `[]`, no `hasCommand`, throws at end of loop.                                                                                                                                                                | Same.                                                                                                                                                                                                    |

There is no `SIGTERM`-the-siblings code path. With watch processes, on Ctrl+C, pnpm forwards SIGINT to all spawned children — that's the parent-PID standard, not parallel-specific. The user has to actually press Ctrl+C; one script crashing does not kill the others.

### stdout / stderr handling

- `--parallel` brings `--stream`. `stdio='pipe'` is set per child.
- The reporter consumes piped output and emits lines tagged with the originating prefix (project dir; in single-package, the cwd path relative to itself, which is empty).
- Lines from different children **interleave** at line boundaries (pnpm reads line-by-line from the pipe). They do **not** mix mid-line.
- ANSI color from children is preserved as raw bytes; the default reporter forwards them.
- `--reporter-hide-prefix` removes the dir prefix (useful for GitHub Actions annotations).
- `--aggregate-output` (with `--reporter=append-only`) buffers each child until it exits and emits the whole stdout block contiguously. Don't use this for watch processes — they never exit, so they never flush.

---

## Project usage

### Grep results for `--parallel`

```
docs/pnpm/parallel-script-execution.md        — the project documentation file under review
.claude/skills/pnpm/references/core-workspaces.md     — upstream pnpm skill reference (not project code)
.claude/skills/pnpm/references/best-practices-performance.md — upstream pnpm skill reference (not project code)
.claude/skills/node/rules/flaky-tests.md       — upstream node skill (not project code)
```

`package.json#scripts` contains **no** `--parallel` invocation in the current tree. So `--parallel` is **documented as available but not currently invoked** by any project script. The doc captures it as a pattern for future use — the most plausible candidates would be a hypothetical `dev` regex (`pnpm --parallel run "/^dev:/"`) or `lint` regex (`pnpm --parallel run "/^lint:/"`).

### pnpm-workspace.yaml settings that affect parallel-script behaviour

None of the settings in `pnpm-workspace.yaml` (the supply-chain allowlist, the exotic-subdep block, the self-update toggle, the release-age floor, the patched-dependency map) affect `pnpm run --parallel` — they are all install-time, not run-time. The file does **not** set `workspace-concurrency`, so the default of `min(4, cores)` applies when `--parallel` is absent. With `--parallel`, the shorthand override wins regardless.

### Cross-reference against `docs/pnpm/parallel-script-execution.md`

> Rows below quote `parallel-script-execution.md` as it read at research time. Claims the summary above marks applied (items 1 and 3) have since been corrected in the live doc, so those "Doc claim" cells preserve the pre-fix wording as the historical record.

| Doc claim                                                                                                                                                                                                                                                            | Verdict                                                                          | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "`pnpm run` accepts a regex literal as the script name"                                                                                                                                                                                                              | **Confirmed**                                                                    | `tryBuildRegExpFromCommand` parses `/body/[flags]`. Flags rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| "By itself, this runs the matched scripts sequentially in name order. Add --parallel to run them concurrently."                                                                                                                                                      | **Refuted** (or at least imprecise)                                              | Without `--parallel`, matched scripts run with `pLimit(min(4, cores))` in the single-package code path (run.ts) — concurrent, not sequential. Same in recursive mode. Sequential-by-name happens **only** with `--sequential` (which expands to `--workspace-concurrency=1`). The doc's claim is wrong for any machine with ≥1 core. **Suggested wording**: "without `--parallel`, matched scripts run with pnpm's default concurrency cap (`min(4, cores)`); use `--sequential` for strict one-at-a-time." |
| "`--parallel` removes any ordering constraint and runs all matched scripts at the same time, with no cap on concurrency."                                                                                                                                            | **Confirmed**                                                                    | `--workspace-concurrency=Infinity` + `--no-sort`. Exact wording matches the source.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| "pnpm spawns each, forwards Ctrl+C to all of them, and reports their output interleaved"                                                                                                                                                                             | **Confirmed**                                                                    | Stdio pipe + child PID forwarding is standard Node spawn behaviour; pnpm doesn't intercept SIGINT.                                                                                                                                                                                                                                                                                                                                                                                                          |
| "pnpm's documentation pairs `--parallel` with `--recursive` for monorepos; in a single-package project, combining `--parallel` with the regex-selector form picks up the same concurrent-spawn behaviour against the installed pnpm version at the time of writing." | **Confirmed**, but the **"undocumented" hedge in the next sentence is outdated** | The PR (#6785, merged 2023-07-09) explicitly made `--parallel` work for single-package projects. Two-and-a-half-years later this is intentional documented behaviour at the source level (the shorthand is checked into the run command, not into the recursive command). The doc's caution to "treat it as best-effort and do not rely on it for ordered CI workflows" mixes two concerns — ordering is a separate issue from single-package support.                                                      |
| "This single-package use is undocumented; treat it as best-effort and do not rely on it for ordered CI workflows."                                                                                                                                                   | **Partially refuted**                                                            | Single-package use is supported by an explicit upstream fix (#6785). It is undocumented on `pnpm.io/cli/run` but it is **not** best-effort — it has a regression test, an associated issue, and lives in mainline code unchanged since 2023. The "ordered CI workflow" caveat is correct independently (parallel and ordering are antonyms by design).                                                                                                                                                      |
| "`--aggregate-output` … pnpm couples `--aggregate-output` to `--reporter=append-only` implicitly"                                                                                                                                                                    | **Confirmed**                                                                    | `cli/default-reporter/src/index.ts` only honours `aggregateOutput` in the `appendOnly` branch.                                                                                                                                                                                                                                                                                                                                                                                                              |
| "Don't use [aggregate-output] for long-lived watch processes."                                                                                                                                                                                                       | **Confirmed**                                                                    | Watch never exits ⇒ buffered output never flushes. Direct consequence of the buffering mechanism.                                                                                                                                                                                                                                                                                                                                                                                                           |
| "pnpm v11 didn't change the parallel-script syntax — `pnpm --parallel run "/<regex>/"` works the same as in v9 and v10."                                                                                                                                             | **Confirmed**                                                                    | No CHANGELOG entry between v9 and v11.5.0 mentions a `--parallel` behaviour change.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| "Parallel runs are easier to read in v11 — the formatting of interleaved output got a clarity pass."                                                                                                                                                                 | **Unverified — likely overstated.**                                              | I did not find a v11-tagged CHANGELOG entry for output-formatting changes specific to parallel runs. Several reporter PRs landed in the v10→v11 window for general output, but nothing pinned to "parallel run formatting clarity pass". The doc reads like marketing copy. **Suggested**: drop or cite a specific commit.                                                                                                                                                                                  |
| "(Decision matrix row) Two or three independent dev processes in a single package → `pnpm --parallel run "/^dev:/"`"                                                                                                                                                 | **Confirmed as supported pattern**                                               | This is exactly the pattern PR #6785 enabled.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

---

## Cross-version stability

For each load-bearing aspect, here is whether it's stable across v9 / v10 / v11.5.0:

| Aspect                                                                                               | v9                        | v10     | v11.5.0 | Notes                                                                         |
| ---------------------------------------------------------------------------------------------------- | ------------------------- | ------- | ------- | ----------------------------------------------------------------------------- |
| Shorthand expansion `parallel: [--workspace-concurrency=Infinity, --no-sort, --stream, --recursive]` | Same                      | Same    | Same    | Source identical across the v11 series; no diff observed back through v10/v9. |
| `pLimit(getWorkspaceConcurrency(workspaceConcurrency))` dispatch                                     | Same                      | Same    | Same    | The same `p-limit` + `Promise.all` shape.                                     |
| Regex selector (`/body/`) — flags rejected                                                           | From v7.26 onward (#5871) | Same    | Same    | Behaviour stable since the feature shipped 2023-02.                           |
| Single-package `--parallel` works (no "No projects matched" error)                                   | From mid-2023 (#6785)     | Same    | Same    | Stable since 2023-07.                                                         |
| `--aggregate-output` + regex selector (same-package case)                                            | From early 2024 (#7557)   | Same    | Same    | Stable since 2024-01.                                                         |
| `--no-bail` aggregates failures via `throwOnCommandFail`                                             | Same                      | Same    | Same    | Code shape unchanged.                                                         |
| `--stream` forces `stdio='pipe'`                                                                     | Same                      | Same    | Same    | `runRecursive.ts:65-72` logic predates v9.                                    |
| Default concurrency (`min(4, cores)`)                                                                | Same                      | Same    | Same    | `MaxDefaultWorkspaceConcurrency = 4` is a long-standing constant.             |
| `--sequential` shorthand                                                                             | Present                   | Present | Present | Predates v11; just under-documented (#9578).                                  |

**Net**: every load-bearing behaviour of `--parallel` that the project relies on has been stable for at least two majors. The "reverify on major bump" tripwire the project's doc proposes is good hygiene but the evidence is that nothing has shifted yet.

---

## Suggested doc tightening

Concrete changes (each a separate user-initiated action; this dossier does not apply them). Items 1 and 3 have since been applied to `parallel-script-execution.md` — they are kept here for the audit trail, marked **Applied**:

1. **[Applied] Refute the "sequentially in name order" claim.** Replace the line "By itself, this runs the matched scripts sequentially in name order" with a statement that the default cap is `min(4, cores)` and that strict one-at-a-time requires `--sequential`. Cite `concurrency.ts:getWorkspaceConcurrency` or just the docs `pnpm run --help` output.
2. **Soften the "undocumented; treat as best-effort" hedge** for single-package `--parallel`. The behaviour is upstream-intentional since PR #6785 (2023-07). The legitimate caveat is the same as the workspace caveat: do not use `--parallel` when ordering matters. The "best-effort" wording overstates risk.
3. **[Applied] Drop or substantiate the "Cleaner script output" v11 claim.** I could not find a CHANGELOG entry that supports it. Either cite a commit or remove the sentence — it reads like undocumented folklore.
4. **Add a one-liner about `--no-bail` semantics** so readers understand they aggregate rather than fail-fast — useful when running multiple checks in parallel and wanting to see all failures.
5. **Mention `--sequential` explicitly** in the "Two reasons to skip `--parallel`" section under "Order matters". The current doc says "use `--workspace-concurrency`" but that's monorepo-only; in single-package, `--sequential` is the right escape hatch.
6. **Add `--reporter-hide-prefix`** to the output-handling section. Useful in CI (GitHub Actions annotations) and currently absent from the doc.
7. **Document the regex-flag rejection.** `pnpm run "/build:.*/i"` throws `UNSUPPORTED_SCRIPT_COMMAND_FORMAT` — worth a sentence.

---

## Sources cited

### pnpm source code at `v11.5.0`

- `exec/commands/src/run.ts` — <https://github.com/pnpm/pnpm/blob/v11.5.0/exec/commands/src/run.ts>
- `exec/commands/src/runRecursive.ts` — <https://github.com/pnpm/pnpm/blob/v11.5.0/exec/commands/src/runRecursive.ts>
- `exec/commands/src/regexpCommand.ts` — <https://github.com/pnpm/pnpm/blob/v11.5.0/exec/commands/src/regexpCommand.ts>
- `config/reader/src/concurrency.ts` — <https://github.com/pnpm/pnpm/blob/v11.5.0/config/reader/src/concurrency.ts>
- `cli/default-reporter/src/index.ts` — <https://github.com/pnpm/pnpm/blob/v11.5.0/cli/default-reporter/src/index.ts>
- `cli/parse-cli-args/src/index.ts` — <https://github.com/pnpm/pnpm/blob/v11.5.0/cli/parse-cli-args/src/index.ts>
- `pnpm/src/parseCliArgs.ts` — <https://github.com/pnpm/pnpm/blob/v11.5.0/pnpm/src/parseCliArgs.ts>
- `pnpm/src/shorthands.ts` — <https://github.com/pnpm/pnpm/blob/v11.5.0/pnpm/src/shorthands.ts>
- `pnpm/src/cmd/index.ts` — <https://github.com/pnpm/pnpm/blob/v11.5.0/pnpm/src/cmd/index.ts>
- `exec/commands/CHANGELOG.md` — <https://github.com/pnpm/pnpm/blob/v11.5.0/exec/commands/CHANGELOG.md>
- `pnpm/CHANGELOG.md` — <https://github.com/pnpm/pnpm/blob/v11.5.0/pnpm/CHANGELOG.md>

### pnpm GitHub issues / PRs (accessed 2026-05-30)

- PR #5871 — Regex script selector — <https://github.com/pnpm/pnpm/pull/5871> (merged 2023-02-02)
- Issue #6692 — `--parallel` without monorepo — <https://github.com/pnpm/pnpm/issues/6692> (filed 2023-06-20)
- PR #6785 — Fix `--parallel` for single-package — <https://github.com/pnpm/pnpm/pull/6785> (merged 2023-07-09)
- Issue #7556 — `--aggregate-output` doesn't work with regex — <https://github.com/pnpm/pnpm/issues/7556>
- PR #7557 — Fix `--aggregate-output` with regex — <https://github.com/pnpm/pnpm/pull/7557> (merged 2024-01-25)
- Issue #9578 — Document `--sequential` flag — <https://github.com/pnpm/pnpm/issues/9578> (filed 2025-05-28)

### pnpm.io documentation (accessed 2026-05-30)

- `pnpm run` reference — <https://pnpm.io/cli/run>

### Project artefacts read

- `package.json` — script declarations
- `pnpm-workspace.yaml` — pnpm v11 single-package config
- `docs/pnpm/parallel-script-execution.md` — the doc under review
- `.claude/skills/pnpm/references/core-workspaces.md`, `.claude/skills/pnpm/references/best-practices-performance.md` — upstream skill references (informational only)
