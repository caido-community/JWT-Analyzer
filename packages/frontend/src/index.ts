import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";

// @ts-ignore
import { createApp } from "vue";
import App from "./views/App.vue";
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
  // Initialize SDK and event listeners
  initializeSDK(sdk);
  initializeFindingsEvents(sdk);
  // initializeRequestEvents(sdk);

  // Load initial requests
  loadInitialRequests(sdk);

  const app = createApp(App);

  app.use(PrimeVue, {
    unstyled: true,
    pt: Classic,
  });

  // Make the SDK available globally for toast notifications
  (window as any).caidoSDK = sdk;

  app.use(SDKPlugin, sdk);

  const root = document.createElement("div");
  Object.assign(root.style, { height: "100%", width: "100%" });
  root.id = `plugin--jwt-analyzer`;

  app.mount(root);

  // Register navigation page and sidebar item
  const pagePath = "/jwt-analyzer";
  sdk.navigation.addPage(pagePath, { body: root });
  sdk.sidebar.registerItem("JWT Analyzer", pagePath, {icon: "fa-solid fa-key",});
  
  // Function to navigate to JWT Analyzer
  const navigateToJWTAnalyzer = () => {
    // Using location.hash is a reliable way to navigate
    location.hash = `#${pagePath}`;
  };
  
  // Register context menu for JWT analysis
  if (sdk.contextMenu) {
    sdk.contextMenu.register({
      group: "JWT Analyzer",
      items: [
        {
          label: "Scan for JWT Token",
          handler: async (context: any) => {
            try {
              console.log("[JWT Analyzer] Context menu handler called with context:", context);
              console.log("[JWT Analyzer] Context object keys:", Object.keys(context));
              
              // Show initial notification immediately
              showToastNotification("Scanning for JWT tokens...", "warning");
              
              // Get request object - handle both direct request and row objects
              let requestObject = null;
              
              if (context.request) {
                console.log("[JWT Analyzer] Found context.request, using it");
                requestObject = context.request;
              } else if (context.row) {
                console.log("[JWT Analyzer] Found context.row, using it as request");
                requestObject = context.row;
              } else if (context.getData && typeof context.getData === 'function') {
                console.log("[JWT Analyzer] Context has getData(), trying to use it");
                try {
                  const data = context.getData();
                  requestObject = data;
                } catch (err) {
                  console.warn("[JWT Analyzer] Error getting data from context:", err);
                }
              } else {
                console.log("[JWT Analyzer] No recognized request object in context, using context itself");
                requestObject = context;
              }
              
              // Check if we found a usable request object
              if (!requestObject) {
                console.error("[JWT Analyzer] No request available in context");
                showToastNotification("No request available", "warning");
                return;
              }
              
              // Extract JWT from request
              console.log("[JWT Analyzer] Attempting to extract JWT from request object:", requestObject);
              const token = extractJWTFromRequest(requestObject);
              
              if (token) {
                console.log("[JWT Analyzer] Found JWT token:", token.substring(0, 20) + "...");
                
                // Get the request ID - handle various ways it might be available
                let requestId = "manual-analysis";
                if (requestObject.getId && typeof requestObject.getId === 'function') {
                  requestId = requestObject.getId() || "manual-analysis";
                } else if (requestObject.id) {
                  requestId = requestObject.id;
                }
                console.log("[JWT Analyzer] Request ID:", requestId);
                
                // Show analyzing notification
                showToastNotification("JWT token found, analyzing...", "info");
                
                // Analyze the token using the backend API
                console.log("[JWT Analyzer] Calling backend analyzeJWT API...");
                const result = await analyzeRequestJWT(sdk, token, requestId, 'request');
                console.log("[JWT Analyzer] Backend API returned result:", result);
                
                // Navigate to the JWT analyzer view
                console.log("[JWT Analyzer] Navigating to JWT Analyzer dashboard");
                navigateToJWTAnalyzer();
                
                // Show success notification using multiple methods to ensure visibility
                showToastNotification("JWT token found and analyzed", "success");
              } else {
                console.warn("[JWT Analyzer] No JWT token found in the request");
                // This notification must be shown - critical fix
                showToastNotification("No JWT token found in the request", "error");
              }
            } catch (error) {
              console.error("[JWT Analyzer] Context menu error:", error);
              showToastNotification(`Error analyzing JWT: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
            }
          }
        }
      ]
    });
  }
  
  // Register a command for JWT analysis
  sdk.commands.register("analyze-jwt", {
    name: "Scan for JWT Token",
    run: (context: any) => {
      try {
        console.log("[JWT Analyzer] Command handler called with context:", context);
        console.log("[JWT Analyzer] Command context keys:", Object.keys(context));
        
        // Show initial notification
        showToastNotification("Scanning for JWT tokens...", "warning");
        
        // Get request object - handle different ways it might be available
        let requestObject = null;
              
        if (context.request) {
          console.log("[JWT Analyzer] Found context.request, using it");
          requestObject = context.request;
        } else if (context.row) {
          console.log("[JWT Analyzer] Found context.row, using it as request");
          requestObject = context.row;
        } else if (context.getData && typeof context.getData === 'function') {
          console.log("[JWT Analyzer] Context has getData(), trying to use it");
          try {
            const data = context.getData();
            requestObject = data;
          } catch (err) {
            console.warn("[JWT Analyzer] Error getting data from context:", err);
          }
        } else {
          console.log("[JWT Analyzer] No recognized request object in context, using context itself");
          requestObject = context;
        }
        
        if (requestObject) {
          // Extract JWT from request
          console.log("[JWT Analyzer] Attempting to extract JWT from request");
          const token = extractJWTFromRequest(requestObject);
          
          if (token) {
            console.log("[JWT Analyzer] Found JWT token:", token.substring(0, 20) + "...");
            
            // Get the request ID - handle various ways it might be available
            let requestId = "manual-analysis";
            if (requestObject.getId && typeof requestObject.getId === 'function') {
              requestId = requestObject.getId() || "manual-analysis";
            } else if (requestObject.id) {
              requestId = requestObject.id;
            }
            console.log("[JWT Analyzer] Request ID:", requestId);
            
            // Show analyzing notification
            showToastNotification("JWT token found, analyzing...", "info");
            
            // Analyze the token and navigate to the analyzer
            console.log("[JWT Analyzer] Calling backend analyzeJWT API...");
            analyzeRequestJWT(sdk, token, requestId, 'request')
              .then((result) => {
                console.log("[JWT Analyzer] Backend API returned result:", result);
                navigateToJWTAnalyzer();
                
                // Show success notification
                showToastNotification("JWT token found and analyzed", "success");
              })
              .catch(err => {
                console.error("[JWT Analyzer] Error analyzing JWT:", err);
                showToastNotification(`Error analyzing JWT: ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
              });
          } else {
            console.warn("[JWT Analyzer] No JWT token found in the request");
            // This notification must be shown - critical fix
            showToastNotification("No JWT token found in the request", "error");
          }
        } else {
          console.log("[JWT Analyzer] No request in context, just navigating to dashboard");
          // Navigate to the JWT analyzer page without analyzing
          navigateToJWTAnalyzer();
          showToastNotification("JWT Analyzer opened", "info");
        }
      } catch (error) {
        console.error("[JWT Analyzer] Command error:", error);
        showToastNotification(`Error analyzing JWT: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
      }
    }
  });

  // Register the menu items - more specific handler for RequestRow
  sdk.menu.registerItem({
    type: "Request",
    commandId: "analyze-jwt",
    leadingIcon: "fas fa-key",
  });

  // Dedicated item for RequestRow with its own command
  sdk.commands.register("analyze-jwt-row", {
    name: "Scan for JWT Token",
    run: async (context: any) => {
      try {
        console.log("[JWT Analyzer] Row command handler called with context:", context);
        
        // Always show initial notification immediately
        showToastNotification("Scanning for JWT tokens...", "warning");
        
        if (!context || !context.requests || !context.requests.length) {
          console.error("[JWT Analyzer] No requests in RequestRowContext");
          showToastNotification("No requests to analyze", "warning");
          return;
        }
        
        // RequestRowContext has a 'requests' array - use the first selected request
        const request = context.requests[0];
        
        if (!request || !request.id) {
          console.error("[JWT Analyzer] Invalid request in RequestRowContext");
          showToastNotification("Invalid request selected", "warning");
          return;
        }
        
        console.log("[JWT Analyzer] Processing request with ID:", request.id);
        
        // Use the GraphQL API to fetch the complete request (this is the key technique from Caido403Bypasser)
        try {
          // Execute the GraphQL request to get the full raw request data
          const req = await sdk.graphql.request({ id: request.id });
          console.log("[JWT Analyzer] GraphQL request complete for ID:", request.id);
          
          if (!req || !req.request) {
            console.error("[JWT Analyzer] GraphQL API returned no request data");
            showToastNotification("Could not retrieve request data", "warning");
            return;
          }
          
          // Extract JWT from the raw request data
          let token = null;
          
          // Check in raw request if available - this is the most reliable method
          if (req.request.raw) {
            console.log("[JWT Analyzer] Found raw request, searching for JWT");
            const jwtMatches = req.request.raw.match(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g);
            if (jwtMatches && jwtMatches.length > 0) {
              token = jwtMatches[0];
              console.log("[JWT Analyzer] Found JWT in raw request");
            }
          }
          
          // If token found, analyze it
          if (token) {
            console.log("[JWT Analyzer] Found JWT token:", token.substring(0, 20) + "...");
            showToastNotification("JWT token found, analyzing...", "info");
            
            // Analyze the token using the backend API
            console.log("[JWT Analyzer] Calling backend analyzeJWT API with request ID:", request.id);
            const result = await analyzeRequestJWT(sdk, token, request.id, 'request');
            console.log("[JWT Analyzer] Backend API returned result:", result);
            
            // Navigate to the JWT analyzer view
            navigateToJWTAnalyzer();
            
            // Show success notification
            showToastNotification("JWT token found and analyzed", "success");
          } else {
            console.warn("[JWT Analyzer] No JWT token found in the request");
            // This notification must be shown - critical fix
            showToastNotification("No JWT token found in the request", "error");
          }
        } catch (err) {
          console.error("[JWT Analyzer] Error using GraphQL API:", err);
          showToastNotification(`Error accessing request data: ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
        }
      } catch (error) {
        console.error("[JWT Analyzer] Row command error:", error);
        showToastNotification(`Error analyzing request: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
      }
    }
  });

  // Register specialized handler for RequestRow
  sdk.menu.registerItem({
    type: "RequestRow",
    commandId: "analyze-jwt-row", // Using the dedicated command for rows
    leadingIcon: "fas fa-key",
  });
};

/**
 * Load initial requests from the backend
 */
async function loadInitialRequests(sdk: FrontendSDK) {
  try {
    console.log("[JWT Analyzer] Loading initial requests...");
    const result = await sdk.backend.getRequests();
    
    if (result.kind === "Success" && result.value) {
      console.log(`[JWT Analyzer] Loaded ${result.value.length} requests`);
      // The event handler in requestEvents.ts will handle updating the store
    } else {
      console.warn("[JWT Analyzer] Failed to load requests:", result.error);
    }
  } catch (error) {
    console.error("[JWT Analyzer] Error loading requests:", error);
  }
}

/**
 * Helper function to reliably show a toast notification regardless of context
 */
function showToastNotification(message: string, type: 'success' | 'info' | 'warning' | 'error') {
  // Log the notification attempt
  console.log(`[JWT Analyzer] ${type.toUpperCase()}: ${message}`);
  
  // Try each notification method in sequence
  
  // First try direct SDK notifications - no need to access sdk from outer scope
  try {
    // Access the sdk from the plugin context
    const pluginSdk = (window as any).caidoSDK?.pluginSdk;
    
    if (pluginSdk && pluginSdk.notifications) {
      switch (type) {
        case 'success': pluginSdk.notifications.success(message); break;
        case 'info': pluginSdk.notifications.info(message); break;
        case 'warning': pluginSdk.notifications.warning(message); break;
        case 'error': pluginSdk.notifications.error(message); break;
      }
    }
  } catch (e) {
    console.error("[JWT Analyzer] Error showing notification via SDK:", e);
  }
  
  // Then try global SDK notifications
  if (window.caidoSDK && window.caidoSDK.notifications) {
    try {
      setTimeout(() => {
        switch (type) {
          case 'success': window.caidoSDK!.notifications!.success(message); break;
          case 'info': window.caidoSDK!.notifications!.info(message); break;
          case 'warning': window.caidoSDK!.notifications!.warning(message); break;
          case 'error': window.caidoSDK!.notifications!.error(message); break;
        }
      }, 100); // Slight delay to prevent conflicts
    } catch (e) {
      console.error("[JWT Analyzer] Error showing notification via global SDK:", e);
    }
  }
  
  // Finally try toast method
  if (window.caidoSDK && window.caidoSDK.window && typeof window.caidoSDK.window.showToast === 'function') {
    try {
      setTimeout(() => {
        window.caidoSDK!.window!.showToast(message, {
          variant: type === 'warning' ? 'warning' : type,
          duration: 3000
        });
      }, 200); // Slightly longer delay
    } catch (e) {
      console.error("[JWT Analyzer] Error showing toast notification:", e);
    }
  }
}
