import { Icon } from "@iconify/react";
import type { ComponentProps, JSX } from "react";

import type { IconifyIcon } from "@client/components/IconifyIcon";
import { useGetIconifyIconData } from "@client/components/IconifyIcon/queries/useGetIconifyIconData.query";
import type { IconifyIconName } from "@client/components/IconifyIcon/types/iconify-icon.type";

interface ServerIconProps extends Omit<
  Extract<ComponentProps<typeof IconifyIcon>, { ssr: true }>,
  "icon"
> {
  icon: IconifyIconName;
}

const ServerIcon = ({
  icon,
  ...props
}: ServerIconProps): JSX.Element | null => {
  const iconQuery = useGetIconifyIconData(icon);

  const iconData = iconQuery.data?.iconData;

  if (!iconData) {
    return null;
  }

  return <Icon icon={iconData} {...props} />;
};

export { ServerIcon };
