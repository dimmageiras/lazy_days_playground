import type { JSX } from "react";

import styles from "./Calendar.module.scss";
import { Header } from "./components/Header";

const Calendar = (): JSX.Element => {
  return (
    <main className={styles["calendar"]}>
      <Header />
    </main>
  );
};

export { Calendar };
