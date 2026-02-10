import type { Auth } from "@gel/auth-core";

import type { EmailPasswordHandlers } from "@server/plugins/gel-auth-fastify/types/handlers.type";

const getEmailPasswordHandlers = (
  core: Promise<Auth>,
): EmailPasswordHandlers => {
  const signin: EmailPasswordHandlers["signin"] = async (email, password) => {
    const result = (await core).signinWithEmailPassword(email, password);

    return result;
  };

  const signup: EmailPasswordHandlers["signup"] = async (
    email,
    password,
    verifyUrl,
  ) => {
    const result = (await core).signupWithEmailPassword(
      email,
      password,
      verifyUrl,
    );

    return result;
  };

  const verifyRegistration: EmailPasswordHandlers["verifyRegistration"] =
    async (verificationToken, verifier) => {
      const result = (await core).verifyEmailPasswordSignup(
        verificationToken,
        verifier,
      );

      return result;
    };

  return {
    signin,
    signup,
    verifyRegistration,
  };
};

export const EmailPasswordHandlersHelper = {
  getEmailPasswordHandlers,
};
