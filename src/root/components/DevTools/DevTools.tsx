import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { JSX } from "react";
import { useLayoutEffect } from "react";

import { TQDTHelper } from "~/root/components/DevTools/helpers/tqdt.helper";

import "./DevTools.module.scss";

const DevTools = (): JSX.Element => {
  useLayoutEffect(() => {
    const {
      observeDevToolsPanel,
      observeDuplicateButtons,
      setupTanstackButton,
    } = TQDTHelper;

    const stopButtonObserver = setupTanstackButton();
    const stopDuplicateButtonsObserver = observeDuplicateButtons();
    const stopPanelObserver = observeDevToolsPanel();

    return () => {
      stopButtonObserver();
      stopDuplicateButtonsObserver();
      stopPanelObserver();
    };
  }, []);

  return <ReactQueryDevtools />;
};

export { DevTools };
