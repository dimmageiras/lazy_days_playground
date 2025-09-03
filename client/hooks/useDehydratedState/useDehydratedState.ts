import type { DehydratedState } from "@tanstack/react-query";
import { useMatches } from "react-router";

import { ObjectUtilsHelper } from "@client/helpers/object-utils.helper";
import { QueriesHelper } from "@client/helpers/queries.helper";

const useDehydratedState = (): DehydratedState => {
  const matches = useMatches();

  const { isDehydratedState } = QueriesHelper;
  const { isObject } = ObjectUtilsHelper;

  const dehydratedStates = matches
    .map(({ loaderData }) =>
      isObject(loaderData) &&
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
