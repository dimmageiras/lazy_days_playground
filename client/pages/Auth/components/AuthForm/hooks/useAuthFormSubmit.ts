import { hydrate, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { SingleFetchRedirect } from "react-router";
import { useNavigate } from "react-router";

import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { ReactRouterHelper } from "@client/helpers/react-router.helper";
import { ROUTES_CONSTANTS } from "@client/routes/constants/routes.constant";
import { useSubmitAuthFormMutation } from "@client/services/auth";
import type {
  AuthFormData,
  AuthFormMethods,
  CheckEmailResult,
} from "@client/types/auth.type";
import { HTTP_STATUS } from "@server/constants/http-status.constant";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";
import { StringUtilsHelper } from "@shared/helpers/string-utils.helper";
import { TypeHelper } from "@shared/helpers/type.helper";

const { AUTH_PATHS, ROUTE_PATHS } = ROUTES_CONSTANTS;
const { SIGNIN, SIGNUP } = AUTH_PATHS;
const { AUTH } = ROUTE_PATHS;
const { TEMPORARY_REDIRECT } = HTTP_STATUS;

const { formDataFromObject } = FormUtilsHelper;
const { hasObjectKey } = ObjectUtilsHelper;
const { decodeFlightLikePayload } = ReactRouterHelper;
const { isString } = StringUtilsHelper;
const { castAsType } = TypeHelper;

type UseAuthFormSubmitHook = (formMethods: AuthFormMethods) => {
  onValid: (formData: AuthFormData) => void;
};

const useAuthFormSubmit: UseAuthFormSubmitHook = (formMethods) => {
  const navigate = useNavigate();
  const { mutateAsync: submitAuthForm } = useSubmitAuthFormMutation();
  const queryClient = useQueryClient();

  const onValid = useCallback(
    (formData: AuthFormData): void => {
      void (async (): Promise<void> => {
        const { data } = await submitAuthForm({
          formData: formDataFromObject(formData),
        });

        const decodedData = castAsType<
          SingleFetchRedirect | { data: CheckEmailResult }
        >(decodeFlightLikePayload(data));

        if (
          hasObjectKey(decodedData, "status") &&
          decodedData.status === TEMPORARY_REDIRECT
        ) {
          const location = decodedData.redirect;

          if (isString(location) && location.length > 0) {
            navigate(location, { replace: true });

            return;
          }
        }

        if (
          hasObjectKey(decodedData, "data") &&
          decodedData.data.defaultValues
        ) {
          const { data } = decodedData;

          if (data.dehydratedState) {
            hydrate(queryClient, data.dehydratedState);
          }

          const { defaultValues } = data;

          switch (defaultValues.mode) {
            case SIGNIN:
              formMethods.reset({
                email: defaultValues.email,
                mode: SIGNIN,
              });
              navigate(`/${AUTH}/${SIGNIN}`, {
                replace: true,
                state: { isAuthCheckEmailComplete: true },
              });

              break;
            case SIGNUP:
              formMethods.reset({
                confirmPassword: "",
                email: defaultValues.email,
                mode: SIGNUP,
                password: "",
              });
              navigate(`/${AUTH}/${SIGNUP}`, {
                replace: true,
                state: { isAuthCheckEmailComplete: true },
              });

              break;
          }
        }
      })();
    },
    [formMethods, navigate, queryClient, submitAuthForm],
  );

  return {
    onValid,
  };
};

export { useAuthFormSubmit };
