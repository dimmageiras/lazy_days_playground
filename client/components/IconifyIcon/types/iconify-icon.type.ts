import type { UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { IconifyIcon } from "iconify-icon";

import type {
  ICONIFY_ICON_QUERY_KEY,
  ICONIFY_ICONS,
} from "@client/components/IconifyIcon/constants/iconify-icon.constant";

type IconifyIconName = (typeof ICONIFY_ICONS)[keyof typeof ICONIFY_ICONS];

interface IconifyIconData<TIconifyIconName extends IconifyIconName> {
  iconData: Required<IconifyIcon>;
  iconName: TIconifyIconName;
}

type IconifyIconQueryResult<TIconifyIconName extends IconifyIconName> =
  UseQueryResult<
    {
      iconData: Required<IconifyIcon>;
      iconName: TIconifyIconName;
    },
    Error
  >;

type IconifyIconQueryOptions<TIconifyIconName extends IconifyIconName> =
  UseQueryOptions<
    IconifyIconData<TIconifyIconName>,
    Error,
    IconifyIconData<TIconifyIconName>,
    [typeof ICONIFY_ICON_QUERY_KEY, TIconifyIconName]
  >;

export type {
  IconifyIconData,
  IconifyIconName,
  IconifyIconQueryOptions,
  IconifyIconQueryResult,
};
