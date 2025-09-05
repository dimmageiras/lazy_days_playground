import { queryOptions } from "@tanstack/react-query";

import { ICONIFY_ICON_QUERY_KEY } from "@client/components/IconifyIcon/constants/iconify-icon.constant";
import { IconifyIconService } from "@client/components/IconifyIcon/services/iconify-icon.service";
import type {
  IconifyIconName,
  IconifyIconQueryOptions,
} from "@client/components/IconifyIcon/types/iconify-icon.type";

interface GetIconifyIconQueryOptionsParams<
  TIconifyIconName extends IconifyIconName
> {
  iconName: TIconifyIconName;
  /** When true, caches the icon indefinitely in the browser */
  isClientFetch?: boolean;
}

/**
 * Creates React Query options for fetching Iconify icon data.
 *
 * @param params - Configuration object
 * @param params.iconName - The name of the icon to fetch
 * @param params.isClientFetch - When true, enables indefinite browser caching
 * @returns Query options configured for the specified icon
 */
const getIconifyIconQueryOptions = <TIconifyIconName extends IconifyIconName>({
  iconName,
  isClientFetch,
}: GetIconifyIconQueryOptionsParams<TIconifyIconName>): IconifyIconQueryOptions<TIconifyIconName> => {
  const { getIconifyIconData: getIconData } = IconifyIconService;

  return queryOptions({
    queryKey: [ICONIFY_ICON_QUERY_KEY, iconName],
    queryFn: () => getIconData(iconName),
    ...(isClientFetch && {
      staleTime: Infinity,
      gcTime: Infinity,
    }),
  });
};

const IconifyIconQueriesHelper = {
  getIconifyIconQueryOptions,
};

export { IconifyIconQueriesHelper };
