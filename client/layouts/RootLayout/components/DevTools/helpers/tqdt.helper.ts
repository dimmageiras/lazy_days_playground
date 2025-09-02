/**
 * Helper functions for managing TanStack Query DevTools button DOM manipulation
 */

import { devToolsStore } from "@client/layouts/RootLayout/components/DevTools/stores/dev-tools.store";

/**
 * Observes DOM changes to detect TanStack Query DevTools panel visibility
 * Monitors the document body for changes and updates the store state when the panel opens or closes
 * @returns Cleanup function to disconnect the MutationObserver and prevent memory leaks
 */
const observeDevToolsPanel = (panelSelector: string): (() => void) => {
  let observer: MutationObserver | null = null;

  const destroy = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  observer = new MutationObserver(() => {
    const panel = document.querySelector(panelSelector);

    devToolsStore.set("isRQDTOpen", panel instanceof HTMLElement);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return destroy;
};

/**
 * Observes the TanStack Query DevTools button container for duplicate buttons
 * Automatically removes duplicate buttons when they appear in the container
 * @returns Cleanup function to disconnect the MutationObserver and prevent memory leaks
 */
const observeDuplicateButtons = (containerSelector: string): (() => void) => {
  let observer: MutationObserver | null = null;

  const destroy = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  const container = document.querySelector(containerSelector);

  const cleanupDuplicates = () => {
    if (!container) {
      return;
    }

    const buttons = Array.from(container.children);

    if (buttons.length <= 1) {
      return;
    }

    buttons.slice(1).forEach((button) => {
      if (button instanceof Element) {
        button.remove();
      }
    });
  };

  observer = new MutationObserver(() => {
    cleanupDuplicates();
  });

  if (container) {
    observer.observe(container, {
      childList: true,
      subtree: true,
    });
  }

  return destroy;
};

export const TQDTHelper = {
  observeDevToolsPanel,
  observeDuplicateButtons,
};
