import { useLayoutEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { FORM_MODES } from "@client/pages/Auth/components/AuthForm/constants/auth-form.constant";
import type { AuthFormData } from "@client/pages/Auth/components/AuthForm/types/auth-form.type";
import { TIMING } from "@shared/constants/timing.constant";

const { CHECK_EMAIL, SIGNIN, SIGNUP } = FORM_MODES;
const { SECONDS_HALF_IN_MS } = TIMING;

const useAuthFieldFocus = (): void => {
  const { control, setFocus } = useFormContext<AuthFormData>();
  const mode = useWatch({ control: control, name: "mode" });
  const firstRenderRef = useRef(true);

  const isCheckEmailMode = mode === CHECK_EMAIL;
  const isSigninMode = mode === SIGNIN;
  const isSignupMode = mode === SIGNUP;

  useLayoutEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isCheckEmailMode) {
      timeout = setTimeout(
        () => {
          setFocus("email");
        },
        firstRenderRef.current ? 0 : SECONDS_HALF_IN_MS,
      );
    }

    if (isSigninMode || isSignupMode) {
      timeout = setTimeout(() => {
        setFocus("password");
      }, SECONDS_HALF_IN_MS);

      if (firstRenderRef.current) {
        firstRenderRef.current = false;
      }
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [isCheckEmailMode, isSigninMode, isSignupMode, setFocus]);
};

export { useAuthFieldFocus };
