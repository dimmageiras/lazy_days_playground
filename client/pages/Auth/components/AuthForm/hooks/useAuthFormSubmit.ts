import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { type SingleFetchRedirect, useNavigate } from "react-router";

import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { AUTH_FORM_MODES } from "@client/pages/Auth/components/AuthForm/constants/auth-form.constant";
import type {
  AuthFormData,
  CheckEmailSuccess,
} from "@client/pages/Auth/components/AuthForm/types/auth-form.type";
import { decodeAuthActionResponse } from "@client/pages/Auth/helpers/auth-action-response.helper";
import { useSubmitAuthFormMutation } from "@client/services/auth";
import { HTTP_STATUS } from "@server/constants/http-status.constant";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";
import { StringUtilsHelper } from "@shared/helpers/string-utils.helper";

const { CHECK_EMAIL, SIGNIN, SIGNUP } = AUTH_FORM_MODES;
const { TEMPORARY_REDIRECT } = HTTP_STATUS;

const { formDataFromObject } = FormUtilsHelper;
const { hasObjectKey } = ObjectUtilsHelper;
const { isString } = StringUtilsHelper;

interface UseAuthSubmitReturn {
  onValid: (data: AuthFormData) => void;
}

const useAuthFormSubmit = (
  formMethods: UseFormReturn<AuthFormData>,
): UseAuthSubmitReturn => {
  const navigate = useNavigate();
  const { mutateAsync: submitAuthForm } = useSubmitAuthFormMutation();

  const onValid = useCallback(
    (formData: AuthFormData): void => {
      void (async (): Promise<void> => {
        const { data } = await submitAuthForm({
          formData: formDataFromObject(formData),
        });

        const decodedData = decodeAuthActionResponse<
          SingleFetchRedirect | { data: { defaultValues: CheckEmailSuccess } }
        >(data);

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
          const { defaultValues } = decodedData.data;

          switch (defaultValues.mode) {
            case CHECK_EMAIL:
              formMethods.reset({
                email: defaultValues.email,
                mode: CHECK_EMAIL,
              });

              break;
            case SIGNIN:
              formMethods.reset({
                email: defaultValues.email,
                mode: SIGNIN,
              });

              break;
            case SIGNUP:
              formMethods.reset({
                confirmPassword: "",
                email: defaultValues.email,
                mode: SIGNUP,
                password: "",
              });

              break;
          }
        }
      })();
    },
    [formMethods, navigate, submitAuthForm],
  );

  return {
    onValid,
  };
};

export { useAuthFormSubmit };
