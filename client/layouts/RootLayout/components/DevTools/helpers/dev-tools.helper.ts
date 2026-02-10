/**
 * Creates a cleanup function for MutationObserver instances
 * @param observer The observer to disconnect
 */
const createObserverCleanup = (observer: MutationObserver | null): void => {
  if (observer) {
    observer.disconnect();
  }
};

/**
 * Sets up the requested DevTools button positioning with automatic detection
 * Observes DOM changes until successful positioning
 * @param buttonSelector - CSS selector for the DevTools button element to be repositioned
 * @param containerSelector - CSS selector for the target container where the button should be moved
 * @returns Cleanup function to disconnect the MutationObserver
 */
const setupDevToolsButton = (
  buttonSelector: string,
  containerSelector: string,
): (() => void) => {
  let observer: MutationObserver | null = null;

  observer = new MutationObserver(() => {
    const button = document.querySelector(buttonSelector);
    const container = document.querySelector(containerSelector);

    if (button && container) {
      container.appendChild(button);
      createObserverCleanup(observer);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    createObserverCleanup(observer);
  };
};

export const DevToolsHelper = {
  createObserverCleanup,
  setupDevToolsButton,
};
