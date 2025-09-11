import type { CaidoBackendSDK, CapturedRequest } from "../types";

/**
 * Store for request and response data
 */
export class RequestStore {
  private static instance: RequestStore;
  private requests: Map<string, any> = new Map();
  private sdk: CaidoBackendSDK;

  private constructor(sdk: CaidoBackendSDK) {
    this.sdk = sdk;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(sdk: CaidoBackendSDK): RequestStore {
    if (!RequestStore.instance) {
      RequestStore.instance = new RequestStore(sdk);
    }
    return RequestStore.instance;
  }

  /**
   * Add request to store
   */
  public async addRequest(request: CapturedRequest): Promise<void> {
    try {
      if (!request.id) {
        this.sdk.console.error("Request has no ID");
        return;
      }

      // Format as raw HTTP for better display
      const rawHttpRequest = this.formatRawHttpRequest(request);

      // Store request in memory map with raw HTTP format
      this.requests.set(request.id, {
        request: {
          ...this.sanitizeForStorage(request),
          rawHttp: rawHttpRequest // Add raw HTTP format for display
        },
        response: null,
        timestamp: new Date().toISOString()
      });

      this.sdk.console.log(`Request ${request.id} added to store with raw HTTP format`);
      
      // Emit event that request was added
      try {
        this.sdk.api.send("request:updated", {
          requestId: request.id,
          hasResponse: false
        });
      } catch (error) {
        this.sdk.console.error(`Error emitting request:updated event: ${error}`);
      }
    } catch (error) {
      this.sdk.console.error(`Error adding request to store: ${error}`);
    }
  }

  /**
   * Add response to store
   */
  public async addResponse(requestId: string, response: any): Promise<void> {
    try {
      const storedData = this.requests.get(requestId);
      
      // Format as raw HTTP for better display
      const rawHttpResponse = this.formatRawHttpResponse(response);
      
      if (!storedData) {
        // If we don't have the request yet, create a new entry
        this.requests.set(requestId, {
          request: null,
          response: {
            ...this.sanitizeForStorage(response),
            rawHttp: rawHttpResponse // Add raw HTTP format for display
          },
          timestamp: new Date().toISOString()
        });
      } else {
        // Update existing entry
        storedData.response = {
          ...this.sanitizeForStorage(response),
          rawHttp: rawHttpResponse // Add raw HTTP format for display
        };
        storedData.timestamp = new Date().toISOString();
        this.requests.set(requestId, storedData);
      }

      this.sdk.console.log(`Response for request ${requestId} added to store with raw HTTP format`);
      
      // Emit event that response was added
      try {
        this.sdk.api.send("request:updated", {
          requestId: requestId,
          hasResponse: true
        });
      } catch (error) {
        this.sdk.console.error(`Error emitting request:updated event: ${error}`);
      }
    } catch (error) {
      this.sdk.console.error(`Error adding response to store: ${error}`);
    }
  }

  /**
   * Get all requests
   */
  public async getRequests(): Promise<any[]> {
    try {
      const result = Array.from(this.requests.entries()).map(([id, data]) => ({
        id,
        ...data
      }));
      
      // Sort by timestamp (newest first)
      return result.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    } catch (error) {
      this.sdk.console.error(`Error getting requests: ${error}`);
      return [];
    }
  }

  /**
   * Get a specific request by ID
   */
  public async getRequest(id: string): Promise<any | null> {
    try {
      const data = this.requests.get(id);
      if (!data) {
        return null;
      }
      return {
        id,
        ...data
      };
    } catch (error) {
      this.sdk.console.error(`Error getting request ${id}: ${error}`);
      return null;
    }
  }

  /**
   * Clear all requests
   */
  public async clearRequests(): Promise<void> {
    try {
      this.requests.clear();
      this.sdk.console.log("All requests cleared from store");
    } catch (error) {
      this.sdk.console.error(`Error clearing requests: ${error}`);
    }
  }

  /**
   * Sanitize data for storage by removing circular references
   * and trimming large objects
   */
  private sanitizeForStorage(data: any): any {
    try {
      // Clone the object to avoid modifying the original
      const seen = new WeakSet();
      
      const sanitize = (obj: any): any => {
        // Handle primitives and null
        if (obj === null || typeof obj !== 'object') {
          return obj;
        }
        
        // Handle Date objects
        if (obj instanceof Date) {
          return obj.toISOString();
        }
        
        // Handle arrays
        if (Array.isArray(obj)) {
          // Limit array size to prevent huge objects
          const maxItems = 100;
          const limitedArray = obj.slice(0, maxItems);
          return limitedArray.map(item => sanitize(item));
        }
        
        // Handle circular references
        if (seen.has(obj)) {
          return '[Circular Reference]';
        }
        
        // Add object to seen set
        seen.add(obj);
        
        // Create a new object with sanitized properties
        const result: any = {};
        
        // Limit number of properties to prevent huge objects
        const maxProps = 50;
        let propCount = 0;
        
        for (const [key, value] of Object.entries(obj)) {
          if (propCount >= maxProps) {
            result['...'] = `[${Object.keys(obj).length - maxProps} more properties]`;
            break;
          }
          
          // Skip functions
          if (typeof value === 'function') {
            continue;
          }
          
          // Sanitize value recursively
          result[key] = sanitize(value);
          propCount++;
        }
        
        return result;
      };
      
      return sanitize(data);
    } catch (error) {
      this.sdk.console.error(`Error sanitizing data for storage: ${error}`);
      return { error: "Error sanitizing data" };
    }
  }

  /**
   * Format raw HTTP request for display
   */
  private formatRawHttpRequest(request: any): string {
    try {
      if (!request) return '';
      
      // Format the request line
      let raw = `${request.method || 'GET'} ${request.url || '/'} HTTP/1.1\r\n`;
      
      // Add headers
      if (request.headers && typeof request.headers === 'object') {
        for (const [name, value] of Object.entries(request.headers)) {
          if (name && value) {
            raw += `${name}: ${value}\r\n`;
          }
        }
      }
      
      // Always add a Content-Length header if missing and we have a body
      if (request.body && typeof request.body === 'string' && request.body.length > 0) {
        if (!request.headers || !Object.keys(request.headers).some(h => h.toLowerCase() === 'content-length')) {
          raw += `Content-Length: ${request.body.length}\r\n`;
        }
      }
      
      // Always add the separator between headers and body
      raw += '\r\n';
      
      // Add body if present
      if (request.body) {
        raw += typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
      }
      
      this.sdk.console.log(`Formatted raw HTTP request (${raw.length} bytes)`);
      return raw;
    } catch (error) {
      this.sdk.console.error(`Error formatting raw HTTP request: ${error}`);
      return 'Error formatting HTTP request';
    }
  }
  
  /**
   * Format raw HTTP response for display
   */
  private formatRawHttpResponse(response: any): string {
    try {
      if (!response) return '';
      
      // Format the status line
      let raw = `HTTP/1.1 ${response.statusCode || response.status || 0} ${this.getStatusText(response.statusCode || response.status || 0)}\r\n`;
      
      // Add headers
      if (response.headers && typeof response.headers === 'object') {
        for (const [name, value] of Object.entries(response.headers)) {
          if (name && value) {
            raw += `${name}: ${value}\r\n`;
          }
        }
      }
      
      // Always add a Content-Length header if missing and we have a body
      if (response.body && typeof response.body === 'string' && response.body.length > 0) {
        if (!response.headers || !Object.keys(response.headers).some(h => h.toLowerCase() === 'content-length')) {
          raw += `Content-Length: ${response.body.length}\r\n`;
        }
      }
      
      // Always add the separator between headers and body
      raw += '\r\n';
      
      // Add body if present
      if (response.body) {
        raw += typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
      }
      
      this.sdk.console.log(`Formatted raw HTTP response (${raw.length} bytes)`);
      return raw;
    } catch (error) {
      this.sdk.console.error(`Error formatting raw HTTP response: ${error}`);
      return 'Error formatting HTTP response';
    }
  }
  
  /**
   * Get status text for status code
   */
  private getStatusText(code: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      301: 'Moved Permanently',
      302: 'Found',
      304: 'Not Modified',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    
    return statusTexts[code] || 'Unknown Status';
  }
} 