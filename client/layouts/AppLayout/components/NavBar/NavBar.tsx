import type { JSX } from "react";

import { IconifyIcon, iconifyIcons } from "@client/components/IconifyIcon";
import { NavigationWrapper } from "@client/components/NavigationWrapper";
import { RouterLink } from "@client/components/RouterLink";

import { NavItems } from "./components/NavItems";
import styles from "./NavBar.module.scss";

const NavBar = (): JSX.Element => {
  const { home } = iconifyIcons;

  return (
    <header className={styles["header"]}>
      <div className={styles["content"]}>
        <div className={styles["left"]}>
          <RouterLink
            aria-label="Lazy Days Spa - Home"
            as="navLink"
            className={styles["home-link"]}
            prioritizeOnClick
            shouldReplace
            to="/"
          >
            <IconifyIcon
              aria-hidden="true"
              className={styles["logo"]}
              icon={home}
              ssr
            />
          </RouterLink>
          <nav aria-label="Main navigation" className={styles["nav-bar"]}>
            <NavItems />
          </nav>
        </div>
        <div className={styles["right"]}>
          <RouterLink
            aria-label="User Profile"
            as="internal"
            className={styles["profile"]}
            prioritizeOnClick
            shouldReplace
            to="/profile"
          >
            User Profile
          </RouterLink>
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
        </div>
      </div>
    </header>
  );
};

export { NavBar };
