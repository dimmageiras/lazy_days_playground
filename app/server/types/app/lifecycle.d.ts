import type { Bus } from "@server/modules/lifecycle";

interface LifecycleBusRegistryEntry {
  readonly bus: Bus<Record<string, unknown>>;
  readonly controllers: Map<string, AbortController>;
}

export type { LifecycleBusRegistryEntry };
