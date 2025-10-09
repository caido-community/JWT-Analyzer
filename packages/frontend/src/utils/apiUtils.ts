import { FrontendSDK, Finding } from "../types";

declare global {
  interface Window {
    caidoSDK?: {
      notifications?: {
        success: (message: string) => void;
        error: (message: string) => void;
        warning: (message: string) => void;
        info: (message: string) => void;
      };
      window?: {
        showToast: (message: string, options?: {
          variant?: "success" | "error" | "warning" | "info";
          duration?: number;
        }) => void;
      };
      backend?: {
        getRequest: (id: string) => Promise<{ 
          kind: string; 
          value?: any; 
          error?: string 
        }>;
        analyzeJWT: (params: any) => Promise<any>;
      };
    };
  }
}

/**
 * Helper function to handle backend API calls and manage errors
 */
export async function handleBackendCall<T>(
  promise: Promise<{ kind: string; value?: T; error?: string }>,
  sdk: FrontendSDK
): Promise<T> {
  const result = await promise;

  if (result.kind === "Error" || !result.value) {
    const errorMessage = result.error || "Unknown error occurred";
    sdk.notifications?.error(errorMessage);
    throw new Error(errorMessage);
  }

  return result.value;
}

/**
 * Function to analyze a JWT token from an HTTP request
 */
export async function analyzeRequestJWT(
  sdk: FrontendSDK, 
  token: string,
  requestId: string,
  source: 'request' | 'response' | 'manual'
): Promise<Finding> {
  return handleBackendCall(
    sdk.backend.analyzeJWT({
      token,
      requestId,
      source
    }),
    sdk
  );
}

/**
 * Extract JWT tokens from request headers or body
 */
export function extractJWTFromRequest(request: any): string | null {
  try {
    // Check if request is null or undefined
    if (!request) {
      return null;
    }
    
    // If the request has a getData method (Caido table row objects often have this)
    if (request.getData && typeof request.getData === 'function') {
      try {
        const data = request.getData();
        if (data) {
          // Check if the data object itself might have the token
          const token = extractJWTFromRequestObject(data);
          if (token) return token;
        }
      } catch (err) {
        // Continue to next method
      }
    }

    // For Caido HTTP history rows specifically - get the raw request/response data
    if (request.getRawRequest && typeof request.getRawRequest === 'function') {
      try {
        const rawRequest = request.getRawRequest();
        if (rawRequest) {
          // Look for JWT tokens in raw request
          const tokens = findJWTs(rawRequest);
          if (tokens.length > 0) {
            return tokens[0] || null;
          }
        }
      } catch (err) {
        // Continue to next method
      }
    }

    // If this is a row from the HTTP history list, try accessing common properties via row data
    if (request.getMethod && typeof request.getMethod === 'function') {
      try {
        // Try to build a complete request object from row methods
        const requestObj = {
          method: request.getMethod ? request.getMethod() : null,
          url: request.getUrl ? request.getUrl() : null,
          headers: request.getHeaders ? request.getHeaders() : null,
          body: request.getBody ? request.getBody() : null
        };
        
        // Log:("[JWT Analyzer] Built request object from row methods:", requestObj);
        const token = extractJWTFromRequestObject(requestObj);
        if (token) return token;
      } catch (err) {
        console.warn("[JWT Analyzer] Error building request from row methods:", err);
      }
    }

    // Skip the async ID fetch approach since it won't work synchronously
    // and we need to return a value immediately

    // If this is a row from the HTTP history list, it might have a request property
    // that contains the actual request object
    if (request.request && typeof request.request === 'object') {
      // Log:("[JWT Analyzer] Found nested request object, checking it");
      const token = extractJWTFromRequestObject(request.request);
      if (token) return token;
    }
    
    // For Caido HTTP history rows, check various common properties
    if (request.headers || request.body || request.url || request.raw) {
      // Log:("[JWT Analyzer] Request has standard properties, checking directly");
      const token = extractJWTFromRequestObject(request);
      if (token) return token;
    }

    // For Caido HTTP history rows, the real request might be accessible via getRequest()
    if (request.getRequest && typeof request.getRequest === 'function') {
      try {
        // Log:("[JWT Analyzer] Attempting to call getRequest()");
        const fullRequest = request.getRequest();
        // Log:("[JWT Analyzer] getRequest() returned:", fullRequest);
        if (fullRequest) {
          const token = extractJWTFromRequestObject(fullRequest);
          if (token) return token;
        }
      } catch (err) {
        console.warn("[JWT Analyzer] Error calling getRequest():", err);
      }
    }
    
    // Try one last approach if nothing else worked - scan the entire object for JWT patterns
    if (request) {
      // Try to stringify the entire object and scan for JWT patterns
      try {
        const stringified = JSON.stringify(request);
        const tokens = findJWTs(stringified);
        if (tokens.length > 0) {
          // Log:("[JWT Analyzer] Found JWT token in stringified object");
          return tokens[0] || null;
        }
      } catch (err) {
        console.warn("[JWT Analyzer] Error stringifying request:", err);
      }
    }
    
    // Try one more direct approach
    return extractJWTFromRequestObject(request);
  } catch (error) {
    console.error("[JWT Analyzer] Error extracting JWT:", error);
    showNotification("Error extracting JWT token", "error");
    return null;
  }
}

/**
 * Extract JWT from a request object once we have the right object
 */
function extractJWTFromRequestObject(request: any): string | null {
  if (!request) return null;
  
  // Check for JWT in the Authorization header first
  let token = findJwtInAuthHeader(request);
  if (token) {
    showNotification("JWT token found in Authorization header", "success");
    return token;
  }

  // Look for JWT in other headers
  token = findJwtInOtherHeaders(request);
  if (token) {
    showNotification("JWT token found in headers", "success");
    return token;
  }

  // Look for JWT in the body if available
  token = findJwtInBody(request);
  if (token) {
    showNotification("JWT token found in request body", "success");
    return token;
  }

  // Look for JWT in the URL
  token = findJwtInUrl(request);
  if (token) {
    showNotification("JWT token found in URL", "success");
    return token;
  }

  // Get raw request if available
  token = findJwtInRawRequest(request);
  if (token) {
    showNotification("JWT token found in raw request", "success");
    return token;
  }

  // If we still couldn't find a token
  console.warn("[JWT Analyzer] No JWT found in the request object");
  return null;
}

function findJwtInAuthHeader(request: any): string | null {
  // Various ways a request might expose headers
  const headers = request.headers || request.requestHeaders || (request.request && request.request.headers);
  
  if (!headers) return null;
  
  // If headers is an array of {name, value} objects
  if (Array.isArray(headers)) {
    const authHeader = headers.find(
      (h: {name: string, value: string}) => 
        h.name.toLowerCase() === 'authorization'
    );
    
    if (authHeader?.value?.startsWith('Bearer ')) {
      const token = authHeader.value.replace('Bearer ', '').trim();
      if (isJWT(token)) {
        // Log:("[JWT Analyzer] Found JWT in Authorization header");
        return token;
      }
    }
  } 
  // If headers is an object
  else if (typeof headers === 'object') {
    const authHeader = 
      headers.Authorization || 
      headers.authorization || 
      headers['Authorization'] || 
      headers['authorization'];
      
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (isJWT(token)) {
        // Log:("[JWT Analyzer] Found JWT in Authorization header (object format)");
        return token;
      }
    }
  }
  
  return null;
}

function findJwtInOtherHeaders(request: any): string | null {
  // Various ways a request might expose headers
  const headers = request.headers || request.requestHeaders || (request.request && request.request.headers);
  
  if (!headers) return null;
  
  // Common JWT header names
  const jwtHeaders = [
    'x-auth-token',
    'jwt',
    'access-token',
    'id-token',
    'refresh-token',
    'x-jwt-token',
    'x-access-token',
    'id_token',
    'token'
  ];
  
  // If headers is an array of {name, value} objects
  if (Array.isArray(headers)) {
    for (const headerName of jwtHeaders) {
      const header = headers.find(
        (h: {name: string, value: string}) => 
          h.name.toLowerCase() === headerName
      );
      
      if (header?.value && isJWT(header.value)) {
        // Log:(`[JWT Analyzer] Found JWT in ${headerName} header`);
        return header.value;
      }
    }
  } 
  // If headers is an object
  else if (typeof headers === 'object') {
    for (const headerName of jwtHeaders) {
      const headerValue = 
        headers[headerName] || 
        headers[headerName.toLowerCase()] || 
        headers[headerName.toUpperCase()];
        
      if (headerValue && typeof headerValue === 'string' && isJWT(headerValue)) {
        // Log:(`[JWT Analyzer] Found JWT in ${headerName} header (object format)`);
        return headerValue;
      }
    }
  }
  
  return null;
}

function findJwtInBody(request: any): string | null {
  // Various ways a request might expose the body
  const body = 
    request.body || 
    request.requestBody || 
    (request.request && request.request.body);
  
  if (!body) return null;
  
  let bodyText: string;
  
  // Convert the body to string based on its type
  if (typeof body === 'string') {
    bodyText = body;
  } else if (typeof body.toString === 'function') {
    bodyText = body.toString();
  } else if (typeof body === 'object') {
    try {
      bodyText = JSON.stringify(body);
    } catch (e) {
      bodyText = String(body);
    }
  } else {
    bodyText = String(body);
  }
  
  // Search for JWT tokens in the body text
  const tokens = findJWTs(bodyText);
  if (tokens.length > 0) {
    // Log:("[JWT Analyzer] Found JWT in body");
    return tokens[0] || null;
  }
  
  return null;
}

function findJwtInUrl(request: any): string | null {
  // Various ways a request might expose the URL
  const url = 
    request.url || 
    request.requestUrl || 
    (request.request && request.request.url);
  
  if (!url) return null;
  
  // Search for JWT tokens in URL
  const tokens = findJWTs(url);
  if (tokens.length > 0) {
    // Log:("[JWT Analyzer] Found JWT in URL");
    return tokens[0] || null;
  }
  
  return null;
}

function findJwtInRawRequest(request: any): string | null {
  // Try to get raw request if available
  const raw = 
    request.raw || 
    request.rawRequest || 
    (request.request && request.request.raw);
  
  if (!raw) return null;
  
  // Search for JWT tokens in the raw request
  const tokens = findJWTs(raw);
  if (tokens.length > 0) {
    // Log:("[JWT Analyzer] Found JWT in raw request");
    return tokens[0] || null;
  }
  
  return null;
}

/**
 * Helper function to check if a string is a JWT token
 */
function isJWT(token: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  return parts.length === 3 && /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/.test(token);
}

/**
 * Helper function to find JWTs in a string
 */
export function findJWTs(content: string): string[] {
  if (!content) return [];
  
  const JWT_REGEX = /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;
  return Array.from(new Set(content.match(JWT_REGEX) || []));
}

// Helper to show notifications in a more reliable way
function showNotification(message: string, type: 'success' | 'info' | 'warn' | 'error'): void {
  try {
    // Try direct Caido notification if available
    if (window.caidoSDK?.notifications) {
      switch (type) {
        case 'success':
          window.caidoSDK.notifications.success(message);
          break;
        case 'info':
          window.caidoSDK.notifications.info(message);
          break;
        case 'warn':
          window.caidoSDK.notifications.warning(message);
          break;
        case 'error':
          window.caidoSDK.notifications.error(message);
          break;
      }
    } 
    // Alternative toast notification method
    else if (window.caidoSDK?.window?.showToast) {
      window.caidoSDK.window.showToast(message, {
        variant: type === 'warn' ? 'warning' : type,
        duration: 3000
      });
    }
    // Fallback to console if nothing else works
    else {
      // Log:(`[JWT Analyzer] ${type.toUpperCase()}: ${message}`);
    }
  } catch (e) {
    console.error("[JWT Analyzer] Failed to show notification:", e);
  }
} 