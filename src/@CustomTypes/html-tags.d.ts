import "html-tags";

declare module "html-tags" {
  export type HtmlTags = Exclude<HtmlTags, "math"> | "iconify-icon";
}
