# Code Review Findings: Project Configuration

## Summary

- Total findings: 9
- Blockers: 0
- Warnings: 4
- Nits: 3
- Info: 2

Overall verdict: The configuration surface is small, internally coherent, and avoids most of the common landmines: `module: "preserve"` correctly pairs with `moduleResolution: "bundler"`, `vite.config.ts` only imports a type (so pnpm strict resolution holds), the `@shared/*` alias is declared in exactly one source of truth, and the `dev` script invokes a real runtime that starts Fastify (top-level await included). The most consequential issues are supply-chain related — `minimumReleaseAge: 0` is set without documentation, `pnpm-workspace.yaml` carries no build-script allowlist, and there is no committed `typecheck` script even though TypeScript is installed. The lockfile is clean, no exotic specifiers, and dependency hygiene is sound.

## Findings

### [warning] `minimumReleaseAge: 0` overrides the safe default with no rationale

**File:** `pnpm-workspace.yaml:1`
**Skill / criterion:** `pnpm` — pnpm v11 settings live in `pnpm-workspace.yaml`; supply-chain overrides warrant explanation

pnpm v11 ships `minimumReleaseAge: 1440` (24 h) as the default to mitigate left-pad / chalk-style 0-day supply-chain attacks. Setting it to `0` opts the project out of that protection for every install — including CI and contributors. The value is intentional but the file has no comment, no ADR, and no README pointer explaining the trade-off, so the next person to touch this config can't tell whether the `0` is a deliberate dev-only decision or an artefact someone pasted in.

**Suggested fix:**

```yaml
# Accept 0-day packages — this is a learning playground with no production
# deploy. Revisit before any external release.
minimumReleaseAge: 0
```

(or record the decision as an ADR under `docs/adr/` and reference it here)

---

### [warning] No `allowBuilds` / build-script allowlist declared

**File:** `pnpm-workspace.yaml` (whole file)
**Skill / criterion:** `pnpm` — build-script allowlist is explicit; packages with native build scripts are listed, nothing else can run install scripts

pnpm v11 expects an explicit `allowBuilds` list. Today's deps (`fastify`, `close-with-grace`, `vite`, `vite-node`, `typescript`, `@types/node`) carry no native build steps, so the install is currently safe by accident. The moment a future dep ships an `install` / `postinstall` script, pnpm will refuse to run it and emit a warning, prompting a contributor to add the package without scrutiny. Setting an empty allowlist now makes the intent explicit and turns silent migrations into deliberate decisions.

**Suggested fix:**

```yaml
minimumReleaseAge: 0

# No package is permitted to run install/postinstall scripts. Add entries
# here only after auditing the build script.
allowBuilds: []
```

---

### [warning] No `typecheck` script even though TypeScript is a dev dependency

**File:** `package.json:5-7`
**Skill / criterion:** Review focus — Scripts: lint/typecheck/test scripts reference the right configs; `code-review-and-quality` — verifiability

`typescript@6.0.3` is installed, `tsc` is on the path (`node_modules/.bin/tsc`), and `noEmit: true` means the compiler is intended for type-checking only — yet there is no script that runs it. As a result the type system is only exercised inside the IDE; CI and pre-commit hooks have no way to fail on a type regression without contributors guessing the right invocation. With `vite-node` doing all the runtime stripping, an undetected type error can ship to `dev` and never surface until a future build step is added.

**Suggested fix:**

```json
"scripts": {
  "dev": "vite-node ./app/server/server.ts",
  "typecheck": "tsc --noEmit"
}
```

---

### [warning] `isolatedModules` is not enabled despite a type-stripping runtime

**File:** `tsconfig.json:2-25`
**Skill / criterion:** `node` — type-stripping interaction with Vite; `code-review-and-quality` — correctness

`vite-node` (and Vite itself) strip types per file using esbuild, with no cross-file type information. Several constructs that `tsc --noEmit` accepts are unsafe under per-file transpilation: re-exporting a type that resolves to a value without `export type`, const enum usage, and namespace value/type ambiguity. `isolatedModules: true` makes `tsc` reject exactly the patterns the transpiler can't handle, closing the gap between what the IDE compiles and what the runtime executes. Today the project is small enough that nothing has tripped on it, but the failure mode is "code that type-checks but crashes at boot", which is the worst category of drift.

**Suggested fix:**

```json
"compilerOptions": {
  "module": "preserve",
  "moduleResolution": "bundler",
  "isolatedModules": true,
  // ...
}
```

---

### [nit] `lib` mixes a coarse target with selective ESNext.* slices

**File:** `tsconfig.json:3-10`
**Skill / criterion:** Review focus — Library list (`lib`) matches the runtime target

`lib: ["es2024", "ESNext.Array", "ESNext.Collection", "ESNext.Error", "ESNext.Iterator", "ESNext.Promise"]` couples an ES2024 baseline to five hand-picked stage-3/4 proposals. The selection is precise but fragile: every time TypeScript promotes one of those slices into the next yearly bundle the entry becomes redundant, and any new proposal the project wants to adopt has to be added one by one. With `target: es2024` and a Node 24 runtime, the simpler `lib: ["esnext"]` is equivalent in practice — Node 24 already implements every proposal in the list — and it eliminates the maintenance ritual.

**Suggested fix:**

```json
"lib": ["esnext"],
```

(or, if the narrow surface is deliberate, add a comment in `tsconfig.json` explaining why the slices are pinned)

---

### [nit] `@shared/*` alias has no `baseUrl`, which is fine, but the path has a leading `./` that is conventionally omitted

**File:** `tsconfig.json:20-22`
**Skill / criterion:** Review focus — paths

With `moduleResolution: "bundler"`, `baseUrl` is no longer required and `paths` resolve relative to the tsconfig file. The current shape works, but `["./app/shared/*"]` is conventionally written `["app/shared/*"]` since the leading `./` adds nothing and most generated paths in the TypeScript ecosystem omit it. Keeping the form consistent with the rest of the ecosystem avoids tooling that does naive string matching from tripping.

**Suggested fix:**

```json
"paths": {
  "@shared/*": ["app/shared/*"]
}
```

---

### [nit] `vite.config.ts` could be valid JSON via `vite.config.json` or `.mjs`, sidestepping the type import entirely

**File:** `vite.config.ts:1-7`
**Skill / criterion:** `vite` — the config does not `import` from `"vite"` unless `vite` is a direct dep

The file currently does `import type { UserConfig } from "vite"`. Because `vite` is in `devDependencies`, pnpm's strict node_modules layout exposes it as a direct dep and the import resolves — so this is safe today. The review plan calls out that the safer idiom is to avoid the import altogether (plain object export) so the config stays correct even if `vite` is later moved to a transitive position (e.g., via a meta-framework that bundles it). The trade-off is losing the inline type assertion; given the config has one property, the assertion adds little.

**Suggested fix:**

```ts
export default {
  resolve: {
    tsconfigPaths: true,
  },
};
```

(or keep the current form if the type assertion is preferred; the current form is **not** broken)

---

### [info] `typescript@6.0.3` and `vite@8.0.12` are major versions that did not exist in the public registry until recently — pin verification matters

**File:** `package.json:14-15`
**Skill / criterion:** `code-review-and-quality` — supply chain; lockfile review

Both versions resolve in the lockfile, so the tarballs exist and were fetched, but they are very recent majors (TS 6 and Vite 8). When new majors land the ecosystem hasn't yet built up battle-tested patterns: plugin compatibility, `@types/*` alignment, and runtime quirks (e.g., type-stripping behaviour) are still being shaken out. This isn't a defect — pinning the exact version (`6.0.3`, `8.0.12` with no `^`) is the right move during that window — but it's worth a periodic re-check that the rest of the ecosystem has caught up before relaxing the pin to `^`.

**Suggested fix:** No action required. Re-verify after the next minor release of each tool that the wider plugin/`@types/*` ecosystem is on the same major before loosening the pin.

---

### [info] Top-level await in `app/server/server.ts` relies on `module: "preserve"` and Node 24 — coherence is fine but document it

**File:** `tsconfig.json:11` (and dev runtime)
**Skill / criterion:** `node` — top-level await support

`server.ts` uses top-level `await` (`await app.register(...)`, `await claimPort()`). This compiles because `module: "preserve"` defers module emit to the bundler/runtime, which is ES2022+ TLA-capable. Engines pin Node 24+, which supports TLA natively. This is a coherent triangle (tsconfig + engines + runtime) — flagged only so future tsconfig changes know not to drop `module: "preserve"` for `"commonjs"` or a downlevel target without simultaneously refactoring the server entry to wrap TLA in an `async` IIFE.

**Suggested fix:** No action required. Consider noting the constraint in a CONTEXT or ADR if one is added for the runtime choice.

---

## Strengths observed

- The `@shared/*` alias is declared in one source of truth (`tsconfig.json`) and Vite picks it up via the built-in `resolve.tsconfigPaths: true` — no `vite-tsconfig-paths` plugin, no duplicate alias map, no drift surface.
- `vite.config.ts` is type-only against `"vite"` (no value import), so esbuild/strip-types erases it and pnpm strict mode never has to resolve `vite` from app code.
- Every direct dependency in `package.json` is imported from app code; no orphan runtime deps, no dev tools mistakenly placed in `dependencies`.
- `packageManager` is pinned to an exact pnpm version, `engines.node` matches the `@types/node` major, and the lockfile contains no `git+`, `file:`, or `link:` specifiers.

## Out of scope

- The recent commit that "updates import paths to remove file extensions and adjust module resolution" is the trigger for several of the tsconfig coherence observations above, but the import-site changes themselves belong to the server-composition / shared review areas.
- Whether `SHUTDOWN_TOKEN` should be sourced from an env file in production rather than from a constants module is a server-composition concern.
- The `.env.local.*` files are git-ignored but were not inspected; secret handling at runtime belongs to a separate review area.
- The presence of two `.env.local.*` files (`dev` and `prod`) without an `.env.example` is a documentation concern.
