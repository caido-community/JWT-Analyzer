import type { FrontendSDK, CapturedRequest } from "@/types";
import { requestStore } from "./requestStore";

/**
 * Set up event listeners for request-related events
 */
export function initializeRequestEvents(sdk: FrontendSDK) {
  // Log:("[JWT Analyzer] Initializing request events");

  // Listen for new requests
  sdk.backend.onEvent("request:captured", (request: CapturedRequest) => {
    // Log:("[JWT Analyzer] Received request:captured event:", request.id);
    requestStore.addRequest(request);
  });

  // Listen for new responses
  sdk.backend.onEvent("response:captured", (data: { requestId: string, response: any }) => {
    // Log:("[JWT Analyzer] Received response:captured event for request:", data.requestId);
    // We'll need to refresh the request to get the updated data with response
    loadRequestWithResponse(sdk, data.requestId);
  });

  // Listen for requests cleared
  sdk.backend.onEvent("requests:cleared", () => {
    // Log:("[JWT Analyzer] Received requests:cleared event");
    requestStore.clearRequests();
  });

  // Load initial requests
  loadInitialRequests(sdk);
}

/**
 * Load initial requests from the backend
 */
async function loadInitialRequests(sdk: FrontendSDK) {
  try {
    // Log:("[JWT Analyzer] Loading requests from backend...");
    requestStore.setLoading(true);
    requestStore.setError(null);

    const response = await sdk.backend.getRequests();
    
    if (response.kind === "Success" && response.value) {
      // Log:(`[JWT Analyzer] Loaded ${response.value.length} requests from backend`);
      requestStore.setRequests(response.value);
    } else {
      console.warn("[JWT Analyzer] Failed to load requests:", response.error);
      requestStore.setError(response.error || "Failed to load requests");
    }
  } catch (error) {
    // Error:("[JWT Analyzer] Error loading requests:", error);
    requestStore.setError("Error loading requests");
  } finally {
    requestStore.setLoading(false);
  }
}

/**
 * Load a specific request with its response data
 */
async function loadRequestWithResponse(sdk: FrontendSDK, requestId: string) {
  try {
    // Log:(`[JWT Analyzer] Loading request with response: ${requestId}`);
    
    const response = await sdk.backend.getRequest(requestId);
    
    if (response.kind === "Success" && response.value) {
      // Log:(`[JWT Analyzer] Loaded request with response: ${requestId}`);
      // Update the request in the store
      requestStore.addRequest(response.value);
    } else {
      console.warn(`[JWT Analyzer] Failed to load request with response: ${requestId}`, response.error);
    }
  } catch (error) {
    // Error:(`[JWT Analyzer] Error loading request with response: ${requestId}`, error);
  }
} 