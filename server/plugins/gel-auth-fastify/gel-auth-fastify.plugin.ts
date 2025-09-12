import { Auth } from "@gel/auth-core";
import type { Client } from "gel";

import type { EmailPasswordHandlers } from "./types/no-name.type";

type GelAuthFactory = (client: Client) => {
  emailPassword: EmailPasswordHandlers;
};

type GelAuthInstance = ReturnType<GelAuthFactory>;

const createGelAuth: GelAuthFactory = (client) => {
  const core = Auth.create(client);

  const signin: EmailPasswordHandlers["signin"] = async (email, password) => {
    const result = (await core).signinWithEmailPassword(email, password);

    return result;
  };

  const signup: EmailPasswordHandlers["signup"] = async (
    email,
    password,
    verifyUrl
  ) => {
    const result = (await core).signupWithEmailPassword(
      email,
      password,
      verifyUrl
    );

    return result;
  };

  const verifyRegistration: EmailPasswordHandlers["verifyRegistration"] =
    async (verificationToken, verifier) => {
      const result = (await core).verifyEmailPasswordSignup(
        verificationToken,
        verifier
      );

      return result;
    };

  const fastifyAuth = {
    emailPassword: { signin, signup, verifyRegistration },
  } satisfies GelAuthInstance;

  return fastifyAuth;
};

export type { GelAuthInstance };
export { createGelAuth };
