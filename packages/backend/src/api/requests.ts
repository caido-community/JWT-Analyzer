import { CaidoBackendSDK, CapturedRequest } from "../types";
import { RequestStore } from "../stores/requestStore";

export async function getRequests(sdk: CaidoBackendSDK): Promise<{ kind: string; value?: CapturedRequest[]; error?: string }> {
  try {
    const requestStore = RequestStore.getInstance(sdk);
    const requests = await requestStore.getRequests();
    
    return {
      kind: "Success",
      value: requests
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    sdk.console.error(`Error in getRequests: ${errorMessage}`);
    
    return {
      kind: "Error",
      error: `Error getting requests: ${errorMessage}`
    };
  }
}

export async function getRequest(
  sdk: CaidoBackendSDK,
  id: string
): Promise<{ kind: string; value?: CapturedRequest; error?: string }> {
  try {
    if (!id) {
      return {
        kind: "Error",
        error: "No request ID provided"
      };
    }
    
    const requestStore = RequestStore.getInstance(sdk);
    const request = await requestStore.getRequest(id);
    
    if (!request) {
      return {
        kind: "Error",
        error: `Request with ID ${id} not found`
      };
    }
    
    return {
      kind: "Success",
      value: request
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    sdk.console.error(`Error in getRequest: ${errorMessage}`);
    
    return {
      kind: "Error",
      error: `Error getting request: ${errorMessage}`
    };
  }
}

export async function clearRequests(sdk: CaidoBackendSDK): Promise<{ kind: string; error?: string }> {
  try {
    const requestStore = RequestStore.getInstance(sdk);
    await requestStore.clearRequests();
    
    sdk.api.send("requests:cleared");
    
    return {
      kind: "Success"
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    sdk.console.error(`Error in clearRequests: ${errorMessage}`);
    
    return {
      kind: "Error",
      error: `Error clearing requests: ${errorMessage}`
    };
  }
} 