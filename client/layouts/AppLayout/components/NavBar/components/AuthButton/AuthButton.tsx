import { useQueryClient } from "@tanstack/react-query";
import type { JSX, MouseEvent } from "react";
import type { NavigateFunction } from "react-router";

import { NavigationWrapper } from "@client/components/NavigationWrapper";
import { AUTH_COOKIE_NAMES } from "@client/constants/auth-cookie.constants";
import { useClientSessionStoreState } from "@client/providers/ClientSessionProvider";
import { useLogout } from "@client/services/auth";

import styles from "./AuthButton.module.scss";

const AuthButton = (): JSX.Element => {
  const [isAuthenticated, setIsAuthenticated] =
    useClientSessionStoreState("isAuthenticated");
  const { mutateAsync } = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = async (
    _event: MouseEvent<HTMLButtonElement>,
    navigate: NavigateFunction
  ): Promise<void> => {
    try {
      const { CLIENT_ID } = AUTH_COOKIE_NAMES;

      await mutateAsync({ cookieName: CLIENT_ID });

      setIsAuthenticated(false);

      queryClient.clear();

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <NavigationWrapper>
      {(navigate) => {
        return isAuthenticated ? (
          <button
            aria-label="Sign out of your account"
            className={styles["auth-button"]}
            onClick={(event) => handleLogout(event, navigate)}
            type="button"
          >
            Logout
          </button>
        ) : (
          <button
            aria-label="Sign in to your account or sign up for a new one"
            className={styles["auth-button"]}
            onClick={() => navigate("/auth", { replace: true })}
            type="button"
          >
            Sign in / Sign up
          </button>
        );
      }}
    </NavigationWrapper>
  );
};

export { AuthButton };
