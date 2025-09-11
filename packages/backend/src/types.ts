import type { DefineAPI, DefineEvents, SDK } from "caido:plugin";

// Define the plugin API
export type API = DefineAPI<{
  analyzeJWT: (params: {
    token: string;
    requestId: string;
    source: 'request' | 'response' | 'manual';
  }) => Promise<{
    kind: string;
    value?: Finding;
    error?: string;
  }>;
  getRequests(): Promise<{ kind: string; value?: CapturedRequest[]; error?: string }>;
  getRequest(id: string): Promise<{ kind: string; value?: CapturedRequest; error?: string }>;
  clearRequests(): Promise<{ kind: string; error?: string }>;
}>;

// Define events that the backend can emit
export type BackendEvents = DefineEvents<{
  "jwt:analyzed": (finding: Finding) => void;
  "request:captured": (request: CapturedRequest) => void;
  "request:updated": (request: UpdatedRequest) => void;
  "requests:cleared": () => void;
}>;

export type CaidoBackendSDK = SDK<API, BackendEvents>;

// Types for better code organization
export interface JWTHeader {
  alg: string;
  typ?: string;
  kid?: string;
  origAlg?: string;
  [key: string]: any;
}

export interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: any;
}

export interface JWTRisk {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  impact: string;
}

export interface JWTAnalysisResult {
  risks: JWTRisk[];
  suggestions: string[];
}

export interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  metadata: {
    token: string;
    header: JWTHeader;
    payload: JWTPayload;
    expStatus: 'valid' | 'expired' | 'not_yet_valid';
    risks: JWTRisk[];
    suggestions: string[];
    issuedAt: string;
    expiresAt: string;
    timeLeft: string;
    issuer: string;
    subject: string;
    audience: string;
    source: 'request' | 'response' | 'manual';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  };
}

export interface CapturedResponse {
  statusCode: number;
  headers: Record<string, string>;
  hasJwt: boolean;
  jwtLocations?: string[];
}

export interface CapturedRequest {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  hasJwt: boolean;
  jwtLocations?: string[];
  response?: CapturedResponse;
} 

interface UpdatedRequest {
  requestId: string;
  hasResponse: boolean;
}
