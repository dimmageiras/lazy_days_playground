import { get } from "immutable";

import {
  HTML_ESCAPE_CHARS,
  HTML_ESCAPE_PATTERN,
} from "../constants/html.constant";

const escapeHtml = (str: string): string => {
  return str.replace(HTML_ESCAPE_PATTERN, (char) =>
    get(HTML_ESCAPE_CHARS, char, char),
  );
};

const HtmlHelper = Object.freeze({
  escapeHtml,
} as const);

export { HtmlHelper };
