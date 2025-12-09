import maskdata from "maskdata";

/**
 * Masks credentials in a DSN (Data Source Name) string by replacing
 * the username:password portion with asterisks.
 *
 * @param dsn - The DSN string to mask (e.g., "gel://user:pass@host:port/db")
 * @returns The DSN with credentials masked (e.g., "gel://user:*****@host:port/db")
 *
 * @example
 * ```typescript
 * maskDsnCredentials("gel://admin:secret123@localhost:5432/my_db");
 * // Returns: "gel://admin:*********@localhost:5432/my_db"
 * ```
 */
const maskDsnCredentials = (dsn: string): string => {
  if (typeof dsn !== "string") {
    return dsn ?? "undefined";
  }

  // Find the position of // and @
  const protocolEndIndex = dsn.indexOf("//");

  if (protocolEndIndex === -1) {
    return dsn;
  }

  const credentialsEndIndex = dsn.indexOf("@", protocolEndIndex);

  if (credentialsEndIndex === -1) {
    return dsn;
  }

  const { maskPassword, maskStringV2 } = maskdata;

  // Extract parts
  const protocol = dsn.substring(0, protocolEndIndex + 2); // "protocol://"
  const host = dsn.substring(credentialsEndIndex); // "@host:port/db"
  const credentials = dsn.substring(protocolEndIndex + 2, credentialsEndIndex); // "user:pass"

  // Separate username and password
  const colonIndex = credentials.indexOf(":");

  if (colonIndex === -1) {
    // No colon found, mask the entire credentials string

    const maskedCredentials = maskStringV2(credentials, {
      maskWith: "*",
      unmaskedStartCharacters: 0,
      unmaskedEndCharacters: 0,
    });

    return `${protocol}${maskedCredentials}${host}`;
  }

  // Extract username and password separately
  const username = credentials.substring(0, colonIndex);
  const password = credentials.substring(colonIndex + 1);

  // Mask only the password part
  const maskedPassword = maskPassword(password, {
    maskWith: "*",
    unmaskedStartCharacters: 0,
    unmaskedEndCharacters: 0,
  });

  // Keep username visible but mask password
  const maskedCredentials = `${username}:${maskedPassword}`;

  return `${protocol}${maskedCredentials}${host}`;
};

export const CredentialsHelper = {
  maskDsnCredentials,
};
