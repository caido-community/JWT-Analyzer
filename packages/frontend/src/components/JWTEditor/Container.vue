<template>
  <div class="h-full flex flex-col gap-1">
    <!-- Title card -->
    <Card
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0' },
        content: { class: 'h-fit' },
      }"
    >
      <template #content>
        <div class="p-4 flex justify-between items-center gap-4">
          <div class="flex flex-col gap-0.5">
            <h2 class="text-lg font-semibold">JWT Editor</h2>
            <p class="text-sm text-surface-300">
              Decode, edit, sign, and attack JWT tokens with cryptographic
              precision.
            </p>
          </div>
          <Button
            label="New Token"
            icon="fas fa-plus"
            size="small"
            @click="addTab(undefined)"
          />
        </div>
      </template>
    </Card>

    <!-- Tab strip -->
    <Card
      v-if="tabs.length > 0"
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0' },
        content: { class: 'h-fit' },
      }"
    >
      <template #content>
        <div class="flex gap-2 p-3 overflow-x-auto">
          <TokenTab
            v-for="(tab, index) in tabs"
            :key="tab.id"
            :label="tab.name"
            :is-selected="activeIndex === index"
            :algorithm="tab.decodedToken?.header?.alg"
            @select="activeIndex = index"
            @close="closeTab(index)"
            @rename="(name) => renameTab(index, name)"
          />
        </div>
      </template>
    </Card>

    <div class="flex-1 min-h-0 flex overflow-hidden select-none">
      <!-- Editor column -->
      <div class="flex-1 min-w-0 min-h-0 overflow-hidden">
        <TokenEditor
          @decode="onDecode"
          @sign="onSign"
          @attack="onAttack"
          @validate="onValidate"
        />
      </div>

      <!-- Horizontal drag gutter -->
      <div
        class="w-1.5 shrink-0 flex items-center justify-center cursor-col-resize hover:bg-primary-500/30 transition-colors group mx-0.5"
        @mousedown="startHorizontalResize"
      >
        <div
          class="w-0.5 h-8 rounded-full bg-surface-600 group-hover:bg-primary-400 transition-colors"
        />
      </div>

      <!-- Right panel -->
      <div
        ref="rightPanel"
        class="flex flex-col min-h-0 overflow-hidden shrink-0"
        :style="{ width: rightPanelWidth + 'px' }"
      >
        <!-- Key Manager -->
        <div
          class="overflow-hidden shrink-0"
          :style="{ height: keyManagerHeight + 'px' }"
        >
          <KeyManager />
        </div>

        <!-- Vertical drag gutter -->
        <div
          class="h-1.5 shrink-0 flex items-center justify-center cursor-row-resize hover:bg-primary-500/30 transition-colors group my-0.5"
          @mousedown="startVerticalResize"
        >
          <div
            class="h-0.5 w-8 rounded-full bg-surface-600 group-hover:bg-primary-400 transition-colors"
          />
        </div>

        <!-- Quick Attacks-->
        <div class="flex-1 min-h-0 overflow-hidden">
          <QuickAttacks />
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <SignDialog @sign="onSignConfirm" />
    <AttackDialog @apply="onAttackConfirm" />
    <KeyDialog />
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import { ref } from "vue";

import AttackDialog from "./AttackDialog.vue";
import KeyDialog from "./KeyDialog.vue";
import KeyManager from "./KeyManager.vue";
import QuickAttacks from "./QuickAttacks.vue";
import SignDialog from "./SignDialog.vue";
import TokenEditor from "./TokenEditor.vue";
import { useAttacks } from "./useAttacks";
import { useKeyManager } from "./useKeyManager";
import { useSigning } from "./useSigning";
import { useSplitterState } from "./useSplitterState";
import { useTokenTabs } from "./useTokenTabs";
import { useValidation } from "./useValidation";

import TokenTab from "@/components/common/TokenTab.vue";

const {
  tabs,
  activeIndex,
  addTab,
  closeTab,
  renameTab,
  activeTab,
  decodeActiveTab,
} = useTokenTabs();

const { keys } = useKeyManager();
const { openSignDialog, signTab } = useSigning(keys);
const { validateTab } = useValidation(keys);
const { openAttackDialog, applyAttack } = useAttacks();

const RIGHT_PANEL_MIN = 180;
const RIGHT_PANEL_MAX = 560;
const KEY_MANAGER_MIN = 80;

const rightPanel = ref<HTMLElement | undefined>(undefined);
const { rightPanelWidth, keyManagerHeight } = useSplitterState();

function startHorizontalResize(e: MouseEvent): void {
  e.preventDefault();
  const startX = e.clientX;
  const startRight = rightPanelWidth.value;

  function onMove(ev: MouseEvent): void {
    const delta = startX - ev.clientX;
    rightPanelWidth.value = Math.min(
      RIGHT_PANEL_MAX,
      Math.max(RIGHT_PANEL_MIN, startRight + delta),
    );
  }

  function onUp(): void {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  }

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function startVerticalResize(e: MouseEvent): void {
  e.preventDefault();
  const startY = e.clientY;
  const startHeight = keyManagerHeight.value;

  function onMove(ev: MouseEvent): void {
    const delta = ev.clientY - startY;
    const panelH = rightPanel.value?.offsetHeight ?? 600;
    keyManagerHeight.value = Math.min(
      panelH - KEY_MANAGER_MIN - 10,
      Math.max(KEY_MANAGER_MIN, startHeight + delta),
    );
  }

  function onUp(): void {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  }

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function onDecode(): void {
  decodeActiveTab();
}

function onSign(): void {
  openSignDialog();
}

function onAttack(): void {
  openAttackDialog();
}

function onValidate(): void {
  const tab = activeTab.value;
  if (tab !== undefined) validateTab(tab);
}

async function onSignConfirm(): Promise<void> {
  const tab = activeTab.value;
  if (tab !== undefined) {
    await signTab(tab);
    decodeActiveTab();
  }
}

async function onAttackConfirm(): Promise<void> {
  const tab = activeTab.value;
  if (tab !== undefined) {
    await applyAttack(tab);
    decodeActiveTab();
  }
}
</script>
