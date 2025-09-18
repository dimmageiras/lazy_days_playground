import type { MouseEvent } from "react";

/**
 * Handles mouse down events to ensure click events are triggered before any other mouse events.
 * This helper is specifically designed to handle race conditions in React where click events
 * need to take priority over other events like onBlur, onFocus, or form validation.
 *
 * Common use cases:
 * - Form submissions where the click must be registered before the form validation takes place
 * - Navigation links that need to be opened before the form validation takes place
 *
 * @example
 * ```tsx
 * // Basic usage with default settings (only left click enabled)
 * <button onMouseDown={handleMouseDown}>Click me</button>
 *
 * // Enable multiple mouse buttons
 * <button
 *   onMouseDown={(event) => handleMouseDown(event, {
 *     enableLeftClick: true,
 *     enableMiddleClick: true,
 *     enableRightClick: false
 *   })}
 * >
 *   Multi-button click
 * </button>
 * ```
 *
 * @param event - The React MouseEvent from the DOM element
 * @param options - Configuration object for mouse button behavior
 * @param options.enableLeftClick - Enable left mouse button (button 0). Defaults to true
 * @param options.enableMiddleClick - Enable middle mouse button (button 1). Defaults to false
 * @param options.enableRightClick - Enable right mouse button (button 2). Defaults to false
 * @returns void - This function doesn't return a value
 *
 * @remarks
 * This helper solves race conditions in React's event system by:
 * 1. Preventing default event behavior
 * 2. Stopping event propagation
 * 3. Triggering click events immediately on mouseDown
 * 4. Bypassing React's event batching for these specific interactions
 *
 * This ensures that critical user interactions (like navigation or form submission)
 * take precedence over secondary events like validation or blur handlers.
 */
const handleMouseDown = <T extends HTMLElement>(
  event: MouseEvent<T>,
  { enableLeftClick, enableMiddleClick, enableRightClick } = {
    enableLeftClick: true,
    enableMiddleClick: false,
    enableRightClick: false,
  }
): void => {
  event.preventDefault();
  event.stopPropagation();

  if (enableLeftClick && event.button === 0) {
    event.currentTarget.click();
  }

  if (enableMiddleClick && event.button === 1) {
    event.currentTarget.click();
  }

  if (enableRightClick && event.button === 2) {
    event.currentTarget.click();
  }
};

export const DomEventsHelper = {
  handleMouseDown,
};
