import classNames from "classnames";
import type { JSX } from "react";
import { useRef, useState } from "react";
import { useStoreValue } from "zustand-x";

import { IconifyIcon } from "~/components/IconifyIcon";
import { useClickOutside } from "~/hooks/useClickOutside";
import { devToolsStore } from "~/root/components/DevTools/stores/dev-tools.store";

const DevTools = (): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRQDTOpen = useStoreValue(devToolsStore, "isRQDTOpen");
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

  return (
    <div
      className={classNames({ visible: !isRQDTOpen })}
      id="dev-tools"
      ref={devToolsRef}
    >
      <button
        className="dev-tools-toggle"
        ref={devToolsToggleRef}
        onClick={() => {
          setIsExpanded(!isExpanded);
        }}
      >
        <IconifyIcon
          className="dev-tools-toggle-icon"
          icon="ooui:expand"
          rotate={iconRotation}
        />
      </button>
      <div
        className={classNames("dev-tools-bubble", {
          visible: isExpanded,
        })}
        ref={devToolsBubbleRef}
      >
        <div className="bubble-content">
          <div className="rrdt-button-container" id="rrdt-button-container" />
          <div
            className="tqdt-button-container"
            id="tqdt-button-container"
            onClick={(event) => {
              const container = event.currentTarget;
              const firstChild = container.firstChild?.childNodes[1];

              if (firstChild && firstChild instanceof HTMLButtonElement) {
                firstChild.click();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export { DevTools };
