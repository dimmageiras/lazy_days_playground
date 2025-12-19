import classNames from "classnames";
import type { JSX } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useStoreState, useTrackedStore } from "zustand-x";

import { IconifyIcon } from "@client/components/IconifyIcon";
import { RouterLink } from "@client/components/RouterLink";
import { useClickOutside } from "@client/hooks/useClickOutside";
import {
  API_DOCS_BASE_URL,
  API_HEALTH_BASE_URL,
} from "@shared/constants/base-urls.constant";
import { HAS_RQDT, HAS_RRDT } from "@shared/constants/root-env.constant";

import {
  RRDT_BUTTON_SELECTOR,
  RRDT_CONTAINER_SELECTOR,
  RRDT_PANEL_SELECTOR,
  TQDT_BUTTON_SELECTOR,
  TQDT_CONTAINER_SELECTOR,
  TQDT_PANEL_SELECTOR,
} from "./constants/dev-tools.constant";
import styles from "./DevTools.module.scss";
import { DevToolsHelper } from "./helpers/dev-tools.helper";
import { RRDTHelper } from "./helpers/rrdt.helper";
import { TQDTHelper } from "./helpers/tqdt.helper";
import { devToolsStore } from "./stores/dev-tools.store";

const DevTools = (): JSX.Element => {
  const [isExpanded, setIsExpanded] = useStoreState(
    devToolsStore,
    "isDevToolsMenuOpen"
  );
  const { isRRDTOpen, isRQDTOpen } = useTrackedStore(devToolsStore);
  const devToolsBubbleRef = useRef<HTMLDivElement>(null);
  const devToolsToggleRef = useRef<HTMLButtonElement>(null);
  const devToolsRef = useClickOutside<HTMLDivElement>(
    () => {
      if (isExpanded) {
        setIsExpanded(false);
      }
    },
    undefined,
    []
  );

  const iconRotation = isExpanded ? "0deg" : "180deg";
  const isDevToolsMenuVisible = !isRQDTOpen && !isRRDTOpen;

  useEffect(() => {
    if (isRQDTOpen || isRRDTOpen) {
      setIsExpanded(false);
    }
  }, [isRQDTOpen, isRRDTOpen, setIsExpanded]);

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

  return (
    <div
      className={classNames(styles["dev-tools"], {
        [String(styles["visible"])]: isDevToolsMenuVisible,
      })}
      id="dev-tools"
      ref={devToolsRef}
    >
      <button
        className={styles["dev-tools-toggle"]}
        ref={devToolsToggleRef}
        onClick={() => {
          setIsExpanded(!isExpanded);
        }}
      >
        <IconifyIcon
          className={styles["dev-tools-toggle-icon"]}
          icon="ooui:expand"
          rotate={iconRotation}
        />
      </button>
      <div
        className={classNames(styles["dev-tools-bubble"], {
          [String(styles["visible"])]: isExpanded,
        })}
        ref={devToolsBubbleRef}
      >
        <div className={styles["bubble-content"]}>
          <div className={styles["option-container"]}>
            <RouterLink
              aria-label="API Health"
              as="internal"
              className={styles["api-health"]}
              onClick={() => {
                setIsExpanded(false);
              }}
              prioritizeOnClick
              shouldReplace
              to={`/${API_HEALTH_BASE_URL}`}
            >
              <IconifyIcon
                className={styles["icon"]}
                icon="streamline-color:shield-cross-flat"
              />
            </RouterLink>
          </div>
          <div className={styles["option-container"]}>
            <RouterLink
              aria-label="API Docs"
              as="internal"
              className={styles["api-docs"]}
              onClick={() => {
                setIsExpanded(false);
              }}
              prioritizeOnClick
              shouldReplace
              to={`/${API_DOCS_BASE_URL}`}
            >
              <IconifyIcon className={styles["icon"]} icon="logos-swagger" />
            </RouterLink>
          </div>
          {HAS_RRDT ? (
            <div
              className={styles["option-container"]}
              id="rrdt-button-container"
            />
          ) : null}
          {HAS_RQDT ? (
            <div
              className={styles["option-container"]}
              id="tqdt-button-container"
              onClick={(event) => {
                const container = event.currentTarget;
                const button = container.querySelector("button");

                if (button) {
                  button.click();
                }
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export { DevTools };
