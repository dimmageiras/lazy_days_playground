import type { JSX } from "react";

import { DynamicElement } from "~/components/DynamicElement";

type IconifyIconProps = JSX.IntrinsicElements["iconify-icon"];

const IconifyIcon = ({ icon, ...props }: IconifyIconProps): JSX.Element => {
  return <DynamicElement icon={icon} as="iconify-icon" {...props} />;
};

export { IconifyIcon };
