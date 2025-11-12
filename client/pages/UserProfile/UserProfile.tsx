import type { JSX } from "react";

import { useVerifyAuth } from "@client/services/auth/queries/useVerifyAuth.query";

const UserProfile = (): JSX.Element => {
  const { data: authData } = useVerifyAuth();

  return (
    <>
      <title>Lazy Days Spa - User Profile</title>
      <meta name="description" content="Lazy Days Spa - User Profile Page" />
      <main aria-label="User profile">
        <h1>User Profile</h1>
        <p>Identity ID: {authData?.identity_id}</p>
        <p>Timestamp: {authData?.timestamp}</p>
      </main>
    </>
  );
};

export { UserProfile };
