import type { HtmlTags } from "html-tags";

import "html-tags";

declare module "html-tags" {
  export type CustomHtmlTags = Exclude<HtmlTags, "math"> | "iconify-icon";
}
