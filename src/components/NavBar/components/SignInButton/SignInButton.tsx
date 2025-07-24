import type { JSX } from "react";

import styles from "./SignInButton.module.scss";

interface SignInButtonProps {
  navigateTo?: () => void;
}

const SignInButton = ({ navigateTo }: SignInButtonProps): JSX.Element => {
  return (
    <button
      className={styles["sign-in-button"]}
      onClick={navigateTo}
      type="button"
    >
      Sign in
    </button>
  );
};

export { SignInButton };
