import type { IconifyIconAttributes } from "iconify-icon";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      readonly "iconify-icon": IconifyIconAttributes &
        HTMLAttributes<HTMLElement> &
        RefAttributes<HTMLElement>;
    }
  }
}

export {};
