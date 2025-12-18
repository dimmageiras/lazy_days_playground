import type { CamelCase, KeyAsString, ValueOf } from "type-fest";

import type { HttpErrorStatuses } from "@server/types/http-status.type";

import { GEL_ERROR_OBJECTS } from "../constants/gel-db.constant.ts";
import { HTTP_STATUS } from "../constants/http-status.constant.ts";

type HandleAuthErrorArgs<TErrorStatus extends ValueOf<HttpErrorStatuses>> =
  Partial<{
    [key in CamelCase<KeyAsString<typeof GEL_ERROR_OBJECTS>>]: {
      details: string;
      errorMessageResponse: string;
      statusCode: TErrorStatus;
    };
  }> & {
    error: Error;
  };

interface HandleAuthErrorReturn<
  TErrorStatus extends ValueOf<HttpErrorStatuses>
> {
  details: string;
  errorMessageResponse: string;
  statusCode: TErrorStatus | HttpErrorStatuses["SERVICE_UNAVAILABLE"];
}

const validateErrorParam = <TParam>(
  param: TParam | undefined,
  paramName: string
): TParam => {
  if (!param) {
    throw new Error(`${paramName} is required`);
  }

  return param;
};

const handleAuthError = <
  TErrorStatus extends HttpErrorStatuses[keyof HttpErrorStatuses]
>({
  backendError,
  error,
  invalidDataError,
  invalidReferenceError,
  noIdentityFoundError,
  pkceVerificationFailedError,
  queryError,
  userAlreadyRegisteredError,
  userError,
  verificationError,
  verificationTokenExpiredError,
}: HandleAuthErrorArgs<TErrorStatus>): HandleAuthErrorReturn<TErrorStatus> => {
  const {
    BACKEND_ERROR,
    INVALID_DATA_ERROR,
    INVALID_REFERENCE_ERROR,
    NO_IDENTITY_FOUND_ERROR,
    PKCE_VERIFICATION_FAILED_ERROR,
    QUERY_ERROR,
    USER_ALREADY_REGISTERED_ERROR,
    USER_ERROR,
    VERIFICATION_ERROR,
    VERIFICATION_TOKEN_EXPIRED_ERROR,
  } = GEL_ERROR_OBJECTS;
  const { SERVICE_UNAVAILABLE } = HTTP_STATUS;

  switch (true) {
    case error instanceof INVALID_DATA_ERROR:
      return validateErrorParam(invalidDataError, "Invalid data error");

    case error instanceof NO_IDENTITY_FOUND_ERROR:
      return validateErrorParam(
        noIdentityFoundError,
        "No identity found error"
      );

    case error instanceof USER_ALREADY_REGISTERED_ERROR:
      return validateErrorParam(
        userAlreadyRegisteredError,
        "User already registered error"
      );

    case error instanceof VERIFICATION_TOKEN_EXPIRED_ERROR:
      return validateErrorParam(
        verificationTokenExpiredError,
        "Verification token expired error"
      );

    case error instanceof PKCE_VERIFICATION_FAILED_ERROR:
      return validateErrorParam(
        pkceVerificationFailedError,
        "PKCE verification failed error"
      );

    case error instanceof VERIFICATION_ERROR:
      return validateErrorParam(verificationError, "Verification error");

    case error instanceof INVALID_REFERENCE_ERROR:
      return validateErrorParam(
        invalidReferenceError,
        "Invalid reference error"
      );

    case error instanceof QUERY_ERROR:
      return validateErrorParam(queryError, "Query error");

    case error instanceof USER_ERROR:
      return validateErrorParam(userError, "User error");

    case error instanceof BACKEND_ERROR:
      if (backendError) {
        return backendError;
      }

      break;

    default:
      break;
  }

  return {
    details: "An unexpected error occurred. Please try again later.",
    errorMessageResponse: "Service temporarily unavailable",
    statusCode: SERVICE_UNAVAILABLE,
  };
};

export const GelDbHelper = { handleAuthError };
