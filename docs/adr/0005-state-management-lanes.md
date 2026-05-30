# 0005. State-management lanes — server state vs client state

- **Status:** Proposed
- **Date:** 2026-05-26

## Context

A React application typically manages two structurally different kinds of state: state that mirrors something owned by an external system (API responses, database rows, third-party data) and state that exists only in the browser session (UI flags, ephemeral selections, form drafts, theme). Each kind has different cache-correctness needs, different freshness expectations, different reactivity patterns, and different debugging affordances. A single store that holds both collapses those needs into one set of trade-offs and historically produces either an over-engineered cache or an under-engineered ad-hoc fetcher, depending on which kind dominates the first feature.

The library choices for each kind are mature: TanStack Query is the conventional answer for server state (query keys, stale-time, cache invalidation, mutation lifecycle), and Zustand is the conventional answer for ergonomic local stores. The decision that matters most is not which library to pick on either side, it is the **boundary** — what is permitted in each lane and what is forbidden — and the consequence of treating that boundary as a binding rule rather than a soft preference.

The project's state-management rule fixes this boundary as a binding convention. Any state a module introduces is placed by the lane its origin dictates, rather than choosing a container after the fact.

## Decision

The project splits application state across **two lanes with non-overlapping responsibilities**:

- **Server state** — anything fetched from an API, a database, or any external system — flows through **TanStack Query**.
- **Client state** — UI flags, local form state, ephemeral selections, session, theme — flows through **Zustand**, accessed via the `zustand-x` wrapper.

The lanes bind any state placed in either container. **The lane split is the decision.** The server-state library may be replaced by an equivalent on its own side without invalidating this ADR. Replacing the client-state library would also invalidate the wrapper conventions the project rule layers on top of it; that swap requires a follow-up ADR covering the wrapper / API conventions. Mixing the responsibilities (server state in the client store, ephemeral UI flags in the server cache) is what this ADR forbids on either side.

## Alternatives considered

### One store for everything

A single state container (Zustand, Redux Toolkit, MobX, etc.) holds both API-derived data and ephemeral UI state. Rejected because the cache-correctness machinery server state needs (deduplication, stale-while-revalidate, refetch-on-focus, invalidation across mutations) either has to be rebuilt inside the store or skipped; either outcome costs more than picking a library that does it as its core competency.

### TanStack Query only

Use the server-state library for everything, modelling UI flags as zero-network queries. Rejected because client-only state has no server identity to key on, no stale time to honour, and no refetch lifecycle to integrate with — every ergonomic affordance the server-state library exists for is wasted, and a hand-rolled set of "fake queries" is worse than a small dedicated store.

### React Context plus `useReducer` for client state

Skip the dedicated client-state library entirely and lean on React's built-in primitives. Rejected on render-perf and ergonomics grounds: context updates trigger re-renders for every consumer that reads any field, even when only one field changed, and the resulting performance discipline (memoising selectors, splitting context providers per slice) ends up reinventing a less-typed version of the dedicated library. The dedicated library also provides cross-component subscription, devtools, and middleware (persist, immer) the context approach has to grow into.

### URL search params as the canonical client-state store

Keep ephemeral UI state in the URL and re-derive from there. Rejected as a global default: URL state is the right answer for shareable, navigable state (active tab in a page, filter criteria on a list) but is a poor fit for transient flags, form drafts, and anything the user expects to survive a within-session navigation. The lane rule does not forbid URL state for the right kind of UI state — it forbids putting _server_ state in the client store, not picking a different client-state mechanism per case.

## Consequences

- **The lane is determined by the state's origin, not its shape.** A piece of data that comes from a server response is server state even if it is currently displayed as a single boolean. A piece of data that exists only because the user opened a dropdown is client state even if it happens to look like a row.
- **Server state never appears in the client store.** Caching, refetching, invalidating, and reconciling server data are the server-state lane's responsibility; the client store does not duplicate them, does not "hydrate from the server response", and does not implement its own stale-time.
- **Client state never appears in the server cache.** Ephemeral flags, draft inputs, and UI selections do not get a query key; they live in the client store (or in component state when they don't need cross-component reach).
- **The wrapper conventions for the client store are normative.** The project does not call the underlying Zustand API directly; the wrapper's `createStore` + option-bag middleware + tracked-store hooks are the surface, with module-level singletons for app-wide state and a Context-plus-factory pattern for scoped stores. The current project rule for state management spells the conventions out in full; this ADR records the decision the rule rests on.
- **Rejecting the lane split in a single feature is an ADR-level change.** A PR that proposes "this one slice can live in both lanes" is proposing a different architecture; it is not a per-feature exception to grant.

## Related

- [`../../.claude/rules/state-management.md`](../../.claude/rules/state-management.md) — the canonical statement of the lane split and the wrapper conventions; this ADR records the decision that rule rests on.
- [ADR-0001](./0001-vite-multi-target-config.md) — the multi-target build layout the state-management surface sits on.
