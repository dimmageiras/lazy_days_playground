import type { WrapperTagElement } from "~/types/html-tags.type";

const rootLoader = async (): Promise<{ htmlTags: WrapperTagElement[] }> => {
  const htmlTags = (await import("html-tags")).default;
  const validTags = (["iconify-icon", ...htmlTags] as const).filter(
    (tag) => tag !== "math"
  );

  return {
    htmlTags: validTags,
  };
};

export { rootLoader };
