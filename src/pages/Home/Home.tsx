import type { JSX } from "react";

import splashImg from "~/assets/images/splash.jpg";

import styles from "./Home.module.scss";

const Home = (): JSX.Element => {
  return (
    <main className={styles["home"]}>
      <img
        className={styles["background-image"]}
        src={splashImg}
        alt="Background Image"
      />
      <div className={styles["content"]}>
        <h1 className={styles["title"]}>
          <iconify-icon
            className={styles["logo"]}
            icon="game-icons:flower-pot"
          />
          Lazy Days Spa
        </h1>
        <p>Hours: limited</p>
        <p>Address: nearby</p>
      </div>
    </main>
  );
};

export { Home };
