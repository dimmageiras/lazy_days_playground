import { useQuery } from "@tanstack/react-query";

import { IconifyIconQueriesHelper } from "@client/components/IconifyIcon/helpers/iconify-icon-queries.helper";
import type {
  IconifyIconName,
  IconifyIconQueryResult,
} from "@client/components/IconifyIcon/types/iconify-icon.type";

/**
 * Custom hook to fetch and cache Iconify icon data.
 *
 * This hook always runs client-side and caches icons indefinitely in the browser
 * for optimal performance. Once an icon is loaded, it will persist until the
 * browser cache is cleared.
 *
 * @param iconName - The name of the icon to fetch
 * @returns Query result containing the icon data
 */
const useGetIconifyIconData = <TIconifyIconName extends IconifyIconName>(
  iconName: TIconifyIconName,
): IconifyIconQueryResult<TIconifyIconName> => {
  const { getIconifyIconQueryOptions } = IconifyIconQueriesHelper;

  return useQuery(
    getIconifyIconQueryOptions({ iconName, isClientFetch: true }),
  );
};

export { useGetIconifyIconData };
