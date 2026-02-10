import type { CustomHtmlTags } from "html-tags";
import htmlTags from "html-tags";
import memoize from "lodash/memoize";

/**
 * Returns an array of valid custom HTML tags including standard HTML tags and custom elements.
 * This function is memoized to avoid recomputing the filtered tag list on every call.
 *
 * @returns {CustomHtmlTags[]} Array of valid HTML tags excluding 'math' and 'selectedcontent', plus 'iconify-icon'
 * @performance Memoized function that caches the result after first execution
 * @example
 * ```tsx
 * const validTags = getCustomTags();
 * // Returns: ['iconify-icon', 'div', 'span', 'button', ...] (cached after first call)
 * ```
 */
const getCustomTags = memoize((): CustomHtmlTags[] => {
  return (["iconify-icon", ...htmlTags] as const).filter(
    (tag) => tag !== "math" && tag !== "selectedcontent",
  );
});

export const DynamicElementHelper = {
  getCustomTags,
};
