import type { JSX } from "react";

import { WrapperElement } from "~/components/WrapperElement";

type IconifyIconProps = JSX.IntrinsicElements["iconify-icon"];

const IconifyIcon = ({ icon, ...props }: IconifyIconProps): JSX.Element => {
  return <WrapperElement icon={icon} as="iconify-icon" {...props} />;
};

export { IconifyIcon };
