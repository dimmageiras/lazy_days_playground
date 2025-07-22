import type { WrapperTagElement } from "~/types/html-tags.type";

import { RootLoaderHelper } from "./root.loader.helper";

interface RootLoaderResponse {
  htmlTags: WrapperTagElement[];
}

const rootLoader = async (): Promise<RootLoaderResponse> => {
  const { getHtmlTags } = RootLoaderHelper;

  const htmlTags = await getHtmlTags();

  return {
    htmlTags,
  };
};

export { rootLoader };
