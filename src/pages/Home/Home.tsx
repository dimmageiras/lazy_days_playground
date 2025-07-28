import type { JSX } from "react";

import splashImg from "~/assets/images/splash.jpg";
import { IconifyIcon } from "~/components/IconifyIcon";

import styles from "./Home.module.scss";

const Home = (): JSX.Element => {
  return (
    <main aria-label="Home" className={styles["home"]}>
      <img
        aria-hidden="true"
        className={styles["background-image"]}
        src={splashImg}
        alt="Background Image"
      />
      <div className={styles["content"]}>
        <h1 aria-label="Company title" className={styles["title"]}>
          <IconifyIcon
            aria-hidden="true"
            className={styles["logo"]}
            icon="game-icons:flower-pot"
          />
          Lazy Days Spa
        </h1>
        <p aria-label="Hours">Hours: limited</p>
        <p aria-label="Address">Address: nearby</p>
      </div>
    </main>
  );
};

export { Home };
