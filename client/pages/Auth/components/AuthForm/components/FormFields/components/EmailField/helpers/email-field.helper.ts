import type { UseMutateAsyncFunction } from "@tanstack/react-query";
import type { ChangeEvent, FocusEvent } from "react";

import { signinRequestSchema } from "@shared/schemas/auth/signin-route.schema";
import type { CheckEmailCreateData } from "@shared/types/generated/user.type";

const checkEmailValidity = async (
  email: string,
  checkEmailExists: UseMutateAsyncFunction<
    CheckEmailCreateData,
    Error,
    string,
    unknown
  >
): Promise<void> => {
  const emailSchema = Reflect.get(signinRequestSchema.shape, "email");
  const isEmailValid = emailSchema.safeParse(email).success;

  if (isEmailValid && email.trim()) {
    await checkEmailExists(email);
  }
};

const handleBlur = async (
  event: FocusEvent<HTMLInputElement>,
  onBlur: () => void,
  checkEmailExists: UseMutateAsyncFunction<
    CheckEmailCreateData,
    Error,
    string,
    unknown
  >,
  hasBeenValidated: boolean
): Promise<void> => {
  onBlur();

  if (hasBeenValidated) {
    return;
  }

  const { value: email } = event.currentTarget;

  await checkEmailValidity(email, checkEmailExists);
};

const handleChange = (
  event: ChangeEvent<HTMLInputElement>,
  onChange: (event: ChangeEvent<HTMLInputElement>) => void,
  debouncedEmailValidation: (email: string) => void,
  hasBeenValidated: boolean
): void => {
  const { value } = event.currentTarget;

  onChange(event);

  if (!hasBeenValidated) {
    return;
  }

  debouncedEmailValidation(value);
};

export const EmailFieldHelper = {
  checkEmailValidity,
  handleBlur,
  handleChange,
};
