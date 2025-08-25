import type { JSX } from "react";

import { PageTitle } from "@client/components/PageTitle";

import { Form } from "./components/Form";
import styles from "./Signin.module.scss";

const Signin = (): JSX.Element => {
  return (
    <main aria-label="Signin" className={styles["signin"]}>
      <PageTitle aria-label="Page title" pageTitle="Sign in to your account" />
      <Form />
    </main>
  );
};

export { Signin };
