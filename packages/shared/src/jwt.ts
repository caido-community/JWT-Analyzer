export type JWTHeader = {
  alg: string;
  typ?: string;
  kid?: string;
  origAlg?: string;
  [key: string]: unknown;
};

export type JWTPayload = {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
};
