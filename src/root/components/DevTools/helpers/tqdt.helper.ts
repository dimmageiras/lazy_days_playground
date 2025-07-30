/**
 * Helper functions for managing TanStack Query DevTools button DOM manipulation
 */

import { devToolsStore } from "~/root/components/DevTools/stores/devToolsStore";

// Constants
const BUTTON_SELECTOR = ".tsqd-open-btn-container";
const CONTAINER_ID = "tqdt-button-container";
const PANEL_SELECTOR = ".tsqd-main-panel";

/**
 * Observes DOM changes to detect TanStack Query DevTools panel visibility
 * Monitors the document body for changes and updates the store state when the panel opens or closes
 * @returns Cleanup function to disconnect the MutationObserver and prevent memory leaks
 */
const observeDevToolsPanel = (): (() => void) => {
  let observer: MutationObserver | null = null;

  const destroy = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  observer = new MutationObserver(() => {
    const panel = document.querySelector(PANEL_SELECTOR);

    if (panel) {
      devToolsStore?.set("isRQDTOpen", true);
    } else {
      devToolsStore?.set("isRQDTOpen", false);
    }
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
const observeDuplicateButtons = (): (() => void) => {
  let observer: MutationObserver | null = null;

  const destroy = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  const cleanupDuplicates = () => {
    const container = document.getElementById(CONTAINER_ID);

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

  const container = document.getElementById(CONTAINER_ID);

  if (container) {
    observer.observe(container, {
      childList: true,
      subtree: true,
    });
  }

  return destroy;
};

/**
 * Sets up TanStack Query DevTools button positioning with automatic detection
 * Observes DOM changes until successful positioning
 * @returns Cleanup function to disconnect the observer
 */
const setupTanstackButton = (): (() => void) => {
  let observer: MutationObserver | null = null;

  const destroy = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  observer = new MutationObserver(() => {
    const button = document.querySelector(BUTTON_SELECTOR);
    const container = document.getElementById(CONTAINER_ID);

    if (button && container) {
      container.appendChild(button);
      destroy();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return destroy;
};

export const TQDTHelper = {
  observeDevToolsPanel,
  observeDuplicateButtons,
  setupTanstackButton,
};
