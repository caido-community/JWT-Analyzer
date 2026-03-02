import { type Caido } from "@caido/sdk-frontend";

/** No backend package; frontend-only plugin. */
export type FrontendSDK = Caido<Record<string, never>, Record<string, never>>;
