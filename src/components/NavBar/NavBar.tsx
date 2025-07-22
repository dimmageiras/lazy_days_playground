import type { JSX } from "react";
import { Link, useNavigate } from "react-router";

import styles from "./NavBar.module.scss";

const NavBar = (): JSX.Element => {
  const navigate = useNavigate();

  const handleSignInClick = (): void => {
    navigate("/signin", { replace: true });
  };

  return (
    <header className={styles["header"]}>
      <div className={styles["content"]}>
        <div className={styles["left"]}>
          <Link className={styles["home-link"]} replace to="/">
            <iconify-icon
              className={styles["logo"]}
              icon="game-icons:flower-pot"
            />
          </Link>
          <nav className={styles["nav-bar"]}>
            <Link className={styles["link"]} replace to="/treatments">
              Treatments
            </Link>
            <Link className={styles["link"]} replace to="/staff">
              Staff
            </Link>
            <Link className={styles["link"]} replace to="/calendar">
              Calendar
            </Link>
          </nav>
        </div>
        <div className={styles["right"]}>
          <Link className={styles["profile"]} replace to="/profile">
            User Profile
          </Link>
          <button
            type="button"
            className={styles["sign-in"]}
            onClick={handleSignInClick}
          >
            Sign in
          </button>
        </div>
      </div>
    </header>
  );
};

export { NavBar };
