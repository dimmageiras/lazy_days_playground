import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import type { JSX } from "react";
import type { NavigateFunction } from "react-router";
import { useLocation } from "react-router";

import { NavigationWrapper } from "@client/components/NavigationWrapper";
import { RouterLink } from "@client/components/RouterLink";
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
  const { pathname } = useLocation();

  const authPath = `/${AUTH}`;
  const isAuthPage = pathname.includes(authPath);

  const handleLogout = async (navigate: NavigateFunction): Promise<void> => {
    try {
      await mutateAsync({ cookieName: CLIENT_ID });

      setIsAuthenticated(false);

      queryClient.clear();

      navigate(HOME, { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return isAuthenticated ? (
    <NavigationWrapper>
      {(navigate) => {
        return (
          <button
            aria-label="Sign out of your account"
            className={styles["auth-button"]}
            onClick={() => handleLogout(navigate)}
            type="button"
          >
            Logout
          </button>
        );
      }}
    </NavigationWrapper>
  ) : (
    <RouterLink
      aria-label="Sign in to your account or sign up for a new one"
      as="internal"
      className={classNames(styles["auth-button"], {
        [String(styles["disabled"])]: isAuthPage,
      })}
      disabled={isAuthPage}
      prioritizeOnClick
      shouldReplace
      to={authPath}
    >
      Sign in / Sign up
    </RouterLink>
  );
};

export { AuthButton };
