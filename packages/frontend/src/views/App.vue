<!-- JWT Analyzer App.vue - Updated with clean Navigation structure -->
<template>
  <div class="h-full flex flex-col gap-1">
    <Navigation :current-page="currentPage" @page-change="handlePageChange" />

    <div class="flex-1 min-h-0">
      <component 
        :is="currentComponent" 
        :findings="findings"
        :tokenDetailsTabs="tokenDetailsTabs"
        :activeTokenTab="activeTokenTab"
        :finding="tokenDetailsTabs[activeTokenTab] || null"
        @view-details="handleViewDetails"
        @refresh="loadFindings"
        @filters-changed="handleFiltersChanged"
        @view-details-decoder="handleDecoderViewDetails"
        @send-to-editor="handleSendToEditor"
        @view-details-editor="handleEditorViewDetails"
        @navigate-to="handlePageChange"
        @navigate-tab="(index) => activeTokenTab = index"
        @close-token-tab="closeTokenTab"
        @rename="(newName) => renameTab(newName, activeTokenTab)"
        @get-token-tab-title="getTokenTabTitle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

import Navigation from '../components/Navigation.vue';
import { useSDK } from '../plugins/sdk';
import type { Finding, JWTHeader, JWTPayload } from '../types';
import { createJWTStorageService } from '../services/storage';

// Import components
import DashboardTab from '../components/DashboardTab.vue';
import TokenDetailsTab from '../components/TokenDetailsTab.vue';
import DecoderTab from '../components/DecoderTab.vue';
import HelpAndDocsTab from '../components/HelpAndDocsTab.vue';
import JWTEditorTab from '../components/JWTEditorTab.vue';
import Button from 'primevue/button';

const sdk = useSDK();
const storageService = createJWTStorageService(sdk);
const findings = ref<Finding[]>([]);
const tokenDetailsTabs = ref<(Finding & { customName?: string })[]>([]);
const activeTokenTab = ref(0);

// Navigation state
type PageType = "Dashboard" | "Decoder" | "Token Details" | "JWT Editor" | "Help & Docs";
const currentPage = ref<PageType>("Dashboard");

const currentComponent = computed(() => {
  switch (currentPage.value) {
    case "Dashboard":
      return DashboardTab;
    case "Decoder":
      return DecoderTab;
    case "Token Details":
      return TokenDetailsTab;
    case "JWT Editor":
      return JWTEditorTab;
    case "Help & Docs":
      return HelpAndDocsTab;
    default:
      return DashboardTab;
  }
});

const handlePageChange = (page: PageType) => {
  currentPage.value = page;
};

// Maximum number of token tabs to keep open
const MAX_TOKEN_TABS = 10;

// Load data and register event handlers
onMounted(async () => {
  // Try to load findings from SDK storage first
  try {
    const savedFindings = storageService.getFindings();
    if (savedFindings && savedFindings.length > 0) {
      findings.value = savedFindings;
    }
  } catch (e) {
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
      
      // Always ensure we're on Dashboard page
      currentPage.value = "Dashboard";
      
      // Notify dashboard of the new finding
      window.dispatchEvent(new CustomEvent('jwt-finding-added', {
        detail: finding
      }));
      
      // Save to localStorage
      try {
        localStorage.setItem('jwt_analyzer_findings', JSON.stringify(findings.value));
      } catch (e) {
      }
    });
  }

  // Listen for backend event when a JWT token is analyzed
  if (sdk && sdk.backend && sdk.backend.onEvent) {
    sdk.backend.onEvent("jwt:analyzed", (finding) => {
      
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
      }
    });
  }

  // Listen for navigate-tab event from components
  window.addEventListener('navigate-tab', ((event: CustomEvent) => {
    if (event.detail && typeof event.detail.tabIndex === 'number') {
      activeTokenTab.value = event.detail.tabIndex;
    }
  }) as EventListener);

  // Listen for navigation events
  window.addEventListener('navigate-to-editor', () => {
    currentPage.value = "JWT Editor";
  });
  
  // Listen for the jwt-finding-added event
  window.addEventListener('jwt-finding-added', ((event: CustomEvent) => {
    
    if (event.detail) {
      const finding = event.detail as Finding;
      // Add the finding to our list if it's not already there
      const existingIndex = findings.value.findIndex(f => 
        f.metadata?.token === finding.metadata?.token);
      
      if (existingIndex === -1) { 
        findings.value = [finding, ...findings.value];
      } else {
        // Replace with updated finding
        findings.value[existingIndex] = finding;
      }
      
      // DO NOT add to token details tabs by default
      // We want tokens to only go to dashboard initially
      
      // Switch to Dashboard tab
      currentPage.value = "Dashboard";
    }
  }) as EventListener);
  
  // Listen for jwt-findings-refreshed event
  window.addEventListener('jwt-findings-refreshed', ((event: CustomEvent) => {
    
    if (event.detail && Array.isArray(event.detail.findings)) {
      const refreshedFindings = event.detail.findings as Finding[];
      findings.value = refreshedFindings;
    }
  }) as EventListener);

  // Initialization complete
});

// Add cleanup in beforeUnmount
function cleanupEventListeners() {
  window.removeEventListener('navigate-tab', ((event: CustomEvent) => {
    if (event.detail && typeof event.detail.tabIndex === 'number') {
      activeTokenTab.value = event.detail.tabIndex;
    }
  }) as EventListener);
  
  window.removeEventListener('navigate-to-editor', () => {});
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
      
    } catch (error) {
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
    currentPage.value = "Dashboard";
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
    }
  }
  
  // Check if we should navigate to the token details tab
  if (finding.navigate === true) {
    // Add to token details tabs and make it active
    addTokenToDetailsTabs(finding, true, true);
    
    // Navigate to Token Details page
    currentPage.value = "Token Details";
    
    // Show notification that token is ready in token details tab
    if (sdk?.notifications) {
      sdk.notifications.info('Viewing token details');
    }
  } else {
    // Stay on current tab
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
    metadata: {
      token,
      header,
      payload,
      risks: analysis.risks || [],
      suggestions: analysis.suggestions || [],
      source: 'manual',
      expStatus: determineExpirationStatus(payload),
      timeLeft: calculateTimeLeft(payload?.exp),
      issuer: payload.iss || 'Not specified',
      subject: payload.sub || 'Not specified',
      audience: Array.isArray(payload.aud) ? payload.aud.join(', ') : (payload.aud || 'Not specified'),
      severity: determineHighestSeverity(analysis.risks || []),
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
    }
  }
  
  // Navigate to Token Details if requested
  if (navigate) {
    addTokenToDetailsTabs(tempFinding, true, true);
    currentPage.value = "Token Details";
    
    if (sdk?.window?.showToast) {
      sdk.window.showToast('Viewing token details', { variant: 'success' });
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
    metadata: {
      token,
      header,
      payload,
      risks: analysis.risks || [],
      suggestions: analysis.suggestions || [],
      source: 'manual',
      expStatus: determineExpirationStatus(payload),
      timeLeft: calculateTimeLeft(payload?.exp),
      issuer: payload.iss || 'Not specified',
      subject: payload.sub || 'Not specified',
      audience: Array.isArray(payload.aud) ? payload.aud.join(', ') : (payload.aud || 'Not specified'),
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
    }
  }
  
  // Navigate to Token Details if requested
  if (navigate) {
    addTokenToDetailsTabs(tempFinding, true, true);
    currentPage.value = "Token Details";
    
    if (sdk?.window?.showToast) {
      sdk.window.showToast('Viewing token details', { variant: 'success' });
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
  // Navigate to JWT Editor page
  currentPage.value = "JWT Editor";
  
  // Wait for component to mount before dispatching event
  setTimeout(() => {
    const event = new CustomEvent('add-token-to-editor', { 
      detail: { token } 
    });
    window.dispatchEvent(event);
  }, 100);
}


// Update findings when filters are applied
function handleFiltersChanged(filteredFindings: Finding[]): void {
  // We're receiving the filtered findings from the DashboardTab component
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