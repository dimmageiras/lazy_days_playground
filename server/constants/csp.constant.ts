/**
 * Content Security Policy (CSP) directives for production
 * CSP helps prevent XSS attacks by controlling which resources can be loaded
 *
 * Note: upgradeInsecureRequests is a boolean CSP directive that takes an empty array
 * to enable automatic upgrading of HTTP requests to HTTPS
 */
const CSP_DIRECTIVES = {
  baseUri: ["'self'"], // Prevents base tag injection attacks
  connectSrc: ["'self'"], // Restricts fetch, XMLHttpRequest, WebSocket, etc.
  defaultSrc: ["'self'"], // Fallback for other fetch directives
  fontSrc: ["'self'"], // Restricts font sources
  formAction: ["'self'"], // Restricts form submission targets
  frameAncestors: ["'none'"], // Prevents clickjacking (replaces X-Frame-Options)
  imgSrc: ["'self'", "data:", "https:"], // Allows images from self, data URIs, and HTTPS
  objectSrc: ["'none'"], // Prevents embedding objects like Flash or Silverlight
  reportUri: ["/api/csp-report"], // Optional: where to send CSP violations
  scriptSrc: ["'self'"], // Restricts script sources
  styleSrc: ["'self'", "'unsafe-inline'"], // Needed for React SSR inline styles
  upgradeInsecureRequests: [], // Automatically upgrades HTTP requests to HTTPS
};

export { CSP_DIRECTIVES };
