<template>
  <div class="decoder-container h-full overflow-y-auto">
    <div class="p-4">
      <Card class="bg-gray-50 dark:bg-surface-700">
      <template #title>
        <div class="flex items-center">
          <span class="tab-icon">
            <i class="pi pi-lock-open"></i>
          </span>
          <span>Decode JWT Token</span>
        </div>
      </template>
      <template #content>
        <div class="mb-4">
          <label for="jwt-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Enter JWT Token
          </label>
          <div class="flex">
            <InputText id="jwt-input" v-model="manualToken" class="flex-1 mr-2" 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
            <Button icon="pi pi-search" label="Decode" @click="decodeManualToken" :disabled="!isValidToken" />
          </div>
          <small v-if="manualToken && !isValidToken" class="text-red-500">
            Invalid JWT format. Please enter a valid token.
          </small>
          </div>
        </template>
      </Card>
        </div>

    <!-- Token Tabs section -->
    <div v-if="decodedTokens.length > 0" class="token-tabs bg-gray-100 dark:bg-surface-700 p-2 mx-4 rounded-t-lg mb-2 flex items-center overflow-x-auto">
      <TabView v-model:activeIndex="activeTokenTab" class="token-tabs-inner w-full">
        <TabPanel v-for="(token, index) in decodedTokens" :key="token.id">
          <template #header>
            <div class="token-tab-header flex items-center">
              <span class="truncate max-w-xs" :title="getTabTitle(token)">
                {{ token.customName || getTabTitle(token) }}
              </span>
              <button 
                @click.stop="closeTokenTab(index)" 
                class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>
          </template>
          
          <!-- Token Content -->
          <div class="token-content p-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card class="bg-white dark:bg-surface-800">
              <template #title>
                <div class="flex items-center">
                  <span class="tab-icon">
                    <i class="pi pi-code"></i>
                  </span>
                  <span>Header</span>
                </div>
              </template>
              <template #content>
                <div class="bg-gray-800 text-white p-3 rounded font-mono text-sm overflow-auto max-h-64">
                    <pre>{{ JSON.stringify(token.header, null, 2) }}</pre>
                </div>
              </template>
            </Card>

            <Card class="bg-white dark:bg-surface-800">
              <template #title>
                <div class="flex items-center">
                  <span class="tab-icon">
                    <i class="pi pi-tag"></i>
                  </span>
                  <span>Payload</span>
                </div>
              </template>
              <template #content>
                <div class="bg-gray-800 text-white p-3 rounded font-mono text-sm overflow-auto max-h-64">
                    <pre>{{ JSON.stringify(token.payload, null, 2) }}</pre>
                </div>
              </template>
            </Card>
          </div>

          <Card class="bg-white dark:bg-surface-800">
            <template #title>
              <div class="flex items-center">
                <span class="tab-icon">
                  <i class="pi pi-shield"></i>
                </span>
                <span>Security Analysis</span>
              </div>
            </template>
            <template #content>
                <div v-if="token.analysis">
                <h3 class="text-md font-semibold mb-2">Risks</h3>
                  <div v-if="!token.analysis.risks || token.analysis.risks.length === 0" 
                  class="py-2 text-center text-gray-500">
                  <span class="tab-icon inline-block align-middle text-success-500">
                    <i class="pi pi-check-circle"></i>
                  </span>
                  No risks detected
                </div>
                <ul v-else class="space-y-2 mb-4">
                    <li v-for="(risk, riskIndex) in token.analysis.risks" :key="riskIndex" 
                    class="border-l-4 p-2 rounded"
                    :class="{
                        'border-red-500 bg-red-200 dark:bg-red-700/40': risk.severity === 'critical',
                        'border-orange-500 bg-orange-200 dark:bg-orange-700/40': risk.severity === 'high',
                        'border-yellow-500 bg-yellow-200 dark:bg-yellow-700/40': risk.severity === 'medium',
                        'border-blue-500 bg-blue-200 dark:bg-blue-700/40': risk.severity === 'low'
                    }">
                    <div class="flex items-start">
                      <Tag :value="risk.severity" :severity="getSeverityType(risk.severity)" class="mr-2" />
                      <span>{{ risk.description }}</span>
                    </div>
                  </li>
                </ul>

                <h3 class="text-md font-semibold mb-2">Suggestions</h3>
                  <div v-if="!token.analysis.suggestions || token.analysis.suggestions.length === 0" 
                  class="py-2 text-center text-gray-500">
                  No suggestions available
                </div>
                <ul v-else class="list-disc ml-5 space-y-1">
                    <li v-for="(suggestion, sugIndex) in token.analysis.suggestions" :key="sugIndex">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
              
              <div class="flex justify-end mt-4 space-x-2">
                  <Button @click="renameTab(index)" icon="pi pi-pencil" text rounded tooltip="Rename Tab" />
                  <Button label="View in Token Details" @click="viewTokenDetails(token)" severity="success" class="p-button-raised" icon="pi pi-external-link" />
                  <Button label="Send to JWT Editor" @click="sendToJWTEditor(token)" severity="info" class="p-button-raised" icon="pi pi-pencil" />
              </div>
            </template>
          </Card>
          </div>
        </TabPanel>
      </TabView>
        </div>
        
    <div v-if="decodedTokens.length === 0 && manualToken === ''" class="flex flex-col items-center justify-center py-10 text-gray-500 h-full">
          <span class="block text-4xl mb-3">
            <i class="pi pi-lock-open text-4xl"></i>
          </span>
          <h3 class="text-xl font-semibold">Enter a JWT Token</h3>
          <p class="mt-2 text-center">Paste a JWT token above to decode and analyze its contents</p>
        </div>
    
    <!-- Rename Modal -->
    <Dialog v-model:visible="showRenameModal" header="Rename Tab" :style="{ width: '30vw' }" :modal="true">
      <div class="p-fluid">
        <div class="field">
          <label for="tab-name">Tab Name</label>
          <InputText id="tab-name" v-model="newTabName" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" @click="cancelRename" class="p-button-text">
          <template #icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </template>
        </Button>
        <Button label="Save" @click="saveRename" autofocus>
          <template #icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </template>
        </Button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Dialog from 'primevue/dialog';
import { useSDK } from '../plugins/sdk';
import { analyzeJWTSecurity, decodeJWT } from '../utils/jwt';
import type { JWTHeader, JWTPayload, JWTRisk } from '../types';

// Define token tab interface
interface DecodedToken {
  id: string;
  token: string;
  header: JWTHeader;
  payload: JWTPayload;
  analysis: {
    risks: JWTRisk[];
    suggestions: string[];
  };
  customName?: string;
}

const sdk = useSDK();
const manualToken = ref('');
const decodedTokens = ref<DecodedToken[]>([]);
const activeTokenTab = ref(0);

// Rename dialog state
const showRenameModal = ref(false);
const newTabName = ref('');
const tabToRename = ref(-1);

// Maximum number of token tabs to keep open
const MAX_TOKEN_TABS = 10;

// Emit events to parent
const emit = defineEmits<{
  (e: 'viewDetails', token: string, header: JWTHeader, payload: JWTPayload, analysis: any): void;
  (e: 'sendToEditor', token: string): void;
}>();

// Validate JWT format
const isValidToken = computed(() => {
  if (!manualToken.value) return false;
  const parts = manualToken.value.split('.');
  return parts.length === 3;
});

// Methods
function getSeverityType(severity: string): string {
  switch (severity) {
    case 'critical': return 'danger';
    case 'high': return 'warning';
    case 'medium': return 'warning';
    case 'low': return 'info';
    default: return 'info';
  }
}

// Get a readable title for the token tab
function getTabTitle(decodedToken: DecodedToken): string {
  // Use custom name if available
  if (decodedToken.customName) {
    return decodedToken.customName;
  }
  
  // Otherwise use algorithm and issuer
  const alg = decodedToken.header?.alg || 'unknown';
  const issuer = decodedToken.payload?.iss || 'unknown';
  
  // Create a short form of the token for display
  const shortToken = decodedToken.token.length > 15 
    ? decodedToken.token.substring(0, 12) + '...' 
    : decodedToken.token;
  
  return `${alg} • ${issuer} • ${shortToken}`;
}

function decodeManualToken() {
  if (!isValidToken.value) return;
  
  try {
    // Use the utility function to decode the JWT
    const decoded = decodeJWT(manualToken.value);
    
    if (!decoded || !decoded.header || !decoded.payload) {
      if (sdk?.notifications) {
        sdk.notifications.error('Failed to decode token');
      }
      return;
    }
    
    // Create a local analysis and display it
    const analysis = analyzeJWTSecurity(decoded.header, decoded.payload);
    
    // Add to decoded tokens
    const decodedToken: DecodedToken = {
      id: `manual-${Date.now()}`,
      token: manualToken.value,
      header: decoded.header,
      payload: decoded.payload,
      analysis
    };
    
    addTokenTab(decodedToken);
    
    // Clear the input field for the next token
    manualToken.value = '';
    
    // Submit to backend for full analysis and creation of a finding
    submitToBackend(decodedToken.token);
    
  } catch (error) {
    console.error('Error decoding token:', error);
    if (sdk?.notifications) {
      sdk.notifications.error('Error processing token');
    }
  }
}

// Add a token to the token tabs
function addTokenTab(token: DecodedToken): void {
  // Check if the token is already in tabs by its token value
  const existingTabIndex = decodedTokens.value.findIndex(tab => tab.token === token.token);
  
  if (existingTabIndex !== -1) {
    // If it exists, replace with updated version
    decodedTokens.value[existingTabIndex] = token;
    activeTokenTab.value = existingTabIndex;
  } else {
    // If not, add it to the tabs
    decodedTokens.value.push(token);
    
    // Enforce maximum number of tabs
    if (decodedTokens.value.length > MAX_TOKEN_TABS) {
      decodedTokens.value.shift(); // Remove oldest tab
    }
    
    // Set the newly added tab as active
    activeTokenTab.value = decodedTokens.value.length - 1;
  }
}

// Close a token tab
function closeTokenTab(index: number): void {
  // Remove the tab
  decodedTokens.value.splice(index, 1);
  
  // Adjust active tab if needed
  if (index <= activeTokenTab.value) {
    activeTokenTab.value = Math.max(0, activeTokenTab.value - 1);
  }
}

// Open rename dialog
function renameTab(index: number): void {
  tabToRename.value = index;
  newTabName.value = decodedTokens.value[index].customName || '';
  showRenameModal.value = true;
}

// Cancel rename
function cancelRename(): void {
  showRenameModal.value = false;
  tabToRename.value = -1;
  newTabName.value = '';
}

// Save rename
function saveRename(): void {
  if (tabToRename.value >= 0 && tabToRename.value < decodedTokens.value.length) {
    decodedTokens.value[tabToRename.value].customName = newTabName.value;
    if (sdk?.notifications) {
      sdk.notifications.success('Tab renamed successfully');
    }
  }
  showRenameModal.value = false;
  tabToRename.value = -1;
  newTabName.value = '';
}

function viewTokenDetails(token: DecodedToken) {
  if (!token) return;
  
  // Get the full token details
  const { header, payload, analysis } = token;
  
  // Emit event to parent component to switch to Token Details tab
  // Add navigate=true to ensure it navigates to the Token Details tab
  emit('viewDetails', token.token, header, payload, analysis, true);
  
  // Also create a finding if it doesn't exist yet
  submitToBackend(token.token);
  
  // Show success toast notification
  if (sdk?.notifications) {
    sdk.notifications.success('Token details view opened');
  }
}

function sendToJWTEditor(token: DecodedToken) {
  if (token) {
    // Emit event to App component to handle navigation to JWT Editor
    emit('sendToEditor', token.token);
    
    // Show toast notification
    if (sdk?.notifications) {
      sdk.notifications.success('Token sent to JWT Editor');
    }
  }
}

function submitToBackend(token: string) {
  // Analyze token directly with backend
  if (sdk && sdk.backend && sdk.backend.analyzeJWT) {
    sdk.notifications?.info('Sending token to backend for analysis...');
    
    sdk.backend.analyzeJWT({
      token,
      requestId: 'manual',
      source: 'manual'
    }).catch(error => {
      console.error('Error analyzing token:', error);
    });
  }
}

onMounted(() => {
  // Add listener for the set-decoder-token event
  window.addEventListener('set-decoder-token', handleSetDecoderToken);
});

onUnmounted(() => {
  // Remove listener when component is unmounted
  window.removeEventListener('set-decoder-token', handleSetDecoderToken);
});

// Handler for receiving tokens from other components
function handleSetDecoderToken(event: Event) {
  const customEvent = event as CustomEvent;
  if (customEvent.detail && customEvent.detail.token) {
    manualToken.value = customEvent.detail.token;
    // Trigger token analysis
    decodeManualToken();
  }
}
</script>

<style scoped>
.decoder-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  overflow-y: auto !important;
}

:deep(.p-card) {
  display: flex;
  flex-direction: column;
  overflow: auto !important;
}

:deep(.p-card-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto !important;
}

.token-content {
  animation: fadeIn 0.3s ease-in-out;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto !important;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.tab-icon {
  display: inline-flex;
  margin-right: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
  align-items: center;
  justify-content: center;
}

.tab-icon i {
  font-size: 1.25rem;
}

/* Token tabs styling */
.token-tabs {
  position: relative;
  height: auto;
  min-height: 40px;
  overflow-x: auto !important;
}

:deep(.token-tabs-inner .p-tabview-nav) {
  border-bottom: none;
  background: transparent;
  overflow-x: auto !important;
}

:deep(.token-tabs-inner .p-tabview-nav-link) {
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  margin-right: 0.25rem;
  font-size: 0.875rem;
  border: 1px solid rgba(209, 213, 219, 0.5);
}

:deep(.token-tabs-inner .p-tabview-selected) {
  border-color: rgba(99, 102, 241, 0.5);
}

:deep(.token-tabs-inner .p-tabview-panels) {
  padding: 0;
  margin: 0;
  border: none;
  height: auto;
  overflow: auto !important;
}

.token-tab-header {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 