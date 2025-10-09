<template>
  <div class="h-full flex flex-col">
    <!-- Token Tabs - Show if there are multiple tokens -->
    <div v-if="tokenDetailsTabs && tokenDetailsTabs.length > 0" class="token-tabs-header">
      <TabView v-model:activeIndex="currentTabIndex" class="token-tabs-inner" scrollable>
        <TabPanel v-for="(tab, index) in tokenDetailsTabs" :key="index">
          <template #header>
            <div class="flex items-center gap-2">
              <span class="text-sm">{{ getTabTitle(tab) }}</span>
              <Button 
                icon="pi pi-times" 
                text 
                rounded 
                severity="secondary" 
                size="small" 
                @click.stop="closeTab(index)"
                class="w-5 h-5 p-0"
              />
            </div>
          </template>
        </TabPanel>
      </TabView>
    </div>

    <!-- Token Details Content -->
    <div class="flex-1 min-h-0 overflow-auto p-4" @contextmenu.prevent="showContextMenu">
    <div v-if="currentFinding" class="jwt-details h-full flex flex-col">
      <!-- Toolbar with actions - improved styling -->
      <div class="flex items-center justify-end mb-3 gap-2">
        <Button label="Refresh" @click="refreshTokenDetails" size="small" class="p-button-outlined" style="border-radius: 6px; padding: 0.375rem 0.75rem;">
          <template #icon>
            <i class="pi pi-refresh"></i>
          </template>
        </Button>
        <Button label="Rename" @click="showRenameModal = true" size="small" class="p-button-outlined" style="border-radius: 6px; padding: 0.375rem 0.75rem;">
          <template #icon>
            <i class="pi pi-pencil"></i>
          </template>
        </Button>
        <Button label="Copy Token" @click="copyTokenToClipboard" size="small" class="p-button-outlined" style="border-radius: 6px; padding: 0.375rem 0.75rem;">
          <template #icon>
            <i class="pi pi-copy"></i>
          </template>
        </Button>
        <Button label="Send to JWT Editor" @click="sendToJWTEditor" size="small" class="p-button-outlined p-button-info" style="border-radius: 6px; padding: 0.375rem 0.75rem;">
          <template #icon>
            <i class="pi pi-external-link"></i>
          </template>
        </Button>
        <Button label="Export" @click="exportMenu.toggle($event)" size="small" class="p-button-outlined p-button-success" style="border-radius: 6px; padding: 0.375rem 0.75rem;">
          <template #icon>
            <i class="pi pi-download"></i>
          </template>
        </Button>
      </div>

      <!-- Token Header -->
      <div class="mb-4">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold">Token Summary</h2>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="bg-gray-50 dark:bg-surface-700 rounded-md px-3 py-2 flex items-center justify-between" style="border: 1px solid rgba(209, 213, 219, 0.3);">
            <div class="flex items-center gap-2">
              <i class="pi pi-shield text-sm" style="color: currentColor;"></i>
              <span class="font-semibold text-xs">Algorithm</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs font-mono">{{ currentFinding.metadata.header?.alg || 'None' }}</span>
              <span v-if="isWeakAlgorithm(currentFinding.metadata.header?.alg)" class="text-orange-500 text-xs">⚠️</span>
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-surface-700 rounded-md px-3 py-2 flex items-center justify-between" style="border: 1px solid rgba(209, 213, 219, 0.3);">
            <div class="flex items-center gap-2">
              <i class="pi pi-key text-sm" style="color: currentColor;"></i>
              <span class="font-semibold text-xs">Signature Type</span>
            </div>
            <div class="text-xs font-semibold" :class="{
              'text-blue-600 dark:text-blue-400': isAsymmetricAlgorithm(currentFinding.metadata.header?.alg),
              'text-purple-600 dark:text-purple-400': isSymmetricAlgorithm(currentFinding.metadata.header?.alg),
              'text-red-600 dark:text-red-400': currentFinding.metadata.header?.alg === 'none'
            }">
              {{ getSignatureTypeLabel(currentFinding.metadata.header?.alg) }}
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-surface-700 rounded-md px-3 py-2 flex items-center justify-between" style="border: 1px solid rgba(209, 213, 219, 0.3);">
            <div class="flex items-center gap-2">
              <i class="pi pi-user text-sm" style="color: currentColor;"></i>
              <span class="font-semibold text-xs">Issuer</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs font-mono">{{ currentFinding.metadata.payload?.iss || currentFinding.metadata.issuer || 'Not specified' }}</span>
              <span v-if="!currentFinding.metadata.payload?.iss && !currentFinding.metadata.issuer" class="text-orange-500 text-xs">⚠️</span>
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-surface-700 rounded-md px-3 py-2 flex items-center justify-between" style="border: 1px solid rgba(209, 213, 219, 0.3);">
            <div class="flex items-center gap-2">
              <i class="pi pi-clock text-sm" style="color: currentColor;"></i>
              <span class="font-semibold text-xs">Expiration</span>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-xs" v-if="currentFinding.metadata.payload?.exp">
                {{ formatExpirationTime(currentFinding.metadata.payload.exp) }}
              </span>
              <span class="text-xs" v-else-if="currentFinding.metadata.expiresAt && currentFinding.metadata.expiresAt !== 'Not specified'">
                {{ currentFinding.metadata.expiresAt }}
              </span>
              <span class="text-xs text-orange-500" v-else>No expiration set</span>
              <span class="text-[10px]" :class="getExpirationStatusClass(currentFinding)">
                {{ currentFinding.metadata.timeLeft || 'No expiration time' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Analysis -->
      <div class="mb-4">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold">Security Analysis</h2>
          <div class="flex items-center">
            <div class="mr-2">Severity:</div>
            <span 
              :class="[
                getSeverityClass(getOverallSeverity(finding)),
                'px-3 py-1 text-xs font-medium rounded-md inline-block min-w-[70px] text-center'
              ]"
            >
              {{ getOverallSeverity(finding).charAt(0).toUpperCase() + getOverallSeverity(finding).slice(1) }}
            </span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- Security Overview Card -->
          <Card class="bg-gray-50 dark:bg-surface-700">
            <template #title>
              <div class="flex items-center">
                <span class="tab-icon">
                  <i class="pi pi-shield"></i>
                </span>
                <span>Security Overview</span>
              </div>
            </template>
            <template #content>
              <div class="mb-3 p-3 rounded" :class="{
                'bg-red-200 dark:bg-red-700/40': getOverallSeverity(finding) === 'critical',
                'bg-orange-200 dark:bg-orange-700/40': getOverallSeverity(finding) === 'high',
                'bg-yellow-200 dark:bg-yellow-700/40': getOverallSeverity(finding) === 'medium',
                'bg-blue-200 dark:bg-blue-700/40': getOverallSeverity(finding) === 'low',
                'bg-indigo-200 dark:bg-indigo-700/40': getOverallSeverity(finding) === 'info'
              }">
                <div class="font-semibold mb-1">Overall Assessment</div>
                <div>{{ getSecuritySummary(finding) }}</div>
              </div>

              <!-- Token Validity -->
              <div class="border-b dark:border-gray-700 mb-3 pb-3">
                <div class="font-semibold mb-1">Token Validity</div>
                <div class="flex items-center justify-between">
                  <span>Expiration Status:</span>
                  <span :class="currentFinding && currentFinding.metadata ? getExpirationStatusClass(currentFinding) : 'text-gray-500'">
                    {{ currentFinding?.metadata?.payload?.exp ? (currentFinding?.metadata?.expStatus === 'valid' ? 'Valid' : 'Expired') : 'Not Set' }}
                  </span>
                </div>
                <div class="flex items-center justify-between mt-1">
                  <span>Time Remaining:</span>
                  <span>{{ currentFinding?.metadata?.payload?.exp ? currentFinding?.metadata?.timeLeft : 'No expiration time' }}</span>
                </div>
              </div>

              <!-- Risk Summary -->
              <div class="border-b dark:border-gray-700 mb-3 pb-3">
                <div class="font-semibold mb-1">Risk Summary</div>
                <div class="grid grid-cols-2 gap-2 mt-2">
                  <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <div>Critical: {{ countRisksBySeverity(finding, 'critical') }}</div>
                  </div>
                  <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <div>High: {{ countRisksBySeverity(finding, 'high') }}</div>
                  </div>
                  <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <div>Medium: {{ countRisksBySeverity(finding, 'medium') }}</div>
                  </div>
                  <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <div>Low: {{ countRisksBySeverity(finding, 'low') }}</div>
                  </div>
                </div>
              </div>

              <!-- Critical Vulnerabilities -->
              <div class="border-b dark:border-gray-700 mb-3 pb-3">
                <div class="font-semibold mb-1">Critical Vulnerabilities</div>
                <div v-if="currentFinding.metadata.risks && currentFinding.metadata.risks.filter(r => r.severity === 'critical').length > 0">
                  <div v-for="(risk, idx) in currentFinding.metadata.risks.filter(r => r.severity === 'critical')" :key="idx"
                    class="mt-1 text-red-600 dark:text-red-400">
                    {{ risk.description }}
                  </div>
                </div>
                <div v-else class="text-success-500 dark:text-success-400">
                  No critical vulnerabilities detected
                </div>
              </div>

              <!-- Security Considerations -->
              <div>
                <div class="font-semibold mb-1">Security Considerations</div>
                <div v-if="currentFinding.metadata.header?.alg === 'none'" class="text-red-600 dark:text-red-400 mt-1">
                  <div class="flex items-start">
                    <span class="font-bold mr-1">•</span>
                    <span>Using 'none' algorithm is extremely dangerous and bypasses signature verification</span>
                  </div>
                </div>
                <div v-if="['HS256', 'HS384', 'HS512'].includes(currentFinding.metadata.header?.alg || '')" class="text-orange-600 dark:text-orange-400 mt-1">
                  <div class="flex items-start">
                    <span class="font-bold mr-1">•</span>
                    <span>Symmetric algorithm requires careful key management</span>
                  </div>
                </div>
                <div v-if="currentFinding.metadata.header?.jwk || currentFinding.metadata.header?.jku" class="text-red-600 dark:text-red-400 mt-1">
                  <div class="flex items-start">
                    <span class="font-bold mr-1">•</span>
                    <span>JWK/JKU parameters present - possible signature bypass risk</span>
                  </div>
                </div>
                <div v-if="!currentFinding.metadata.payload?.exp" class="text-orange-600 dark:text-orange-400 mt-1">
                  <div class="flex items-start">
                    <span class="font-bold mr-1">•</span>
                    <span>No expiration time - token remains valid indefinitely</span>
                  </div>
                </div>
                <div v-else-if="isLongExpiration(currentFinding.metadata.payload?.exp)" class="text-yellow-600 dark:text-yellow-400 mt-1">
                  <div class="flex items-start">
                    <span class="font-bold mr-1">•</span>
                    <span>Long expiration time increases risk if compromised</span>
                  </div>
                </div>
                <div v-if="currentFinding.metadata.header?.alg === 'RS256'" class="text-yellow-600 dark:text-yellow-400 mt-1">
                  <div class="flex items-start">
                    <span class="font-bold mr-1">•</span>
                    <span>Check for algorithm confusion vulnerabilities (RS256 to HS256)</span>
                  </div>
                </div>
                <div v-if="Object.keys(currentFinding.metadata.payload || {}).some(k => 
                    k.toLowerCase().includes('admin') || 
                    k.toLowerCase().includes('role') || 
                    k.toLowerCase().includes('priv'))" class="text-orange-600 dark:text-orange-400 mt-1">
                  <div class="flex items-start">
                    <span class="font-bold mr-1">•</span>
                    <span>Token contains privileged access claims</span>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Algorithm & Expiration Card -->
          <Card class="bg-gray-50 dark:bg-surface-700">
            <template #title>
              <div class="flex items-center">
                <span class="tab-icon">
                  <i class="pi pi-cog"></i>
                </span>
                <span>Technical Details</span>
              </div>
            </template>
            <template #content>
              <!-- Algorithm Security -->
              <div class="border-b dark:border-gray-700 mb-3 pb-3">
                <div class="font-semibold mb-1">Algorithm</div>
                <div class="flex items-center justify-between">
                  <span class="font-mono">{{ currentFinding.metadata.header?.alg || 'None' }}</span>
                  <span 
                    :class="[
                      isWeakAlgorithm(currentFinding.metadata.header?.alg) ? 
                        'bg-yellow-200 text-yellow-900 dark:bg-yellow-700 dark:text-yellow-100' : 
                        'bg-green-200 text-green-900 dark:bg-green-700 dark:text-green-100',
                      'px-3 py-1 text-xs font-medium rounded-md inline-block min-w-[70px] text-center'
                    ]"
                  >
                    {{ isWeakAlgorithm(currentFinding.metadata.header?.alg) ? 'Weak' : 'Strong' }}
                  </span>
                </div>
                <div v-if="isWeakAlgorithm(currentFinding.metadata.header?.alg)" class="mt-2 text-sm text-orange-600 dark:text-orange-400">
                  {{ getAlgorithmWarning(currentFinding.metadata.header?.alg) }}
                </div>
              </div>

              <!-- Expiration Details -->
              <div class="border-b dark:border-gray-700 mb-3 pb-3">
                <div class="font-semibold mb-1">Expiration</div>
                <div class="flex items-center justify-between">
                  <span>Expires At:</span>
                  <span v-if="currentFinding.metadata.payload?.exp" class="font-mono">
                    {{ formatExpirationTime(currentFinding.metadata.payload.exp) }}
                  </span>
                  <span v-else class="text-orange-600 dark:text-orange-400">Not Set</span>
                </div>
                <div v-if="!currentFinding.metadata.payload?.exp" class="mt-2 text-sm text-orange-600 dark:text-orange-400">
                  Missing expiration increases the window of opportunity for attackers.
                </div>
              </div>

              <!-- Issuance Details -->
              <div>
                <div class="font-semibold mb-1">Issuance</div>
                <div class="flex items-center justify-between">
                  <span>Issued At:</span>
                  <span v-if="currentFinding.metadata.payload?.iat" class="font-mono">
                    {{ formatIssuedAt(currentFinding.metadata.payload.iat) }}
                  </span>
                  <span v-else class="text-orange-600 dark:text-orange-400">Not Set</span>
                </div>
                <div v-if="currentFinding.metadata.payload?.iat" class="flex items-center justify-between mt-1">
                  <span>Token Age:</span>
                  <span>{{ getTokenAge(currentFinding.metadata.payload.iat) }}</span>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Vulnerabilities Card -->
        <div class="text-lg font-semibold mb-2">Vulnerabilities & Recommendations</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- Identified Risks Card -->
          <Card class="bg-gray-50 dark:bg-surface-700">
            <template #title>
              <div class="flex items-center">
                <span class="tab-icon">
                  <i class="pi pi-exclamation-triangle"></i>
                </span>
                <span>Identified Risks</span>
              </div>
            </template>
            <template #content>
              <div v-if="currentFinding.metadata.risks && currentFinding.metadata.risks.length > 0" class="findings-panel">
                <div class="space-y-3">
                  <div v-for="(risk, index) in currentFinding.metadata.risks" :key="index" 
                       class="border border-gray-200 dark:border-gray-700 rounded p-3">
                    <div class="flex items-center justify-between mb-1">
                      <div class="flex items-center">
                        <span
                            :class="['inline-block w-2 h-2 rounded-full mr-2', risk.severity === 'critical' ? 'bg-red-500' : risk.severity === 'high' ? 'bg-orange-500' : risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500']">
                        </span>
                        <span class="font-semibold">{{ risk.description }}</span>
                      </div>
                      <div>
                        <span :class="['px-2 py-1 rounded-md text-xs', getSeverityClass(risk.severity)]">{{ risk.severity }}</span>
                      </div>
                    </div>
                    <div v-if="risk.impact" class="text-sm ml-4 text-gray-600 dark:text-gray-400">
                      <span class="font-semibold">Impact:</span> {{ risk.impact }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-8">
                <div class="text-gray-500">No vulnerabilities found</div>
              </div>
            </template>
          </Card>
          
          <!-- Attack Vectors Card -->
          <Card class="bg-gray-50 dark:bg-surface-700">
            <template #title>
              <div class="flex items-center">
                <span class="tab-icon">
                  <i class="pi pi-eye-slash"></i>
                </span>
                <span>Potential Attack Vectors</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-2 mb-4">
                <ul class="space-y-2 list-none">
                  <li v-if="currentFinding.metadata.header?.alg === 'none'" class="border-l-2 border-red-500 pl-2">
                    <strong class="text-gray-700 dark:text-gray-300 font-semibold">Algorithm Bypass:</strong> 
                    <span>Modify the algorithm to "none" and remove the signature to bypass validation completely. Many JWT libraries have special handling for the 'none' algorithm.</span>
                  </li>
                  <li v-if="['HS256', 'HS384', 'HS512'].includes(currentFinding.metadata.header?.alg || '')" class="border-l-2 border-orange-500 pl-2">
                    <strong class="text-gray-700 dark:text-gray-300 font-semibold">Key Brute-Force:</strong> 
                    <span>Symmetric keys may be susceptible to brute-force or dictionary attacks using tools like hashcat (mode 16500) with common JWT secret wordlists.</span>
                  </li>
                  <li v-if="currentFinding.metadata.header?.alg === 'RS256'" class="border-l-2 border-orange-500 pl-2">
                    <strong class="text-gray-700 dark:text-gray-300 font-semibold">Algorithm Confusion (CVE-2016-5431):</strong> 
                    <span>Vulnerable libraries may accept algorithm changes from RS256 to HS256, allowing attackers to sign tokens using the public key as an HMAC secret.</span>
                  </li>
                  <li v-if="currentFinding.metadata.header?.kid" class="border-l-2 border-orange-500 pl-2">
                    <strong class="text-gray-700 dark:text-gray-300 font-semibold">Key ID Injection:</strong> 
                    <span>The 'kid' parameter could be vulnerable to path traversal (e.g., '../../../dev/null') or SQL injection attacks if improperly validated.</span>
                  </li>
                  <li v-if="!currentFinding.metadata.payload?.exp" class="border-l-2 border-orange-500 pl-2">
                    <strong class="text-gray-700 dark:text-gray-300 font-semibold">Immortal Token:</strong> 
                    <span>Tokens without expiration remain valid indefinitely after compromise, even after password changes or user account deletion.</span>
                  </li>
                </ul>
              </div>
                
              <h4 class="text-md font-semibold mt-6 mb-2">Security Recommendations</h4>
              <div v-if="currentFinding.metadata.suggestions && currentFinding.metadata.suggestions.length > 0" class="space-y-1 mb-4">
                <div v-for="(suggestion, index) in currentFinding.metadata.suggestions.slice(0, 5)" :key="index" class="flex items-start">
                  <span class="text-green-600 dark:text-green-400 mr-2">•</span>
                  <span>{{ suggestion }}</span>
                </div>
              </div>
              <div v-else class="text-gray-500 dark:text-gray-400 italic mb-4">
                No suggestions available
              </div>

              <h4 class="text-md font-semibold mt-6 mb-2">CVE Mitigations</h4>
              <div class="space-y-2">
                <div v-if="currentFinding.metadata.header?.alg === 'none'" class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-2 rounded-r text-sm">
                  <strong class="block text-gray-700 dark:text-gray-300">CVE-2015-9235 (None Algorithm)</strong>
                  <span>Update your JWT library to reject tokens with 'none' algorithm.</span>
                </div>
                <div v-if="currentFinding.metadata.header?.alg === 'RS256'" class="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-2 rounded-r text-sm">
                  <strong class="block text-gray-700 dark:text-gray-300">CVE-2016-5431 (Algorithm Confusion)</strong>
                  <span>Always verify tokens with the expected algorithm.</span>
                </div>
                <div v-if="typeof currentFinding.metadata.payload?.exp === 'string'" class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-2 rounded-r text-sm">
                  <strong class="block text-gray-700 dark:text-gray-300">CVE-2022-21449 (Type Confusion)</strong>
                  <span>Ensure all numeric claims use proper number types.</span>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Token Parts -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card class="bg-gray-50 dark:bg-surface-700">
          <template #title>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center">
                <span class="tab-icon">
                  <i class="pi pi-code"></i>
                </span>
                <span>Header</span>
              </div>
              <Button icon="pi pi-copy" text rounded aria-label="Copy Header" 
                @click="copyToClipboard(JSON.stringify(currentFinding.metadata.header, null, 2))" />
            </div>
          </template>
          <template #content>
            <div class="bg-gray-800 text-white p-3 rounded font-mono text-sm overflow-auto max-h-64">
              <pre>{{ JSON.stringify(currentFinding.metadata.header, null, 2) }}</pre>
            </div>
          </template>
        </Card>

        <Card class="bg-gray-50 dark:bg-surface-700">
          <template #title>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center">
                <span class="tab-icon">
                  <i class="pi pi-tag"></i>
                </span>
                <span>Payload</span>
              </div>
              <Button icon="pi pi-copy" text rounded aria-label="Copy Payload" 
                @click="copyToClipboard(JSON.stringify(currentFinding.metadata.payload, null, 2))" />
            </div>
          </template>
          <template #content>
            <div class="bg-gray-800 text-white p-3 rounded font-mono text-sm overflow-auto max-h-64">
              <pre>{{ JSON.stringify(currentFinding.metadata.payload, null, 2) }}</pre>
            </div>
          </template>
        </Card>
      </div>

      <!-- Full Token -->
      <Card class="flex-grow bg-gray-50 dark:bg-surface-700">
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="tab-icon">
                <i class="pi pi-key"></i>
              </span>
              <span>Raw Token</span>
            </div>
            <Button icon="pi pi-copy" text rounded aria-label="Copy Token" 
              @click="copyToClipboard(currentFinding.metadata.token)" />
          </div>
        </template>
        <template #content>
          <div class="bg-gray-800 text-white p-3 rounded font-mono text-sm overflow-auto max-h-32 jwt-token-display">
            <div class="token-part token-header">{{ currentFinding.metadata.token.split('.')[0] }}</div>
            <div class="token-part token-payload">{{ currentFinding.metadata.token.split('.')[1] }}</div>
            <div class="token-part token-signature">{{ currentFinding.metadata.token.split('.')[2] }}</div>
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Empty state when no finding is present -->
    <div v-else class="flex items-center justify-center h-full flex-grow">
      <div class="text-center p-8 bg-gray-50 dark:bg-surface-700 rounded-lg shadow-sm max-w-lg mx-auto">
        <div class="flex justify-center items-center mb-6">
          <div class="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <i class="pi pi-key text-gray-400 dark:text-gray-500" style="font-size: 3.5rem;"></i>
          </div>
        </div>
        <h3 class="text-2xl font-semibold text-gray-300 dark:text-gray-300 mb-4">Select a JWT Token</h3>
        <p class="text-gray-400 dark:text-gray-400 mb-6 text-lg">Use the Dashboard to view intercepted tokens or try the JWT Decoder to analyze a token manually</p>
        <div class="flex flex-col md:flex-row justify-center gap-4">
          <Button label="Go to Dashboard" class="p-button-outlined" @click="navigateToDashboard" icon="pi pi-chart-bar" />
          <Button label="Open JWT Decoder" class="p-button-outlined" @click="navigateToDecoder" icon="pi pi-eye" />
        </div>
      </div>
    </div>

    <!-- Context Menu for right-click -->
    <Menu id="context-menu" ref="menu" :model="contextMenuItems" :popup="true" />
    
    <!-- Export Menu -->
    <Menu id="export-menu" ref="exportMenu" :model="exportMenuItems" :popup="true" />
    
    <!-- Rename Dialog -->
    <Dialog v-model:visible="showRenameModal" header="Rename Token" :style="{ width: '30vw' }" :modal="true" class="jwt-dialog">
      <div class="p-fluid">
        <div class="field">
          <label for="tab-name" class="block font-medium mb-2">Token Name</label>
          <InputText id="tab-name" v-model="newTokenName" class="w-full" placeholder="Enter a name for this token" />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" @click="showRenameModal = false" class="p-button-outlined">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </template>
          </Button>
          <Button label="Save" @click="renameToken" severity="success" class="p-button-raised">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </template>
          </Button>
        </div>
      </template>
    </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { computed } from 'vue';
import { onMounted } from 'vue';
import { watch } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import type { Finding } from '../types';
import { useSDK } from '../plugins/sdk';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Menu from 'primevue/menu';
import { analyzeJWTSecurity, decodeJWT } from '../utils/jwt';

const sdk = useSDK();

// Props
const props = defineProps<{
  finding: Finding | null,
  tokenDetailsTabs?: (Finding & { customName?: string })[],
  activeTokenTab?: number
}>();

// Current tab index (synced with parent)
const currentTabIndex = ref(props.activeTokenTab || 0);

// Watch for changes to activeTokenTab prop
watch(() => props.activeTokenTab, (newVal) => {
  if (newVal !== undefined) {
    currentTabIndex.value = newVal;
  }
});

// Watch for changes to currentTabIndex and notify parent
watch(currentTabIndex, (newVal) => {
  if (newVal !== props.activeTokenTab) {
    emit('navigate-tab', newVal);
  }
});

// Computed property for the current finding
const currentFinding = computed(() => {
  if (props.tokenDetailsTabs && props.tokenDetailsTabs.length > 0) {
    return props.tokenDetailsTabs[currentTabIndex.value] || props.finding;
  }
  
  return props.finding;
});

// Watch for changes to the finding prop to auto-refresh token details
watch(() => currentFinding.value?.metadata?.token, (newToken: string | undefined, oldToken: string | undefined) => {
  if (newToken && newToken !== oldToken) {
    refreshTokenDetails(false);
  }
}, { immediate: true });

// Emit events to parent
const emit = defineEmits<{
  (e: 'rename', newName: string, index: number): void;
  (e: 'navigate-tab', index: number): void;
  (e: 'close-token-tab', index: number): void;
  (e: 'navigate-to', page: string): void;
}>();

// Functions for tab management
function getTabTitle(tab: Finding & { customName?: string }): string {
  if (tab.customName) {
    return tab.customName;
  }
  
  const alg = tab.metadata?.header?.alg || 'unknown';
  const issuer = tab.metadata?.payload?.iss || tab.metadata?.issuer || 'unknown';
  const token = tab.metadata?.token || '';
  const shortToken = token.length > 10 ? token.substring(0, 10) + '...' : token;
  
  return `${alg} • ${issuer.substring(0, 15)}${issuer.length > 15 ? '...' : ''}`;
}

function closeTab(index: number) {
  emit('close-token-tab', index);
}

// Context menu and rename dialog state
const menu = ref();
const showRenameModal = ref(false);
const newTokenName = ref('');

// Export menu state
const exportMenu = ref();
const exportMenuItems = ref([
  {
    label: 'Export as Markdown',
    icon: 'pi pi-file',
    command: () => exportAsMarkdown(),
    template: (item) => {
      return (
        `<div class="p-menuitem-content" @click="${item.command}">
          <div class="flex items-center px-3 py-2">
            <i class="pi pi-file mr-2"></i>
            <span>Export as Markdown</span>
          </div>
        </div>`
      );
    }
  },
  {
    label: 'Export as JSON',
    icon: 'pi pi-code',
    command: () => exportAsJSON(),
    template: (item) => {
      return (
        `<div class="p-menuitem-content" @click="${item.command}">
          <div class="flex items-center px-3 py-2">
            <i class="pi pi-code mr-2"></i>
            <span>Export as JSON</span>
          </div>
        </div>`
      );
    }
  }
]);

// Context menu items
const contextMenuItems = ref([
  {
    label: 'Rename Tab',
    icon: 'pi pi-pencil',
    command: () => openRenameDialog(),
    template: (item) => {
      return (
        `<div class="p-menuitem-content" @click="${item.command}">
          <div class="flex items-center px-3 py-2">
            <i class="pi pi-pencil mr-2"></i>
            <span>${item.label}</span>
          </div>
        </div>`
      );
    }
  },
  {
    label: 'Copy Token',
    icon: 'pi pi-copy',
    command: () => copyTokenToClipboard(),
    template: (item) => {
      return (
        `<div class="p-menuitem-content" @click="${item.command}">
          <div class="flex items-center px-3 py-2">
            <i class="pi pi-copy mr-2"></i>
            <span>${item.label}</span>
          </div>
        </div>`
      );
    }
  }
]);

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

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
    .then(() => {
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Text copied to clipboard', { 
          variant: 'success',
          duration: 3000 
        });
      }
    })
    .catch(err => {
      console.error('Failed to copy text:', err);
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Failed to copy text', { 
          variant: 'error',
          duration: 3000 
        });
      }
    });
}

function getExpirationStatusClass(finding: Finding): string {
  if (!finding || !finding.metadata || !finding.metadata.expStatus) {
    return 'text-gray-500';
  }
  
  return finding.metadata.expStatus === 'valid' ? 'text-success-500' : 'text-orange-500';
}

function formatExpirationTime(timestamp: number): string {
  try {
    return new Date(timestamp * 1000).toLocaleString();
  } catch (error) {
    return 'Invalid date';
  }
}

function formatIssuedAt(timestamp: number): string {
  try {
    return new Date(timestamp * 1000).toLocaleString();
  } catch (error) {
    return 'Invalid date';
  }
}

function getTokenAge(timestamp: number): string {
  try {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return `Issued ${diff} seconds ago`;
    if (diff < 3600) return `Issued ${Math.floor(diff/60)} minutes ago`;
    if (diff < 86400) return `Issued ${Math.floor(diff/3600)} hours ago`;
    return `Issued ${Math.floor(diff/86400)} days ago`;
  } catch (error) {
    return '';
  }
}

function formatAudience(aud: string | string[] | undefined): string {
  if (!aud) return '';
  return Array.isArray(aud) ? aud.join(', ') : aud;
}

function isWeakAlgorithm(alg: string | undefined): boolean {
  if (!alg) return false;
  return alg === 'none' || alg === 'HS256' || alg === 'HS384' || alg === 'HS512';
}

function getAlgorithmWarning(alg: string | undefined): string {
  if (!alg) return '';
  
  if (alg === 'none') {
    return 'Critical: "none" algorithm bypasses signature verification';
  }
  
  if (['HS256', 'HS384', 'HS512'].includes(alg)) {
    return 'Warning: Symmetric algorithm requires careful key management';
  }
  
  return '';
}

function isSymmetricAlgorithm(alg: string | undefined): boolean {
  if (!alg) return false;
  return ['HS256', 'HS384', 'HS512'].includes(alg);
}

function isAsymmetricAlgorithm(alg: string | undefined): boolean {
  if (!alg) return false;
  return ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512'].includes(alg);
}

function getSignatureTypeLabel(alg: string | undefined): string {
  if (!alg) return 'Unknown';
  
  if (alg === 'none') {
    return 'None (Unsigned)';
  }
  
  if (isSymmetricAlgorithm(alg)) {
    return 'Symmetric (HMAC)';
  }
  
  if (isAsymmetricAlgorithm(alg)) {
    if (alg.startsWith('RS') || alg.startsWith('PS')) {
      return 'Asymmetric (RSA)';
    }
    if (alg.startsWith('ES')) {
      return 'Asymmetric (ECDSA)';
    }
  }
  
  return 'Unknown';
}

function getSignatureTypeDescription(alg: string | undefined): string {
  if (!alg) return 'No algorithm specified';
  
  if (alg === 'none') {
    return 'No signature - vulnerable to tampering';
  }
  
  if (isSymmetricAlgorithm(alg)) {
    return 'Single shared secret key for signing & verification';
  }
  
  if (isAsymmetricAlgorithm(alg)) {
    return 'Private key signs, public key verifies';
  }
  
  return 'Unknown algorithm type';
}

function getOverallSeverity(finding: Finding): string {
  if (!finding || !finding.metadata || !finding.metadata.risks || finding.metadata.risks.length === 0) {
    return 'info';
  }
  
  return finding.metadata.risks[0].severity;
}

function getSecuritySummary(finding: Finding): string {
  if (!finding?.metadata?.risks) return 'No security analysis available';
  
  const criticalCount = countRisksBySeverity(finding, 'critical');
  const highCount = countRisksBySeverity(finding, 'high');
  
  if (criticalCount > 0) {
    return `Critical vulnerabilities detected. This token has ${criticalCount} critical and ${highCount} high severity issues that require immediate attention.`;
  } else if (highCount > 0) {
    return `High severity issues found. This token has ${highCount} security concerns that should be addressed.`;
  } else if (countRisksBySeverity(finding, 'medium') > 0) {
    return 'Medium severity issues detected. This token has security concerns that should be reviewed.';
  } else if (countRisksBySeverity(finding, 'low') > 0) {
    return 'Minor security issues found. This token has some low-severity concerns.';
  } else {
    return 'No significant security issues detected. The token appears to follow security best practices.';
  }
}

function isLongExpiration(exp?: number): boolean {
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp > now && (exp - now) > 86400 * 30; // More than 30 days
}

// Show context menu on right-click
function showContextMenu(event: MouseEvent) {
  menu.value.show(event);
}

// Open rename dialog
function openRenameDialog() {
  newTokenName.value = currentFinding.value?.customName || '';
  showRenameModal.value = true;
}

// Save new tab name
function renameToken() {
  if (newTokenName.value.trim()) {
    emit('rename', newTokenName.value.trim(), currentTabIndex.value);
    showRenameModal.value = false;
  }
}

// Function to copy token to clipboard
function copyTokenToClipboard() {
  if (currentFinding.value?.metadata?.token) {
    navigator.clipboard.writeText(currentFinding.value.metadata.token)
      .then(() => {
        if ((window as any).caidoSDK?.window?.showToast) {
          (window as any).caidoSDK.window.showToast('Token copied to clipboard', {
            variant: 'success',
            duration: 3000
          });
        }
      })
      .catch(err => {
        console.error('Failed to copy token:', err);
        if ((window as any).caidoSDK?.window?.showToast) {
          (window as any).caidoSDK.window.showToast('Failed to copy token', {
            variant: 'error',
            duration: 3000
          });
        }
      });
  }
}

function navigateToDashboard() {
  // Emit navigation event for parent App.vue to handle
  emit('navigate-to', 'Dashboard');
}

function navigateToDecoder() {
  // Emit navigation event for parent App.vue to handle
  emit('navigate-to', 'Decoder');
}

// Function to send token to JWT Editor
function sendToJWTEditor() {
  if (currentFinding.value?.metadata?.token) {
    emit('navigate-to', 'JWT Editor');
    
    setTimeout(() => {
      const event = new CustomEvent('add-token-to-editor', { 
        detail: { token: currentFinding.value.metadata.token } 
      });
      window.dispatchEvent(event);
      
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Token sent to JWT Editor', {
          variant: 'success',
          duration: 3000
        });
      }
    }, 100);
  }
}

// Function to refresh token details
function refreshTokenDetails(showNotification: boolean = true): void {
  if (currentFinding.value?.metadata?.token) {
    try {
      // Re-decode the token to get fresh information
      const decoded = decodeJWT(currentFinding.value.metadata.token);
      
      if (decoded) {
        // Update expiration status and other time-based fields
        const now = Math.floor(Date.now() / 1000);
        
        // Update expiration status
        if (decoded.payload.exp) {
          const timeLeft = decoded.payload.exp - now;
          
          if (timeLeft > 0) {
            if (currentFinding.value.metadata) {
              currentFinding.value.metadata.expStatus = 'valid';
              
              // Format the time left
              const days = Math.floor(timeLeft / 86400);
              const hours = Math.floor((timeLeft % 86400) / 3600);
              const minutes = Math.floor((timeLeft % 3600) / 60);
              
              if (days > 0) {
                currentFinding.value.metadata.timeLeft = `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''} remaining`;
              } else if (hours > 0) {
                currentFinding.value.metadata.timeLeft = `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
              } else {
                currentFinding.value.metadata.timeLeft = `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
              }
            }
          } else if (currentFinding.value.metadata) {
            currentFinding.value.metadata.expStatus = 'expired';
            currentFinding.value.metadata.timeLeft = 'Expired';
          }
        }
        
        // Store all the original severity values we need to preserve
        const originalSeverity = currentFinding.value.severity;
        const originalMetadataSeverity = currentFinding.value.metadata?.severity;
        
        // Store the first risk's original severity if it exists (used for Security Analysis section)
        let originalFirstRiskSeverity = null;
        if (currentFinding.value.metadata?.risks && currentFinding.value.metadata.risks.length > 0) {
          originalFirstRiskSeverity = currentFinding.value.metadata.risks[0].severity;
        }
        
        const analysis = analyzeJWTSecurity(decoded.header, decoded.payload);
        if (analysis && analysis.risks && currentFinding.value.metadata) {
          // Keep the original first risk severity if it exists
          if (originalFirstRiskSeverity && analysis.risks.length > 0) {
            analysis.risks[0].severity = originalFirstRiskSeverity;
          }
          
          // Update the risks but preserve the severities
          currentFinding.value.metadata.risks = analysis.risks;
          
          // Keep original severity values rather than using analysis.severity
          // This ensures refresh doesn't change the severity
          if (originalMetadataSeverity) {
            currentFinding.value.metadata.severity = originalMetadataSeverity;
          }
          
          if (originalSeverity) {
            currentFinding.value.severity = originalSeverity;
          }
        }
      }
      
      // Only show success notification if requested
      if (showNotification && (window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Token details refreshed', {
          variant: 'success',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error refreshing token details:', error);
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Error refreshing token details', {
          variant: 'error',
          duration: 3000
        });
      }
    }
  } else {
    if (showNotification && (window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('No token to refresh', {
        variant: 'error',
        duration: 3000
      });
    }
  }
}

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

// Function to count risks by severity
function countRisksBySeverity(finding: Finding, severity: string): number {
  if (!finding || !finding.metadata || !finding.metadata.risks) {
    return 0;
  }
  return finding.metadata.risks.filter((risk: any) => risk.severity === severity).length;
}

// Export functions
function exportAsMarkdown() {
  if (!currentFinding.value) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('No token details to export', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }

  try {
    const fileName = `jwt-analysis-${new Date().getTime()}.md`;
    const header = currentFinding.value.metadata.header;
    const payload = currentFinding.value.metadata.payload;
    const risks = currentFinding.value.metadata.risks || [];

    let markdown = `# JWT Token Analysis\n\n`;
    markdown += `**Analysis Date:** ${new Date().toLocaleString()}\n\n`;
    
    // Token Summary
    markdown += `## Token Summary\n\n`;
    markdown += `- **Algorithm:** ${header?.alg || 'None'}\n`;
    markdown += `- **Issuer:** ${payload?.iss || 'Not specified'}\n`;
    
    if (payload?.exp) {
      markdown += `- **Expiration:** ${formatExpirationTime(payload.exp)}\n`;
      markdown += `- **Time Remaining:** ${currentFinding.value.metadata.timeLeft || 'Unknown'}\n`;
    } else {
      markdown += `- **Expiration:** Not set\n`;
    }
    
    markdown += `- **Overall Security Severity:** ${getOverallSeverity(currentFinding.value)}\n\n`;
    
    // Security Risks
    markdown += `## Security Risks\n\n`;
    
    if (risks.length > 0) {
      risks.forEach(risk => {
        markdown += `### ${risk.severity.toUpperCase()}: ${risk.description}\n`;
        if (risk.impact) {
          markdown += `**Impact:** ${risk.impact}\n\n`;
        }
      });
    } else {
      markdown += `No security risks detected.\n\n`;
    }
    
    // Token Parts
    markdown += `## Token Details\n\n`;
    markdown += `### Header\n\n\`\`\`json\n${JSON.stringify(header, null, 2)}\n\`\`\`\n\n`;
    markdown += `### Payload\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\n`;
    
    // Raw Token
    markdown += `### Raw Token\n\n\`\`\`\n${currentFinding.value.metadata.token}\n\`\`\`\n`;
    
    // Security Recommendations
    if (currentFinding.value.metadata.suggestions && currentFinding.value.metadata.suggestions.length > 0) {
      markdown += `\n## Security Recommendations\n\n`;
      currentFinding.value.metadata.suggestions.forEach(suggestion => {
        markdown += `- ${suggestion}\n`;
      });
    }
    
    // Download the markdown file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Markdown export successful!', {
        variant: 'success',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('Error exporting markdown:', error);
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Failed to export Markdown', {
        variant: 'error',
        duration: 3000
      });
    }
  }
}

function exportAsJSON() {
  if (!currentFinding.value) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('No token details to export', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }

  try {
    const fileName = `jwt-analysis-${new Date().getTime()}.json`;
    
    // Create export data structure
    const exportData = {
      analysisDate: new Date().toISOString(),
      token: currentFinding.value.metadata.token,
      tokenSummary: {
        algorithm: currentFinding.value.metadata.header?.alg || 'None',
        issuer: currentFinding.value.metadata.payload?.iss || 'Not specified',
        expiration: currentFinding.value.metadata.payload?.exp 
          ? formatExpirationTime(currentFinding.value.metadata.payload.exp) 
          : 'Not set',
        timeRemaining: currentFinding.value.metadata.timeLeft || 'Unknown',
        overallSeverity: getOverallSeverity(currentFinding.value)
      },
      header: currentFinding.value.metadata.header,
      payload: currentFinding.value.metadata.payload,
      securityRisks: currentFinding.value.metadata.risks || [],
      securityRecommendations: currentFinding.value.metadata.suggestions || []
    };
    
    // Download the JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('JSON export successful!', {
        variant: 'success',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('Error exporting JSON:', error);
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Failed to export JSON', {
        variant: 'error',
        duration: 3000
      });
    }
  }
}
</script>

<style scoped>
.token-details-container {
  padding-bottom: 1rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  overflow-y: auto !important;
}

.jwt-details {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  overflow-y: auto !important;
}

:deep(.p-card) {
  height: 100%;
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

.jwt-token-display {
  word-break: break-all;
  white-space: pre-wrap;
  overflow: auto !important;
}

.token-part {
  margin-bottom: 0.5rem;
}

.token-header {
  color: #61affe;
}

.token-payload {
  color: #fca130;
}

.token-signature {
  color: #49cc90;
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

:deep(.p-tag.p-tag-warning) {
  background-color: #fbbf24 !important;
  color: #78350f !important;
  border-radius: 0.25rem !important;
  padding: 0.25rem 0.5rem !important;
  font-weight: 500 !important;
  display: inline-flex !important;
  align-items: center !important;
  opacity: 1 !important;
}

:deep(.p-tag.p-tag-danger) {
  background-color: #ef4444;
  color: #7f1d1d;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-weight: 500;
}

:deep(.p-tag.p-tag-info) {
  background-color: #60a5fa;
  color: #1e3a8a;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-weight: 500;
}

:deep(.p-tag.p-tag-success) {
  background-color: #10b981;
  color: #064e3b;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-weight: 500;
}

.jwt-dialog {
  --p-dialog-content-padding: 1rem;
  --p-dialog-content-padding-top: 1rem;
  --p-dialog-content-padding-bottom: 1rem;
  --p-dialog-content-padding-left: 1rem;
  --p-dialog-content-padding-right: 1rem;
  --p-dialog-content-padding-vertical: 1rem;
  --p-dialog-content-padding-horizontal: 1rem;
}

:deep(.jwt-dialog) {
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:deep(.jwt-dialog .p-dialog-header) {
  border-bottom: 1px solid #e5e7eb;
  padding: 1.25rem;
  font-weight: 600;
  font-size: 1.1rem;
  background-color: #f9fafb;
  border-radius: 8px 8px 0 0;
}

:deep(.jwt-dialog .p-dialog-content) {
  padding: 1.25rem;
}

:deep(.jwt-dialog .p-dialog-footer) {
  border-top: 1px solid #e5e7eb;
  padding: 1rem 1.25rem;
}

:deep(.dark) .jwt-dialog .p-dialog-header {
  background-color: var(--surface-800);
  border-bottom-color: var(--surface-700);
}

:deep(.dark) .jwt-dialog .p-dialog-footer {
  border-top-color: var(--surface-700);
}

/* Token tabs styling */
.token-tabs-header {
  padding: 0;
  margin: 0;
}

:deep(.token-tabs-inner .p-tabview-nav-container) {
  border-radius: 6px 6px 0 0;
  overflow: hidden;
  margin: 0;
  padding: 0 1rem;
}

:deep(.token-tabs-inner .p-tabview-nav) {
  border-bottom: none;
  background: transparent;
  padding: 0;
  margin: 0;
}

:deep(.token-tabs-inner .p-tabview-nav-link) {
  padding: 0.5rem 0.75rem;
  border-radius: 6px 6px 0 0;
  margin-right: 0.125rem;
  font-size: 0.875rem;
  border: 1px solid rgba(209, 213, 219, 0.3);
  border-bottom: none;
}

:deep(.token-tabs-inner .p-tabview-selected .p-tabview-nav-link) {
  border-color: rgba(99, 102, 241, 0.5);
}

:deep(.token-tabs-inner .p-tabview-panels) {
  padding: 0;
  margin: 0;
  border: none;
}
</style> 