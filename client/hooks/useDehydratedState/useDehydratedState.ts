import type { DehydratedState } from "@tanstack/react-query";

import { QueriesHelper } from "@client/helpers/queries.helper";
import { useMatchesContext } from "@client/providers/MatchesProvider";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

const useDehydratedState = (): DehydratedState => {
  const matches = useMatchesContext();

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
    { queries: [], mutations: [] },
  );

  return combinedDehydratedState;
};

export { useDehydratedState };
