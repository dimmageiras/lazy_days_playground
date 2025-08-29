import type { IconifyIconProperties } from "iconify-icon";

import "@types/react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      readonly "iconify-icon": IconifyIconProperties &
        HTMLAttributes<HTMLElement> &
        RefAttributes<HTMLElement>;
    }
  }
}

export {};
