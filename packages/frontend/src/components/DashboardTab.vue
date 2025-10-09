<template>
  <div class="h-full flex flex-col">
    <!-- Fixed header section -->
    <div class="flex-shrink-0 p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      <Card class="bg-gray-50 dark:bg-surface-700" :pt="{ body: { class: 'p-0' }, content: { class: 'flex flex-col' } }">
        <template #title>
          <div class="flex items-center justify-between px-4 py-3">
            <span>JWT Summary</span>
            <Badge :value="jwtCount" severity="info" />
          </div>
        </template>
        <template #content>
          <div class="px-4 pb-4">
          <div class="stats-grid grid grid-cols-2 gap-2">
            <div class="stat p-3 rounded-lg bg-white dark:bg-surface-800 shadow-sm border-l-4 border-red-500">
              <div class="text-gray-500 dark:text-gray-400 text-xs font-medium">Critical Issues</div>
              <div class="font-bold text-lg text-danger-600 dark:text-danger-400">{{ criticalCount }}</div>
            </div>
            <div class="stat p-3 rounded-lg bg-white dark:bg-surface-800 shadow-sm border-l-4 border-orange-500">
              <div class="text-gray-500 dark:text-gray-400 text-xs font-medium">High Issues</div>
              <div class="font-bold text-lg text-orange-500 dark:text-orange-400">{{ highCount }}</div>
            </div>
            <div class="stat p-3 rounded-lg bg-white dark:bg-surface-800 shadow-sm border-l-4 border-yellow-500">
              <div class="text-gray-500 dark:text-gray-400 text-xs font-medium">Medium Issues</div>
              <div class="font-bold text-lg text-yellow-500 dark:text-yellow-400">{{ mediumCount }}</div>
            </div>
            <div class="stat p-3 rounded-lg bg-white dark:bg-surface-800 shadow-sm border-l-4 border-blue-500">
              <div class="text-gray-500 dark:text-gray-400 text-xs font-medium">Low Issues</div>
              <div class="font-bold text-lg text-info-600 dark:text-info-400">{{ lowCount }}</div>
            </div>
          </div>
          </div>
        </template>
      </Card>

      <Card class="bg-gray-50 dark:bg-surface-700" :pt="{ body: { class: 'p-0' }, content: { class: 'flex flex-col' } }">
        <template #title>
          <div class="flex items-center justify-between px-4 py-3">
            <span>Algorithm Distribution</span>
          </div>
        </template>
        <template #content>
          <div class="px-4 pb-4">
          <div v-if="jwtCount === 0" class="h-24 flex items-center justify-center text-gray-500">
            No JWTs analyzed yet
          </div>
          <div v-else class="algorithm-distribution">
            <div class="grid grid-cols-2 gap-2">
              <div v-for="(item, index) in algorithmData" :key="index" 
                class="algorithm-card p-2 rounded-lg bg-white dark:bg-surface-800 shadow-sm"
                :style="{ borderLeft: '3px solid ' + getAlgorithmColor(item.name) }">
                <div class="flex items-center justify-between mb-1">
                  <div class="font-medium text-xs">{{ item.name }}</div>
                  <div class="text-xs font-bold px-1.5 py-0.5 rounded-full" 
                    :style="{ backgroundColor: getAlgorithmColor(item.name) + '33', color: getAlgorithmColor(item.name) }">
                    {{ item.value }}
                  </div>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div class="h-1.5 rounded-full" 
                    :style="{ 
                      width: getPercentage(item) + '%', 
                      backgroundColor: getAlgorithmColor(item.name)
                    }">
                  </div>
                </div>
                <div class="text-xs text-right mt-0.5 text-gray-500">
                  {{ getPercentage(item) }}%
                </div>
              </div>
            </div>
          </div>
          </div>
        </template>
      </Card>
      </div>
    </div>

    <!-- Scrollable main content area -->
    <div class="flex-1 min-h-0 overflow-hidden p-4 pt-0">
      <Card class="h-full bg-gray-50 dark:bg-surface-700" :pt="{ body: { class: 'h-full p-0' }, content: { class: 'h-full flex flex-col' } }">
      <template #title>
        <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center">
          <span class="tab-icon">
            <i class="pi pi-list"></i>
          </span>
          <span>Recent Findings</span>
          </div>
          <div class="flex items-center">
            <Button icon="pi pi-refresh" text rounded aria-label="Refresh" 
              :loading="isLoading" @click="refreshFindings" />
          </div>
        </div>
      </template>
      <template #content>
        <div class="h-full flex flex-col">
        <!-- Add the search and filter component -->
        <div class="px-4 pb-2">
          <SearchFilterBar @filter-change="applyFilters" />
        </div>

        <div v-if="findings.length === 0" class="flex-1 flex items-center justify-center text-gray-500 px-4">
          <div class="text-center">
            <span class="block text-4xl mb-2">
              <i class="pi pi-inbox text-4xl"></i>
            </span>
            <p>No JWT findings yet</p>
          </div>
        </div>
        <div v-else-if="filteredFindings.length === 0" class="flex-1 flex items-center justify-center text-gray-500 px-4">
          <div class="text-center">
            <span class="block text-4xl mb-2">
              <i class="pi pi-filter-slash"></i>
            </span>
            <p>No findings match your filters</p>
          </div>
        </div>
        <div v-else class="flex-1 overflow-hidden px-4 pb-4">
          <DataTable :value="filteredFindings" :paginator="filteredFindings.length > 10" :rows="10" 
            stripedRows class="p-datatable-sm" responsiveLayout="scroll"
            v-model:expandedRows="expandedRows"
            @row-click="onRowClick"
            @row-toggle="onRowToggle"
            rowHover
            :rowClass="rowClass"
            tableStyle="border-radius: 8px; overflow: hidden;">
            <Column expander style="width: 3rem" />
            <template #empty>
              <div class="p-4 text-center text-gray-500">No JWT tokens found</div>
            </template>
            <Column field="title" header="Title" :sortable="true">
              <template #body="slotProps">
                <div class="flex items-center">
                  <span class="token-preview font-mono px-2 py-1 rounded border-l-2 border-blue-500">
                    {{ formatTokenPreview(slotProps.data.metadata?.token || '') }}
                  </span>
                  <button 
                    class="ml-2 text-gray-500 hover:text-blue-500 focus:outline-none hover:scale-110 transition-transform" 
                    @click.stop="copyTokenToClipboard(slotProps.data.metadata?.token || '')"
                    title="Copy JWT token"
                  >
                    <i class="pi pi-copy"></i>
                  </button>
                </div>
              </template>
            </Column>
            <Column field="metadata.source" header="Source" :sortable="true">
              <template #body="slotProps">
                <Tag :value="slotProps.data.metadata?.source || 'unknown'" 
                  :severity="slotProps.data.metadata?.source === 'request' ? 'info' : 'success'" />
              </template>
            </Column>
            <Column field="severity" header="Severity" :sortable="true">
              <template #body="slotProps">
                  <span 
                    :class="[
                      getSeverityClass(slotProps.data.severity),
                      'px-3 py-1 text-xs font-medium rounded-md inline-block min-w-[70px] text-center'
                    ]"
                  >
                    {{ slotProps.data.severity.charAt(0).toUpperCase() + slotProps.data.severity.slice(1) }}
                  </span>
              </template>
            </Column>
            <Column field="metadata.header.alg" header="Algorithm" :sortable="true" />
            <Column field="metadata.timeLeft" header="Expiration" :sortable="true" />
            <Column header="Actions" style="width: 14rem">
              <template #body="slotProps">
                  <div class="flex gap-1">
                <Button icon="pi pi-eye" text rounded aria-label="View Details" 
                      @click.stop="toggleExpand(slotProps.data)" 
                      tooltip="View Request/Response" tooltipOptions="{ position: 'top' }"
                      class="hover:bg-blue-50 dark:hover:bg-blue-900/30" />
                  <Button icon="pi pi-key" text rounded aria-label="Decode Token" 
                    @click.stop="decodeToken(slotProps.data)" 
                    tooltip="Decode Token" tooltipOptions="{ position: 'top' }"
                    class="hover:bg-green-50 dark:hover:bg-green-900/30" />
                  <Button icon="pi pi-list" text rounded aria-label="Token Details" 
                    @click.stop="viewTokenDetails(slotProps.data)" 
                    tooltip="Token Details" tooltipOptions="{ position: 'top' }"
                    class="hover:bg-purple-50 dark:hover:bg-purple-900/30" />
                  <Button icon="pi pi-pencil" text rounded aria-label="Send to Editor" 
                    @click.stop="sendToEditor(slotProps.data)" 
                    tooltip="Send to JWT Editor" tooltipOptions="{ position: 'top' }"
                    class="hover:bg-amber-50 dark:hover:bg-amber-900/30" />
                  <Button icon="pi pi-trash" text rounded aria-label="Delete Token" 
                    @click.stop="deleteToken(slotProps.data)" 
                    tooltip="Delete Token" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30" tooltipOptions="{ position: 'top' }" />
              </div>
            </template>
          </Column>
          <template #expansion="slotProps">
            <div class="p-3 request-expansion bg-white dark:bg-surface-800 rounded-lg shadow-sm"
                 :class="{
                   'request-source': slotProps.data.metadata?.source === 'request',
                   'response-source': slotProps.data.metadata?.source === 'response',
                   'manual-source': slotProps.data.metadata?.source === 'manual'
                 }">
              
              <!-- JWT Token Information -->
              <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <h4 class="font-bold mb-2 flex items-center">
                  <i class="pi pi-key text-blue-500 mr-2"></i>
                  JWT Token Information
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div class="mb-2">
                      <span class="font-medium">Algorithm:</span> {{ slotProps.data.metadata.header?.alg || 'Unknown' }}
                    </div>
                    <div class="mb-2">
                      <span class="font-medium">Issuer:</span> {{ slotProps.data.metadata.issuer || 'Not specified' }}
                    </div>
                  </div>
                  <div>
                    <div class="mb-2">
                      <span class="font-medium">Subject:</span> {{ slotProps.data.metadata.subject || 'Not specified' }}
                    </div>
                    <div class="mb-2">
                      <span class="font-medium">Expiration:</span> {{ slotProps.data.metadata.timeLeft }}
                    </div>
                    <div class="mb-2">
                      <span class="font-medium">Audience:</span> {{ slotProps.data.metadata.audience || 'Not specified' }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Token Source Information (for manual tokens only) -->
              <div v-if="slotProps.data.metadata?.source === 'manual'" class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                <h4 class="font-bold mb-2 flex items-center">
                  <i class="pi pi-info-circle text-amber-500 mr-2"></i>
                  Token Source
                </h4>
                <div class="grid grid-cols-1 gap-2">
                  <div class="mb-2">
                    <span class="font-medium">Origin:</span> JWT Editor
                  </div>
                  <div class="mb-2">
                    <span class="font-medium">Created via:</span>
                    <span v-if="slotProps.data.metadata.header?.alg === 'none'" class="text-danger-500">
                      Token manipulation - "none" algorithm attack
                    </span>
                    <span v-else-if="slotProps.data.title && slotProps.data.title.includes('Attack')" class="text-danger-500">
                      Token manipulation - Attack simulation
                    </span>
                    <span v-else-if="slotProps.data.metadata.header?.alg?.startsWith('HS') && 
                                     slotProps.data.metadata.header?.origAlg?.startsWith('RS')" class="text-danger-500">
                      Token manipulation - HMAC confusion attack
                    </span>
                    <span v-else>
                      Manual analysis or decode operation
                    </span>
                  </div>
                  <div v-if="slotProps.data.timestamp" class="mb-2">
                    <span class="font-medium">Timestamp:</span> {{ new Date(slotProps.data.timestamp).toLocaleString() }}
                  </div>
                </div>
              </div>
              
              <!-- Token Actions -->
              <div class="mt-4 flex justify-end gap-2">
                <Button icon="pi pi-key" label="Decode" class="p-button-sm" 
                  @click="decodeToken(slotProps.data)" />
                <Button icon="pi pi-list" label="Token Details" class="p-button-sm" 
                  @click="viewTokenDetails(slotProps.data)" />
                <Button icon="pi pi-pencil" label="Send to Editor" class="p-button-sm" 
                  @click="sendToEditor(slotProps.data)" />
              </div>
            </div>
          </template>
        </DataTable>
        </div>
        </div>
      </template>
    </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { computed } from 'vue';
import { onMounted } from 'vue';
import { onBeforeUnmount } from 'vue';
import { watch } from 'vue';
import Card from 'primevue/card';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import SearchFilterBar from './SearchFilterBar.vue';
import type { Finding } from '../types';
import { useSDK } from '../plugins/sdk';
import { createJWTStorageService } from '../services/storage';

// Define a filter type for our search filters
interface JWTFilter {
  search: string;
  severities: string[];
  sources: string[];
  algorithms: string[];
}

// SDK
const sdk = useSDK();

// Props
const props = defineProps({
  findings: {
    type: Array as () => Finding[],
    required: true
  }
});

// Emits
const emit = defineEmits<{
  (e: 'view-details', finding: Finding): void,
  (e: 'refresh'): void,
  (e: 'filters-changed', filteredFindings: Finding[]): void,
  (e: 'navigate-to', page: string): void
}>();

// State
const isLoading = ref(false);
const expandedRows = ref<Finding[]>([]);

// Search and filter state
const searchQuery = ref('');
const selectedSeverities = ref<string[]>([]);
const selectedSources = ref<string[]>([]);
const selectedAlgorithms = ref<string[]>([]);

// Computed
const jwtCount = computed(() => props.findings.length);

const criticalCount = computed(() => 
  props.findings.filter((f: Finding) => f.severity === 'critical').length
);

const highCount = computed(() => 
  props.findings.filter((f: Finding) => f.severity === 'high').length
);

const mediumCount = computed(() => 
  props.findings.filter((f: Finding) => f.severity === 'medium').length
);

const lowCount = computed(() => 
  props.findings.filter((f: Finding) => f.severity === 'low').length
);

// Filtered findings based on search and filter criteria
const filteredFindings = computed(() => {
  let result = [...props.findings];
  
  // Apply text search if provided
  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(finding => {
      // Search in token
      if (finding.metadata?.token && finding.metadata.token.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in title
      if (finding.title && finding.title.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in payload data
      if (finding.metadata?.payload) {
        const payloadStr = JSON.stringify(finding.metadata.payload).toLowerCase();
        if (payloadStr.includes(query)) {
          return true;
        }
      }
      
      // Search in header data
      if (finding.metadata?.header) {
        const headerStr = JSON.stringify(finding.metadata.header).toLowerCase();
        if (headerStr.includes(query)) {
          return true;
        }
      }
      
      return false;
    });
  }
  
  // Apply severity filter if selected
  if (selectedSeverities.value.length > 0) {
    result = result.filter(finding => 
      finding.severity && selectedSeverities.value.includes(finding.severity)
    );
  }
  
  // Apply source filter if selected
  if (selectedSources.value.length > 0) {
    result = result.filter(finding => 
      finding.metadata?.source && selectedSources.value.includes(finding.metadata.source)
    );
  }
  
  // Apply algorithm filter if selected
  if (selectedAlgorithms.value.length > 0) {
    result = result.filter(finding => 
      finding.metadata?.header?.alg && selectedAlgorithms.value.includes(finding.metadata.header.alg)
    );
  }
  
  return result;
});

// Algorithm distribution data for pie chart
const algorithmData = computed(() => {
  // Make sure findings exist and have metadata
  if (!props.findings || props.findings.length === 0) {
    return [];
  }

  // Extract algorithms, handling undefined/null values
  const algorithms = props.findings.map((f: Finding) => {
    // Use a default of 'none' if algorithm is missing
    return f.metadata?.header?.alg || 'none';
  });
  
  // Count occurrences of each algorithm
  const counts: Record<string, number> = {};
  algorithms.forEach((alg: string) => {
    counts[alg] = (counts[alg] || 0) + 1;
  });
  
  // Convert to array of objects for the chart component
  const result = Object.entries(counts).map(([name, value]) => ({ name, value }));
  
  // Log the algorithm data to verify it's working
  // Log:("[JWT Analyzer] Algorithm distribution:", result);
  
  return result;
});

onMounted(() => {
  refreshFindings();
  window.addEventListener('jwt-finding-added', handleFindingAdded);
});

onBeforeUnmount(() => {
  window.removeEventListener('jwt-finding-added', handleFindingAdded);
});

// Handler for jwt-finding-added event
function handleFindingAdded(event: Event) {
  const customEvent = event as CustomEvent;
  if (customEvent.detail) {
    // Auto-expand the new finding
    if (!expandedRows.value.some((row: Finding) => row.id === customEvent.detail.id)) {
      expandedRows.value = [...expandedRows.value, customEvent.detail];
    }
    
    // Refresh the findings data
    emit('refresh');
  }
}

// Handle filter changes from search bar
function applyFilters(filters: JWTFilter): void {
  // Log:("[JWT Analyzer] Applying filters:", filters);
  searchQuery.value = filters.search;
  selectedSeverities.value = filters.severities;
  selectedSources.value = filters.sources;
  selectedAlgorithms.value = filters.algorithms;
}

// Methods
function getSeverityClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-200 text-red-900 dark:bg-red-700 dark:text-red-100 font-medium';
    case 'high':
      return 'bg-orange-200 text-orange-900 dark:bg-orange-700 dark:text-orange-100 font-medium';
    case 'medium':
      return 'bg-yellow-200 text-yellow-900 dark:bg-yellow-700 dark:text-yellow-100 font-medium';
    case 'low':
      return 'bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100 font-medium';
    case 'info':
      return 'bg-indigo-200 text-indigo-900 dark:bg-indigo-700 dark:text-indigo-100 font-medium';
    default:
      return 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 font-medium';
  }
}

function getStatusClass(status: number): string {
  if (status >= 500) return 'bg-red-500 text-white'; // Server errors
  if (status >= 400) return 'bg-orange-500 text-white'; // Client errors
  if (status >= 300) return 'bg-blue-500 text-white'; // Redirects
  if (status >= 200) return 'bg-green-500 text-white'; // Success
  return 'bg-gray-500 text-white'; // Default
}

function getUrlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function formatBody(body: string): string {
  try {
    const json = JSON.parse(body);
    return JSON.stringify(json, null, 2);
  } catch {
    return body;
  }
}

function formatAudience(aud: string | string[] | undefined): string {
  if (!aud) return 'Not specified';
  if (Array.isArray(aud)) return aud.join(', ');
  return aud;
}

// Toggle row expansion
function toggleExpand(finding: Finding) {
  const index = expandedRows.value.findIndex((row: Finding) => row.id === finding.id);
  if (index >= 0) {
    expandedRows.value = expandedRows.value.filter((row: Finding) => row.id !== finding.id);
  } else {
    expandedRows.value = [...expandedRows.value, finding];
  }
}

// Handle row click for expansion
function onRowClick(event: any) {
  if (!event.data) return;
  
  // Don't toggle expansion if clicking on action buttons
  if (event.originalEvent.target.closest('.p-button')) {
    return;
  }
  
  toggleExpand(event.data);
}

// Token Actions
function viewTokenDetails(finding: Finding) {
  // Set navigate property to true to navigate to Token Details tab
  emit('view-details', { ...finding, navigate: true });
}

function decodeToken(finding: Finding) {
  if (finding.metadata.token) {
    emit('navigate-to', 'Decoder');
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('add-token-to-decoder', {
        detail: { token: finding.metadata.token }
      }));
    }, 100);
  }
}

function sendToEditor(finding: Finding) {
  if (finding.metadata.token) {
    emit('navigate-to', 'JWT Editor');
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('add-token-to-editor', {
        detail: { token: finding.metadata.token }
      }));
    }, 100);
  }
}

async function refreshFindings() {
  isLoading.value = true;
  emit('refresh');
  
  setTimeout(() => {
    isLoading.value = false;
  }, 500);
}

function formatTokenPreview(token: string): string {
  if (!token) return 'Unknown Token';
  
  // Show first part of token (header) plus a bit of the payload with ellipsis
  const parts = token.split('.');
  if (parts.length >= 2) {
    return `${parts[0].substring(0, 10)}...${parts[1].substring(0, 8)}...`;
  }
  
  // Fallback if token format is unexpected
  return token.length > 20 ? `${token.substring(0, 20)}...` : token;
}

async function copyTokenToClipboard(token: string): Promise<void> {
  if (!token) return;
  
  try {
    await navigator.clipboard.writeText(token);
    // Use proper SDK notification
    if (sdk?.window?.showToast) {
      sdk.window.showToast('JWT token copied to clipboard', { variant: 'success' });
    }
  } catch (e) {
    console.error('Failed to copy token to clipboard:', e);
    
    // Fallback method
    const textArea = document.createElement('textarea');
    textArea.value = token;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const success = document.execCommand('copy');
      if (success) {
        if (sdk?.window?.showToast) {
          sdk.window.showToast('JWT token copied to clipboard', { variant: 'success' });
        }
      } else {
        if (sdk?.window?.showToast) {
          sdk.window.showToast('Failed to copy token', { variant: 'error' });
        }
      }
    } catch (err) {
      if (sdk?.window?.showToast) {
        sdk.window.showToast('Failed to copy token', { variant: 'error' });
      }
      console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
  }
}

// Add a function to delete tokens
function deleteToken(finding: Finding): void {
  if (!finding || !finding.id) return;
  
  try {
    // Remove from current list
    const newFindings = props.findings.filter((f: Finding) => f.id !== finding.id);
    
    // Update SDK storage to persist the deletion
    const storageService = createJWTStorageService(sdk);
    storageService.saveFindings(newFindings);
    
    // Emit refresh event to notify parent to update
    emit('refresh');
    
    // Dispatch event to update findings in other components
    const event = new CustomEvent('jwt-findings-refreshed', { 
      detail: { findings: newFindings }
    });
    window.dispatchEvent(event);
    
    // Show success message using SDK
    if (sdk?.window?.showToast) {
      sdk.window.showToast('Token deleted successfully', { variant: 'success' });
    }
  } catch (error) {
    console.error('[JWT Analyzer] Error deleting token:', error);
    if (sdk?.window?.showToast) {
      sdk.window.showToast('Failed to delete token', { variant: 'error' });
    }
  }
}

// Update the watch mechanism to refresh the chart when findings change
watch(() => props.findings, () => {
  // Algorithm chart data will automatically update because it's a computed prop
  // No extra code needed here - the reactive system will handle it
}, { deep: true });

// Add this function to handle row toggle events
function onRowToggle(event: any) {
  // The event will already handle the expanded rows state
  // We just need this function to ensure the expander arrow works correctly
  expandedRows.value = event.data;
}

// Add the new format functions needed for the HTTPEditor
function formatRawHttpForDisplay(rawHttp: string): string {
  if (!rawHttp) return 'No data available';
  
  // Replace special characters for HTML display
  const htmlEscaped = rawHttp
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // Add syntax highlighting
  return htmlEscaped
    // Highlight HTTP method and URL
    .replace(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE)(\s+)([^\s]+)(\s+)(HTTP\/[0-9.]+)/gm, 
      '<span class="text-green-600 dark:text-green-400 font-bold">$1</span>$2<span class="text-blue-600 dark:text-blue-400">$3</span>$4<span class="text-purple-600 dark:text-purple-400">$5</span>')
    // Highlight status line
    .replace(/^(HTTP\/[0-9.]+)(\s+)([0-9]+)(\s+)(.+)$/gm,
      '<span class="text-purple-600 dark:text-purple-400">$1</span>$2<span class="text-blue-600 dark:text-blue-400 font-bold">$3</span>$4<span class="text-gray-600 dark:text-gray-400">$5</span>')
    // Highlight headers
    .replace(/^([A-Za-z0-9_-]+)(:)(.+)$/gm, 
      '<span class="text-amber-600 dark:text-amber-400 font-bold">$1</span><span class="text-gray-600 dark:text-gray-400">$2</span><span class="text-gray-800 dark:text-gray-300">$3</span>');
}

function formatRawHttpRequest(request: any): string {
  if (!request) return '';
  
  // Handle cases where we already have formatted raw HTTP
  if (request.rawHttp && typeof request.rawHttp === 'string') {
    // Use the pre-formatted HTTP string
    return request.rawHttp;
  }
  
  // Format the request line
  let raw = `${request.method || 'GET'} ${request.url || '/'} HTTP/1.1\r\n`;
  
  // Add headers
  if (request.headers) {
    Object.entries(request.headers).forEach(([name, value]) => {
      raw += `${name}: ${value}\r\n`;
    });
  }
  
  // Add separator between headers and body
  raw += '\r\n';
  
  // Add body if present
  if (request.body) {
    raw += request.body;
  }
  
  return raw;
}

function formatRawHttpResponse(response: any): string {
  if (!response) return '';
  
  // Handle cases where we already have formatted raw HTTP
  if (response.rawHttp && typeof response.rawHttp === 'string') {
    // Use the pre-formatted HTTP string
    return response.rawHttp;
  }
  
  // Format the status line
  let raw = `HTTP/1.1 ${response.status || response.statusCode || 200} OK\r\n`;
  
  // Add headers
  if (response.headers) {
    Object.entries(response.headers).forEach(([name, value]) => {
      raw += `${name}: ${value}\r\n`;
    });
  }
  
  // Add separator between headers and body
  raw += '\r\n';
  
  // Add body if present
  if (response.body) {
    raw += response.body;
  }
  
  return raw;
}

// Add function to get percentage for each algorithm
function getPercentage(item: { name: string, value: number }): number {
  const total = props.findings.length;
  if (total === 0) return 0;
  return Math.round((item.value / total) * 100);
}

// Add function to get color for each algorithm
function getAlgorithmColor(alg: string): string {
  const colorMap: Record<string, string> = {
    'HS256': '#4285F4', // Blue
    'RS256': '#EA4335', // Red
    'ES256': '#FBBC05', // Yellow
    'HS384': '#34A853', // Green
    'HS512': '#8E44AD', // Purple
    'none': '#555555',  // Dark Gray
    'RS384': '#00ACC1', // Teal
    'RS512': '#E91E63', // Pink
    'ES384': '#FF9800', // Orange
    'ES512': '#3949AB', // Indigo
    'PS256': '#9C27B0'  // Deep Purple
  };
  
  return colorMap[alg] || '#555555';
}

// Add this with other methods
function rowClass(data: Finding): Record<string, boolean> {
  // Add our new classes for border styling
  const severityClass = data.severity ? `severity-${data.severity}` : 'severity-info';
  return {
    'finding-row': true, // Base class for all rows
    'source-request': data.metadata?.source === 'request',
    'source-response': data.metadata?.source === 'response',
    'source-manual': data.metadata?.source === 'manual',
    [severityClass]: true // Add severity-based classes
  };
}

// Watch for changes in filtered findings and emit to parent
watch(filteredFindings, (newFilteredFindings: Finding[]) => {
  emit('filters-changed', newFilteredFindings);
});
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
}

.stats-grid {
  margin-bottom: 0;
}

:deep(.p-datatable) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.p-datatable-wrapper) {
  flex-grow: 1;
}

:deep(.p-datatable-table) {
  min-height: 200px;
}

:deep(.p-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
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

.request-expansion pre {
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.p-button.p-button-sm) {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

:deep(.p-row-toggler) {
  width: 2rem;
  height: 2rem;
}

/* Add styles for the expansion panel with colored border */
.request-expansion {
  border-left: 4px solid #4F46E5; /* Indigo color to match the JWT theme */
  padding-left: 1rem;
}

/* Different colors based on token source */
.request-expansion.request-source {
  border-left-color: #3B82F6; /* Blue for request source */
}

.request-expansion.response-source {
  border-left-color: #10B981; /* Green for response source */
}

.request-expansion.manual-source {
  border-left-color: #F59E0B; /* Amber for manual source */
}

/* NEW STYLES - Row colored borders */
:deep(.p-datatable .p-datatable-tbody > tr) {
  border-left: 4px solid transparent;
  position: relative;
  transition: all 0.2s ease;
}

/* Row border colors based on source */
:deep(.p-datatable .p-datatable-tbody > tr.source-request) {
  border-left-color: #3B82F6; /* Blue for request tokens */
}

:deep(.p-datatable .p-datatable-tbody > tr.source-response) {
  border-left-color: #10B981; /* Green for response tokens */
}

:deep(.p-datatable .p-datatable-tbody > tr.source-manual) {
  border-left-color: #F59E0B; /* Amber for manual tokens */
}

/* Add hover effect */
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  border-left-width: 6px;
}

/* Different colors for multiple rows if needed */
:deep(.p-datatable .p-datatable-tbody > tr:nth-child(4n+1)) { border-left-opacity: 1; }
:deep(.p-datatable .p-datatable-tbody > tr:nth-child(4n+2)) { border-left-opacity: 0.85; }
:deep(.p-datatable .p-datatable-tbody > tr:nth-child(4n+3)) { border-left-opacity: 0.7; }
:deep(.p-datatable .p-datatable-tbody > tr:nth-child(4n+4)) { border-left-opacity: 0.55; }

/* For severity-based row coloring */
:deep(.p-datatable .p-datatable-tbody > tr.severity-critical) {
  border-left-color: #EF4444; /* Red */
}

:deep(.p-datatable .p-datatable-tbody > tr.severity-high) {
  border-left-color: #F97316; /* Orange */
}

:deep(.p-datatable .p-datatable-tbody > tr.severity-medium) {
  border-left-color: #F59E0B; /* Amber */
}

:deep(.p-datatable .p-datatable-tbody > tr.severity-low) {
  border-left-color: #3B82F6; /* Blue */
}

:deep(.p-datatable .p-datatable-tbody > tr.severity-info) {
  border-left-color: #8B5CF6; /* Purple */
}
</style> 