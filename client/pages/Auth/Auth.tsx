import type { JSX } from "react";

import { PageTitle } from "@client/components/PageTitle";

import styles from "./Auth.module.scss";
import { AuthForm } from "./components/AuthForm";

const Auth = (): JSX.Element => {
  return (
    <main aria-label="Auth" className={styles["auth"]}>
      <PageTitle
        aria-label="Page title"
        pageTitle="Sign in to your account or sign up for a new one"
      />
      <section aria-label="Auth form" className={styles["auth-form"]}>
        <AuthForm />
      </section>
    </main>
  );
};

export { Auth };
