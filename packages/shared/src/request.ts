export type CapturedResponse = {
  statusCode: number;
  headers: Record<string, string>;
  hasJwt: boolean;
  jwtLocations?: string[];
};

export type CapturedRequest = {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  hasJwt: boolean;
  jwtLocations?: string[];
  response?: CapturedResponse;
};
