# 0013. Client state lanes (forward-looking)

- **Status:** Proposed
- **Date:** 2026-06-14

## Context

The project has no client tier yet — no React, no state library, no component code is installed. State management is therefore a green field, and a green field is the cheapest moment to fix a state strategy and the most expensive moment to leave one implicit.

Two failure modes are worth pre-empting. State that is really a cache of remote data gets stuffed into a client store and slowly reinvents fetching, caching, and invalidation by hand. And a single shared store accumulates everything until per-request or per-route data leaks between contexts that should have been isolated.

We want "where does this piece of state live, and how do I reach it?" to be mechanical — derivable from two questions (where does the value come from, and how long does it live?) rather than from taste — before the first store is ever written.

## Decision

Client-tier state is governed by one doctrine with three facets, fixed up front. The libraries it names are not yet dependencies; the rules constrain the shape of client code the moment it is introduced, and the decision flips to in-force when that code lands.

**Lanes are assigned by source.** A value's origin — not its convenience — decides its tool. Server state (anything fetched from an API, a database, or any external system) lives in the server-cache library; it is a cache of something the client does not own. Client state (UI flags, local form state, ephemeral selections, session, theme) lives in the client store. The lanes never cross: server state never goes in the client store, and client-only state never goes in the server-cache library.

**The client store is reached only through the wrapper.** The project does not call the underlying state library directly. All stores are created through the project's wrapper, which layers tracked-store ergonomics — proxy-based auto-tracking — over the base library. Concretely: store creation through the wrapper's creator (state plus an option-bag of middleware) rather than the base library's; typing through the wrapper's state-API type rather than the base state-creator type; and slices composed through the wrapper's chainable action and selector extension methods. Because the wrapper's tracked hooks track accessed keys automatically, hand-written shallow-equality selectors are unnecessary, and that base-library guidance is deliberately not carried over.

**Store shape is partitioned by lifetime.** Within the client lane, state is split by how long it lives — both shapes are canonical glossary terms. A **module-level singleton** is genuinely global to the running process (UI flags, app-wide selections, session, theme); it is declared once at module scope and consumed by importing the store directly, with no provider plumbing. A **scoped store** is per-request, per-tenant, or per-route; it is built through a factory plus React context plus provider and consumed through a fixed four-hook access set that hides the context, the out-of-provider guard, and the library's hook signatures from the component. Those four hooks are the only sanctioned way a component touches a scoped store.

One operational rule rides on top of both shapes: production builds gate the devtools middleware behind a build-time flag so the listener never ships.

## Alternatives considered

- **One store for everything (no lane split).** Put both remote data and UI state in a single client store. Rejected: it forces the team to hand-build caching, deduplication, and invalidation that the server-cache library already provides, and it blurs the source boundary the two-question test is meant to make mechanical.

- **Call the base state library directly (no wrapper).** Skip the wrapper and use the underlying library's creator and selector API. Rejected: it loses the proxy-based tracked-store ergonomics and reintroduces the hand-written shallow-equality selector discipline the wrapper removes; it also leaves every store free to diverge in how it is created, typed, and consumed.

- **Always-scoped stores (context everywhere).** Build every store through a factory plus context, even process-global ones. Rejected: genuinely global state would pay provider-plumbing and hook-indirection cost for no isolation benefit — there is nothing per-request to isolate. The singleton-versus-scoped partition exists so each store pays only the cost its lifetime warrants.

- **Defer the decision until client code exists.** Wait for the first component before choosing a strategy. Rejected: deferring guarantees that divergent ad-hoc patterns appear first and have to be unwound; the cheapest moment to fix a state strategy is before any store exists.

## Consequences

**Positive.**

- "Where does this state go?" becomes a two-question lookup — source, then lifetime — rather than a judgement call, which is equally legible to a new contributor and to an agent.
- The wrapper is a single seam: tracked-store behaviour, typing conventions, and the option-bag middleware contract are enforced in one place, and a future change to the underlying library is absorbed there.
- Per-request, per-tenant, and per-route data is structurally isolated by the scoped-store shape, removing a class of cross-context leakage by construction rather than by review.
- The rule is enforceable from the first line of client code, so no divergent state patterns accrue before the convention exists.

**Accepted negative.**

- The doctrine is committed before any named library is installed, so it cannot be validated against running code until the client tier lands; if the chosen libraries prove unfit, this ADR is superseded rather than silently dropped.
- The wrapper-only rule rules out reaching for base-library idioms and third-party examples verbatim — contributors must translate them through the wrapper's surface, which is a learning cost.
- The four-hook access set and factory-plus-context scaffolding are boilerplate that every scoped store repeats, traded for the isolation and the hidden-plumbing guarantee.

## Related

- [`./0003-path-alias-scheme.md`](./0003-path-alias-scheme.md) — the path-alias scheme and the shared/server split it enforces; this ADR is the forward-looking client-tier doctrine for the client lane that split does not yet carry.
- [`./0007-library-wrapper-seam.md`](./0007-library-wrapper-seam.md) — the wrapper-only indirection convention this ADR applies to the client-state libraries, which are reached through the project's wrapper rather than imported directly.
- [`../../.claude/rules/state-management.md`](../../.claude/rules/state-management.md) — the rule that enforces and elaborates the lane assignment, the wrapper-only conventions, and the singleton-versus-scoped access patterns in full.
- [`../../CONTEXT.md`](../../CONTEXT.md) — canonical definitions of **Module-level singleton** and **Scoped store**.
