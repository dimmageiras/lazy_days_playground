import type { WrapperTagElement } from "~/types/html-tags.type";

const getHtmlTags = async (): Promise<WrapperTagElement[]> => {
  const htmlTags = (await import("html-tags")).default;
  const validTags = (["iconify-icon", ...htmlTags] as const).filter(
    (tag) => tag !== "math"
  );

  return validTags;
};

export const RootLoaderHelper = {
  getHtmlTags,
};
