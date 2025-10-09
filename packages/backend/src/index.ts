import type { SDK } from "caido:plugin";
import { API, BackendEvents } from "./types";
import { analyzeJWT } from "./api/analyzer";
import { handleRequestInterceptor, handleResponseInterceptor } from "./services/eventHandlers";
// @ts-ignore
import { getRequests, getRequest, clearRequests } from "./api/requests";
import { RequestStore } from "./stores/requestStore";

export function init(sdk: SDK<API, BackendEvents>) {
  RequestStore.getInstance(sdk);
  
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
  
  sdk.api.register("analyzeJWT", analyzeJWT);
  sdk.api.register("getRequests", getRequests);
  sdk.api.register("getRequest", getRequest);
  sdk.api.register("clearRequests", clearRequests);
}

export type { API, BackendEvents };