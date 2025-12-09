import type { JSX } from "react";

import splashImg from "@client/assets/images/splash.jpg";
import { IconifyIcon, iconifyIcons } from "@client/components/IconifyIcon";

import styles from "./Home.module.scss";

const Home = (): JSX.Element => {
  const { home } = iconifyIcons;

  return (
    <>
      <title>Lazy Days Spa</title>
      <meta name="description" content="Lazy Days Spa - Home Page" />
      <main aria-label="Home" className={styles["home"]}>
        <img
          alt="Background Image"
          aria-hidden="true"
          className={styles["background-image"]}
          src={splashImg}
        />
        <div className={styles["content"]}>
          <h1 aria-label="Company title" className={styles["title"]}>
            <IconifyIcon
              aria-hidden="true"
              className={styles["logo"]}
              icon={home}
              ssr
            />
            Lazy Days Spa
          </h1>
          <p aria-label="Hours">Hours: limited</p>
          <p aria-label="Address">Address: nearby</p>
        </div>
      </main>
    </>
  );
};

export { Home };
