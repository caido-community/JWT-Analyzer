<template>
  <div class="requests-container">
    <div class="header-section">
      <h2 class="text-xl font-bold">Captured Requests</h2>
      <div class="flex gap-2">
        <button
          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          @click="handleRefresh"
        >
          <i class="pi pi-refresh mr-1"></i> Refresh
        </button>
        <button
          class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
          @click="handleClear"
        >
          <i class="pi pi-trash mr-1"></i> Clear
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-indicator">
      <i class="pi pi-spin pi-spinner text-2xl"></i>
      <span class="ml-2">Loading requests...</span>
    </div>

    <div v-else-if="error" class="error-message">
      <i class="pi pi-exclamation-triangle text-red-500 mr-2"></i>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="requests.length === 0" class="empty-state">
      <div class="text-center p-6">
        <i class="pi pi-inbox text-4xl text-gray-400 mb-2"></i>
        <p class="text-gray-500">No requests captured yet</p>
        <p class="text-sm text-gray-400 mt-2">
          Send requests through Caido to see them here
        </p>
      </div>
    </div>

    <div v-else class="request-list">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-100 dark:bg-gray-800">
            <th class="p-2 text-left">Method</th>
            <th class="p-2 text-left">URL</th>
            <th class="p-2 text-left">Time</th>
            <th class="p-2 text-left">JWT</th>
            <th class="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="request in requests"
            :key="request.id"
            :class="[
              'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900',
              selectedRequestId === request.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            ]"
            @click="selectRequest(request.id)"
          >
            <td class="p-2">
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-bold',
                  methodClass(request.method)
                ]"
              >
                {{ request.method }}
              </span>
            </td>
            <td class="p-2 truncate max-w-xs">{{ request.url }}</td>
            <td class="p-2 text-sm">{{ formatTime(request.timestamp) }}</td>
            <td class="p-2">
              <span
                v-if="request.hasJwt"
                class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-xs"
              >
                <i class="pi pi-check-circle mr-1"></i> Found
              </span>
              <span v-else class="text-gray-400 text-xs">None</span>
            </td>
            <td class="p-2">
              <button
                class="text-blue-500 hover:text-blue-700"
                @click.stop="viewRequestDetails(request.id)"
              >
                <i class="pi pi-search"></i>
              </button>
              <button
                v-if="request.hasJwt"
                class="text-green-500 hover:text-green-700 ml-2"
                @click.stop="analyzeJWT(request)"
              >
                <i class="pi pi-key"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Request Detail Modal -->
    <div v-if="showModal && selectedRequest" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="text-lg font-bold">
            {{ selectedRequest.method }} {{ urlPath(selectedRequest.url) }}
          </h3>
          <button 
            class="text-gray-500 hover:text-gray-800"
            @click="closeModal"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="section">
            <h4 class="text-md font-bold mb-2">Request Details</h4>
            <div class="detail-item">
              <span class="label">URL:</span>
              <span class="value">{{ selectedRequest.url }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Method:</span>
              <span class="value">{{ selectedRequest.method }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Time:</span>
              <span class="value">{{ new Date(selectedRequest.timestamp).toLocaleString() }}</span>
            </div>
            <div class="detail-item">
              <span class="label">JWT Locations:</span>
              <span class="value" v-if="selectedRequest.jwtLocations?.length">
                {{ selectedRequest.jwtLocations.join(', ') }}
              </span>
              <span class="value text-gray-400" v-else>None</span>
            </div>
          </div>
          
                              <div class="section">            <h4 class="text-md font-bold mb-2">Request Headers</h4>            <div v-if="Object.keys(selectedRequest.headers).length > 0" class="headers-table">              <table class="w-full border-collapse">                <thead>                  <tr class="bg-gray-100 dark:bg-gray-800">                    <th class="p-2 text-left">Name</th>                    <th class="p-2 text-left">Value</th>                  </tr>                </thead>                <tbody>                  <tr                     v-for="(value, name) in selectedRequest.headers"                     :key="name"                    class="border-b border-gray-200 dark:border-gray-700"                  >                    <td class="p-2 font-medium">{{ name }}</td>                    <td class="p-2 break-all">{{ value }}</td>                  </tr>                </tbody>              </table>            </div>            <div v-else class="empty-message">No headers</div>          </div>                    <div class="section" v-if="selectedRequest.body">            <h4 class="text-md font-bold mb-2">Request Body</h4>            <div class="body-content">              <pre>{{ formatBody(selectedRequest.body) }}</pre>            </div>          </div>                    <!-- Response Section -->          <div v-if="selectedRequest && selectedRequest.response" class="section response-section">            <h4 class="text-md font-bold mb-2">Response Details</h4>                        <div class="detail-item">              <span class="label">Status Code:</span>              <span class="value">{{ selectedRequest.response.statusCode }}</span>            </div>                        <h4 class="text-md font-bold mb-2 mt-4">Response Headers</h4>            <div v-if="selectedRequest.response.headers && Object.keys(selectedRequest.response.headers).length > 0" class="headers-table">              <table class="w-full border-collapse">                <thead>                  <tr class="bg-gray-100 dark:bg-gray-800">                    <th class="p-2 text-left">Name</th>                    <th class="p-2 text-left">Value</th>                  </tr>                </thead>                <tbody>                  <tr                     v-for="(value, name) in selectedRequest.response.headers"                     :key="name"                    class="border-b border-gray-200 dark:border-gray-700"                  >                    <td class="p-2 font-medium">{{ name }}</td>                    <td class="p-2 break-all">{{ value }}</td>                  </tr>                </tbody>              </table>            </div>            <div v-else class="empty-message">No response headers</div>                        <div class="section" v-if="selectedRequest.response.body">              <h4 class="text-md font-bold mb-2 mt-4">Response Body</h4>              <div class="body-content">                <pre>{{ formatBody(selectedRequest.response.body) }}</pre>              </div>            </div>          </div>          <div v-else class="section response-section">            <h4 class="text-md font-bold mb-2">Response</h4>            <div class="empty-message">No response data available</div>          </div>
        </div>
        <div class="modal-footer">
          <button 
            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            @click="closeModal"
          >
            Close
          </button>
          <button
            v-if="selectedRequest.hasJwt"
            class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded ml-2"
            @click="analyzeJWT(selectedRequest)"
          >
            Analyze JWT
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSDK } from '@/plugins/sdk';
import { requestStore } from '@/stores/requestStore';
import type { CapturedRequest } from '@/types';
import { extractJWTFromRequest } from '@/utils/apiUtils';

const sdk = useSDK();
const isLoading = computed(() => requestStore.isLoading());
const error = computed(() => requestStore.getError());
const requests = computed(() => requestStore.getRequests());
const selectedRequestId = ref<string | null>(null);
const selectedRequest = computed(() => 
  selectedRequestId.value ? requests.value.find(r => r.id === selectedRequestId.value) : null
);
const showModal = ref(false);

onMounted(() => {
  refreshRequests();
});

// Format date/time for display
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

// Extract path from URL for display
function urlPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return url;
  }
}

// Return CSS class based on HTTP method
function methodClass(method: string): string {
  const methodMap: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };
  
  return methodMap[method.toUpperCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
}

// Format JSON body for display
function formatBody(body: string): string {
  try {
    const json = JSON.parse(body);
    return JSON.stringify(json, null, 2);
  } catch {
    return body;
  }
}

// Event handlers
function selectRequest(id: string) {
  selectedRequestId.value = id;
}

async function viewRequestDetails(id: string) {
  selectedRequestId.value = id;
  
  // Load the full request data including response
  try {
    const response = await sdk.backend.getRequest(id);
    if (response.kind === "Success" && response.value) {
      // Log:("[JWT Analyzer] Loaded request details:", response.value);
      // Update the request in the store to ensure it has the latest data
      requestStore.addRequest(response.value);
    } else {
      // Error:("[JWT Analyzer] Failed to load request details:", response.error);
    }
  } catch (error) {
    // Error:("[JWT Analyzer] Error loading request details:", error);
  }
  
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function refreshRequests() {
  try {
    requestStore.setLoading(true);
    requestStore.setError(null);
    
    // Log:("[JWT Analyzer] Refreshing requests...");
    const response = await sdk.backend.getRequests();
    // Log:("[JWT Analyzer] getRequests response:", response);
    
    if (response.kind === "Success" && Array.isArray(response.value)) {
      // Log:(`[JWT Analyzer] Loaded ${response.value.length} requests`);
      requestStore.setRequests(response.value || []);
    } else {
      // Error:("[JWT Analyzer] Failed to load requests:", response.error || "Unknown error");
      requestStore.setError(response.error || "Failed to load requests");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Error:("[JWT Analyzer] Error loading requests:", error);
    requestStore.setError(`Error loading requests: ${errorMessage}`);
  } finally {
    requestStore.setLoading(false);
  }
}

async function handleRefresh() {
  await refreshRequests();
}

async function handleClear() {
  try {
    const response = await sdk.backend.clearRequests();
    
    if (response.kind === "Success") {
      requestStore.clearRequests();
      sdk.notifications?.success("Requests cleared");
    } else {
      sdk.notifications?.error(response.error || "Failed to clear requests");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    sdk.notifications?.error(`Error clearing requests: ${errorMessage}`);
  }
}

// Extract and analyze JWT token
async function analyzeJWT(request: CapturedRequest) {
  try {
    const mockRequest = {
      headers: request.headers,
      url: request.url,
      body: request.body ? { toString: () => request.body } : undefined,
      getId: () => request.id
    };
    
    const token = extractJWTFromRequest(mockRequest as any);
    
    if (token) {
      // Close modal if open
      if (showModal.value) {
        closeModal();
      }
      
      // Analyze the token
      const result = await sdk.backend.analyzeJWT({ 
        token, 
        requestId: request.id, 
        source: 'request' 
      });
      
      if (result.kind === "Success") {
        sdk.notifications?.success("JWT token analyzed");
      } else {
        sdk.notifications?.error(result.error || "Failed to analyze JWT token");
      }
    } else {
      sdk.notifications?.warning("No JWT token found");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    sdk.notifications?.error(`Error analyzing JWT: ${errorMessage}`);
  }
}
</script>

<style scoped>
.requests-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.request-list {
  flex: 1;
  overflow-y: auto;
}

.loading-indicator, .error-message, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #64748b;
}

.error-message {
  color: #ef4444;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.modal-container {
  background: white;
  border-radius: 0.5rem;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
}

.section {
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  margin-bottom: 0.5rem;
}

.label {
  font-weight: 500;
  width: 120px;
}

.headers-table, .body-content {
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  overflow: hidden;
}

.body-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  background: #f8fafc;
}

.body-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.empty-message {
  color: #94a3b8;
  padding: 1rem;
}

/* Dark mode */
:global([data-mode="dark"]) .modal-container {
  background: #1e293b;
}

:global([data-mode="dark"]) .modal-header,
:global([data-mode="dark"]) .modal-footer {
  border-color: #334155;
}

:global([data-mode="dark"]) .headers-table,
:global([data-mode="dark"]) .body-content {
  border-color: #334155;
}

:global([data-mode="dark"]) .body-content {
  background: #0f172a;
}
</style> 