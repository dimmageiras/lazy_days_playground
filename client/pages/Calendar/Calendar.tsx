import type { JSX } from "react";

import styles from "./Calendar.module.scss";
import { Header } from "./components/Header";
import { MonthDisplay } from "./components/MonthDisplay";

const Calendar = (): JSX.Element => {
  return (
    <>
      <title>Lazy Days Spa - Calendar</title>
      <meta name="description" content="Lazy Days Spa - Calendar Page" />
      <main className={styles["calendar"]}>
        <Header />
        <MonthDisplay />
      </main>
    </>
  );
};

export { Calendar };
