import type { CamelCase } from "type-fest";

import type { HttpErrorStatuses } from "@server/types/http-status.type";

import { GEL_ERROR_OBJECTS } from "../constants/gel-db.constant.ts";
import { HTTP_STATUS } from "../constants/http-status.constant.ts";

type HandleAuthErrorArgs<
  TErrorStatus extends HttpErrorStatuses[keyof HttpErrorStatuses]
> = Partial<{
  [key in CamelCase<keyof typeof GEL_ERROR_OBJECTS>]: {
    details: string;
    errorMessageResponse: string;
    statusCode: TErrorStatus;
  };
}> & {
  error: Error;
};

interface HandleAuthErrorReturn<
  TErrorStatus extends HttpErrorStatuses[keyof HttpErrorStatuses]
> {
  details: string;
  errorMessageResponse: string;
  statusCode: TErrorStatus | HttpErrorStatuses["SERVICE_UNAVAILABLE"];
}

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
    case error instanceof INVALID_DATA_ERROR: {
      if (!invalidDataError) {
        throw new Error("Invalid data error is required");
      }

      return invalidDataError;
    }

    case error instanceof NO_IDENTITY_FOUND_ERROR: {
      if (!noIdentityFoundError) {
        throw new Error("No identity found error is required");
      }

      return noIdentityFoundError;
    }

    case error instanceof USER_ALREADY_REGISTERED_ERROR: {
      if (!userAlreadyRegisteredError) {
        throw new Error("User already registered error is required");
      }

      return userAlreadyRegisteredError;
    }

    case error instanceof VERIFICATION_TOKEN_EXPIRED_ERROR: {
      if (!verificationTokenExpiredError) {
        throw new Error("Verification token expired error is required");
      }

      return verificationTokenExpiredError;
    }

    case error instanceof PKCE_VERIFICATION_FAILED_ERROR: {
      if (!pkceVerificationFailedError) {
        throw new Error("PKCE verification failed error is required");
      }

      return pkceVerificationFailedError;
    }

    case error instanceof VERIFICATION_ERROR: {
      if (!verificationError) {
        throw new Error("Verification error is required");
      }

      return verificationError;
    }

    case error instanceof INVALID_REFERENCE_ERROR: {
      if (!invalidReferenceError) {
        throw new Error("Invalid reference error is required");
      }

      return invalidReferenceError;
    }

    case error instanceof QUERY_ERROR: {
      if (!queryError) {
        throw new Error("Query error is required");
      }

      return queryError;
    }

    case error instanceof USER_ERROR: {
      if (!userError) {
        throw new Error("User error is required");
      }

      return userError;
    }

    case error instanceof BACKEND_ERROR:
    default: {
      if (backendError) {
        return backendError;
      }

      return {
        details: "An unexpected error occurred. Please try again later.",
        errorMessageResponse: "Service temporarily unavailable",
        statusCode: SERVICE_UNAVAILABLE,
      };
    }
  }
};

export const GelDbHelper = { handleAuthError };
