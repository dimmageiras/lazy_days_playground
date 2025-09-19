import type { JSX } from "react";

import { PageTitle } from "@client/components/PageTitle";

import { AuthForm } from "./components/AuthForm";
import styles from "./Signin.module.scss";

const Signin = (): JSX.Element => {
  return (
    <main aria-label="Signin" className={styles["signin"]}>
      <PageTitle aria-label="Page title" pageTitle="Sign in to your account" />
      <section aria-label="Signin form" className={styles["signin-form"]}>
        <AuthForm />
      </section>
    </main>
  );
};

export { Signin };
