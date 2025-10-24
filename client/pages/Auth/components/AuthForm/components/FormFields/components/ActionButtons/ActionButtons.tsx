import classNames from "classnames";
import type { JSX } from "react";
import { memo } from "react";

import { DomEventsHelper } from "@client/helpers/dom-events.helper";

import styles from "./ActionButtons.module.scss";

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

    const isSignInDisabled = !shouldEnableSignIn || shouldDisableActionButtons;
    const isSignUpDisabled = !shouldEnableSignUp || shouldDisableActionButtons;

    return (
      <div className={styles["action-buttons"]}>
        <button
          className={classNames(styles["submit"], styles["sign-up"])}
          disabled={isSignUpDisabled}
          onMouseDown={handleMouseDown}
          type={isSignUpDisabled ? "button" : "submit"}
        >
          Sign up
        </button>
        <button
          className={classNames(styles["submit"], styles["sign-in"])}
          disabled={isSignInDisabled}
          onMouseDown={handleMouseDown}
          type={isSignInDisabled ? "button" : "submit"}
        >
          Sign in
        </button>
      </div>
    );
  }
);

ActionButtons.displayName = "ActionButtons";

export { ActionButtons };
