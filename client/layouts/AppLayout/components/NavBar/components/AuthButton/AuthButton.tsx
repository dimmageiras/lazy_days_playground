import type { JSX } from "react";

import { NavigationWrapper } from "@client/components/NavigationWrapper";

import styles from "./AuthButton.module.scss";

const AuthButton = (): JSX.Element => {
  return (
    <NavigationWrapper shouldReplace to="/auth">
      {(navigateTo) => (
        <button
          aria-label="Sign in to your account or sign up for a new one"
          className={styles["auth-button"]}
          onClick={navigateTo}
          type="button"
        >
          Sign in / Sign up
        </button>
      )}
    </NavigationWrapper>
  );
};

export { AuthButton };
