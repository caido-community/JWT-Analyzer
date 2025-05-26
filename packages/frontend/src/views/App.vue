<!-- D:\Hunting Data\JWT Analyzer\JWT-Analyzer\packages\frontend\src\views\App.vue OLD -->
<template>
  <div class="jwt-analyzer h-full flex flex-col">
    <!-- Main Content Area -->
    <main class="flex-1 h-full">
      <TabView v-model:activeIndex="activeTab" class="h-full">
        <!-- Dashboard Tab -->
        <TabPanel>
          <template #header>
            <div class="p-tabview-nav-link">
              <span class="tab-icon"><i class="pi pi-chart-bar"></i></span>
              <span>Dashboard</span>
            </div>
          </template>
          <DashboardTab 
            :findings="findings" 
            @view-details="handleViewDetails" 
            @refresh="loadFindings"
            @filters-changed="handleFiltersChanged"
          />
        </TabPanel>

        <!-- Decoder Tab -->
        <TabPanel>
          <template #header>
            <div class="p-tabview-nav-link">
              <span class="tab-icon"><i class="pi pi-eye"></i></span>
              <span>JWT Decoder</span>
            </div>
          </template>
          <DecoderTab 
            @view-details="handleDecoderViewDetails"
            @send-to-editor="handleSendToEditor" 
          />
        </TabPanel>

        <!-- Token Details Tab -->
        <TabPanel>
          <template #header>
            <div class="p-tabview-nav-link">
              <span class="tab-icon"><i class="pi pi-key"></i></span>
              <span>Token Details</span>
            </div>
          </template>
          <div class="token-details-container h-full flex flex-col">
            <!-- Token Tabs navigation -->
            <div v-if="tokenDetailsTabs.length > 0" class="token-tabs bg-gray-100 dark:bg-surface-700 p-2 rounded-t-lg mb-2 flex items-center overflow-x-auto">
              <TabView v-model:activeIndex="activeTokenTab" class="token-tabs-inner w-full">
                <TabPanel v-for="(tab, index) in tokenDetailsTabs" :key="tab.id">
                  <template #header>
                    <div class="token-tab-header flex items-center">
                      <span class="truncate max-w-xs" :title="getTokenTabTitle(tab)">{{ tab.customName || getTokenTabTitle(tab) }}</span>
                      <button 
                        @click.stop="closeTokenTab(index)" 
                        class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <i class="pi pi-times"></i>
                      </button>
                    </div>
                  </template>
                  <TokenDetailsTab :finding="tab" @rename="(newName) => renameTab(newName, index)" />
                </TabPanel>
              </TabView>
            </div>
            
            <!-- Empty state when no tokens -->
            <div v-else class="flex items-center justify-center h-full flex-grow">
              <div class="text-center p-8 bg-gray-50 dark:bg-surface-700 rounded-lg shadow-sm max-w-md mx-auto">
                <div class="flex justify-center items-center mb-6">
                  <div class="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <i class="pi pi-key text-gray-400" style="font-size: 3.5rem;"></i>
                  </div>
                </div>
                <h3 class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Analyze JWT Tokens</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6 text-lg">Find and analyze tokens from your requests or use the JWT Decoder to analyze tokens manually.</p>
                <div class="flex flex-col md:flex-row justify-center gap-4">
                  <Button label="Go to Dashboard" class="p-button-outlined" @click="activeTab = 0">
                    <template #icon>
                      <i class="pi pi-chart-bar"></i>
                    </template>
                  </Button>
                  <Button label="Go to JWT Decoder" class="p-button-outlined" @click="activeTab = 1">
                    <template #icon>
                      <i class="pi pi-eye"></i>
                    </template>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- JWT Editor Tab -->
        <TabPanel>
          <template #header>
            <div class="p-tabview-nav-link">
              <span class="tab-icon">
                <i class="pi pi-code"></i>
              </span>
              <span>JWT Editor</span>
            </div>
          </template>
          <JWTEditorTab @view-details="handleEditorViewDetails" />
        </TabPanel>

        <!-- Settings Tab -->
        <TabPanel class="help-docs-tab">
          <template #header>
            <div class="p-tabview-nav-link">
              <span class="tab-icon"><i class="pi pi-info-circle"></i></span>
              <span>Help & Docs</span>
            </div>
          </template>
          <HelpAndDocsTab />
        </TabPanel>
      </TabView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onMounted } from 'vue';
import { onBeforeUnmount } from 'vue';
import { computed } from 'vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';

import { useSDK } from '../plugins/sdk';
import type { Finding, JWTHeader, JWTPayload } from '../types';

// Import components
import DashboardTab from '../components/DashboardTab.vue';
import TokenDetailsTab from '../components/TokenDetailsTab.vue';
import DecoderTab from '../components/DecoderTab.vue';
import HelpAndDocsTab from '../components/HelpAndDocsTab.vue';
import JWTEditorTab from '../components/JWTEditorTab.vue';
import Button from 'primevue/button';

const sdk = useSDK();
const findings = ref<Finding[]>([]);
const tokenDetailsTabs = ref<(Finding & { customName?: string })[]>([]);
const activeTab = ref(0);
const activeTokenTab = ref(0);

// Maximum number of token tabs to keep open
const MAX_TOKEN_TABS = 10;

// Load data and register event handlers
onMounted(async () => {
  // Try to load findings from localStorage first
  try {
    const savedFindings = localStorage.getItem('jwt_analyzer_findings');
    if (savedFindings) {
      findings.value = JSON.parse(savedFindings);
      console.log(`[JWT Analyzer] Loaded ${findings.value.length} findings from localStorage`);
    }
  } catch (e) {
    console.error('[JWT Analyzer] Error loading findings from localStorage:', e);
  }

  // Fetch existing findings
  loadFindings();

  // Register finding selection handler
  if (sdk && sdk.findings && sdk.findings.onSelect) {
    // Register for JWT Token finding type
    sdk.findings.onSelect('JWT Token', (finding) => {
      // Add the finding to our list if it's not already there
      const existingIndex = findings.value.findIndex(f => 
        f.metadata?.token === finding.metadata?.token);
      
      if (existingIndex === -1) {
        findings.value = [finding as Finding, ...findings.value];
      } else {
        // Replace with updated finding
        findings.value[existingIndex] = finding as Finding;
      }
      
      // DO NOT add to token details tabs automatically
      // Only add to dashboard
      
      // Always ensure we're on Dashboard tab
      activeTab.value = 0;
      
      // Notify dashboard of the new finding
      window.dispatchEvent(new CustomEvent('jwt-finding-added', {
        detail: finding
      }));
      
      // Save to localStorage
      try {
        localStorage.setItem('jwt_analyzer_findings', JSON.stringify(findings.value));
      } catch (e) {
        console.error('[JWT Analyzer] Error saving findings to localStorage:', e);
      }
    });
  }

  // Listen for backend event when a JWT token is analyzed
  if (sdk && sdk.backend && sdk.backend.onEvent) {
    sdk.backend.onEvent("jwt:analyzed", (finding) => {
      console.log("[JWT Analyzer] Received jwt:analyzed event from backend");
      
      // Add to dashboard
      const existingIndex = findings.value.findIndex(f => 
        f.metadata?.token === finding.metadata?.token);
      
      if (existingIndex === -1) {
        findings.value = [finding, ...findings.value];
      } else {
        // Replace with updated finding
        findings.value[existingIndex] = finding;
      }
      
      // Send an event so the dashboard knows to refresh
      window.dispatchEvent(new CustomEvent('jwt-finding-added', { 
        detail: finding 
      }));
      
      // DO NOT add to token details at all - only add to dashboard
      // addTokenToDetailsTabs(finding, false);
      
      // We explicitly do not switch tabs here - leave user in their current context
      
      // Show notification
      if (sdk?.notifications) {
        sdk.notifications.success('New JWT token analyzed - check dashboard');
      }
      
      // Update local storage to persist findings
      try {
        localStorage.setItem('jwt_analyzer_findings', JSON.stringify(findings.value));
      } catch (e) {
        console.error("Failed to save findings to localStorage:", e);
      }
    });
  }

  // Listen for navigate-tab event from components
  window.addEventListener('navigate-tab', ((event: CustomEvent) => {
    if (event.detail && typeof event.detail.tabIndex === 'number') {
      console.log(`[JWT Analyzer] Navigating to tab index ${event.detail.tabIndex}`);
      activeTab.value = event.detail.tabIndex;
    }
  }) as EventListener);

  // Listen for navigation events
  window.addEventListener('navigate-to-editor', () => {
    // Switch to JWT Editor tab (tab index 3)
    activeTab.value = 3;
  });
  
  // Listen for navigation to decoder
  window.addEventListener('navigate-to-decoder', (event: Event) => {
    const customEvent = event as CustomEvent;
    // Switch to Decoder tab (tab index 1)
    activeTab.value = 1;
    
    // Optional: wait a bit and then dispatch event to set the token in decoder
    if (customEvent.detail && customEvent.detail.token) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('set-decoder-token', {
          detail: { token: customEvent.detail.token }
        }));
      }, 100);
    }
  });
  
  // Listen for the jwt-finding-added event
  window.addEventListener('jwt-finding-added', ((event: CustomEvent) => {
    console.log("[JWT Analyzer] App received jwt-finding-added event:", event.detail);
    
    if (event.detail) {
      const finding = event.detail as Finding;
      // Add the finding to our list if it's not already there
      const existingIndex = findings.value.findIndex(f => 
        f.metadata?.token === finding.metadata?.token);
      
      if (existingIndex === -1) {
        console.log("[JWT Analyzer] Adding new finding to list");
        findings.value = [finding, ...findings.value];
      } else {
        // Replace with updated finding
        console.log("[JWT Analyzer] Updating existing finding");
        findings.value[existingIndex] = finding;
      }
      
      // DO NOT add to token details tabs by default
      // We want tokens to only go to dashboard initially
      
      // Switch to Dashboard tab (instead of Token Details)
      activeTab.value = 0;
    }
  }) as EventListener);
  
  // Listen for jwt-findings-refreshed event
  window.addEventListener('jwt-findings-refreshed', ((event: CustomEvent) => {
    console.log("[JWT Analyzer] App received jwt-findings-refreshed event");
    
    if (event.detail && Array.isArray(event.detail.findings)) {
      const refreshedFindings = event.detail.findings as Finding[];
      console.log(`[JWT Analyzer] Updating findings list with ${refreshedFindings.length} items`);
      findings.value = refreshedFindings;
    }
  }) as EventListener);

  // Log initialization
  if (sdk && sdk.console) {
    sdk.console.log('JWT Analyzer frontend initialized');
  }
});

// Add cleanup in beforeUnmount
function cleanupEventListeners() {
  window.removeEventListener('navigate-tab', ((event: CustomEvent) => {
    if (event.detail && typeof event.detail.tabIndex === 'number') {
      activeTab.value = event.detail.tabIndex;
    }
  }) as EventListener);
  
  window.removeEventListener('navigate-to-editor', () => {});
  window.removeEventListener('navigate-to-decoder', () => {});
  window.removeEventListener('jwt-finding-added', (() => {}) as EventListener);
  window.removeEventListener('jwt-findings-refreshed', (() => {}) as EventListener);
}

onBeforeUnmount(() => {
  cleanupEventListeners();
});

// Function to load findings
async function loadFindings() {
  if (sdk && sdk.findings && sdk.findings.getAll) {
    try {
      const allFindings = await sdk.findings.getAll();
      // Filter to only include JWT findings
      const backendFindings = allFindings.filter(f => 
        (f.title && f.title.includes('JWT')) || f.type === 'JWT Token'
      ) as Finding[];
      
      // Merge with existing findings, avoiding duplicates
      const existingTokens = new Set(findings.value.map(f => f.metadata?.token));
      const newFindings = backendFindings.filter(f => !existingTokens.has(f.metadata?.token));
      
      if (newFindings.length > 0) {
        // Add new findings from backend to our list
        findings.value = [...newFindings, ...findings.value];
        
        // Save the combined findings
        try {
          localStorage.setItem('jwt_analyzer_findings', JSON.stringify(findings.value));
        } catch (e) {
          console.error("Failed to save findings to localStorage:", e);
        }
      }
      
      // Sort by newest first (if timestamp is available)
      findings.value.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
        return 0;
      });
      
      // Update the dashboard by dispatching an event
      window.dispatchEvent(new CustomEvent('jwt-findings-refreshed', {
        detail: { findings: findings.value }
      }));
      
      console.log(`[JWT Analyzer] Loaded ${findings.value.length} findings total`);
    } catch (error) {
      console.error('Error fetching findings:', error);
      if (sdk?.notifications) {
        sdk.notifications.error('Failed to load findings');
      }
    }
  }
}

// Add a token to the details tabs
function addTokenToDetailsTabs(finding: Finding, makeActive: boolean = false, addToDetails: boolean = true) {
  // If addToDetails is false, don't add to token details tabs at all
  if (!addToDetails) {
    return;
  }

  // Check if this token is already in tabs
  const existingTabIndex = tokenDetailsTabs.value.findIndex(tab => 
    tab.metadata?.token === finding.metadata?.token
  );
  
  if (existingTabIndex !== -1) {
    // If it exists, replace with updated version
    tokenDetailsTabs.value[existingTabIndex] = { ...finding, customName: tokenDetailsTabs.value[existingTabIndex].customName };
    // Only make this tab active if explicitly requested
    if (makeActive) {
    activeTokenTab.value = existingTabIndex;
    }
  } else {
    // If not, add it to the tabs
    tokenDetailsTabs.value.push({ ...finding, customName: undefined });
    
    // Enforce maximum number of tabs
    if (tokenDetailsTabs.value.length > MAX_TOKEN_TABS) {
      tokenDetailsTabs.value.shift(); // Remove oldest tab
    }
    
    // Only set the newly added tab as active if explicitly requested
    if (makeActive) {
    activeTokenTab.value = tokenDetailsTabs.value.length - 1;
    }
  }
  
  // Store the tab information in local storage
  try {
    localStorage.setItem('jwt_analyzer_tabs', JSON.stringify(tokenDetailsTabs.value));
  } catch (e) {
    console.error("Failed to save tabs to localStorage:", e);
  }
}

// Close a token tab
function closeTokenTab(index: number) {
  // Remove the tab
  tokenDetailsTabs.value.splice(index, 1);
  
  // Adjust active tab if needed
  if (index <= activeTokenTab.value) {
    activeTokenTab.value = Math.max(0, activeTokenTab.value - 1);
  }
  
  // If no tabs left, show notification and return to dashboard
  if (tokenDetailsTabs.value.length === 0) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('All token tabs closed', {
        variant: 'info',
        duration: 3000
      });
    }
    
    // Return to dashboard if all tabs are closed
      activeTab.value = 0;
  }
}

// Get a readable title for the token tab
function getTokenTabTitle(tab: Finding & { customName?: string }): string {
  // Use custom name if available
  if (tab.customName) {
    return tab.customName;
  }
  
  // Otherwise use algorithm, issuer and expiration to create a readable title
  const alg = tab.metadata?.header?.alg || 'unknown';
  const issuer = tab.metadata?.payload?.iss || tab.metadata?.issuer || 'unknown';
  
  // Create a short form of the token for display
  const token = tab.metadata?.token || '';
  const shortToken = token.length > 15 ? token.substring(0, 12) + '...' : token;
  
  return `${alg} • ${issuer} • ${shortToken}`;
}

// Handle renaming a tab
function renameTab(newName: string, index: number) {
  if (index >= 0 && index < tokenDetailsTabs.value.length) {
    tokenDetailsTabs.value[index].customName = newName;
    
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Tab renamed successfully', {
        variant: 'success',
        duration: 3000
      });
    }
  }
}

// Methods
function handleViewDetails(finding: Finding & {navigate?: boolean}) {
  console.log("[JWT Analyzer] App handling viewDetails event", finding);
  
  // First, add to findings list for the dashboard if not already there
  const existingIndex = findings.value.findIndex(f => 
    f.metadata?.token === finding.metadata?.token);
    
  if (existingIndex === -1) {
    findings.value = [finding, ...findings.value];
    
    // Dispatch event to refresh dashboard
    window.dispatchEvent(new CustomEvent('jwt-finding-added', {
      detail: finding
    }));
    
    // Persist to localStorage
    try {
      localStorage.setItem('jwt_analyzer_findings', JSON.stringify(findings.value));
    } catch (e) {
      console.error("Failed to save findings to localStorage:", e);
    }
  }
  
  // Check if we should navigate to the token details tab
  if (finding.navigate === true) {
    console.log("[JWT Analyzer] Explicitly navigating to Token Details tab");
    // Add to token details tabs and make it active
    addTokenToDetailsTabs(finding, true, true);
    
    // Switch tab to token details - FIXED: using index 2 for Token Details tab
    activeTab.value = 2;
    
    // Show notification that token is ready in token details tab
    if (sdk?.notifications) {
      sdk.notifications.info('Viewing token details');
    }
  } else {
    // Stay on current tab
    console.log("[JWT Analyzer] Not navigating - keeping current tab");
    // Do NOT add to token details tabs at all
    
    if (sdk?.notifications) {
      sdk.notifications.info('Token added to dashboard');
    }
  }
}

// Handle view details from decoder
function handleDecoderViewDetails(token: string, header: JWTHeader, payload: JWTPayload, analysis: any, navigate: boolean = false) {
  // Create a temporary finding object for the token details view
  const tempFinding: Finding = {
    id: `manual-${Date.now()}`,
    title: 'Manual JWT Analysis',
    severity: determineHighestSeverity(analysis.risks || []),
    timestamp: new Date().toISOString(),
    metadata: {
      token,
      header,
      payload,
      risks: analysis.risks || [],
      suggestions: analysis.suggestions || [],
      source: 'manual',
      origin: 'JWT Decoder',
      action: 'Token was manually decoded and analyzed',
      severity: determineHighestSeverity(analysis.risks || []),
      timeLeft: analysis.timeLeft || 'Unknown',
      issuer: payload.iss || 'Not specified',
      subject: payload.sub || 'Not specified',
      audience: Array.isArray(payload.aud) ? payload.aud.join(', ') : (payload.aud || 'Not specified'),
    }
  };
  
  // Add the finding to our dashboard
  const existingIndex = findings.value.findIndex(f => 
    f.metadata?.token === tempFinding.metadata?.token);
    
  if (existingIndex === -1) {
    findings.value = [tempFinding, ...findings.value];
    
    // Notify that a finding was added to dashboard
    window.dispatchEvent(new CustomEvent('jwt-finding-added', {
      detail: tempFinding
    }));
    
    // Persist to localStorage
    try {
      localStorage.setItem('jwt_analyzer_findings', JSON.stringify(findings.value));
    } catch (e) {
      console.error("Failed to save findings to localStorage:", e);
    }
  }
  
  // Check if we should navigate to token details tab
  if (navigate) {
    // Add to token details tabs and make it active
    addTokenToDetailsTabs(tempFinding, true, true);
    
    // Switch to token details tab - FIXED: using index 2 for Token Details tab
    activeTab.value = 2;
    
    // Show notification
    if (sdk?.notifications) {
      sdk.notifications.success('Viewing token details');
    }
  } else {
    // Do NOT add to token details tabs at all
    // Keep notification to confirm token was added to dashboard
    if (sdk?.notifications) {
      sdk.notifications.success('Token added to dashboard');
    }
  }
}

// Handle view details from JWT editor
function handleEditorViewDetails(token: string, header: JWTHeader, payload: JWTPayload, analysis: any, navigate: boolean = false) {
  // Create a temporary finding object for the token details view
  const tempFinding: Finding = {
    id: `manual-${Date.now()}`,
    title: 'Manual JWT Analysis',
    severity: determineHighestSeverity(analysis.risks || []),
    timestamp: new Date().toISOString(),
    metadata: {
      token,
      header,
      payload,
      risks: analysis.risks || [],
      suggestions: analysis.suggestions || [],
      source: 'manual',
      origin: 'JWT Editor',
      action: 'Token was created or modified using the JWT Editor',
      expStatus: determineExpirationStatus(payload),
      timeLeft: calculateTimeLeft(payload?.exp),
      severity: determineHighestSeverity(analysis.risks || [])
    }
  };
  
  // Add the finding to our dashboard
  const existingIndex = findings.value.findIndex(f => 
    f.metadata?.token === tempFinding.metadata?.token);
    
  if (existingIndex === -1) {
    findings.value = [tempFinding, ...findings.value];
    
    // Notify that a finding was added
    window.dispatchEvent(new CustomEvent('jwt-finding-added', {
      detail: tempFinding
    }));
    
    // Persist to localStorage
    try {
      localStorage.setItem('jwt_analyzer_findings', JSON.stringify(findings.value));
    } catch (e) {
      console.error("Failed to save findings to localStorage:", e);
    }
  }
  
  // Check if we should navigate to token details tab
  if (navigate) {
    // Add to token details tabs and make it active
    addTokenToDetailsTabs(tempFinding, true, true);
    
    // Switch to token details tab - FIXED: using index 2 for Token Details tab
    activeTab.value = 2;
    
    // Show notification
    if (sdk?.notifications) {
      sdk.notifications.success('Viewing token details');
    }
  } else {
    // Do NOT add to token details tabs at all
    // Keep notification to confirm token was added to dashboard
    if (sdk?.notifications) {
      sdk.notifications.success('Token added to dashboard');
    }
  }
}

// Helper function to determine highest severity from risks
function determineHighestSeverity(risks: Array<{severity: string}>): string {
  if (risks.some(r => r.severity === 'critical')) return 'critical';
  if (risks.some(r => r.severity === 'high')) return 'high';
  if (risks.some(r => r.severity === 'medium')) return 'medium';
  if (risks.some(r => r.severity === 'low')) return 'low';
  return 'info';
}

// Helper function to determine token expiration status
function determineExpirationStatus(payload: JWTPayload): 'valid' | 'expired' | 'not_yet_valid' {
  if (!payload?.exp) return 'valid'; // No expiration set
  
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return 'expired';
  if (payload.nbf && payload.nbf > now) return 'not_yet_valid';
  return 'valid';
}

// Helper function to calculate time left
function calculateTimeLeft(exp?: number): string {
  if (!exp) return 'No expiration time';
  
  const now = Math.floor(Date.now() / 1000);
  const diff = exp - now;
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

// Handle send to editor event from DecoderTab
function handleSendToEditor(token: string) {
  // Switch to JWT Editor tab
  activeTab.value = 3;
  
  // The JWT Editor component will handle the token creation
  // We need to emit a custom event to notify the JWT Editor about the new token
  const event = new CustomEvent('add-token-to-editor', { 
    detail: { token } 
  });
  window.dispatchEvent(event);
}

// Update findings when filters are applied
function handleFiltersChanged(filteredFindings: Finding[]): void {
  // We're receiving the filtered findings from the DashboardTab component
  console.log(`[JWT Analyzer] Filtered findings: ${filteredFindings.length} of ${findings.value.length} total`);
}
</script>

<style scoped>
/* Global scrolling fixes */
html, body {
  height: 100%;
  overflow: auto !important;
}

.jwt-analyzer {
  height: 100%;
  overflow: auto !important;
  display: flex;
  flex-direction: column;
}

:deep(.p-tabview) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto !important;
}

:deep(.p-tabview-panels) {
  height: calc(100% - 48px); /* Ensure panels take full remaining height */
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto !important;
  padding: 1rem 0;
}

:deep(.p-tabview-panel) {
  height: 100%; /* Make each panel take full height */
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto !important;
}

/* Right align Help & Docs tab */
:deep(.p-tabview-nav) {
  display: flex;
  flex-wrap: wrap;
  position: relative;
}

:deep(.help-docs-tab) {
  margin-left: auto !important;
}

:deep(.help-docs-tab::before) {
  content: '';
  display: inline-block;
  width: 50px;
  border-left: 1px solid rgba(230, 230, 230, 0.5);
  margin-right: 20px;
  height: 20px;
}

:deep(.p-tabview-nav-container) {
  position: relative;
}

/* Component containers */
:deep(.dashboard-container),
:deep(.token-details-container),
:deep(.decoder-container),
:deep(.jwt-editor-container),
:deep(.settings-container) {
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto !important;
}

:deep(.p-card) {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: auto !important;
}

:deep(.p-card-content) {
  overflow: auto !important;
}

:deep(.p-tabview-nav-link) {
  display: flex;
  align-items: center;
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

:deep(.flex-grow) {
  flex-grow: 1;
}
</style>