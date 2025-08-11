import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { JSX } from "react";
import { useLayoutEffect } from "react";

import "./DevTools.module.scss";

import { DevToolsHelper } from "./helpers/dev-tools.helper";
import { TQDTHelper } from "./helpers/tqdt.helper";

// React Router DevTools
const RRD_BUTTON_SELECTOR = "[data-testid='react-router-devtools-trigger']";
const RRD_CONTAINER_SELECTOR = "#rrdt-button-container";

// TanStack Query DevTools
const TQDT_BUTTON_SELECTOR = ".tsqd-open-btn-container";
const TQDT_CONTAINER_SELECTOR = "#tqdt-button-container";
const TQDT_PANEL_SELECTOR = ".tsqd-main-panel";

const DevTools = (): JSX.Element => {
  useLayoutEffect(() => {
    const { setupDevToolsButton } = DevToolsHelper;
    const { observeDevToolsPanel, observeDuplicateButtons } = TQDTHelper;

    // React Router DevTools
    const stopRRDButtonObserver = setupDevToolsButton(
      RRD_BUTTON_SELECTOR,
      RRD_CONTAINER_SELECTOR
    );

    // TanStack Query DevTools
    const stopTQDTButtonObserver = setupDevToolsButton(
      TQDT_BUTTON_SELECTOR,
      TQDT_CONTAINER_SELECTOR
    );
    const stopTQDTDuplicateButtonsObserver = observeDuplicateButtons(
      TQDT_CONTAINER_SELECTOR
    );
    const stopTQDTPanelObserver = observeDevToolsPanel(TQDT_PANEL_SELECTOR);

    return () => {
      stopRRDButtonObserver();
      stopTQDTButtonObserver();
      stopTQDTDuplicateButtonsObserver();
      stopTQDTPanelObserver();
    };
  }, []);

  return <ReactQueryDevtools />;
};

export { DevTools };
