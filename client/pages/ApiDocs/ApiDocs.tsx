import type { JSX } from "react";

import styles from "./ApiDocs.module.scss";

const ApiDocs = (): JSX.Element => {
  return (
    <main className={styles["api-swagger"]}>
      <iframe className={styles["swagger-iframe"]} src="/api/docs/swagger" />
    </main>
  );
};

export { ApiDocs };
