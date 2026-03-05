import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import { RequestViewModeContainer } from "./components/RequestViewMode";
import { ResponseViewModeContainer } from "./components/ResponseViewMode";
import { SDKPlugin } from "./plugins/sdk";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import {
  analyzeJWTSecurity,
  buildFinding,
  decodeJWT,
  extractJWTs,
  hasJWT,
} from "./utils/jwt";
import App from "./views/App.vue";

const PAGE_PATH = "/jwt-analyzer";
const PLUGIN_ROOT_ID = "plugin--jwt-analyzer";

const Commands = {
  sendToAnalyzer: "jwt-analyzer.send-to-analyzer",
  sendResponseToAnalyzer: "jwt-analyzer.send-response-to-analyzer",
} as const;

type ViewModeOptions = {
  label: string;
  view: { component: unknown; props?: Record<string, unknown> };
  when?: (...args: unknown[]) => boolean;
};

type ExtendedViewModeSDK = {
  addRequestViewMode: (options: ViewModeOptions) => void;
  addResponseViewMode: (options: ViewModeOptions) => void;
};

type ResponseContext = {
  response?: { raw?: string | { toText?: () => string } };
  request?: { host?: string; path?: string; port?: number; isTls?: boolean };
};

function getRawFromContext(
  context: unknown,
): { raw: string; id?: string } | undefined {
  const ctx = context as {
    type: string;
    request?: { type?: string; raw?: string; id?: string };
  };

  if (ctx.type === "RequestContext" && ctx.request !== undefined) {
    return { raw: ctx.request.raw ?? "", id: ctx.request.id };
  }

  return undefined;
}

function getRawFromResponseContext(context: ResponseContext): string {
  const raw = context.response?.raw;
  if (typeof raw === "string") return raw;
  if (raw !== null && raw !== undefined && typeof raw.toText === "function") {
    return raw.toText?.() ?? "";
  }
  return "";
}

function sendTokenToDashboard(
  sdk: FrontendSDK,
  token: string,
  source: "request" | "response" | "manual",
): void {
  const decoded = decodeJWT(token);
  if (decoded === undefined) {
    sdk.window.showToast("Failed to decode JWT token", { variant: "error" });
    return;
  }

  const analysis = analyzeJWTSecurity(decoded.header, decoded.payload);
  const finding = buildFinding(
    token,
    decoded.header,
    decoded.payload,
    analysis.risks,
    analysis.suggestions,
    source,
  );

  window.dispatchEvent(
    new CustomEvent("add-token-to-dashboard", { detail: { finding } }),
  );
  window.location.hash = PAGE_PATH;
  sdk.window.showToast("JWT token sent to Dashboard", { variant: "success" });
}

export const init = (sdk: FrontendSDK) => {
  const app = createApp(App);
  app.use(PrimeVue, { unstyled: true, pt: Classic });
  app.use(SDKPlugin, sdk);

  const root = document.createElement("div");
  Object.assign(root.style, { height: "100%", width: "100%" });
  root.id = PLUGIN_ROOT_ID;
  app.mount(root);

  sdk.navigation.addPage(PAGE_PATH, { body: root });
  sdk.sidebar.registerItem("JWT Analyzer", PAGE_PATH, {
    icon: "fa-solid fa-key",
  });

  sdk.commands.register(Commands.sendToAnalyzer, {
    name: "Send to JWT Analyzer",
    group: "JWT Analyzer",
    run: (context) => {
      const info = getRawFromContext(context);
      if (info === undefined) {
        sdk.window.showToast("No request selected", { variant: "warning" });
        return;
      }

      const tokens = extractJWTs(info.raw);
      const token = tokens[0];

      if (token === undefined || token.length === 0) {
        sdk.window.showToast("No JWT found in this request", {
          variant: "warning",
        });
        return;
      }

      sendTokenToDashboard(sdk, token, "request");
    },
    when: (context) => {
      const info = getRawFromContext(context);
      if (info === undefined) return false;
      return hasJWT(info.raw);
    },
  });

  sdk.menu.registerItem({
    type: "Request",
    commandId: Commands.sendToAnalyzer,
    leadingIcon: "fas fa-key",
  });

  sdk.commands.register(Commands.sendResponseToAnalyzer, {
    name: "Send to JWT Analyzer",
    group: "JWT Analyzer",
    run: (context) => {
      const raw = getRawFromResponseContext(context as ResponseContext);

      const tokens = extractJWTs(raw);
      const token = tokens[0];

      if (token === undefined || token.length === 0) {
        sdk.window.showToast("No JWT found in this response", {
          variant: "warning",
        });
        return;
      }

      sendTokenToDashboard(sdk, token, "response");
    },
    when: (context) => {
      const raw = getRawFromResponseContext(context as ResponseContext);
      return hasJWT(raw);
    },
  });

  sdk.menu.registerItem({
    type: "Response",
    commandId: Commands.sendResponseToAnalyzer,
    leadingIcon: "fas fa-key",
  });

  const requestViewMode: ViewModeOptions = {
    label: "JWT",
    view: { component: RequestViewModeContainer },
    when: (request: unknown) => {
      const req = request as { raw?: string } | undefined;
      return hasJWT(req?.raw ?? "");
    },
  };

  const responseViewMode: ViewModeOptions = {
    label: "JWT",
    view: { component: ResponseViewModeContainer },
    when: (response: unknown) => {
      const res = response as { raw?: string } | undefined;
      return hasJWT(res?.raw ?? "");
    },
  };

  const surfaces = [
    sdk.httpHistory,
    sdk.replay,
    sdk.search,
    sdk.sitemap,
    sdk.intercept,
  ] as unknown as ExtendedViewModeSDK[];

  for (const surface of surfaces) {
    try {
      surface.addRequestViewMode(requestViewMode);
    } catch {
      /* ignore */
    }
    try {
      surface.addResponseViewMode(responseViewMode);
    } catch {
      /* ignore */
    }
  }
};
