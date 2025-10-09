import { type InjectionKey, type Plugin, inject } from "vue";

import { FrontendSDK } from "@/types";

const KEY: InjectionKey<FrontendSDK> = Symbol("FrontendSDK");

// Define SDK interface based on Caido Plugin SDK
export interface CaidoSDK {
  findings: {
    onSelect: (findingType: string, callback: (finding: any) => void) => void;
    create: (finding: any) => Promise<void>;
    getAll: () => Promise<any[]>;
  };
  navigation: {
    addPage: (path: string, options: { body: HTMLElement }) => void;
  };
  sidebar: {
    registerItem: (label: string, path: string) => void;
  };
  contextMenu: {
    register: (config: any) => void;
    _handlers?: Array<{
      group: string;
      items: Array<{
        label: string;
        handler: (context: any) => void;
      }>;
    }>;
  };
  notifications: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  window: {
    showToast: (message: string, options?: {
      variant?: "success" | "error" | "warning" | "info";
      duration?: number;
    }) => void;
  };
  console: {
    log: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
  };
}

// Remove mock SDK - not needed in production

// Global SDK instance
let sdkInstance: CaidoSDK | null = null;

// Initialize SDK
export const initSDK = () => {
  try {
    // Try to access Caido SDK if available
    if (window.caido && window.caido.sdk) {
      sdkInstance = window.caido.sdk;
    }
  } catch (error) {
    console.error('Failed to initialize SDK:', error);
  }
  
  return sdkInstance;
};

// Hook to use the SDK in components
export const useSDK = () => {
  // Initialize SDK if not already done
  if (!sdkInstance) {
    sdkInstance = initSDK();
  }
  
  return sdkInstance;
};

// Add type declaration for window
declare global {
  interface Window {
    caido?: {
      sdk: CaidoSDK;
    };
  }
}

/*
 * This is the plugin that will provide the FrontendSDK to VueJS
 * To access the frontend SDK from within a component, use the `useSDK` function.
 */
export const SDKPlugin: Plugin = (app: any, sdk: FrontendSDK) => {
  app.provide(KEY, sdk);
};
