/**
 * Helper functions for managing React Router DevTools button DOM manipulation
 */

import { devToolsStore } from "@client/layouts/RootLayout/components/DevTools/stores/dev-tools.store";

/**
 * Observes DOM changes to detect React Router DevTools panel visibility
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

    if (panel instanceof HTMLElement) {
      const panelIsCollapsed =
        panel.hasAttribute("tabindex") &&
        panel.getAttribute("tabindex") === "-1";

      devToolsStore.set("isRRDTOpen", !panelIsCollapsed);
    }
  });

  observer.observe(document.body, {
    attributeFilter: ["tabindex"],
    attributes: true,
    subtree: true,
  });

  return destroy;
};

export const RRDTHelper = { observeDevToolsPanel };
