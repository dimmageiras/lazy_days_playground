const HTML_ESCAPE_CHARS = new Map([
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&#39;"],
] as const);

const HTML_CHARS_PATTERN = /[&<>"']/g;

export { HTML_ESCAPE_CHARS, HTML_CHARS_PATTERN };
