/**
 * Extracts the target element from an event object.
 * Safely handles cases where the event or event.target might be null.
 *
 * @param event - The event object to extract the target from
 * @returns The event target element, or null if not available
 */
const getEventTarget = (event: Event): EventTarget | null =>
  event?.target ?? null;

/**
 * Determines whether a target element should be ignored during click outside detection.
 * Elements are ignored if they are detached from the document or are the root HTML element.
 *
 * @param target - The HTMLElement to check
 * @returns True if the target should be ignored, false otherwise
 */
const shouldIgnoreTarget = (target: HTMLElement): boolean =>
  !document.body.contains(target) && target.tagName !== "HTML";

export const ClickOutsideHelper = {
  getEventTarget,
  shouldIgnoreTarget,
};
