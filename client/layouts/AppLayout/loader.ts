import type { DehydratedState } from "@tanstack/react-query";
import { data } from "react-router";

import { iconifyIconLoader } from "@client/components/IconifyIcon";

const loader = async (): Promise<
  ReturnType<
    typeof data<{
      dehydratedState: DehydratedState;
    }>
  >
> => {
  const { iconifyIconDehydratedState } = await iconifyIconLoader();

  return data({ dehydratedState: iconifyIconDehydratedState });
};

export { loader };
