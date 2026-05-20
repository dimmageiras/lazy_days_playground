import {
  HTML_ESCAPE_CHARS,
  HTML_ESCAPE_PATTERN,
} from "@shared/constants/html.constant";

import { ObjectHelper } from "./object.helper";

const { isObjectKey } = ObjectHelper;

const escapeHtml = (str: string): string => {
  return str.replace(HTML_ESCAPE_PATTERN, (char) => {
    const isKey = isObjectKey(HTML_ESCAPE_CHARS, char);

    if (!isKey) {
      return char;
    }

    return Reflect.get(HTML_ESCAPE_CHARS, char);
  });
};

const HtmlHelper = Object.freeze({
  escapeHtml,
} as const);

export { HtmlHelper };
