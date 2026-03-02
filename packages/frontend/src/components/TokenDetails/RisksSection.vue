<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-sm font-semibold text-surface-200">Security Analysis</h3>

    <!-- Security Overview -->
    <div
      class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded border border-surface-700 bg-surface-800/50"
    >
      <div class="flex flex-col gap-3">
        <div class="p-3 rounded" :class="overallAssessmentClass">
          <div class="font-semibold mb-1 text-surface-100">
            Overall Assessment
          </div>
          <div class="text-sm text-surface-200">{{ securitySummary }}</div>
        </div>
        <div class="border-b border-surface-700 pb-3">
          <div class="font-semibold mb-1 text-surface-200">Token Validity</div>
          <div class="flex justify-between text-sm">
            <span class="text-surface-400">Expiration status</span>
            <span :class="expirationClass">{{ expirationLabel }}</span>
          </div>
          <div class="flex justify-between text-sm mt-1">
            <span class="text-surface-400">Time remaining</span>
            <span class="text-surface-200">{{
              data.timeLeft ?? (data.payload?.exp ? "-" : "No expiration")
            }}</span>
          </div>
        </div>
        <div class="border-b border-surface-700 pb-3">
          <div class="font-semibold mb-2 text-surface-200">Risk Summary</div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
              <span class="text-surface-200"
                >Critical: {{ countCritical }}</span
              >
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
              <span class="text-surface-200">High: {{ countHigh }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-yellow-500 shrink-0"></span>
              <span class="text-surface-200">Medium: {{ countMedium }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-blue-500 shrink-0"></span>
              <span class="text-surface-200">Low: {{ countLow }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="text-surface-400 text-sm">Severity</span>
          <span
            class="px-3 py-1 text-xs font-medium rounded min-w-[70px] text-center capitalize"
            :class="severityBadgeClass"
          >
            {{ overallSeverity }}
          </span>
        </div>
        <div v-if="criticalRisks.length > 0" class="flex flex-col gap-1">
          <div class="font-semibold text-surface-200 text-sm">
            Critical vulnerabilities
          </div>
          <div
            v-for="(r, i) in criticalRisks"
            :key="i"
            class="text-sm text-red-400 dark:text-red-300"
          >
            {{ r.description }}
          </div>
        </div>
        <div v-else class="text-sm text-success-400">
          No critical vulnerabilities detected
        </div>
      </div>
    </div>

    <!-- Security Considerations -->
    <div v-if="considerations.length > 0" class="flex flex-col gap-2">
      <div class="font-semibold text-surface-200 text-sm">
        Security considerations
      </div>
      <div
        v-for="(c, i) in considerations"
        :key="i"
        class="flex items-start gap-2 text-sm"
        :class="c.class"
      >
        <span class="font-bold shrink-0">•</span>
        <span>{{ c.text }}</span>
      </div>
    </div>

    <!-- Risk list -->
    <div v-if="data.risks.length > 0" class="flex flex-col gap-2">
      <div class="text-xs font-medium text-surface-400 uppercase tracking-wide">
        Risks
      </div>
      <div
        v-for="(risk, i) in data.risks"
        :key="i"
        class="flex items-start gap-3 p-3 rounded border"
        :class="riskRowClass(risk.severity)"
      >
        <span
          class="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium capitalize font-mono"
          :class="severityBadgeClassFor(risk.severity)"
        >
          {{ risk.severity }}
        </span>
        <div class="flex flex-col gap-0.5 min-w-0">
          <span class="text-sm text-surface-200">{{ risk.description }}</span>
          <span v-if="risk.impact" class="text-xs text-surface-400">{{
            risk.impact
          }}</span>
        </div>
      </div>
    </div>
    <div v-else class="text-sm text-surface-400 flex items-center gap-2">
      <i class="fas fa-circle-check text-green-500"></i>
      No security risks detected.
    </div>

    <!-- Suggestions -->
    <div v-if="data.suggestions.length > 0" class="flex flex-col gap-1">
      <span class="text-xs font-medium text-surface-400 uppercase tracking-wide"
        >Suggestions</span
      >
      <ul class="list-disc list-inside space-y-1">
        <li
          v-for="(s, i) in data.suggestions"
          :key="i"
          class="text-sm text-surface-300"
        >
          {{ s }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import {
  countRisksBySeverity,
  getExpirationStatusClass,
  getOverallSeverity,
  getSecurityConsiderations,
  getSecuritySummary,
  getSeverityClass,
} from "./useTokenDetailsSecurity";

import type { TokenDetailsData } from "@/composables/useTokenDetailsState";

const props = defineProps<{ data: TokenDetailsData }>();

const overallSeverity = computed(() => getOverallSeverity(props.data));
const securitySummary = computed(() => getSecuritySummary(props.data));
const countCritical = computed(() =>
  countRisksBySeverity(props.data, "critical"),
);
const countHigh = computed(() => countRisksBySeverity(props.data, "high"));
const countMedium = computed(() => countRisksBySeverity(props.data, "medium"));
const countLow = computed(() => countRisksBySeverity(props.data, "low"));
const criticalRisks = computed(() =>
  props.data.risks.filter((r) => r.severity === "critical"),
);
const considerations = computed(() => getSecurityConsiderations(props.data));

const overallAssessmentClass = computed(() => {
  const s = overallSeverity.value;
  if (s === "critical") return "bg-red-700/30 border border-red-600/40";
  if (s === "high") return "bg-orange-700/30 border border-orange-600/40";
  if (s === "medium") return "bg-yellow-700/30 border border-yellow-600/40";
  if (s === "low") return "bg-blue-700/30 border border-blue-600/40";
  return "bg-surface-700/50 border border-surface-600";
});

const severityBadgeClass = computed(() =>
  getSeverityClass(overallSeverity.value),
);

const expirationClass = computed(() => getExpirationStatusClass(props.data));

const expirationLabel = computed(() => {
  if (props.data.payload?.exp === undefined) return "Not set";
  if (props.data.expStatus === "valid") return "Valid";
  if (props.data.expStatus === "expired") return "Expired";
  return "Not yet valid";
});

function riskRowClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "border-red-500/30 bg-red-500/10";
    case "high":
      return "border-orange-500/30 bg-orange-500/10";
    case "medium":
      return "border-yellow-500/30 bg-yellow-500/10";
    case "low":
      return "border-blue-500/30 bg-blue-500/10";
    default:
      return "border-surface-700 bg-surface-800";
  }
}

function severityBadgeClassFor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "high":
      return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "low":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    default:
      return "bg-surface-700 text-surface-400";
  }
}
</script>
