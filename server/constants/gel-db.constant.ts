import {
  InvalidDataError,
  NoIdentityFoundError,
  PKCEVerificationFailedError,
  UserAlreadyRegisteredError,
  UserError,
  VerificationError,
  VerificationTokenExpiredError,
} from "@gel/auth-core";
import { BackendError, InvalidReferenceError, QueryError } from "gel";

/**
 * Gel error objects used across the application
 */
const GEL_ERROR_OBJECTS = Object.freeze({
  BACKEND_ERROR: BackendError,
  INVALID_DATA_ERROR: InvalidDataError,
  INVALID_REFERENCE_ERROR: InvalidReferenceError,
  NO_IDENTITY_FOUND_ERROR: NoIdentityFoundError,
  PKCE_VERIFICATION_FAILED_ERROR: PKCEVerificationFailedError,
  QUERY_ERROR: QueryError,
  USER_ALREADY_REGISTERED_ERROR: UserAlreadyRegisteredError,
  USER_ERROR: UserError,
  VERIFICATION_ERROR: VerificationError,
  VERIFICATION_TOKEN_EXPIRED_ERROR: VerificationTokenExpiredError,
} as const);

export { GEL_ERROR_OBJECTS };
