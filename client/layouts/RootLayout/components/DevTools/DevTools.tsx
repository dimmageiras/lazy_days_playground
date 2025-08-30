import classNames from "classnames";
import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { useStoreState, useTrackedStore } from "zustand-x";

import { IconifyIcon } from "@client/components/IconifyIcon";
import { RouterLink } from "@client/components/RouterLink";
import { useClickOutside } from "@client/hooks/useClickOutside";
import { devToolsStore } from "@client/root/components/DevTools/stores/dev-tools.store";
import { HAS_RQDT, HAS_RRDT } from "@shared/constants/root-env.constant";

import styles from "./DevTools.module.scss";

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
    [devToolsBubbleRef.current, devToolsToggleRef.current]
  );

  const iconRotation = isExpanded ? "0deg" : "180deg";
  const isDevToolsMenuVisible = !isRQDTOpen && !isRRDTOpen;

  useEffect(() => {
    if (isRQDTOpen || isRRDTOpen) {
      setIsExpanded(false);
    }
  }, [isRQDTOpen, isRRDTOpen]);

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
              as="internal"
              className={styles["api-health"]}
              shouldReplace
              to="/api/health"
            >
              <IconifyIcon
                className={styles["icon"]}
                icon="streamline-color:shield-cross-flat"
              />
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
                const firstChild = container.firstChild?.childNodes[1];

                if (firstChild && firstChild instanceof HTMLButtonElement) {
                  firstChild.click();
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
