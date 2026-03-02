<script setup lang="ts">
import type { Finding, JWTHeader, JWTPayload, JWTRisk } from "shared";
import { onBeforeUnmount, onMounted } from "vue";

import { Dashboard } from "@/components/Dashboard";
import { Decoder } from "@/components/Decoder";
import { HelpAndDocs } from "@/components/HelpAndDocs";
import { JWTEditor } from "@/components/JWTEditor";
import { Navigation } from "@/components/Navigation";
import { TokenDetails } from "@/components/TokenDetails";
import { useFindings } from "@/composables/useFindings";
import { useNavigation } from "@/composables/useNavigation";
import { useTokenDetailsState } from "@/composables/useTokenDetailsState";
import { type analyzeJWTSecurity } from "@/utils/jwt";

const { currentPage, setPage } = useNavigation();
const { findings, loadFindings, removeFinding, clearAll, addOrUpdateFinding } =
  useFindings();
const { addOrFocusTab } = useTokenDetailsState();

function onGlobalAddToDashboard(e: Event): void {
  const finding = (e as CustomEvent<{ finding?: Finding }>).detail?.finding;
  if (finding === undefined) return;
  addOrUpdateFinding(finding);
  setPage("Dashboard");
}

function onGlobalAddToDecoder(e: Event): void {
  const token = (e as CustomEvent<{ token?: string }>).detail?.token;
  if (token === undefined || token.length === 0) return;
  if (currentPage.value !== "Decoder") {
    setPage("Decoder");

    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("add-token-to-decoder", { detail: { token } }),
      );
    }, 100);
  }
}

function onGlobalAddToEditor(e: Event): void {
  const token = (e as CustomEvent<{ token?: string }>).detail?.token;
  if (token === undefined || token.length === 0) return;
  if (currentPage.value !== "JWT Editor") {
    setPage("JWT Editor");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("add-token-to-editor", { detail: { token } }),
      );
    }, 100);
  }
}

onMounted(() => {
  window.addEventListener("add-token-to-dashboard", onGlobalAddToDashboard);
  window.addEventListener("add-token-to-decoder", onGlobalAddToDecoder);
  window.addEventListener("add-token-to-editor", onGlobalAddToEditor);
});

onBeforeUnmount(() => {
  window.removeEventListener("add-token-to-dashboard", onGlobalAddToDashboard);
  window.removeEventListener("add-token-to-decoder", onGlobalAddToDecoder);
  window.removeEventListener("add-token-to-editor", onGlobalAddToEditor);
});

function handleViewDetails(payload: Finding & { navigate?: boolean }): void {
  if (payload.navigate !== true) return;
  const m = payload.metadata;
  addOrFocusTab({
    token: m.token,
    header: m.header,
    payload: m.payload,
    risks: m.risks,
    suggestions: m.suggestions,
    issuer: m.issuer,
    subject: m.subject,
    audience: m.audience,
    timeLeft: m.timeLeft,
    expStatus: m.expStatus,
    source: m.source,
  });
  setPage("Token Details");
}

function handleRefresh(): void {
  loadFindings();
}

function handleNavigateTo(page: string): void {
  setPage(
    page as
      | "Dashboard"
      | "Decoder"
      | "Token Details"
      | "JWT Editor"
      | "Help & Docs",
  );
}

function handleViewDetailsDecoder(
  token: string,
  header: JWTHeader,
  payload: JWTPayload,
  analysis: { risks: JWTRisk[]; suggestions: string[] },
): void {
  addOrFocusTab({
    token,
    header,
    payload,
    risks: analysis.risks,
    suggestions: analysis.suggestions,
    source: "manual",
  });
  setPage("Token Details");
}

function handleSendToEditor(token: string): void {
  setPage("JWT Editor");
  setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent("add-token-to-editor", { detail: { token } }),
    );
  }, 100);
}

function handleViewDetailsEditor(
  token: string,
  header: JWTHeader,
  payload: JWTPayload,
  analysis: ReturnType<typeof analyzeJWTSecurity>,
): void {
  addOrFocusTab({
    token,
    header,
    payload,
    risks: analysis.risks,
    suggestions: analysis.suggestions,
    source: "manual",
  });
  setPage("Token Details");
}
</script>

<template>
  <div class="h-full flex flex-col gap-1">
    <Navigation :current-page="currentPage" @page-change="setPage" />
    <div class="flex-1 min-h-0">
      <Dashboard
        v-if="currentPage === 'Dashboard'"
        :findings="findings"
        :on-delete="removeFinding"
        :on-clear-all="clearAll"
        @refresh="handleRefresh"
        @view-details="handleViewDetails"
        @navigate-to="handleNavigateTo"
      />
      <Decoder
        v-else-if="currentPage === 'Decoder'"
        @view-details-decoder="handleViewDetailsDecoder"
        @send-to-editor="handleSendToEditor"
      />
      <TokenDetails
        v-else-if="currentPage === 'Token Details'"
        @send-to-editor="handleSendToEditor"
      />
      <JWTEditor
        v-else-if="currentPage === 'JWT Editor'"
        @view-details-editor="handleViewDetailsEditor"
      />
      <HelpAndDocs v-else-if="currentPage === 'Help & Docs'" />
      <div
        v-else
        class="flex flex-1 items-center justify-center text-surface-500"
      >
        Unknown page
      </div>
    </div>
  </div>
</template>
