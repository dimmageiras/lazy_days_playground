import type { DehydratedState } from "@tanstack/react-query";
import { useMatches } from "react-router";

import { QueriesHelper } from "@client/helpers/queries.helper";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

const useDehydratedState = (): DehydratedState => {
  const matches = useMatches();

  const { isDehydratedState } = QueriesHelper;
  const { isPlainObject } = ObjectUtilsHelper;

  const dehydratedStates = matches
    .map(({ loaderData }) =>
      isPlainObject(loaderData) &&
      "dehydratedState" in loaderData &&
      isDehydratedState(loaderData.dehydratedState)
        ? loaderData.dehydratedState
        : null
    )
    .filter((state) => state !== null);

  return dehydratedStates.reduce(
    (combined, current) => ({
      queries: [...combined.queries, ...current.queries],
      mutations: [...combined.mutations, ...current.mutations],
    }),
    { queries: [], mutations: [] }
  );
};

export { useDehydratedState };
