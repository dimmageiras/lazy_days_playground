import { API_REPORTS_ENDPOINTS } from "../../shared/constants/api.constant.ts";
import { API_CSP_REPORTS_BASE_URL } from "../../shared/constants/base-urls.constant.ts";

const { CREATE_CSP_REPORT } = API_REPORTS_ENDPOINTS;

/**
 * Routes excluded from CSRF validation.
 * - CSP report: browser-initiated reports that cannot send a CSRF token.
 * All other mutating requests (DELETE, PATCH, POST, PUT) require a valid x-csrf-token header.
 */
const CSRF_EXCLUDED_PATHS = new Set([
  `/${API_CSP_REPORTS_BASE_URL}/${CREATE_CSP_REPORT}`,
]);

const CSRF_HEADER = "x-csrf-token" as const;

export { CSRF_EXCLUDED_PATHS, CSRF_HEADER };
