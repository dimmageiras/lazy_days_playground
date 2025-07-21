import type { IconifyIconProperties } from "iconify-icon";

import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": IconifyIconProperties & {
        className?: string;
      };
    }
  }
}

export {};
