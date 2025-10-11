import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";

// @ts-ignore
import { createApp } from "vue";
import App from "./views/App.vue";
import JWTViewMode from "./views/JWTViewMode.vue";
import "./styles/index.css";
import "primeicons/primeicons.css";

import { SDKPlugin } from "./plugins/sdk";
import type { FrontendSDK } from "./types";
import { initializeSDK } from "./stores/sdkStore";
import { initializeFindingsEvents } from "./stores/findingsStore";
// import { initializeRequestEvents } from "./stores/requestEvents";
import { analyzeRequestJWT, extractJWTFromRequest } from "./utils/apiUtils";

// Define the toast notification interface on the window object
declare global {
  interface Window {
    showToast?: (options: { message: string; type: 'success' | 'info' | 'warn' | 'error'; timeout?: number }) => void;
  }
}

export const init = (sdk: FrontendSDK) => {
  initializeSDK(sdk);
  initializeFindingsEvents(sdk);

  const app = createApp(App);

  app.use(PrimeVue, {
    unstyled: true,
    pt: Classic,
  });

  (window as any).caidoSDK = sdk;

  app.use(SDKPlugin, sdk);

  const root = document.createElement("div");
  Object.assign(root.style, { height: "100%", width: "100%" });
  root.id = `plugin--jwt-analyzer`;

  app.mount(root);

  const pagePath = "/jwt-analyzer";
  sdk.navigation.addPage(pagePath, { body: root });
  sdk.sidebar.registerItem("JWT Analyzer", pagePath, {icon: "fa-solid fa-key",});
  
  const analyzeJWTFromRequest = async (requestId: string) => {
    try {
      const req = await sdk.graphql.request({ id: requestId });
      
      if (!req?.request?.raw) {
        showToastNotification("Could not retrieve request data", "warning");
        return;
      }

      const jwtMatches = req.request.raw.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.?[a-zA-Z0-9_-]*/g);
      const token = jwtMatches?.[0];

      if (token) {
        showToastNotification("JWT token found, analyzing...", "info");
        
        const result = await sdk.backend.analyzeJWT({
          token,
          requestId,
          source: 'request'
        });

        if (result.kind === 'Ok') {
          navigateToJWTAnalyzer();
          showToastNotification("JWT analyzed successfully", "success");
        } else {
          showToastNotification(`Analysis failed: ${result.error}`, "error");
        }
      } else {
        showToastNotification("No JWT token found in request", "warning");
      }
    } catch (error) {
      showToastNotification(`Error analyzing JWT: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const navigateToJWTAnalyzer = () => {
    location.hash = `#${pagePath}`;
  };
  
  if (sdk.contextMenu) {
    sdk.contextMenu.register({
      group: "JWT Analyzer",
      items: [
        {
          label: "Scan for JWT Token",
          handler: async (context: any) => {
            try {
              showToastNotification("Analyzing JWT token...", "info");
              
              let requestObject = null;
              
              if (context.request) {
                requestObject = context.request;
              } else if (context.row) {
                requestObject = context.row;
              } else if (context.getData && typeof context.getData === 'function') {
                try {
                  const data = context.getData();
                  requestObject = data;
                } catch (err) {}
              } else {
                requestObject = context;
              }
              
              if (!requestObject) {
                showToastNotification("No request available", "warning");
                return;
              }
              
              const token = extractJWTFromRequest(requestObject);
              
              if (token) {
                let requestId = "manual-analysis";
                if (requestObject.getId && typeof requestObject.getId === 'function') {
                  requestId = requestObject.getId() || "manual-analysis";
                } else if (requestObject.id) {
                  requestId = requestObject.id;
                }
                
                const result = await analyzeRequestJWT(sdk, token, requestId, 'request');
                navigateToJWTAnalyzer();
                showToastNotification("JWT analysis complete", "success");
              } else {
                showToastNotification("No JWT token found in the request", "error");
              }
            } catch (error) {
              showToastNotification(`Error analyzing JWT: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
            }
          }
        }
      ]
    });
  }
  
  sdk.commands.register("analyze-jwt", {
    name: "Scan for JWT Token",
    run: (context) => {
      showToastNotification("Scanning for JWT tokens...", "info");

      if (context.type === "RequestRowContext") {
        const request = context.requests?.[0];
        if (request?.id) {
          analyzeJWTFromRequest(request.id);
        } else {
          showToastNotification("No valid request selected", "warning");
        }
      } else if (context.type === "RequestContext") {
        const request = context.request;
        if (request?.id) {
          analyzeJWTFromRequest(request.id?.toString());
        } else {
          showToastNotification("No valid request selected", "warning");
        }
      } else {
        navigateToJWTAnalyzer();
        showToastNotification("JWT Analyzer opened", "info");
      }
    }
  });

  sdk.menu.registerItem({
    type: "Request",
    commandId: "analyze-jwt",
    leadingIcon: "fas fa-key",
  });

  sdk.menu.registerItem({
    type: "RequestRow",
    commandId: "analyze-jwt",
    leadingIcon: "fas fa-key",
  });

  sdk.httpHistory.addRequestViewMode({
    label: "JWT",
    view: {
      component: JWTViewMode,
    },
    condition: (request) => {
      if (!request.raw) return false;
      const jwtPattern = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.?[a-zA-Z0-9_-]*/g;
      return request.raw.match(jwtPattern) !== null;
    },
  });

    sdk.replay.addRequestViewMode({
    label: "JWT",
    view: {
      component: JWTViewMode,
    },
    condition: (request) => {
      if (!request.raw) return false;
      const jwtPattern = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.?[a-zA-Z0-9_-]*/g;
      return request.raw.match(jwtPattern) !== null;
    },
  });

    sdk.search.addRequestViewMode({
    label: "JWT",
    view: {
      component: JWTViewMode,
    },
    condition: (request) => {
      if (!request.raw) return false;
      const jwtPattern = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.?[a-zA-Z0-9_-]*/g;
      return request.raw.match(jwtPattern) !== null;
    },
  });

    sdk.sitemap.addRequestViewMode({
    label: "JWT",
    view: {
      component: JWTViewMode,
    },
    condition: (request) => {
      if (!request.raw) return false;
      const jwtPattern = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.?[a-zA-Z0-9_-]*/g;
      return request.raw.match(jwtPattern) !== null;
    },
  });
};



function showToastNotification(message: string, type: 'success' | 'info' | 'warning' | 'error') {
  try {
    const pluginSdk = (window as any).caidoSDK?.pluginSdk;
    
    if (pluginSdk && pluginSdk.notifications) {
      switch (type) {
        case 'success': pluginSdk.notifications.success(message); break;
        case 'info': pluginSdk.notifications.info(message); break;
        case 'warning': pluginSdk.notifications.warning(message); break;
        case 'error': pluginSdk.notifications.error(message); break;
      }
    }
  } catch (e) {}
  
  if (window.caidoSDK && window.caidoSDK.notifications) {
    try {
      setTimeout(() => {
        switch (type) {
          case 'success': window.caidoSDK!.notifications!.success(message); break;
          case 'info': window.caidoSDK!.notifications!.info(message); break;
          case 'warning': window.caidoSDK!.notifications!.warning(message); break;
          case 'error': window.caidoSDK!.notifications!.error(message); break;
        }
      }, 100);
    } catch (e) {}
  }
  
  if (window.caidoSDK && window.caidoSDK.window && typeof window.caidoSDK.window.showToast === 'function') {
    try {
      setTimeout(() => {
        window.caidoSDK!.window!.showToast(message, {
          variant: type === 'warning' ? 'warning' : type,
          duration: 3000
        });
      }, 200);
    } catch (e) {}
  }
}
