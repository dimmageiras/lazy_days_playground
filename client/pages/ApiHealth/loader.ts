import type { DehydratedState } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/react-query";
import { data } from "react-router";

import { QueriesHelper } from "@client/helpers/queries.helper";
import { ApiHealthQueriesHelper } from "@client/services/api-health/queries/helpers/api-health-queries.helper";

const loader = async (): Promise<
  ReturnType<
    typeof data<{
      dehydratedState: DehydratedState;
    }>
  >
> => {
  const { getDatabaseHealthQueryOptions, getServerHealthQueryOptions } =
    ApiHealthQueriesHelper;
  const { fetchServerData } = QueriesHelper;

  const queryClient = await fetchServerData([
    getDatabaseHealthQueryOptions(),
    getServerHealthQueryOptions(),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return data({ dehydratedState });
};

export { loader };
