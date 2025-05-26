import type { SDK } from "caido:plugin";
import { API, BackendEvents } from "./types";
import { analyzeJWT } from "./api/analyzer";
import { handleRequestInterceptor, handleResponseInterceptor, handleContextMenu } from "./services/eventHandlers";
// Use a type assertion to handle missing module
// @ts-ignore - Module might not exist at type checking time but will be available at runtime
import { getRequests, getRequest, clearRequests } from "./api/requests";
import { RequestStore } from "./stores/requestStore";

/**
 * Initialize the plugin
 */
export function init(sdk: SDK<API, BackendEvents>) {
  sdk.console.log("JWT Analyzer plugin initializing...");

  // Initialize the RequestStore with the SDK
  RequestStore.getInstance(sdk);
  
  // Register HTTP interceptors
  sdk.events.onInterceptRequest((sdk, request) => {
    try {
      handleRequestInterceptor(sdk, request);
    } catch (error) {
      sdk.console.error(`Error in request interceptor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  sdk.events.onInterceptResponse((sdk, request, response) => {
    try {
      handleResponseInterceptor(sdk, request, response);
    } catch (error) {
      sdk.console.error(`Error in response interceptor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Register API methods
  sdk.api.register("analyzeJWT", analyzeJWT);
  sdk.api.register("getRequests", getRequests);
  sdk.api.register("getRequest", getRequest);
  sdk.api.register("clearRequests", clearRequests);
  
  // Log successful initialization
  sdk.console.log("JWT Analyzer plugin initialized successfully!");
}

// Re-export types
export type { API, BackendEvents };