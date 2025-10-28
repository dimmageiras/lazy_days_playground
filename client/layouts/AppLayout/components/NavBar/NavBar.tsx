import type { JSX } from "react";

import { IconifyIcon, iconifyIcons } from "@client/components/IconifyIcon";
import { RouterLink } from "@client/components/RouterLink";

import { AuthButton } from "./components/AuthButton";
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
          <AuthButton />
        </div>
      </div>
    </header>
  );
};

export { NavBar };
