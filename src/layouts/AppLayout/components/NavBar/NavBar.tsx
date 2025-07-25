import type { JSX } from "react";

import { IconifyIcon } from "~/components/IconifyIcon";
import { NavigationWrapper } from "~/components/NavigationWrapper";
import { RouterLink } from "~/components/RouterLink";

import { NavItems } from "./components/NavItems";
import styles from "./NavBar.module.scss";

const NavBar = (): JSX.Element => {
  return (
    <header className={styles["header"]}>
      <div className={styles["content"]}>
        <div className={styles["left"]}>
          <RouterLink
            aria-label="Lazy Days Spa - Home"
            as="navLink"
            className={styles["home-link"]}
            shouldReplace
            to="/"
          >
            <IconifyIcon
              aria-hidden="true"
              className={styles["logo"]}
              icon="game-icons:flower-pot"
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
            shouldReplace
            to="/profile"
          >
            User Profile
          </RouterLink>
          <NavigationWrapper shouldReplace to="/signin">
            {(navigateTo) => (
              <button
                aria-label="Sign in"
                className={styles["sign-in"]}
                onClick={navigateTo}
                type="button"
              >
                Sign in
              </button>
            )}
          </NavigationWrapper>
        </div>
      </div>
    </header>
  );
};

export { NavBar };
