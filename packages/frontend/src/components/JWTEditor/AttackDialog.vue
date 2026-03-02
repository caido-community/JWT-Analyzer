<template>
  <Dialog
    v-model:visible="showAttackDialog"
    header="Attack Panel"
    modal
    class="w-[40rem]"
    :pt="dialogPt"
  >
    <!-- Warning banner -->
    <div
      class="flex items-start gap-3 p-3 rounded border border-danger-500/30 bg-danger-500/10"
    >
      <i
        class="fas fa-triangle-exclamation text-danger-400 mt-0.5 shrink-0"
      ></i>
      <p class="text-sm text-surface-300">
        These attacks manipulate the JWT in ways that may bypass insecure
        verification. Use only against systems you are authorized to test.
      </p>
    </div>

    <!-- Attack type -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-surface-400 uppercase tracking-wide"
        >Attack Type</label
      >
      <Select
        v-model="selectedAttack"
        :options="ATTACK_OPTIONS"
        option-label="label"
        option-value="value"
        class="w-full"
      />
    </div>

    <!-- Descriptions -->
    <div
      class="text-sm text-surface-300 p-3 rounded bg-surface-800 border border-surface-700"
    >
      <template v-if="selectedAttack === 'none'">
        Sets <code class="text-secondary-300">alg: "none"</code> and removes the
        signature. Exploits servers that accept unsigned tokens.
      </template>
      <template v-else-if="selectedAttack === 'hmac-confusion'">
        Changes algorithm from RS/ES to HS256. Exploits servers that use the
        public key as the HMAC secret. Optionally re-sign with the public key.
      </template>
      <template v-else-if="selectedAttack === 'empty-key'">
        Signs the token with an empty string as the key. Exploits
        implementations that accept empty secrets.
      </template>
      <template v-else-if="selectedAttack === 'psychic'">
        Injects a zeroed ECDSA signature (CVE-2022-21449). Only applicable to
        ES256/384/512 tokens.
      </template>
      <template v-else-if="selectedAttack === 'embedded-jwk'">
        Embeds a crafted JWK in the header. Exploits servers that trust the
        <code class="text-secondary-300">jwk</code> header parameter.
      </template>
      <template v-else-if="selectedAttack === 'weak-hmac'">
        Signs the token with a weak/common secret. Useful for testing weak
        secret protection.
      </template>
      <template v-else-if="selectedAttack === 'alg-sub'">
        Substitutes the algorithm field with another value to test algorithm
        confusion.
      </template>
    </div>

    <!-- Attack-specific options -->

    <!-- HMAC confusion: optional public key -->
    <div v-if="selectedAttack === 'hmac-confusion'" class="flex flex-col gap-1">
      <label class="text-xs text-surface-400 uppercase tracking-wide">
        Public Key (PEM) - optional, for re-signing
      </label>
      <Textarea
        v-model="publicKeyForHmac"
        rows="5"
        placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
        class="w-full font-mono text-xs"
      />
    </div>

    <!-- Embedded JWK: with/without kid -->
    <div
      v-if="selectedAttack === 'embedded-jwk'"
      class="flex items-center gap-2"
    >
      <Checkbox v-model="embedJwkWithKid" binary />
      <label class="text-sm text-surface-300"
        >Include <code class="text-secondary-300">kid</code> in header</label
      >
    </div>

    <!-- Weak HMAC: secret selection -->
    <div v-if="selectedAttack === 'weak-hmac'" class="flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-surface-400 uppercase tracking-wide"
          >Select Weak Secret</label
        >
        <Select
          v-model="weakSecret"
          :options="weakSecrets"
          class="w-full font-mono"
        />
      </div>
      <div class="flex gap-2">
        <InputText
          v-model="customWeakSecret"
          placeholder="Add custom secret…"
          class="flex-1"
          @keydown.enter="addCustomSecret"
        />
        <Button
          label="Add"
          severity="info"
          outlined
          size="small"
          @click="addCustomSecret"
        />
      </div>
      <div
        v-if="
          weakSecrets.filter((s) => !DEFAULT_WEAK_SECRETS.includes(s)).length >
          0
        "
        class="flex flex-wrap gap-1"
      >
        <span
          v-for="s in weakSecrets.filter(
            (w) => !DEFAULT_WEAK_SECRETS.includes(w),
          )"
          :key="s"
          class="px-2 py-0.5 rounded text-xs bg-surface-700 text-surface-300 border border-surface-600 flex items-center gap-1 cursor-pointer hover:border-danger-500/50"
          @click="removeCustomSecret(s)"
        >
          {{ s || '""' }}
          <i class="fas fa-times text-[9px] text-surface-500"></i>
        </span>
      </div>
    </div>

    <!-- Algorithm substitution: target alg -->
    <div v-if="selectedAttack === 'alg-sub'" class="flex flex-col gap-1">
      <label class="text-xs text-surface-400 uppercase tracking-wide"
        >Target Algorithm</label
      >
      <Select
        v-model="targetAlgorithm"
        :options="ALG_SUB_OPTIONS"
        option-label="label"
        option-value="value"
        class="w-full"
      />
    </div>

    <template #footer>
      <Button
        label="Cancel"
        severity="info"
        outlined
        size="small"
        @click="showAttackDialog = false"
      />
      <Button
        label="Apply Attack"
        icon="fas fa-bug"
        size="small"
        severity="danger"
        @click="$emit('apply')"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Textarea from "primevue/textarea";

import { ALG_SUB_OPTIONS, ATTACK_OPTIONS, useAttacks } from "./useAttacks";

import { dialogPt } from "@/utils/dialogPt";

defineEmits<{ (e: "apply"): void }>();

const DEFAULT_WEAK_SECRETS = [
  "password",
  "secret",
  "1234567890",
  "jwt_secret",
  "key",
  "secretkey",
  "private",
  "mysecret",
  "changeme",
  "",
];

const {
  showAttackDialog,
  selectedAttack,
  publicKeyForHmac,
  embedJwkWithKid,
  weakSecret,
  customWeakSecret,
  targetAlgorithm,
  weakSecrets,
  addCustomSecret,
  removeCustomSecret,
} = useAttacks();
</script>
