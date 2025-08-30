import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { JSX } from "react";
import { useLayoutEffect } from "react";

import { HAS_RQDT, HAS_RRDT } from "@shared/constants/root-env.constant";

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
    const stopRRDTButtonObserver = HAS_RRDT
      ? setupDevToolsButton(RRDT_BUTTON_SELECTOR, RRDT_CONTAINER_SELECTOR)
      : null;
    const stopRRDTPanelObserver = HAS_RRDT
      ? observeRRDTPanel(RRDT_PANEL_SELECTOR)
      : null;

    // TanStack Query DevTools
    const stopTQDTButtonObserver = HAS_RQDT
      ? setupDevToolsButton(TQDT_BUTTON_SELECTOR, TQDT_CONTAINER_SELECTOR)
      : null;
    const stopTQDTDuplicateButtonsObserver = HAS_RQDT
      ? observeDuplicateButtons(TQDT_CONTAINER_SELECTOR)
      : null;
    const stopTQDTPanelObserver = HAS_RQDT
      ? observeTQDTPanel(TQDT_PANEL_SELECTOR)
      : null;

    return () => {
      stopRRDTButtonObserver?.();
      stopRRDTPanelObserver?.();
      stopTQDTButtonObserver?.();
      stopTQDTDuplicateButtonsObserver?.();
      stopTQDTPanelObserver?.();
    };
  }, []);

  return <ReactQueryDevtools />;
};

export { DevTools };
