import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
} from "node:crypto";
import { promisify } from "node:util";

import {
  AUTH_TAG_LENGTH,
  COOKIE_SECRET,
  IV_LENGTH,
  KEY_LENGTH,
  SALT_LENGTH,
  TOKEN_ENCRYPTION_METHOD,
} from "../../shared/constants/root-env.constant.ts";

const scryptAsync: (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer> = promisify(scrypt);

/**
 * Derives a cryptographic key from the COOKIE_SECRET
 * Uses scrypt for key derivation (OWASP recommended)
 */
const deriveKey = async (salt: Buffer): Promise<Buffer> => {
  return await scryptAsync(COOKIE_SECRET, salt, +KEY_LENGTH);
};

/**
 * Encrypts data using AES-256-GCM
 *
 * @param plaintext - The data to encrypt (e.g., JWT token)
 * @returns Encrypted data in format: salt.iv.authTag.encryptedData (all base64)
 *
 * @example
 * ```typescript
 * const encrypted = await encryptData("my-jwt-token-here");
 * // Returns: "base64salt.base64iv.base64tag.base64encrypted"
 * ```
 */
const encryptData = async (plaintext: string): Promise<string> => {
  try {
    const salt = randomBytes(+SALT_LENGTH);
    const iv = randomBytes(+IV_LENGTH);

    const key = await deriveKey(salt);

    const cipher = createCipheriv(TOKEN_ENCRYPTION_METHOD, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      salt.toString("base64"),
      iv.toString("base64"),
      authTag.toString("base64"),
      encrypted.toString("base64"),
    ].join(".");
  } catch (error) {
    throw new Error(
      `Encryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Decrypts data encrypted with encryptData
 *
 * @param encryptedData - Encrypted string in format: salt.iv.authTag.encryptedData
 * @returns Decrypted plaintext
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 *
 * @example
 * ```typescript
 * const decrypted = await decryptData(encryptedCookie);
 * // Returns: "my-jwt-token-here"
 * ```
 */
const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    const parts = encryptedData.split(".");

    if (parts.length !== 4) {
      throw new Error("Invalid encrypted data format");
    }

    const saltB64 = parts[0];
    const ivB64 = parts[1];
    const authTagB64 = parts[2];
    const encryptedB64 = parts[3];

    if (!saltB64 || !ivB64 || !authTagB64 || !encryptedB64) {
      throw new Error("Invalid encrypted data: missing parts");
    }

    const salt = Buffer.from(saltB64, "base64");
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const encrypted = Buffer.from(encryptedB64, "base64");

    if (
      salt.length !== +SALT_LENGTH ||
      iv.length !== +IV_LENGTH ||
      authTag.length !== +AUTH_TAG_LENGTH
    ) {
      throw new Error("Invalid encrypted data: incorrect lengths");
    }

    const key = await deriveKey(salt);

    const decipher = createDecipheriv(TOKEN_ENCRYPTION_METHOD, key, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    throw new Error(
      `Decryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Checks if data can be decrypted (validates format and decryption)
 *
 * @param encryptedData - Encrypted string to validate
 * @returns true if data is valid and can be decrypted
 */
const isValidEncryptedData = async (
  encryptedData: string
): Promise<boolean> => {
  try {
    await decryptData(encryptedData);

    return true;
  } catch {
    return false;
  }
};

export const EncryptionHelper = {
  decryptData,
  encryptData,
  isValidEncryptedData,
};
