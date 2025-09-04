import type {
  AnyUseQueryOptions,
  DehydratedState,
} from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

import { ArrayUtilsHelper } from "./array-utils.helper";
import { ObjectUtilsHelper } from "./object-utils.helper";

const createQueryClientForServer = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 2 * 1000,
      },
    },
  });
};

const fetchServerData = async <TQueryOptions extends AnyUseQueryOptions>(
  queryOptionsList: TQueryOptions[]
): Promise<QueryClient> => {
  const queryClient = createQueryClientForServer();

  await Promise.all(
    queryOptionsList.map((queryOptions) =>
      queryClient.ensureQueryData(queryOptions)
    )
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
