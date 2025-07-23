import type { JSX } from "react";

import { LinkWrapper } from "~/components/LinkWrapper";

import { NavItems } from "./components/NavItems";
import styles from "./NavBar.module.scss";

const NavBar = (): JSX.Element => {
  return (
    <header className={styles["header"]}>
      <div className={styles["content"]}>
        <div className={styles["left"]}>
          <LinkWrapper
            as="navLink"
            className={styles["home-link"]}
            shouldReplace
            to="/"
          >
            <iconify-icon
              className={styles["logo"]}
              icon="game-icons:flower-pot"
            />
          </LinkWrapper>
          <nav className={styles["nav-bar"]}>
            <NavItems />
          </nav>
        </div>
        <div className={styles["right"]}>
          <LinkWrapper
            as="internal"
            className={styles["profile"]}
            shouldReplace
            to="/profile"
          >
            User Profile
          </LinkWrapper>
          <button
            type="button"
            className={styles["sign-in"]}
            onClick={(event) => {
              event.preventDefault();
            }}
          >
            <LinkWrapper as="internal" shouldReplace to="/signin">
              Sign in
            </LinkWrapper>
          </button>
        </div>
      </div>
    </header>
  );
};

export { NavBar };
