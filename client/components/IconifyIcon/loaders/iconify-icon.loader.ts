import type { DehydratedState } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/react-query";

import { ICONIFY_ICONS } from "@client/components/IconifyIcon/constants/iconify-icon.constant";
import { IconifyIconQueriesHelper } from "@client/components/IconifyIcon/helpers/iconify-icon-queries.helper";
import { QueriesHelper } from "@client/helpers/queries.helper";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

const iconifyIconLoader = async (): Promise<{
  iconifyIconDehydratedState: DehydratedState;
}> => {
  const { getIconifyIconQueryOptions } = IconifyIconQueriesHelper;
  const { getObjectValues } = ObjectUtilsHelper;
  const { fetchServerData } = QueriesHelper;

  const iconNames = getObjectValues(ICONIFY_ICONS);

  const iconifyIconQueryOptionsList = iconNames.map((iconName) =>
    getIconifyIconQueryOptions({ iconName })
  );

  const queryClient = await fetchServerData(iconifyIconQueryOptionsList);

  const iconifyIconDehydratedState = dehydrate(queryClient);

  return { iconifyIconDehydratedState };
};

export { iconifyIconLoader };
