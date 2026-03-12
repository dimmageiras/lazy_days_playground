import type { HTTP_STATUS } from "@server/constants/http-status.constant";

import "react-router";

declare module "react-router" {
  interface SingleFetchRedirect {
    readonly redirect: string;
    readonly status: (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
    readonly revalidate: boolean;
    readonly reload: boolean;
    readonly replace: boolean;
  }
}

export {};
