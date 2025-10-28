import type { Route } from "@rr/types/client/+types/root";
import type { DehydratedState } from "@tanstack/react-query";

import { QueriesHelper } from "@client/helpers/queries.helper";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

const useDehydratedState = (
  matches: Route.ComponentProps["matches"]
): DehydratedState => {
  const { isDehydratedState } = QueriesHelper;
  const { isPlainObject } = ObjectUtilsHelper;

  const dehydratedStates = matches
    .map((match) => {
      const { loaderData } = match || { loaderData: undefined };

      return isPlainObject(loaderData) &&
        "dehydratedState" in loaderData &&
        isDehydratedState(loaderData.dehydratedState)
        ? loaderData.dehydratedState
        : null;
    })
    .filter((state) => state !== null);

  const combinedDehydratedState = dehydratedStates.reduce(
    (combined, current) => ({
      queries: [...combined.queries, ...current.queries],
      mutations: [...combined.mutations, ...current.mutations],
    }),
    { queries: [], mutations: [] }
  );

  return combinedDehydratedState;
};

export { useDehydratedState };
