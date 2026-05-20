const HTML_ESCAPE_CHARS = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
} as const);

const HTML_ESCAPE_PATTERN = /[&<>"']/g;

export { HTML_ESCAPE_CHARS, HTML_ESCAPE_PATTERN };
