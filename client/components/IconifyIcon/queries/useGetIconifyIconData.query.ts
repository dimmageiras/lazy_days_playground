import { useQuery } from "@tanstack/react-query";

import { IconifyIconQueriesHelper } from "@client/components/IconifyIcon/helpers/iconify-icon-queries.helper";
import type {
  IconifyIconName,
  IconifyIconQueryResult,
} from "@client/components/IconifyIcon/types/iconify-icon.type";

const useGetIconifyIconData = <TIconifyIconName extends IconifyIconName>(
  iconName: TIconifyIconName
): IconifyIconQueryResult<TIconifyIconName> => {
  const { getIconifyIconQueryOptions } = IconifyIconQueriesHelper;

  return useQuery(getIconifyIconQueryOptions(iconName));
};

export { useGetIconifyIconData };
