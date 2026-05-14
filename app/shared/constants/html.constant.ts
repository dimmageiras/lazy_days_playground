const HTML_ESCAPE_CHARS = Object.freeze(
  new Map([
    ["&", "&amp;"],
    ["<", "&lt;"],
    [">", "&gt;"],
    ['"', "&quot;"],
    ["'", "&#39;"],
  ] as const),
);

/** Has the `g` flag; safe with `String.prototype.replace`,
 * which does not advance `lastIndex`. Construct a fresh
 * RegExp before any `.exec` / `.test` use.
 * */
const HTML_CHARS_PATTERN = /[&<>"']/g;

export { HTML_ESCAPE_CHARS, HTML_CHARS_PATTERN };
