import type {
  AnyUseQueryOptions,
  DehydratedState,
  UseMutationOptions,
} from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

import { TIMING } from "@shared/constants/timing.constant";
import { ArrayUtilsHelper } from "@shared/helpers/array-utils.helper";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

const { SECONDS_TWO_IN_MS } = TIMING;

const { isArray } = ArrayUtilsHelper;
const { hasObjectKey, isPlainObject } = ObjectUtilsHelper;

const createQueryClientForServer = (): QueryClient => {
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
  return (
    isPlainObject(value) &&
    hasObjectKey(value, "queries") &&
    isArray(value.queries) &&
    hasObjectKey(value, "mutations") &&
    isArray(value.mutations)
  );
};

const executeMutationOnServer = async <TData, TVariables>(
  mutationOptions: UseMutationOptions<TData, Error, TVariables>,
  variables: TVariables,
): Promise<{ data: TData; queryClient: QueryClient }> => {
  const queryClient = createQueryClientForServer();
  const mutation = queryClient
    .getMutationCache()
    .build(queryClient, mutationOptions);

  const data = await mutation.execute(variables);

  return { data, queryClient };
};

export const QueriesHelper = {
  executeMutationOnServer,
  fetchServerData,
  isDehydratedState,
};
