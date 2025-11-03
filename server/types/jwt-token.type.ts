interface JWTPayload {
  exp: number;
  iat: number;
  iss: string;
  nbf: number;
  sub: string;
}

export type { JWTPayload };
