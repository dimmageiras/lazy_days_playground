import { useMutationState } from "@tanstack/react-query";
import classNames from "classnames";
import type { JSX } from "react";
import { memo } from "react";

import { DomEventsHelper } from "@client/helpers/dom-events.helper";
import { USER_QUERY_KEYS } from "@client/pages/Signin/components/SigninForm/components/FormFields/components/EmailField/constants/user.constant";
import type { CheckEmailResponse } from "@shared/types/user.type";

import styles from "./ActioButtons.module.scss";

interface ActionButtonsProps {
  isFormValid: boolean;
}

const ActionButtons = memo(
  ({ isFormValid }: ActionButtonsProps): JSX.Element => {
    const emailExists = useMutationState({
      filters: { mutationKey: USER_QUERY_KEYS.CHECK_EMAIL },
      select: (mutation) => {
        const data = mutation.state.data as CheckEmailResponse | undefined;

        return data?.exists ?? null;
      },
    })[0];

    const { handleMouseDown } = DomEventsHelper;

    const shouldEnableSignIn = isFormValid && emailExists === true;
    const shouldEnableSignUp = isFormValid && emailExists === false;

    const queryFailed = emailExists === null;

    return (
      <div className={styles["action-buttons"]}>
        <button
          className={classNames(styles["submit"], styles["sign-up"])}
          disabled={!shouldEnableSignUp || queryFailed}
          onMouseDown={handleMouseDown}
          type="submit"
        >
          Sign up
        </button>
        <button
          className={classNames(styles["submit"], styles["sign-in"])}
          disabled={!shouldEnableSignIn || queryFailed}
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
