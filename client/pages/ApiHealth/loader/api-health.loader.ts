import type { DehydratedState } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/react-query";
import { data } from "react-router";

import { QueriesHelper } from "@client/helpers/queries.helper";
import {
  getDatabaseHealthQueryOptions,
  getServerHealthQueryOptions,
} from "@client/services/api-health";

const apiHealthLoader = async (): Promise<
  ReturnType<
    typeof data<{
      dehydratedState: DehydratedState;
    }>
  >
> => {
  const { fetchServerData } = QueriesHelper;

  const queryClient = await fetchServerData([
    getDatabaseHealthQueryOptions(),
    getServerHealthQueryOptions(),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return data({ dehydratedState });
};

export { apiHealthLoader };
