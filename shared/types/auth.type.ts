import type { USER_ROLES } from "../constants/user.constant";

/**
 * Base user information stored in the database
 */
interface User {
  address: string;
  createdAt: string;
  email: string;
  id: string;
  name: string;
  phone: string;
  role: (typeof USER_ROLES)[keyof typeof USER_ROLES];
  updatedAt: string;
}

/**
 * User profile data that can be edited by regular users
 * Excludes role and system fields (id, createdAt, updatedAt, role)
 */
type EditableUserProfile = Pick<User, "address" | "email" | "name" | "phone">;

/**
 * User profile data that can be edited by admins
 * Includes role field for admin-level editing
 */
interface AdminEditableUserProfile extends EditableUserProfile {
  role: User["role"];
}

/**
 * JWT token payload structure
 * Contains minimal user data for authentication
 */
interface JWTPayload {
  /** User email for logging/identification */
  email: string;
  /** Token expiration timestamp */
  exp: number;
  /** Token issued at timestamp */
  iat: number;
  /** User role for authorization */
  role: User["role"];
  /** User ID from database */
  userId: string;
}

/**
 * Refresh token payload structure
 * Contains minimal data for token renewal
 */
interface RefreshTokenPayload {
  /** Token expiration timestamp */
  exp: number;
  /** Token issued at timestamp */
  iat: number;
  /** Token version for revocation */
  tokenVersion: number;
  /** User ID from database */
  userId: string;
}

export type {
  AdminEditableUserProfile,
  EditableUserProfile,
  JWTPayload,
  RefreshTokenPayload,
  User,
};
