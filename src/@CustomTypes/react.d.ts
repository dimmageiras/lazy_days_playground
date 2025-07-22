import type { IconifyIconAttributes } from "iconify-icon";

import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      readonly "iconify-icon": IconifyIconAttributes & {
        className?: string;
      };
    }
  }
}

export {};
