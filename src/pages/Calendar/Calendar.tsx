import type { JSX } from "react";

import styles from "./Calendar.module.scss";
import { Header } from "./components/Header";
import { MonthDisplay } from "./components/MonthDisplay";

const Calendar = (): JSX.Element => {
  return (
    <main className={styles["calendar"]}>
      <Header />
      <MonthDisplay />
    </main>
  );
};

export { Calendar };
