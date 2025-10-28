import type { JSX } from "react";

import styles from "./ApiDocs.module.scss";

const ApiDocs = (): JSX.Element => {
  return (
    <>
      <title>API Swagger Documentation</title>
      <meta name="description" content="API Swagger Documentation" />
      <main className={styles["api-swagger"]}>
        <iframe className={styles["swagger-iframe"]} src="/api/docs/swagger" />
      </main>
    </>
  );
};

export { ApiDocs };
