import type { HtmlTags } from "html-tags";

type WrapperTagElement = Exclude<HtmlTags, "math"> | "iconify-icon";

export type { WrapperTagElement };
