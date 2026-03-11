import { useQueryClient } from "@tanstack/react-query";
import type { JSX, MouseEvent } from "react";
import type { NavigateFunction } from "react-router";

import { NavigationWrapper } from "@client/components/NavigationWrapper";
import { COOKIE_KEYS } from "@client/constants/auth-cookie.constant";
import { useClientSessionStoreState } from "@client/providers/ClientSessionProvider";
import { ROUTES_CONSTANTS } from "@client/routes/constants/routes.constant";
import { useLogout } from "@client/services/auth";

import styles from "./AuthButton.module.scss";
const { CLIENT_ID } = COOKIE_KEYS;
const { ROUTE_PATHS } = ROUTES_CONSTANTS;
const { AUTH, HOME } = ROUTE_PATHS;

const AuthButton = (): JSX.Element => {
  const [isAuthenticated, setIsAuthenticated] =
    useClientSessionStoreState("isAuthenticated");
  const { mutateAsync } = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = async (
    _event: MouseEvent<HTMLButtonElement>,
    navigate: NavigateFunction,
  ): Promise<void> => {
    try {
      await mutateAsync({ cookieName: CLIENT_ID });

      setIsAuthenticated(false);

      queryClient.clear();

      navigate(HOME, { replace: true });
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
            onClick={() => navigate(`/${AUTH}`, { replace: true })}
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
