const USER_ENDPOINTS = Object.freeze({
  CHECK_EMAIL: "check-email",
} as const);

const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  STAFF: "staff",
  USER: "user",
} as const);

export { USER_ENDPOINTS, USER_ROLES };
