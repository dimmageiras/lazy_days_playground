import { API_REPORTS_ENDPOINTS } from "../../shared/constants/api.constant.ts";
import { API_REPORTS_BASE_URL } from "../../shared/constants/base-urls.constant.ts";

const { CREATE_CSP_REPORT } = API_REPORTS_ENDPOINTS;

/**
 * Content Security Policy (CSP) directives for production
 * CSP helps prevent XSS attacks by controlling which resources can be loaded
 *
 * Note: upgradeInsecureRequests is a boolean CSP directive that takes an empty array
 * to enable automatic upgrading of HTTP requests to HTTPS
 */
const CSP_DIRECTIVES = Object.freeze({
  baseUri: ["'self'"], // Prevents base tag injection attacks
  connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections for Vite HMR
  defaultSrc: ["'self'"], // Fallback for other fetch directives
  fontSrc: ["'self'", "https://fonts.gstatic.com"], // Allow Google Fonts
  formAction: ["'self'"], // Restricts form submission targets
  frameAncestors: ["'none'"], // Prevents clickjacking (replaces X-Frame-Options)
  imgSrc: ["'self'", "data:", "https:"], // Allows images from self, data URIs, and HTTPS
  objectSrc: ["'none'"], // Prevents embedding objects like Flash or Silverlight
  reportUri: [`${API_REPORTS_BASE_URL}/${CREATE_CSP_REPORT}`], // Where to send CSP violations
  scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for React Router SSR
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // Needed for React SSR inline styles and Google Fonts
  upgradeInsecureRequests: [], // Automatically upgrades HTTP requests to HTTPS
} as const);

export { CSP_DIRECTIVES };
