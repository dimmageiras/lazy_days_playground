import { queryOptions } from "@tanstack/react-query";

import { ICONIFY_ICON_QUERY_KEY } from "@client/components/IconifyIcon/constants/iconify-icon.constant";
import { IconifyIconService } from "@client/components/IconifyIcon/services/iconify-icon.service";
import type {
  IconifyIconName,
  IconifyIconQueryOptions,
} from "@client/components/IconifyIcon/types/iconify-icon.type";

const getIconifyIconQueryOptions = <TIconifyIconName extends IconifyIconName>(
  iconName: TIconifyIconName
): IconifyIconQueryOptions<TIconifyIconName> => {
  const { getIconifyIconData: getIconData } = IconifyIconService;

  return queryOptions({
    queryKey: [ICONIFY_ICON_QUERY_KEY, iconName],
    queryFn: () => getIconData(iconName),
  });
};

const IconifyIconQueriesHelper = {
  getIconifyIconQueryOptions,
};

export { IconifyIconQueriesHelper };
