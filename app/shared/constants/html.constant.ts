import { Map } from "immutable";

const HTML_ESCAPE_CHARS = Map([
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&#39;"],
] as const);

const HTML_ESCAPE_REPLACE_REGEX = /[&<>"']/g;

export { HTML_ESCAPE_CHARS, HTML_ESCAPE_REPLACE_REGEX };
