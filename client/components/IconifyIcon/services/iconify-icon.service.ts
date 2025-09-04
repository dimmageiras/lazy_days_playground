import { loadIcon } from "iconify-icon";

import type {
  IconifyIconData,
  IconifyIconName,
} from "@client/components/IconifyIcon/types/iconify-icon.type";

const getIconifyIconData = async <TIconifyIconName extends IconifyIconName>(
  iconName: TIconifyIconName
): Promise<IconifyIconData<TIconifyIconName>> => {
  const iconData = await loadIcon(iconName);

  if (!iconData) {
    throw new Error(`Failed to load icon: ${iconName}`);
  }

  return {
    iconData,
    iconName,
  };
};

export const IconifyIconService = {
  getIconifyIconData,
};
