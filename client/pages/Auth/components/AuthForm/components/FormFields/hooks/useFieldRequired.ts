import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { authFormSchema } from "@client/pages/Auth/components/AuthForm/schemas/auth-form.schema";
import type {
  AuthFormData,
  AuthFormField,
} from "@client/pages/Auth/components/AuthForm/types/auth-form.type";

const { checkFieldIsRequiredInDiscriminatedUnion } = FormUtilsHelper;

const useFieldRequired = (field: AuthFormField): boolean => {
  const { control } = useFormContext<AuthFormData>();
  const mode = useWatch({ control, name: "mode" });

  return useMemo(
    () => checkFieldIsRequiredInDiscriminatedUnion(authFormSchema, field, mode),
    [field, mode],
  );
};

export { useFieldRequired };
