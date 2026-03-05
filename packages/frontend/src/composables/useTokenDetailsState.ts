import type { JWTHeader, JWTPayload, JWTRisk } from "jwt-analyzer-shared";
import { computed, ref } from "vue";

export type TokenDetailsData = {
  token: string;
  header: JWTHeader;
  payload: JWTPayload;
  risks: JWTRisk[];
  suggestions: string[];
  issuer?: string;
  subject?: string;
  audience?: string;
  timeLeft?: string;
  expStatus?: "valid" | "expired" | "not_yet_valid";
  source?: "request" | "response" | "manual";
};

export type TokenTab = TokenDetailsData & {
  id: string;
  label?: string;
};

const MAX_TABS = 10;
const _tokenTabs = ref<TokenTab[]>([]);
const _activeTabIndex = ref(0);

export function useTokenDetailsState() {
  const tokenTabs = _tokenTabs;
  const activeTabIndex = _activeTabIndex;

  const activeTab = computed<TokenTab | undefined>(
    () => tokenTabs.value[activeTabIndex.value],
  );

  function addOrFocusTab(data: TokenDetailsData): void {
    const existing = tokenTabs.value.findIndex((t) => t.token === data.token);
    if (existing !== -1) {
      activeTabIndex.value = existing;
      return;
    }
    const tab: TokenTab = {
      ...data,
      id: `td-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    tokenTabs.value.push(tab);
    if (tokenTabs.value.length > MAX_TABS) tokenTabs.value.shift();
    activeTabIndex.value = Math.min(tokenTabs.value.length - 1, MAX_TABS - 1);
  }

  function closeTab(index: number): void {
    tokenTabs.value.splice(index, 1);
    if (activeTabIndex.value >= tokenTabs.value.length) {
      activeTabIndex.value = Math.max(0, tokenTabs.value.length - 1);
    }
  }

  function renameTab(index: number, label: string): void {
    const tab = tokenTabs.value[index];
    if (tab !== undefined) tab.label = label;
  }

  return {
    tokenTabs,
    activeTabIndex,
    activeTab,
    addOrFocusTab,
    closeTab,
    renameTab,
  };
}
