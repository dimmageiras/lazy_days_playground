import classNames from "classnames";
import type { JSX } from "react";
import { memo } from "react";

import { DomEventsHelper } from "@client/helpers/dom-events.helper";

import styles from "./ActioButtons.module.scss";

interface ActionButtonsProps {
  isExistingUser: boolean;
  shouldDisableActionButtons: boolean;
  shouldEnableSignIn: boolean;
  shouldEnableSignUp: boolean;
}

const ActionButtons = memo(
  ({
    shouldDisableActionButtons,
    shouldEnableSignIn,
    shouldEnableSignUp,
  }: ActionButtonsProps): JSX.Element => {
    const { handleMouseDown } = DomEventsHelper;

    return (
      <div className={styles["action-buttons"]}>
        <button
          className={classNames(styles["submit"], styles["sign-up"])}
          disabled={!shouldEnableSignUp || shouldDisableActionButtons}
          onMouseDown={handleMouseDown}
          type="submit"
        >
          Sign up
        </button>
        <button
          className={classNames(styles["submit"], styles["sign-in"])}
          disabled={!shouldEnableSignIn || shouldDisableActionButtons}
          onMouseDown={handleMouseDown}
          type="submit"
        >
          Sign in
        </button>
      </div>
    );
  }
);

ActionButtons.displayName = "ActionButtons";

export { ActionButtons };
