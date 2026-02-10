import type {
  AnyUseQueryOptions,
  DehydratedState,
} from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

import { TIMING } from "@shared/constants/timing.constant";
import { ArrayUtilsHelper } from "@shared/helpers/array-utils.helper";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

const createQueryClientForServer = (): QueryClient => {
  const { SECONDS_TWO_IN_MS } = TIMING;

  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: SECONDS_TWO_IN_MS,
      },
    },
  });
};

const fetchServerData = async <TQueryOptions extends AnyUseQueryOptions>(
  queryOptionsList: TQueryOptions[],
): Promise<QueryClient> => {
  const queryClient = createQueryClientForServer();

  await Promise.all(
    queryOptionsList.map((queryOptions) =>
      queryClient.ensureQueryData(queryOptions),
    ),
  );

  return queryClient;
};

const isDehydratedState = (value: unknown): value is DehydratedState => {
  const { isArray } = ArrayUtilsHelper;
  const { isPlainObject } = ObjectUtilsHelper;

  return (
    isPlainObject(value) &&
    "queries" in value &&
    "mutations" in value &&
    isArray(value.queries) &&
    isArray(value.mutations)
  );
};

export const QueriesHelper = {
  fetchServerData,
  isDehydratedState,
};
