import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { JSX } from "react";
import { useLayoutEffect } from "react";

import "./DevTools.module.scss";

import { DevToolsHelper } from "./helpers/dev-tools.helper";
import { RRDTHelper } from "./helpers/rrdt.helper";
import { TQDTHelper } from "./helpers/tqdt.helper";

// React Router DevTools
const RRDT_BUTTON_SELECTOR = "[data-testid='react-router-devtools-trigger']";
const RRDT_CONTAINER_SELECTOR = "#rrdt-button-container";
const RRDT_PANEL_SELECTOR = "#react_router_devtools";

// TanStack Query DevTools
const TQDT_BUTTON_SELECTOR = ".tsqd-open-btn-container";
const TQDT_CONTAINER_SELECTOR = "#tqdt-button-container";
const TQDT_PANEL_SELECTOR = ".tsqd-main-panel";

const DevTools = (): JSX.Element => {
  useLayoutEffect(() => {
    const { setupDevToolsButton } = DevToolsHelper;
    const { observeDevToolsPanel: observeRRDTPanel } = RRDTHelper;
    const { observeDevToolsPanel: observeTQDTPanel, observeDuplicateButtons } =
      TQDTHelper;

    // React Router DevTools
    const stopRRDTButtonObserver = setupDevToolsButton(
      RRDT_BUTTON_SELECTOR,
      RRDT_CONTAINER_SELECTOR
    );

    // TanStack Query DevTools
    const stopTQDTButtonObserver = setupDevToolsButton(
      TQDT_BUTTON_SELECTOR,
      TQDT_CONTAINER_SELECTOR
    );
    const stopTQDTDuplicateButtonsObserver = observeDuplicateButtons(
      TQDT_CONTAINER_SELECTOR
    );
    const stopRRDTPanelObserver = observeRRDTPanel(RRDT_PANEL_SELECTOR);
    const stopTQDTPanelObserver = observeTQDTPanel(TQDT_PANEL_SELECTOR);

    return () => {
      stopRRDTButtonObserver();
      stopRRDTPanelObserver();
      stopTQDTButtonObserver();
      stopTQDTDuplicateButtonsObserver();
      stopTQDTPanelObserver();
    };
  }, []);

  return <ReactQueryDevtools />;
};

export { DevTools };
