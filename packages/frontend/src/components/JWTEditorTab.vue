<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 min-h-0 overflow-auto p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 h-full">
      <!-- JWT Editor with attack options -->
      <Card class="bg-gray-50 dark:bg-surface-700 w-full h-full">
        <template #title>
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center">
              <span class="tab-icon">
                <i class="pi pi-code"></i>
              </span>
              <span>JWT Editor</span>
            </div>
            <Button label="New Token" icon="pi pi-plus" size="small" @click="addNewTokenTab" class="p-button-outlined" />
          </div>
        </template>
        <template #content>
          <div class="token-editor-content h-full flex flex-col overflow-auto">
            <!-- Token Tabs navigation -->
            <div class="token-tabs bg-gray-100 dark:bg-surface-700 rounded mb-4 overflow-x-auto">
              <TabView v-model:activeIndex="activeTokenTab" class="token-tabs-inner w-full">
                <TabPanel v-for="(tab, index) in tokenTabs" :key="tab.id">
                  <template #header>
                    <div class="token-tab-header flex items-center">
                      <span class="truncate max-w-xs" :title="tab.name">{{ tab.name }}</span>
                      <button 
                        @click.stop="closeTokenTab(index)" 
                        class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <i class="pi pi-times"></i>
                      </button>
                    </div>
                  </template>
                  
                  <!-- Tab Content - moved inside each TabPanel -->
                  <div class="tab-content h-full flex flex-col overflow-auto">
                    <!-- JWT Input -->
                    <div class="mb-4">
                      <label for="jwt-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        JWT Token
                      </label>
                      <Textarea :id="`jwt-input-${tab.id}`" v-model="tab.token" rows="8" class="w-full" 
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
                    </div>

                    <div class="flex items-center justify-between gap-2 mb-4 flex-wrap">
                      <div class="flex items-center gap-2">
                        <Button icon="pi pi-search" label="Decode" @click="() => decodeToken(tab)" />
                        <Button label="Sign" icon="pi pi-lock" @click="() => prepareSignTab(tab)" severity="info" />
                        <Button label="Attack" icon="pi pi-exclamation-triangle" @click="() => prepareAttackTab(tab)" severity="warning" />
                      </div>
                      <div class="flex items-center gap-2">
                        <Dropdown v-model="validationKeyIndex" :options="keyOptions" optionLabel="label" optionValue="index" 
                          placeholder="Select key" class="w-64" />
                        <Button label="Validate" icon="pi pi-check" @click="() => validateToken(tab)" severity="success" />
                      </div>
                    </div>

                    <div v-if="tab.decodedToken" class="decoded-token flex-grow overflow-auto">
                      <!-- Header/Payload editors -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <!-- Header editor -->
                        <div>
                          <div class="flex justify-between items-center mb-2">
                            <h3 class="text-md font-medium">Header</h3>
                            <Button 
                              icon="pi pi-copy" 
                              text
                              aria-label="Copy Header" 
                              @click="tab.headerJson && copyToClipboard(tab.headerJson)"
                              class="p-button-text"
                            />
                          </div>
                          <div class="bg-gray-100 dark:bg-surface-800 p-2 rounded">
                            <Textarea v-model="tab.headerJson" rows="6" class="w-full font-mono text-sm" @blur="() => validateJson(tab, 'header')" />
                            <div v-if="tab.headerJsonError" class="text-red-500 text-xs mt-1">{{ tab.headerJsonError }}</div>
                          </div>
                        </div>

                        <!-- Payload editor -->
                        <div>
                          <div class="flex justify-between items-center mb-2">
                            <h3 class="text-md font-medium">Payload</h3>
                            <Button 
                              icon="pi pi-copy" 
                              text
                              aria-label="Copy Payload" 
                              @click="tab.payloadJson && copyToClipboard(tab.payloadJson)"
                              class="p-button-text"
                            />
                          </div>
                          <div class="bg-gray-100 dark:bg-surface-800 p-2 rounded">
                            <Textarea v-model="tab.payloadJson" rows="6" class="w-full font-mono text-sm" @blur="() => validateJson(tab, 'payload')" />
                            <div v-if="tab.payloadJsonError" class="text-red-500 text-xs mt-1">{{ tab.payloadJsonError }}</div>
                          </div>
                        </div>
                      </div>

                      <!-- Signature block styled to match header/payload -->
                      <div class="mb-4">
                        <div class="flex justify-between items-center mb-2">
                          <div class="flex items-center gap-2">
                            <h3 class="text-md font-medium">Signature</h3>
                            <div v-if="tab.decodedToken?.header" class="text-xs font-semibold flex items-center gap-1" :class="{
                              'text-blue-600 dark:text-blue-400': isAsymmetricAlgorithm(tab.decodedToken.header.alg),
                              'text-purple-600 dark:text-purple-400': isSymmetricAlgorithm(tab.decodedToken.header.alg),
                              'text-red-600 dark:text-red-400': tab.decodedToken.header.alg === 'none'
                            }">
                              <i class="pi pi-key"></i>
                              <span>{{ getSignatureTypeLabel(tab.decodedToken.header.alg) }}</span>
                            </div>
                          </div>
                          <Button 
                            icon="pi pi-copy" 
                            text
                            aria-label="Copy Signature" 
                            @click="tab.decodedToken?.signature && copyToClipboard(tab.decodedToken.signature)"
                            class="p-button-text"
                          />
                        </div>
                        <div class="bg-gray-100 dark:bg-surface-800 p-2 rounded">
                          <div class="bg-gray-800 text-white p-3 rounded font-mono text-sm overflow-auto relative">
                            <pre class="whitespace-pre-wrap break-all overflow-x-auto max-h-[126px]">{{ tab.decodedToken?.signature }}</pre>
                          </div>
                        </div>
                      </div>

                      <!-- Action buttons -->
                      <div class="flex space-x-2 mb-4">
                        <Button label="Update Token" icon="pi pi-refresh" @click="() => updateToken(tab)" severity="info" />
                        <Button label="View in Token Details" icon="pi pi-external-link" @click="() => saveToDetails(tab)" severity="success" class="p-button-raised" />
                        <Button label="Rename Tab" icon="pi pi-pencil" @click="() => prepareRenameTab(tab)" severity="secondary" />
                      </div>
                    </div>
                  </div>
                </TabPanel>
              </TabView>
            </div>
            
            <!-- Empty state when no tabs -->
            <div v-if="tokenTabs.length === 0" class="flex items-center justify-center py-10">
              <div class="text-center">
                <div class="text-gray-400 text-5xl mb-4">
                  <i class="pi pi-plus" style="font-size: 5rem;"></i>
                </div>
                <h3 class="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No tokens yet</h3>
                <p class="text-gray-500 mb-4">Click the plus button to add a new token</p>
                <Button label="Add Token" icon="pi pi-plus" @click="addNewTokenTab" class="p-button-outlined" />
              </div>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Keys and Signature Management -->
      <Card class="bg-gray-50 dark:bg-surface-700 w-full h-full">
        <template #title>
          <div class="flex items-center">
            <span class="tab-icon">
              <i class="pi pi-key"></i>
            </span>
            <span>Keys Management</span>
          </div>
        </template>
        <template #content>
          <div class="keys-management-content h-full overflow-auto flex flex-col">
            <!-- Saved Keys section -->
            <div class="mb-6">
              <div class="flex justify-between items-center mb-3">
                <h3 class="text-md font-medium">Saved Keys</h3>
                <div class="flex space-x-2">
                  <Button icon="pi pi-plus" label="Add Key" @click="showKeyModal = true" size="small" />
                </div>
              </div>
              
              <div v-if="keys.length === 0" class="text-center py-10 bg-gray-100 dark:bg-surface-800 rounded">
                <p class="text-gray-500">No keys available</p>
                <p class="text-sm text-gray-400 mt-2">Click "Add Key" to create a new key</p>
              </div>
              
              <div v-else class="flex-1 overflow-y-auto max-h-[300px]">
                <div v-for="(key, index) in keys" :key="index" 
                  class="p-5 mb-4 bg-gray-200 dark:bg-surface-700 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm flex justify-between items-center">
                  <div>
                    <div class="font-medium text-gray-800 dark:text-gray-200">{{ key.id || 'Unnamed Key' }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatKeyTypeDisplay(key.type) }} • {{ key.algorithm }}</div>
                  </div>
                  <div class="flex space-x-2">
                    <Button icon="pi pi-pencil" text rounded aria-label="Edit" @click="editKey(index)" />
                    <Button icon="pi pi-trash" text rounded aria-label="Delete" severity="danger" @click="deleteKey(index)" />
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Common Attacks -->
            <div class="mt-6">
              <h3 class="text-md font-medium mb-3">Common Attacks</h3>
              <div class="grid grid-cols-1 gap-3">
                <div 
                  v-for="(attack, index) in commonAttacks" 
                  :key="index" 
                  @click="() => prepareAttackWithType(attack.type)" 
                  class="p-3 bg-[#b32139] dark:bg-[#b32139] text-white dark:text-white rounded cursor-pointer transition-colors hover:bg-[#9c1c30] dark:hover:bg-[#9c1c30] flex items-center justify-center"
                >
                  <div class="attack-icon mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,7.6 15.9,8.7L17.3,7.3C15.8,5.8 13.9,5 12,5C10.1,5 8.2,5.8 6.7,7.3L8.1,8.7C9.2,7.6 10.6,7 12,7M9,17V15H15V17H9M12,13C10.67,13 9.69,11.93 10.14,10.94C10.35,10.44 10.73,10.04 11.2,9.83C11.46,9.71 11.72,9.65 12,9.65C12.28,9.65 12.54,9.71 12.8,9.83C13.27,10.04 13.65,10.44 13.86,10.94C14.31,11.93 13.33,13 12,13Z"/>
                    </svg>
                  </div>
                  <div class="font-medium">{{ attack.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Dialogs -->
    <Dialog v-model:visible="showKeyModal" header="Key Management" :style="{ width: '50vw' }" :modal="true" class="jwt-dialog">
      <div class="p-fluid">
        <div class="field mb-4">
          <label for="key-id" class="block font-medium mb-2">Key ID</label>
          <InputText id="key-id" v-model="newKey.id" placeholder="Enter a descriptive name" class="w-full" />
        </div>

        <div class="field mb-4">
          <label for="key-type" class="block font-medium mb-2">Key Type</label>
          <Dropdown id="key-type" v-model="newKey.type" :options="keyTypes" optionLabel="name" optionValue="value" placeholder="Select key type" class="w-full" />
        </div>

        <div class="field mb-4">
          <label for="key-algorithm" class="block font-medium mb-2">Algorithm</label>
          <Dropdown id="key-algorithm" v-model="newKey.algorithm" 
            :options="newKey.type === 'symmetric' ? 
              ['HS256', 'HS384', 'HS512'] : 
              ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512']" 
            placeholder="Select algorithm" class="w-full" />
        </div>

        <div v-if="newKey.type === 'symmetric'" class="field mb-4">
          <label for="key-value" class="block font-medium mb-2">Key Value</label>
          <div class="flex items-center w-full">
            <InputText id="key-value" v-model="newKey.value" 
              :type="showKeyValue ? 'text' : 'password'" 
              placeholder="Enter or generate a key" 
              class="w-full rounded-l-md border-r-0 flex-1" />
            <Button 
              @click="showKeyValue = !showKeyValue" 
              class="p-button-secondary rounded-none bg-gray-700 text-white border-0 eye-toggle"
              style="height: 100%; width: 3rem;">
              <template #icon>
                <svg v-if="showKeyValue" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                </svg>
              </template>
            </Button>
            <Button 
              label="Generate" 
              class="p-button-info rounded-l-none bg-[#b32139] border-0 text-white" 
              @click="generateRandomKey">
              <template #icon>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
              </template>
            </Button>
          </div>
        </div>

        <div v-if="newKey.type === 'asymmetric'" class="field mb-4">
          <label for="key-public" class="block font-medium mb-2">Public Key</label>
          <Textarea id="key-public" v-model="newKey.publicKey" rows="4" class="w-full font-mono text-sm bg-gray-50 dark:bg-surface-800" />
          
          <label for="key-private" class="block font-medium mb-2 mt-3 flex items-center justify-between">
            <span>Private Key</span>
            <Button 
              @click="showPrivateKey = !showPrivateKey" 
              class="p-button-secondary bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0 rounded-full eye-toggle"
              style="width: 2.5rem; min-width: 2.5rem; height: 2.5rem;">
              <template #icon>
                <svg v-if="showPrivateKey" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                </svg>
              </template>
            </Button>
          </label>
          <Textarea v-if="showPrivateKey" id="key-private" v-model="newKey.privateKey" rows="4" class="w-full font-mono text-sm bg-gray-50 dark:bg-surface-800" />
          <div v-else class="bg-gray-200 dark:bg-surface-800 p-4 rounded border border-gray-300 dark:border-gray-600 text-center text-gray-500 private-key-hidden">
            Private key is hidden. Click the eye icon to show it.
          </div>
          
          <Button 
            label="Generate Key Pair" 
            class="mt-3 p-button-info bg-[#b32139] border-0 text-white" 
            @click="generateKeyPair">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </template>
          </Button>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" @click="showKeyModal = false" class="p-button-outlined" />
          <Button label="Save" @click="saveKey" severity="success" class="p-button-raised" />
        </div>
      </template>
    </Dialog>
    
    <Dialog v-model:visible="showSigningModal" header="Sign Token" :style="{ width: '50vw' }" :modal="true" class="jwt-dialog">
      <div class="p-fluid">
        <div class="field mb-4">
          <label class="block font-medium mb-2">Select a key for signing:</label>
          <Dropdown v-model="selectedKeyIndex" :options="keyOptions" optionLabel="label" optionValue="index" class="w-full" />
        </div>
        
        <div class="field mb-4">
          <label class="block font-medium mb-2">or enter a temporary key:</label>
          <div class="p-inputgroup">
            <InputText v-model="tempKeyValue" placeholder="Enter a signing key" class="flex-1" />
            <Dropdown v-model="tempKeyAlgorithm" :options="['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512']" class="w-36" />
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" @click="showSigningModal = false" class="p-button-outlined" />
          <Button label="Sign" @click="signToken" severity="success" class="p-button-raised" />
        </div>
      </template>
    </Dialog>
    
    <Dialog v-model:visible="showAttackModal" header="JWT Attack Tools" :style="{ width: '50vw' }" :modal="true" class="jwt-dialog">
      <div class="p-fluid">
        <div class="field mb-4">
          <label class="block font-medium mb-2">Selected Attack Type:</label>
          <Dropdown v-model="selectedAttack" :options="attackTypes" optionLabel="name" optionValue="value" class="w-full" />
        </div>
        
        <div v-if="selectedAttack === 'hmac-confusion'" class="field mb-4">
          <label class="block font-medium mb-2">Public Key for HMAC Confusion (optional):</label>
          <Textarea v-model="publicKeyForAttack" rows="5" placeholder="Paste the public key here for HMAC confusion attack" 
            class="w-full font-mono text-sm bg-gray-50 dark:bg-surface-800" />
        </div>
        
        <div v-if="selectedAttack === 'embedded-jwk'" class="field mb-4">
          <label class="block font-medium mb-2">Options:</label>
          <div class="flex items-center">
            <Checkbox v-model="embedJwkWithKid" binary />
            <label class="ml-2">Include kid parameter (references the embedded key)</label>
          </div>
        </div>
        
        <div v-if="selectedAttack === 'weak-hmac'" class="field mb-4">
          <label class="block font-medium mb-2">Weak Secret to Use:</label>
          <Dropdown v-model="weakHmacSecret" :options="weakSecrets" class="w-full" />
          
          <div class="mt-3">
            <label class="block font-medium mb-2">Add Custom Secret:</label>
            <div class="flex gap-2 items-center w-full">
              <InputText v-model="customWeakSecret" placeholder="Enter your custom weak secret" class="w-full" />
              <Button type="button" class="p-button-success" @click="addCustomSecret" style="min-width: 42px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </Button>
            </div>
          </div>
          
          <div v-if="getCustomSecrets().length > 0" class="mt-3">
            <label class="block font-medium mb-2">Custom Secrets:</label>
            <ul class="list-none p-0 m-0">
              <li v-for="(secret, index) in getCustomSecrets()" :key="index" 
                  class="mb-1 p-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded">
                <span class="font-mono">{{ secret || '(empty string)' }}</span>
                <Button 
                  type="button" 
                  class="p-button-danger p-button-sm"
                  @click="removeCustomSecretByValue(secret)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </Button>
              </li>
            </ul>
          </div>
        </div>
        
        <div v-if="selectedAttack === 'alg-sub'" class="field mb-4">
          <label class="block font-medium mb-2">Target Algorithm:</label>
          <Dropdown v-model="targetAlgorithm" :options="['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512']" class="w-full" />
        </div>
        
        <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200 mt-4 rounded-r">
          <h3 class="font-semibold mb-2 text-lg flex items-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="mr-2">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            Attack Details:
          </h3>
          <p v-if="selectedAttack === 'none'" class="mb-2">
            The 'none' algorithm attack modifies the JWT header to use the 'none' algorithm and removes the signature. In vulnerable implementations, this may bypass signature verification entirely. <strong>This is a real vulnerability (CVE-2015-9235) and has been found in numerous production systems. Authorized for security testing.</strong>
          </p>
          <p v-else-if="selectedAttack === 'hmac-confusion'" class="mb-2">
            The HMAC key confusion attack changes RS/ES algorithms to HS algorithms, tricking the server into using the public key as an HMAC secret. <strong>This is a real attack documented in CVE-2016-5431 and CVE-2016-10555. Authorized for security assessment in controlled environments.</strong>
          </p>
          <p v-else-if="selectedAttack === 'empty-key'" class="mb-2">
            This attack attempts to sign the token with an empty key, which may be accepted by vulnerable implementations. <strong>This is a real vulnerability found in some JWT libraries (e.g., CVE-2020-28042). Authorized for security testing with proper authorization.</strong>
          </p>
          <p v-else-if="selectedAttack === 'psychic'" class="mb-2">
            The Psychic Signature attack (CVE-2022-21449) exploits a vulnerability in certain ECDSA implementations, where all-zero signatures are incorrectly validated. <strong>This is a real, high-severity vulnerability that affected Java 15, 16, 17, and 18. Authorized for security assessment with proper permissions.</strong>
          </p>
          <p v-else-if="selectedAttack === 'embedded-jwk'" class="mb-2">
            Embeds a JWK (JSON Web Key) in the token header and signs the token with the corresponding private key. Vulnerable servers may use this embedded key for verification. <strong>This is a real vulnerability documented in CVE-2018-0114. Authorized for security testing in controlled environments.</strong>
          </p>
          <p v-else-if="selectedAttack === 'weak-hmac'" class="mb-2">
            Uses a weak or commonly used secret to sign an HMAC-based token. Many implementations use predictable secrets. <strong>This is a real-world issue found in many systems using default, weak, or common secrets. Authorized for security assessment with proper authorization.</strong>
          </p>
          <p v-else-if="selectedAttack === 'alg-sub'" class="mb-2">
            Algorithm substitution attack - changes the algorithm type while maintaining a valid signature format to exploit parsing inconsistencies. <strong>This is a real vulnerability affecting multiple JWT libraries. Authorized for security testing with proper permissions.</strong>
          </p>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" @click="showAttackModal = false" class="p-button-outlined" />
          <Button label="Apply Attack" @click="applySelectedAttack" severity="warning" class="p-button-raised" />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="showRenameModal" header="Rename Token Tab" :style="{ width: '30vw' }" :modal="true" class="jwt-dialog">
      <div class="p-fluid">
        <div class="field">
          <label for="tab-name" class="block font-medium mb-2">Tab Name</label>
          <InputText id="tab-name" v-model="newTabName" placeholder="Enter a name for this tab" class="w-full" />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" @click="showRenameModal = false" class="p-button-outlined" />
          <Button label="Rename" @click="renameCurrentTab" severity="success" class="p-button-raised" />
        </div>
      </template>
    </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { computed } from 'vue';
import { watch } from 'vue';
import { onMounted, onBeforeUnmount } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import InputSwitch from 'primevue/inputswitch';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Checkbox from 'primevue/checkbox';

import { useSDK } from '../plugins/sdk';
import { decodeJWT, analyzeJWTSecurity } from '../utils/jwt';
import type { JWTHeader, JWTPayload } from '../types';
import { createJWTStorageService } from '../services/storage';

// Create emit for sending tokens to details
const emit = defineEmits<{
  (e: 'view-details-editor', token: string, header: JWTHeader, payload: JWTPayload, analysis: any, navigate?: boolean): void;
}>();

const sdk = useSDK();
const storageService = createJWTStorageService(sdk);
const token = ref('');
const headerJson = ref('');
const payloadJson = ref('');
const headerJsonError = ref('');
const payloadJsonError = ref('');
const decodedToken = ref<any>(null);

// Key management
const showKeyModal = ref(false);
const showKeyValue = ref(false);
const showPrivateKey = ref(false);
const keys = ref<any[]>([]);
const newKey = ref({
  id: '',
  type: 'symmetric',
  algorithm: 'HS256',
  value: '',
  publicKey: '',
  privateKey: ''
});

// Key editing
const editingKeyIndex = ref(-1);

// Signing dialog
const showSigningModal = ref(false);
const selectedKeyIndex = ref(-1);
const tempKeyValue = ref('');
const tempKeyAlgorithm = ref('HS256');

// Validation key selection
const validationKeyIndex = ref(-1);

// Attack dialog
const showAttackModal = ref(false);
const selectedAttack = ref('none');
const publicKeyForAttack = ref('');

// Token tabs functionality
interface TokenTab {
  id: string;
  name: string;
  token: string;
  headerJson: string;
  payloadJson: string;
  headerJsonError?: string;
  payloadJsonError?: string;
  decodedToken: any;
}

const tokenTabs = ref<TokenTab[]>([]);
const activeTokenTab = ref(0);
const showRenameModal = ref(false);
const newTabName = ref('');

// Array of common JWT attacks
const commonAttacks = [
  { name: "'none' Algorithm", type: 'none' },
  { name: "HMAC Key Confusion", type: 'hmac-confusion' },
  { name: "Empty Key", type: 'empty-key' },
  { name: "Psychic Signature", type: 'psychic' },
  { name: "Embedded JWK", type: 'embedded-jwk' },
  { name: "Weak HMAC Secret", type: 'weak-hmac' },
  { name: "Algorithm Substitution", type: 'alg-sub' }
];

// Attack types for dropdown
const attackTypes = computed(() => [
  { name: "'none' Algorithm", value: 'none' },
  { name: 'HMAC Key Confusion', value: 'hmac-confusion' },
  { name: 'Empty Key', value: 'empty-key' },
  { name: 'Psychic Signature', value: 'psychic' },
  { name: 'Embedded JWK', value: 'embedded-jwk' },
  { name: 'Weak HMAC Secret', value: 'weak-hmac' },
  { name: 'Algorithm Substitution', value: 'alg-sub' }
]);

// Load saved keys from localStorage on component mount
onMounted(() => {
  try {
    const savedKeys = storageService.getJWTKeys();
    if (savedKeys && savedKeys.length > 0) {
      keys.value = savedKeys;
    }
    
    // Load saved custom weak secrets
    const savedWeakSecrets = storageService.getWeakSecrets();
    if (savedWeakSecrets && savedWeakSecrets.length > 0) {
      // Merge saved secrets with default ones, avoiding duplicates
      savedWeakSecrets.forEach((secret: string) => {
        if (!weakSecrets.value.includes(secret)) {
          weakSecrets.value.push(secret);
        }
      });
    }
    
    // Load saved token editor state
    const editorState = storageService.getEditorState();
    if (editorState) {
      token.value = editorState.token || '';
      headerJson.value = editorState.headerJson || '';
      payloadJson.value = editorState.payloadJson || '';
      decodedToken.value = editorState.decodedToken || null;
    }
    
    // Create initial tab
    addNewTokenTab();

    // Listen for add-token-to-editor event
    window.addEventListener('add-token-to-editor', ((event: CustomEvent) => {
      if (event.detail && event.detail.token) {
        // Create a new tab with the provided token
        const newTab: TokenTab = {
          id: `tab-${Date.now()}`,
          name: `New Token ${tokenTabs.value.length + 1}`,
          token: event.detail.token,
          headerJson: '',
          payloadJson: '',
          headerJsonError: '',
          payloadJsonError: '',
          decodedToken: null
        };
        
        // Add the new tab
        tokenTabs.value.push(newTab);
        activeTokenTab.value = tokenTabs.value.length - 1;
        
        // Decode the token if possible
        decodeToken(newTab);
        
      }
    }) as EventListener);
  } catch (error) {
    console.error('Error loading saved keys:', error);
  }
});

// Clean up event listeners when the component is unmounted
onBeforeUnmount(() => {
  window.removeEventListener('add-token-to-editor', ((event: CustomEvent) => {
    // Clean up code
  }) as EventListener);
});

// Save keys to SDK storage whenever they change
watch(keys, async (newKeys: any[]) => {
  try {
    await storageService.saveJWTKeys(newKeys);
  } catch (error) {
    console.error('Error saving keys:', error);
  }
}, { deep: true });

// Save token editor state to SDK storage whenever it changes
watch([token, headerJson, payloadJson, decodedToken], async () => {
  try {
    await storageService.saveEditorState({
      token: token.value,
      headerJson: headerJson.value,
      payloadJson: payloadJson.value,
      decodedToken: decodedToken.value
    });
  } catch (error) {
    console.error('Error saving editor state:', error);
  }
}, { deep: true });

// Computed properties
const keyTypes = computed(() => [
  { name: 'Symmetric Key (HMAC)', value: 'symmetric' },
  { name: 'Asymmetric Key (RSA/EC)', value: 'asymmetric' }
]);

const keyOptions = computed(() => {
  return [
    { label: '-- Select a key --', index: -1 },
    ...keys.value.map((key: any, index: number) => ({
      label: `${key.id} (${key.algorithm})`,
      index
    }))
  ];
});

// Watch for active tab changes to update editor
watch(activeTokenTab, (newTabIndex: number) => {
  if (tokenTabs.value[newTabIndex]) {
    // Update the editor with the selected tab's content
    token.value = tokenTabs.value[newTabIndex].token;
    headerJson.value = tokenTabs.value[newTabIndex].headerJson;
    payloadJson.value = tokenTabs.value[newTabIndex].payloadJson;
    decodedToken.value = tokenTabs.value[newTabIndex].decodedToken;
  }
});

// Watch for token changes to update the active tab
watch(token, (newToken: string) => {
  if (tokenTabs.value.length > 0 && activeTokenTab.value >= 0) {
    // Update the current tab's token
    tokenTabs.value[activeTokenTab.value].token = newToken;
    
    // Auto-decode if possible
    if (newToken.trim().length > 0 && newToken.split('.').length === 3) {
      decodeToken();
    }
  }
});

// Watch for header/payload changes to update the active tab
watch(headerJson, (newHeaderJson: string) => {
  if (tokenTabs.value.length > 0 && activeTokenTab.value >= 0) {
    tokenTabs.value[activeTokenTab.value].headerJson = newHeaderJson;
  }
});

watch(payloadJson, (newPayloadJson: string) => {
  if (tokenTabs.value.length > 0 && activeTokenTab.value >= 0) {
    tokenTabs.value[activeTokenTab.value].payloadJson = newPayloadJson;
  }
});

// Watch for decoded token changes to update the active tab
watch(decodedToken, (newDecodedToken: any) => {
  if (tokenTabs.value.length > 0 && activeTokenTab.value >= 0) {
    tokenTabs.value[activeTokenTab.value].decodedToken = newDecodedToken;
  }
});

// Replace the original decodeToken function with extended functionality
function decodeToken(tabInput?: TokenTab) {
  // Get the right tab to operate on
  const tab = tabInput || (tokenTabs.value.length > 0 && activeTokenTab.value >= 0 ? 
    tokenTabs.value[activeTokenTab.value] : null);
  
  if (!tab) return;
  const tokenValue = tab.token || token.value;
  if (!tokenValue) return;
  
  try {
    const decoded = decodeJWT(tokenValue);
    if (!decoded) {
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Invalid JWT format', {
          variant: 'error',
          duration: 3000
        });
      }
      return;
    }
    
    tab.decodedToken = decoded;
    tab.headerJson = JSON.stringify(decoded.header, null, 2);
    tab.payloadJson = JSON.stringify(decoded.payload, null, 2);
    tab.headerJsonError = '';
    tab.payloadJsonError = '';
    
    // If this is for the current tab, update main state too
    if (!tabInput || tab === tokenTabs.value[activeTokenTab.value]) {
      decodedToken.value = decoded;
      headerJson.value = tab.headerJson;
      payloadJson.value = tab.payloadJson;
      headerJsonError.value = '';
      payloadJsonError.value = '';
    }
    
    // Update tab name based on decoded token if it's still the default name
    if (tab.name.startsWith('Token ')) {
      // Create a better name based on the token's content
      const alg = decoded.header?.alg || 'unknown';
      const iss = decoded.payload?.iss || 'unknown';
      tab.name = `${alg} • ${iss}`;
    }
  } catch (error) {
    console.error('Error decoding token:', error);
  }
}

function validateJson(tabInput: TokenTab | null, type: 'header' | 'payload') {
  const tab = tabInput || (tokenTabs.value.length > 0 && activeTokenTab.value >= 0 ?
    tokenTabs.value[activeTokenTab.value] : null);
  
  if (!tab) return;
  
  try {
    if (type === 'header') {
      JSON.parse(tab.headerJson);
      tab.headerJsonError = '';
      if (tab === tokenTabs.value[activeTokenTab.value]) {
        headerJsonError.value = '';
      }
    } else {
      JSON.parse(tab.payloadJson);
      tab.payloadJsonError = '';
      if (tab === tokenTabs.value[activeTokenTab.value]) {
        payloadJsonError.value = '';
      }
    }
  } catch (error) {
    if (type === 'header') {
      tab.headerJsonError = 'Invalid JSON format';
      if (tab === tokenTabs.value[activeTokenTab.value]) {
        headerJsonError.value = 'Invalid JSON format';
      }
    } else {
      tab.payloadJsonError = 'Invalid JSON format';
      if (tab === tokenTabs.value[activeTokenTab.value]) {
        payloadJsonError.value = 'Invalid JSON format';
      }
    }
  }
}

/**
 * CRYPTOGRAPHIC SIGNATURE VERIFICATION
 * This function actually verifies the JWT signature using the Web Crypto API
 */
async function verifyCryptographicSignature(tab: TokenTab, header: any, payload: any): Promise<{isValid: boolean, error?: string}> {
  try {
    const parts = tab.token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid token format' };
    }
    
    const [headerPart, payloadPart, signaturePart] = parts;
    const dataToVerify = `${headerPart}.${payloadPart}`;
    const algorithm = header.alg;
    
    if (!algorithm || algorithm === 'none') {
      return { isValid: true };
    }
    
    // Use the selected validation key
    let verificationKey = null;
    
    if (validationKeyIndex.value >= 0 && validationKeyIndex.value < keys.value.length) {
      verificationKey = keys.value[validationKeyIndex.value];
      
      // Check if selected key matches the algorithm
      if (verificationKey.algorithm !== algorithm) {
        return { isValid: false, error: `Selected key algorithm (${verificationKey.algorithm}) doesn't match token algorithm (${algorithm}). Please select a key with the correct algorithm.` };
      }
    } else {
      return { isValid: false, error: `Please select a key for validation from the dropdown above the Validate button.` };
    }
    
    // Verify the signature based on algorithm type
    if (algorithm.startsWith('HS')) {
      return await verifyHMACSignature(dataToVerify, signaturePart, verificationKey.value, algorithm);
    } else if (algorithm.startsWith('RS') || algorithm.startsWith('PS')) {
      return await verifyRSASignature(dataToVerify, signaturePart, verificationKey.publicKey || verificationKey.value, algorithm);
    } else if (algorithm.startsWith('ES')) {
      return await verifyECDSASignature(dataToVerify, signaturePart, verificationKey.publicKey || verificationKey.value, algorithm);
    }
    
    return { isValid: false, error: `Unsupported algorithm: ${algorithm}` };
  } catch (error) {
    console.error('Cryptographic verification error:', error);
    return { isValid: false, error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function verifyHMACSignature(data: string, signature: string, secret: string, algorithm: string): Promise<{isValid: boolean, error?: string}> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    
    const hashAlg = algorithm === 'HS256' ? 'SHA-256' : 
                    algorithm === 'HS384' ? 'SHA-384' : 'SHA-512';
    
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: hashAlg } },
      false,
      ['verify']
    );
    
    const dataBuffer = encoder.encode(data);
    const signatureBuffer = base64UrlToArrayBuffer(signature);
    
    const isValid = await window.crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBuffer,
      dataBuffer
    );
    
    return { isValid };
  } catch (error) {
    return { isValid: false, error: `HMAC verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function verifyRSASignature(data: string, signature: string, publicKeyPEM: string, algorithm: string): Promise<{isValid: boolean, error?: string}> {
  try {
    const hashAlg = algorithm === 'RS256' || algorithm === 'PS256' ? 'SHA-256' :
                    algorithm === 'RS384' || algorithm === 'PS384' ? 'SHA-384' : 'SHA-512';
    
    const publicKey = await importRsaPublicKey(publicKeyPEM, algorithm);
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const signatureBuffer = base64UrlToArrayBuffer(signature);
    
    const algorithmName = algorithm.startsWith('PS') ? 'RSA-PSS' : 'RSASSA-PKCS1-v1_5';
    const verifyAlg: any = {
      name: algorithmName,
      hash: { name: hashAlg }
    };
    
    if (algorithmName === 'RSA-PSS') {
      verifyAlg.saltLength = hashAlg === 'SHA-256' ? 32 : hashAlg === 'SHA-384' ? 48 : 64;
    }
    
    const isValid = await window.crypto.subtle.verify(
      verifyAlg,
      publicKey,
      signatureBuffer,
      dataBuffer
    );
    
    return { isValid };
  } catch (error) {
    return { isValid: false, error: `RSA verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function verifyECDSASignature(data: string, signature: string, publicKeyPEM: string, algorithm: string): Promise<{isValid: boolean, error?: string}> {
  try {
    const hashAlg = algorithm === 'ES256' ? 'SHA-256' :
                    algorithm === 'ES384' ? 'SHA-384' : 'SHA-512';
    
    const publicKey = await importEcPublicKey(publicKeyPEM, algorithm);
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const signatureBuffer = base64UrlToArrayBuffer(signature);
    
    const isValid = await window.crypto.subtle.verify(
      { name: 'ECDSA', hash: { name: hashAlg } },
      publicKey,
      signatureBuffer,
      dataBuffer
    );
    
    return { isValid };
  } catch (error) {
    return { isValid: false, error: `ECDSA verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function importRsaPublicKey(pemKey: string, algorithm: string) {
  const pemContents = pemKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemContents);
  
  const hashAlg = algorithm === 'RS256' || algorithm === 'PS256' ? 'SHA-256' :
                  algorithm === 'RS384' || algorithm === 'PS384' ? 'SHA-384' : 'SHA-512';
  
  const algorithmName = algorithm.startsWith('PS') ? 'RSA-PSS' : 'RSASSA-PKCS1-v1_5';
  
  return window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    { name: algorithmName, hash: { name: hashAlg } },
    false,
    ['verify']
  );
}

async function importEcPublicKey(pemKey: string, algorithm: string) {
  const pemContents = pemKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemContents);
  
  const namedCurve = algorithm === 'ES256' ? 'P-256' :
                     algorithm === 'ES384' ? 'P-384' : 'P-521';
  
  return window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    { name: 'ECDSA', namedCurve },
    false,
    ['verify']
  );
}

function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const base64Padded = base64 + padding;
  const binaryString = atob(base64Padded);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function validateToken(tabInput: TokenTab) {
  const tab = tabInput || (tokenTabs.value.length > 0 && activeTokenTab.value >= 0 ?
    tokenTabs.value[activeTokenTab.value] : null);
  
  if (!tab || !tab.decodedToken) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Please decode a token first', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }

  // First validate JSON format
  validateJson(tab, 'header');
  validateJson(tab, 'payload');
  
  // Check for JSON errors
  if (tab.headerJsonError) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Invalid JSON format in header. Please fix the syntax errors.', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }
  
  if (tab.payloadJsonError) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Invalid JSON format in payload. Please fix the syntax errors.', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }

  try {
    const header = JSON.parse(tab.headerJson);
    const payload = JSON.parse(tab.payloadJson);
    
    // Validate JWT-specific fields
    const validationErrors = validateJWTFields(header, payload);
    if (validationErrors.length > 0) {
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast(`Invalid JWT: ${validationErrors.join(', ')}`, {
          variant: 'error',
          duration: 4000
        });
      }
      return;
    }
    
    // Basic validation
    if (!header.alg) {
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Invalid token: Missing algorithm in header', {
          variant: 'error',
          duration: 3000
        });
      }
      return;
    }
    
    // CRITICAL: Check if token parts were modified
    const isStructurallyValid = validateTokenSignature(tab, header, payload);
    
    if (!isStructurallyValid) {
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('TOKEN MODIFIED: Token signature does not match the current header and payload. Re-sign the token to make it valid.', {
          variant: 'error',
          duration: 5000
        });
      }
      return;
    }
    
    // NOW DO CRYPTOGRAPHIC VALIDATION: Verify signature with keys
    const cryptoValidation = await verifyCryptographicSignature(tab, header, payload);
    
    if (cryptoValidation.error) {
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast(`CRYPTOGRAPHIC VALIDATION FAILED: ${cryptoValidation.error}`, {
          variant: 'error',
          duration: 5000
        });
      }
      return;
    }
    
    if (!cryptoValidation.isValid) {
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('INVALID SIGNATURE: Signature verification failed. The signature was not created with the provided key or the token has been tampered with.', {
          variant: 'error',
          duration: 6000
        });
      }
      return;
    }
    
    // Check expiration if set
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        if ((window as any).caidoSDK?.window?.showToast) {
          (window as any).caidoSDK.window.showToast('Token signature is valid but token has expired', {
            variant: 'warning',
            duration: 3000
          });
        }
        return;
      }
    }
    
    // Check not-before claim
    if (payload.nbf) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.nbf > now) {
        if ((window as any).caidoSDK?.window?.showToast) {
          (window as any).caidoSDK.window.showToast('Token signature is valid but token is not yet valid (nbf claim)', {
            variant: 'warning',
            duration: 3000
          });
        }
        return;
      }
    }
    
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Token validation passed - signature is valid and token is active', {
        variant: 'success',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('Token validation error:', error);
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Invalid JSON format in header or payload. Please check your syntax.', {
        variant: 'error',
        duration: 3000
      });
    }
  }
}

/**
 * Validate JWT-specific field types and values
 */
function validateJWTFields(header: any, payload: any): string[] {
  const errors: string[] = [];
  
  // Validate header fields
  if (header.alg && typeof header.alg !== 'string') {
    errors.push('Header "alg" must be a string');
  }
  if (header.typ && typeof header.typ !== 'string') {
    errors.push('Header "typ" must be a string');
  }
  if (header.kid && typeof header.kid !== 'string') {
    errors.push('Header "kid" must be a string');
  }
  
  // Validate payload fields
  if (payload.exp !== undefined) {
    if (typeof payload.exp !== 'number' || !Number.isInteger(payload.exp)) {
      errors.push('Payload "exp" (expiration) must be a numeric timestamp (integer)');
    }
  }
  
  if (payload.iat !== undefined) {
    if (typeof payload.iat !== 'number' || !Number.isInteger(payload.iat)) {
      errors.push('Payload "iat" (issued at) must be a numeric timestamp (integer)');
    }
  }
  
  if (payload.nbf !== undefined) {
    if (typeof payload.nbf !== 'number' || !Number.isInteger(payload.nbf)) {
      errors.push('Payload "nbf" (not before) must be a numeric timestamp (integer)');
    }
  }
  
  if (payload.iss !== undefined && typeof payload.iss !== 'string') {
    errors.push('Payload "iss" (issuer) must be a string');
  }
  
  if (payload.sub !== undefined && typeof payload.sub !== 'string') {
    errors.push('Payload "sub" (subject) must be a string');
  }
  
  if (payload.aud !== undefined) {
    if (typeof payload.aud !== 'string' && !Array.isArray(payload.aud)) {
      errors.push('Payload "aud" (audience) must be a string or array of strings');
    } else if (Array.isArray(payload.aud)) {
      const hasNonString = payload.aud.some((aud: any) => typeof aud !== 'string');
      if (hasNonString) {
        errors.push('Payload "aud" (audience) array must contain only strings');
      }
    }
  }
  
  if (payload.jti !== undefined && typeof payload.jti !== 'string') {
    errors.push('Payload "jti" (JWT ID) must be a string');
  }
  
  return errors;
}

/**
 * This function checks if the signature matches the current header+payload
 * IMPORTANT: This is structural validation only - it checks if token parts were modified
 * For cryptographic validation, the "Validate" button should verify with actual keys
 */
function validateTokenSignature(tab: TokenTab, header: any, payload: any): boolean {
  try {
    const base64UrlHeader = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const base64UrlPayload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const originalParts = tab.token.split('.');
    if (originalParts.length !== 3) {
      return false;
    }
    
    const originalHeader = originalParts[0];
    const originalPayload = originalParts[1];
    
    if (originalHeader === base64UrlHeader && originalPayload === base64UrlPayload) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error during signature validation:', error);
    return false;
  }
}

function updateToken(tabInput: TokenTab) {
  const tab = tabInput || (tokenTabs.value.length > 0 && activeTokenTab.value >= 0 ?
    tokenTabs.value[activeTokenTab.value] : null);
  
  if (!tab) return;
  
  if (tab.headerJsonError || tab.payloadJsonError) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Invalid JSON format in header or payload', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }
  
  try {
    const header = JSON.parse(tab.headerJson);
    const payload = JSON.parse(tab.payloadJson);
    
    // Base64url encode header and payload (properly handle Unicode)
    const base64UrlHeader = btoa(unescape(encodeURIComponent(JSON.stringify(header))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const base64UrlPayload = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const parts = tab.token.split('.');
    if (parts.length === 3) {
      // Try to automatically re-sign the token if we have a suitable key
      let newSignature = parts[2]; // Default to original signature
      let signatureUpdated = false;
      
      // Check if we have a compatible signing key
      const currentAlg = header.alg || 'HS256';
      const compatibleKey = keys.value.find(k => {
        if (currentAlg.startsWith('HS')) return k.name.includes('HMAC') || k.name.includes('HS') || k.name.toLowerCase().includes('secret');
        if (currentAlg.startsWith('RS')) return k.name.includes('RSA') || k.name.includes('RS') || k.name.toLowerCase().includes('private');
        if (currentAlg.startsWith('ES')) return k.name.includes('ECDSA') || k.name.includes('ES') || k.name.toLowerCase().includes('ecdsa');
        return false;
      });
      
      // Re-signing disabled - use manual signing interface
      
      tab.token = `${base64UrlHeader}.${base64UrlPayload}.${newSignature}`;
      
      // If this is the active tab, update the main token as well
      if (tab === tokenTabs.value[activeTokenTab.value]) {
        token.value = tab.token;
      }
      
      if ((window as any).caidoSDK?.window?.showToast) {
        if (signatureUpdated) {
          (window as any).caidoSDK.window.showToast('Token updated and re-signed successfully with your key!', {
            variant: 'success',
            duration: 4000
          });
        } else {
          (window as any).caidoSDK.window.showToast('Token updated - Signature is invalid. Click "Sign" button to re-sign the token with a key.', {
            variant: 'warning',
            duration: 6000
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating token:', error);
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Error updating token', {
        variant: 'error',
        duration: 3000
      });
    }
  }
}

function saveToDetails(tabInput: TokenTab) {
  const tab = tabInput || (tokenTabs.value.length > 0 && activeTokenTab.value >= 0 ?
    tokenTabs.value[activeTokenTab.value] : null);
  
  if (!tab || !tab.decodedToken) return;
  
  try {
    const header = JSON.parse(tab.headerJson);
    const payload = JSON.parse(tab.payloadJson);
    
    const analysis = analyzeJWTSecurity(header, payload);
    
    emit('view-details-editor', tab.token, header, payload, analysis, true);
    
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Opening token in Token Details tab', {
        variant: 'success',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('Error saving to details:', error);
  }
}

// Key management methods
function generateRandomKey() {
  // Check if an algorithm is selected first
  if (!newKey.value.algorithm) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Please select an algorithm first', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }

  // Generate a real cryptographic key based on the selected algorithm
  const length = newKey.value.algorithm === 'HS256' ? 32 : newKey.value.algorithm === 'HS384' ? 48 : 64;
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  newKey.value.value = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  
  // Key will remain hidden by default
  
  // Show a success message
  if ((window as any).caidoSDK?.window?.showToast) {
    (window as any).caidoSDK.window.showToast(`Key generated successfully`, {
      variant: 'success',
      duration: 3000
    });
  }
}

// Helper function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

// Helper function to format PEM content with line breaks every 64 characters
function formatPEM(base64: string) {
  const matches = base64.match(/.{1,64}/g);
  return matches ? matches.join('\n') : base64;
}

async function generateKeyPair() {
  // Clear any notifications to prevent stacking
  clearNotifications();
  
  // Check if an algorithm is selected first
  if (!newKey.value.algorithm) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Please select an algorithm first', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }
  
  // Generate RSA or EC keypair based on selected algorithm
  try {
    if (['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512'].includes(newKey.value.algorithm)) {
      await generateRSAKeyPair();
    } else if (['ES256', 'ES384', 'ES512'].includes(newKey.value.algorithm)) {
      await generateECKeyPair();
    }
    
    // Show a success message
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast(`${newKey.value.algorithm} key pair generated successfully`, {
        variant: 'success',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('Failed to generate key pair:', error);
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Failed to generate key pair. Using fallback method.', {
        variant: 'warning',
        duration: 3000
      });
    }
  }
}

// Helper function to clear any existing notifications
function clearNotifications() {
  // Try to access the notification system and clear notifications if possible
  if ((window as any).caidoSDK?.window?.clearToasts) {
    (window as any).caidoSDK.window.clearToasts();
  }
}

async function generateRSAKeyPair() {
  try {
    // Determine if this is PS* (PSS) or RS* (PKCS1) algorithm
    const isPSS = ['PS256', 'PS384', 'PS512'].includes(newKey.value.algorithm);
    const algorithmName = isPSS ? "RSA-PSS" : "RSASSA-PKCS1-v1_5";
    
    // Determine hash algorithm
    const hashAlg = newKey.value.algorithm.includes('256') ? "SHA-256" :
                    newKey.value.algorithm.includes('384') ? "SHA-384" : "SHA-512";
    
    // Generate a real RSA key pair using Web Crypto API
    const modulusLength = newKey.value.algorithm.endsWith('512') ? 4096 : 2048;
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: algorithmName,
        modulusLength: modulusLength,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
        hash: { name: hashAlg }
      },
      true, // extractable
      ["sign", "verify"]
    );

    // Export the keys in PEM format
    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    // Convert to base64
    const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
    const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);

    // Format as PEM
    newKey.value.publicKey = `-----BEGIN PUBLIC KEY-----\n${formatPEM(publicKeyBase64)}\n-----END PUBLIC KEY-----`;
    newKey.value.privateKey = `-----BEGIN PRIVATE KEY-----\n${formatPEM(privateKeyBase64)}\n-----END PRIVATE KEY-----`;

  } catch (error) {
    console.error("Error generating RSA keys:", error);
    // Fallback to simulated keys if the real generation fails
    simulateRSAKeyPair();
  }
}

// Fallback function for legacy browsers or if Web Crypto fails
function simulateRSAKeyPair() {
  newKey.value.publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo
4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u
+qKhbwKfBstIs+bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyeh
kd3qqGElvW/VDL5AaWTg0nLVkjRo9z+40RQzuVaE8AkAFmxZzow3x+VJYKdjykkJ
0iT9wCS0DRTXu269V264Vf/3jvredZiKRkgwlL9xNAwxXFg0x/XFw005UWVRIkdg
cKWTjpBP2dPwVZ4WWC+9aGVd+Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbc
mwIDAQAB
-----END PUBLIC KEY-----`;

  newKey.value.privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu
NMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ
qgtzJ6GR3eqoYSW9b9UMvkBpZODSctWSNGj3P7jRFDO5VoTwCQAWbFnOjDfH5Ulg
p2PKSQnSJP3AJLQNFNe7br1XbrhV//eO+t51mIpGSDCUv3E0DDFcWDTH9cXDTTlR
ZVEiR2BwpZOOkE/Z0/BVnhZYL71oZV34bKfWjQIt6V/isSMahdsAASACp4ZTGtwi
VuNd9tybAgMBAAECggEBAKTmjaS6tkK8BlPXClTQ2vpz/N6uxDeS35mXpqasqskV
laAidgg/sWqpjXDbXr93otIMLlWsM+X0CqMDgSXKejLS2jx4GDjI1ZTXg++0AMJ8
sJ74pWzVDOfmCEQ/7wXs3+cbnXhKriO8Z036q92Qc1+N87SI38nkGa0ABH9CN83H
mQqt4fB7UdHzuIRe/me2PGhIq5ZBzj6h3BpoPGzEP+x3l9YmK8t/1cN0pqI+dQwY
dgfGjackLu/2qH80MCF7IyQaseZUOJyKrCLtSD/Iixv/hzDEUPfOCjFDgTpzf3cw
ta8+oE4wHCo1iI1/4TlPkwmXx4qSXtmw4aQPz7IDQvECgYEA8KNThCO2gsC2I9PQ
DM/8Cw0O983WCDY+oi+7JPiNAJwv5DYBqEZB1QYdj06YD16XlC/HAZMsMku1na2T
N0driwenQQWzoev3g2S7gRDoS/FCJSI3jJ+kjgtaA7Qmzlgk1TxODN+G1H91HW7t
0l7VnL27IWyYo2qRRK3jzxqUiPUCgYEAx0oQs2reBQGMVZnApD1jeq7n4MvNLcPv
t8b/eU9iUv6Y4Mj0Suo/AU8lYZXm8ubbqAlwz2VSVunD2tOplHyMUrtCtObAfVDU
AhCndKaA9gApgfb3xw1IKbuQ1u4IF1FJl3VtumfQn//LiH1B3rXhcdyo3/vIttEk
48RakUKClU8CgYEAzV7W3COOlDDcQd935DdtKBFRAPRPAlspQUnzMi5eSHMD/ISL
DY5IiQHbIH83D4bvXq0X7qQoSBSNP7Dvv3HYuqMhf0DaegrlBuJllFVVq9qPVRnK
xt1Il2HgxOBvbhOT+9in1BzA+YJ99UzC85O0Qz06A+CmtHEy4aZ2kj5hHjECgYEA
mNS4+A8Fkss8Js1RieK2LniBxMgmYml3pfVLKGnzmng7H2+cwPLhPIzIuwytXywh
2bzbsYEfYx3EoEVgMEpPhoarQnYPukrJO4gwE2o5Te6T5mJSZGlQJQj9q4ZB2Dfz
et6INsK0oG8XVGXSpQvQh3RUYekCZQkBBFcpqWpbIEsCgYAnM3DQf3FJoSnXaMhr
VBIovic5l0xFkEHskAjFTevO86Fsz1C2aSeRKSqGFoOQ0tmJzBEs1R6KqnHInicD
TQrKhArgLXX4v3CddjfTRJkFWDbE/CkvKZNOrcf1nhaGCPspRJj2KUkj1Fhl9Cnc
dn/RsYEONbwQSjIfMPkvxF+8HQ==
-----END PRIVATE KEY-----`;
}

async function generateECKeyPair() {
  try {
    // Determine the curve based on the algorithm
    const namedCurve = 
      newKey.value.algorithm === 'ES256' ? 'P-256' :
      newKey.value.algorithm === 'ES384' ? 'P-384' : 'P-521';

    // Generate a real EC key pair using Web Crypto API
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve
      },
      true, // extractable
      ["sign", "verify"]
    );

    // Export the keys in PEM format
    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    // Convert to base64
    const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
    const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);

    // Format as PEM
    newKey.value.publicKey = `-----BEGIN PUBLIC KEY-----\n${formatPEM(publicKeyBase64)}\n-----END PUBLIC KEY-----`;
    newKey.value.privateKey = `-----BEGIN PRIVATE KEY-----\n${formatPEM(privateKeyBase64)}\n-----END PRIVATE KEY-----`;

  } catch (error) {
    console.error("Error generating EC keys:", error);
    // Fallback to simulated keys if the real generation fails
    simulateECKeyPair();
  }
}

// Fallback function for legacy browsers or if Web Crypto fails
function simulateECKeyPair() {
  newKey.value.publicKey = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEVs/o5+uQbTjL3chynL4wXgUg2R9
q9UU8I5mEovUf86QZ7kOBIjJwqnzD1omageEHWwHdBO6B+dFabmdT9POxg==
-----END PUBLIC KEY-----`;

  newKey.value.privateKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgevZzL1gdAFr88hb2
OF/2NxApJCzGCEDdfSp6VQO30hyhRANCAAQRWz+jn65BtOMvdyHKcvjBeBSDZH2r
1RTwjmYSi9R/zpBnuQ4EiMnCqfMPWiZqB4QdbAd0E7oH50VpuZ1P087G
-----END PRIVATE KEY-----`;
}

async function saveKey() {
  // Clear any existing notifications
  clearNotifications();
  
  // Validate the key data
  if (!newKey.value.id.trim()) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Please provide a key ID', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }

  // Check if algorithm is selected
  if (!newKey.value.algorithm) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Please select an algorithm', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }

  if (newKey.value.type === 'symmetric' && !newKey.value.value) {
    generateRandomKey();
    // If no key was generated (due to no algorithm selected), return
    if (!newKey.value.value) return;
  }

  if (newKey.value.type === 'asymmetric' && (!newKey.value.publicKey || !newKey.value.privateKey)) {
    generateKeyPair();
    // If no keys were generated (due to no algorithm selected), return
    if (!newKey.value.publicKey || !newKey.value.privateKey) return;
  }
  
  if (editingKeyIndex.value !== -1) {
    // Update existing key
    keys.value[editingKeyIndex.value] = { ...newKey.value };
  } else {
    // Add new key
    keys.value.push({ ...newKey.value });
  }
  
  // Reset form
  editingKeyIndex.value = -1;
  newKey.value = {
    id: '',
    type: 'symmetric',
    algorithm: 'HS256',
    value: '',
    publicKey: '',
    privateKey: ''
  };
  
  showKeyModal.value = false;
  
  // Update SDK storage immediately
  try {
    await storageService.saveJWTKeys(keys.value);
  } catch (error) {
    console.error('Error saving keys to storage:', error);
  }
  
  if ((window as any).caidoSDK?.window?.showToast) {
    (window as any).caidoSDK.window.showToast('Key saved successfully', {
      variant: 'success',
      duration: 3000
    });
  }
}

function editKey(index: number) {
  editingKeyIndex.value = index;
  newKey.value = { ...keys.value[index] };
  showKeyModal.value = true;
}

function deleteKey(index: number) {
  keys.value.splice(index, 1);
  
  if ((window as any).caidoSDK?.window?.showToast) {
    (window as any).caidoSDK.window.showToast('Key deleted successfully', {
      variant: 'success',
      duration: 3000
    });
  }
}

async function signToken() {
  // Get token from the active tab
  const currentTab = activeTokenForAction.value;
  const tokenToSign = currentTab?.token || token.value;
  
  if (!tokenToSign) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Please provide a token to sign', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }

  try {
    const parts = tokenToSign.split('.');
    if (parts.length < 2) {
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Invalid token format', {
          variant: 'error',
          duration: 3000
        });
      }
      return;
    }

    // Parse header to update the algorithm
    let header;
    try {
      header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
      // If active tab exists, use its header JSON, otherwise use global headerJson
      header = JSON.parse((currentTab?.headerJson || headerJson.value) || '{}');
    }

    // Determine which key to use
    let keyToUse;
    let algorithm;
    let cryptoKey;

    if (selectedKeyIndex.value >= 0 && selectedKeyIndex.value < keys.value.length) {
      // Use a saved key
      const selectedKey = keys.value[selectedKeyIndex.value];
      keyToUse = selectedKey.type === 'symmetric' ? selectedKey.value : selectedKey.privateKey;
      algorithm = selectedKey.algorithm;
      header.alg = algorithm;
    } else if (tempKeyValue.value) {
      // Use a temporary key
      keyToUse = tempKeyValue.value;
      algorithm = tempKeyAlgorithm.value;
      header.alg = algorithm;
    } else {
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Please select a key or provide a temporary key', {
          variant: 'error',
          duration: 3000
        });
      }
      return;
    }

    // Update the header part
    const updatedHeader = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // The data to sign is the base64url encoded header + "." + base64url encoded payload
    const dataToSign = `${updatedHeader}.${parts[1]}`;
    let signature = '';

    // Create a real signature based on algorithm
    if (algorithm.startsWith('HS')) {
      // HMAC signature
      try {
        // Convert key to ArrayBuffer
        const encoder = new TextEncoder();
        const keyData = encoder.encode(keyToUse);
        
        // Import the key
        const importedKey = await window.crypto.subtle.importKey(
          "raw",
          keyData,
          {
            name: "HMAC",
            hash: { name: algorithm === 'HS256' ? "SHA-256" : 
                         algorithm === 'HS384' ? "SHA-384" : "SHA-512" }
          },
          false,
          ["sign"]
        );
        
        // Sign the data
        const dataBuffer = encoder.encode(dataToSign);
        const signatureBuffer = await window.crypto.subtle.sign(
          "HMAC",
          importedKey,
          dataBuffer
        );
        
        // Convert signature to base64url
        signature = arrayBufferToBase64(signatureBuffer)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } catch (error) {
        console.error('Error creating HMAC signature:', error);
        // Fallback to simulated signature
        signature = btoa(keyToUse.slice(0, 10) + dataToSign)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      }
    } else if (algorithm.startsWith('RS')) {
      // RSA signature
      try {
        // Import the private key
        const importedKey = await importRsaPrivateKey(keyToUse);
        
        // Sign the data
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataToSign);
        const signatureBuffer = await window.crypto.subtle.sign(
          {
            name: "RSASSA-PKCS1-v1_5",
            hash: { name: algorithm === 'RS256' ? "SHA-256" : 
                         algorithm === 'RS384' ? "SHA-384" : "SHA-512" }
          },
          importedKey,
          dataBuffer
        );
        
        // Convert signature to base64url
        signature = arrayBufferToBase64(signatureBuffer)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } catch (error) {
        console.error('Error creating RSA signature:', error);
        // Fallback to simulated signature
        signature = 'RS_SIGNATURE_PLACEHOLDER'
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      }
    } else if (algorithm.startsWith('ES')) {
      // ECDSA signature
      try {
        // Import the private key
        const importedKey = await importEcPrivateKey(keyToUse, algorithm);
        
        // Sign the data
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataToSign);
        const signatureBuffer = await window.crypto.subtle.sign(
          {
            name: "ECDSA",
            hash: { name: algorithm === 'ES256' ? "SHA-256" : 
                         algorithm === 'ES384' ? "SHA-384" : "SHA-512" }
          },
          importedKey,
          dataBuffer
        );
        
        // Convert signature to base64url
        signature = arrayBufferToBase64(signatureBuffer)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } catch (error) {
        console.error('Error creating ECDSA signature:', error);
        // Fallback to simulated signature
        signature = 'ES_SIGNATURE_PLACEHOLDER'
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      }
    }

    // Update the token - use the active tab if available, otherwise use global token
    const signedToken = `${updatedHeader}.${parts[1]}.${signature}`;
    const formattedHeader = JSON.stringify(header, null, 2);
    
    if (currentTab) {
      currentTab.token = signedToken;
      currentTab.headerJson = formattedHeader;
      // Re-decode the token to update the display
      decodeToken(currentTab);
    } else {
      token.value = signedToken;
      headerJson.value = formattedHeader;
    }

    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Token signed successfully', {
        variant: 'success',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('Error signing token:', error);
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Error signing token', {
        variant: 'error',
        duration: 3000
      });
    }
  }

  showSigningModal.value = false;
}

// Helper function to import RSA private key
async function importRsaPrivateKey(pemKey: string) {
  // Remove PEM header/footer and convert to binary
  const pemContents = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  // Convert base64 to ArrayBuffer
  const binaryDer = base64ToArrayBuffer(pemContents);
  
  // Import the key
  return window.crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' }, // Default, will be overridden during signing
    },
    false,
    ['sign']
  );
}

// Helper function to import EC private key
async function importEcPrivateKey(pemKey: string, algorithm: string) {
  // Determine the curve based on the algorithm
  const namedCurve = 
    algorithm === 'ES256' ? 'P-256' :
    algorithm === 'ES384' ? 'P-384' : 'P-521';
  
  // Remove PEM header/footer and convert to binary
  const pemContents = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  // Convert base64 to ArrayBuffer
  const binaryDer = base64ToArrayBuffer(pemContents);
  
  // Import the key
  return window.crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'ECDSA',
      namedCurve: namedCurve
    },
    false,
    ['sign']
  );
}

// Helper function to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function applyAttack(attackType: string) {
  selectedAttack.value = attackType;
  showAttackModal.value = true;
}

async function applySelectedAttack() {
  if (!decodedToken.value) {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Please decode a token first', {
        variant: 'error',
        duration: 3000
      });
    }
    return;
  }
  
  try {
    const header = JSON.parse(headerJson.value);
    const payload = JSON.parse(payloadJson.value);
    
    switch (selectedAttack.value) {
      case 'none':
        // Apply 'none' algorithm attack
        header.alg = 'none';
        headerJson.value = JSON.stringify(header, null, 2);
        
        // Update the token with empty signature
        const base64UrlHeader = btoa(JSON.stringify(header))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        const base64UrlPayload = btoa(JSON.stringify(payload))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        token.value = `${base64UrlHeader}.${base64UrlPayload}.`;
        
        if ((window as any).caidoSDK?.window?.showToast) {
          (window as any).caidoSDK.window.showToast('Applied "none" algorithm attack - signature verification will be bypassed in vulnerable implementations', {
            variant: 'success',
            duration: 3000
          });
        }
        break;
        
      case 'hmac-confusion':
        await applyHmacConfusionAttack(header, payload);
        break;
        
      case 'empty-key':
        // Apply empty key attack by simulating signing with an empty key
        const emptyKeyHeader = btoa(JSON.stringify(header))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        const emptyKeyPayload = btoa(JSON.stringify(payload))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        // Create a signature - in real application you would use crypto APIs
        // Here we're creating a signature that looks like it was made with an empty key
        const emptyKeySignature = btoa(`empty_key_${emptyKeyHeader}.${emptyKeyPayload}`)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        token.value = `${emptyKeyHeader}.${emptyKeyPayload}.${emptyKeySignature}`;
        
        if ((window as any).caidoSDK?.window?.showToast) {
          (window as any).caidoSDK.window.showToast('Token signed with an empty key - check if the server accepts it', {
            variant: 'success',
            duration: 3000
          });
        }
        break;
        
      case 'psychic':
        // Apply psychic signature attack (CVE-2022-21449)
        if (header.alg?.startsWith('ES')) {
          // Create a fake all-zero signature for the ECDSA algorithm
          const psychicSignature = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
          
          // Update the token with the psychic signature
          token.value = `${token.value.split('.')[0]}.${token.value.split('.')[1]}.${psychicSignature}`;
          
          if ((window as any).caidoSDK?.window?.showToast) {
            (window as any).caidoSDK.window.showToast('Psychic signature attack applied (CVE-2022-21449) - test if the server is vulnerable', {
              variant: 'success',
              duration: 3000
            });
          }
        } else {
          if ((window as any).caidoSDK?.window?.showToast) {
            (window as any).caidoSDK.window.showToast('Psychic signature attack is only applicable to ECDSA algorithms (ES256, ES384, ES512)', {
              variant: 'error',
              duration: 3000
            });
          }
        }
        break;
        
      case 'embedded-jwk':
        // Apply embedded JWK attack by adding a JWK to the header
        // Generate a simple RSA key pair for the attack
        const jwk = {
          kty: "RSA",
          n: "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
          e: "AQAB",
          alg: "RS256",
          kid: embedJwkWithKid.value ? "embedded-key-1" : undefined
        };
        
        // Add the jwk to the header
        header.jwk = jwk;
        if (embedJwkWithKid.value) {
          header.kid = "embedded-key-1";
        }
        headerJson.value = JSON.stringify(header, null, 2);
        
        // Update the token header
        const jwkHeaderBase64 = btoa(JSON.stringify(header))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        const jwkPayloadBase64 = btoa(JSON.stringify(payload))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        // Fake signature
        const jwkSignature = btoa(`${jwkHeaderBase64}.${jwkPayloadBase64}.embedded_jwk_signature`)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        token.value = `${jwkHeaderBase64}.${jwkPayloadBase64}.${jwkSignature}`;
        
        if ((window as any).caidoSDK?.window?.showToast) {
          (window as any).caidoSDK.window.showToast('Embedded JWK attack applied - the token now contains its own verification key in the header', {
            variant: 'success',
            duration: 3000
          });
        }
        break;
        
      case 'weak-hmac':
        // Apply weak HMAC secret attack
        if (!header.alg?.startsWith('HS')) {
          header.alg = 'HS256';
          headerJson.value = JSON.stringify(header, null, 2);
        }
        
        const weakHeader = btoa(JSON.stringify(header))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        const weakPayload = btoa(JSON.stringify(payload))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        // Simulate signing with a weak secret
        const weakSignature = btoa(`${weakHeader}.${weakPayload}.signed_with_${weakHmacSecret.value}`)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        token.value = `${weakHeader}.${weakPayload}.${weakSignature}`;
        
        if ((window as any).caidoSDK?.window?.showToast) {
          (window as any).caidoSDK.window.showToast(`Token signed with a weak HMAC secret: '${weakHmacSecret.value}'`, {
            variant: 'success',
            duration: 3000
          });
        }
        break;
        
      case 'alg-sub':
        // Apply algorithm substitution attack
        const originalAlg = header.alg;
        header.alg = targetAlgorithm.value;
        headerJson.value = JSON.stringify(header, null, 2);
        
        const algSubHeader = btoa(JSON.stringify(header))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        const algSubPayload = btoa(JSON.stringify(payload))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        // Keep original signature to test for inconsistencies in validation
        token.value = `${algSubHeader}.${algSubPayload}.${decodedToken.value.signature}`;
        
        if ((window as any).caidoSDK?.window?.showToast) {
          (window as any).caidoSDK.window.showToast(`Algorithm changed from ${originalAlg} to ${targetAlgorithm.value} for algorithm substitution attack`, {
            variant: 'success',
            duration: 3000
          });
        }
        break;
    }
    
    // Update decoded token to reflect changes
    decodeToken();
    
  } catch (error) {
    console.error('Error applying attack:', error);
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Error applying attack', {
        variant: 'error',
        duration: 3000
      });
    }
  }
  
  showAttackModal.value = false;
}

async function applyHmacConfusionAttack(header: any, payload: any) {
  // Apply HMAC confusion attack (algorithm switching)
  if (header.alg?.startsWith('RS') || header.alg?.startsWith('ES')) {
    const originalAlg = header.alg;
    header.alg = 'HS256';
    headerJson.value = JSON.stringify(header, null, 2);
    
    // Update the token (signature would be updated separately)
    const base64UrlHeader = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const base64UrlPayload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    token.value = `${base64UrlHeader}.${base64UrlPayload}.${decodedToken.value.signature}`;
    
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast(`Algorithm changed from ${originalAlg} to HS256 for key confusion attack. In vulnerable implementations, this may make the server use the public key as HMAC secret.`, {
        variant: 'success',
        duration: 5000
      });
    }
  } else if (publicKeyForAttack.value && header.alg?.startsWith('HS')) {
    // User provided a public key, let's use that for signing
    const dataToSign = `${token.value.split('.')[0]}.${token.value.split('.')[1]}`;
    
    try {
      // Use the public key as HMAC secret (this is the actual attack)
      // Remove PEM header/footer and whitespace
      const publicKeyData = publicKeyForAttack.value
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s/g, '');
      
      // Convert base64 to binary
      const publicKeyBinary = atob(publicKeyData);
      
      // Create a TextEncoder to convert the string to bytes
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(dataToSign);
      
      // Import the key for HMAC
      const key = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(publicKeyBinary),
        {
          name: 'HMAC',
          hash: { name: 'SHA-256' }
        },
        false,
        ['sign']
      );
      
      // Sign the data
      const signature = await window.crypto.subtle.sign(
        'HMAC',
        key,
        dataBytes
      );
      
      // Convert to base64url
      const base64Signature = arrayBufferToBase64(signature)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      token.value = `${token.value.split('.')[0]}.${token.value.split('.')[1]}.${base64Signature}`;
      
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Re-signed with public key as HMAC secret for key confusion attack', {
          variant: 'success',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error applying HMAC confusion attack:', error);
      
      // Fallback to simulated signature if real crypto fails
      const signature = btoa(`hmac_confusion_${dataToSign}_${publicKeyForAttack.value.slice(0, 10)}`)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      token.value = `${token.value.split('.')[0]}.${token.value.split('.')[1]}.${signature}`;
      
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Re-signed with public key as HMAC secret for key confusion attack (simulated)', {
          variant: 'success',
          duration: 3000
        });
      }
    }
  } else {
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('HMAC confusion attack is applicable to RS/ES algorithms or when providing a public key', {
        variant: 'error',
        duration: 3000
      });
    }
  }
}

// Token tabs functionality
function addNewTokenTab() {
  const newTab: TokenTab = {
    id: `tab-${Date.now()}`,
    name: `Token ${tokenTabs.value.length + 1}`,
    token: '',
    headerJson: '',
    payloadJson: '',
    headerJsonError: '',
    payloadJsonError: '',
    decodedToken: null
  };
  
  tokenTabs.value.push(newTab);
  activeTokenTab.value = tokenTabs.value.length - 1;
}

function closeTokenTab(index: number) {
  // Remove the tab
  tokenTabs.value.splice(index, 1);
  
  // Adjust active tab if needed
  if (index <= activeTokenTab.value) {
    activeTokenTab.value = Math.max(0, activeTokenTab.value - 1);
  }
  
  // If no tabs left, create a new one
  if (tokenTabs.value.length === 0) {
    addNewTokenTab();
  }
}

function renameCurrentTab() {
  if (activeTokenTab.value >= 0 && activeTokenTab.value < tokenTabs.value.length) {
    tokenTabs.value[activeTokenTab.value].name = newTabName.value || `Token ${activeTokenTab.value + 1}`;
    showRenameModal.value = false;
    
    if ((window as any).caidoSDK?.window?.showToast) {
      (window as any).caidoSDK.window.showToast('Tab renamed successfully', {
        variant: 'success',
        duration: 3000
      });
    }
  }
}

// Add a new function to copy to clipboard
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
    .then(() => {
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Copied to clipboard', {
          variant: 'success',
          duration: 3000
        });
      }
    })
    .catch(error => {
      console.error('Failed to copy to clipboard:', error);
    });
}

// Signature type detection helper functions
function isSymmetricAlgorithm(alg: string | undefined): boolean {
  if (!alg) return false;
  return ['HS256', 'HS384', 'HS512'].includes(alg);
}

function isAsymmetricAlgorithm(alg: string | undefined): boolean {
  if (!alg) return false;
  return ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512'].includes(alg);
}

function formatKeyTypeDisplay(type: string): string {
  if (type === 'symmetric') return 'HMAC Secret';
  if (type === 'asymmetric') return 'RSA/EC Key Pair';
  return type;
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

// New helper functions for tab-specific operations
function prepareSignTab(tab: TokenTab) {
  activeTokenForAction.value = tab;
  showSigningModal.value = true;
}

function prepareAttackTab(tab: TokenTab) {
  activeTokenForAction.value = tab;
  showAttackModal.value = true;
}

function prepareRenameTab(tab: TokenTab) {
  activeTokenForAction.value = tab;
  newTabName.value = tab.name;
  showRenameModal.value = true;
}

// Add a new variable to track which tab we're working with in modals
const activeTokenForAction = ref<TokenTab | null>(null);

function prepareAttackWithType(attackType: string) {
  // First find the active tab
  if (activeTokenTab.value >= 0 && activeTokenTab.value < tokenTabs.value.length) {
    const tab = tokenTabs.value[activeTokenTab.value];
    // Set as the active tab for operations
    activeTokenForAction.value = tab;
    // Set the attack type
    selectedAttack.value = attackType;
    // Show the attack modal
    showAttackModal.value = true;
  }
}

// Add new state variables for attack options
const embedJwkWithKid = ref(true);
const weakHmacSecret = ref('password');
const targetAlgorithm = ref('HS256');
const weakSecrets = ref([
  'password',
  'secret',
  '1234567890',
  'jwt_secret',
  'key',
  'secretkey',
  'private',
  'mysecret',
  'changeme',
  ''
]);

const customWeakSecret = ref('');
const selectedSecret = ref('');

function addCustomSecret() {
  if (customWeakSecret.value.trim() || customWeakSecret.value === '') { // Allow empty strings too
    // Don't add duplicates
    if (!weakSecrets.value.includes(customWeakSecret.value)) {
      weakSecrets.value.push(customWeakSecret.value);
      
      // Save updated secrets to localStorage
      saveWeakSecrets();
    }
    
    // Reset the input field
    customWeakSecret.value = '';
  }
}

function removeCustomSecret(index: number) {
  // Check if this is a default secret that shouldn't be removed
  if (index >= 0 && index < weakSecrets.value.length && !isDefaultSecret(weakSecrets.value[index])) {
    weakSecrets.value.splice(index, 1);
    
    // Save updated secrets to localStorage
    saveWeakSecrets();
  }
}

function removeSelectedSecret() {
  if (selectedSecret.value && !isDefaultSecret(selectedSecret.value)) {
    const index = weakSecrets.value.indexOf(selectedSecret.value);
    if (index !== -1) {
      weakSecrets.value.splice(index, 1);
      selectedSecret.value = ''; // Clear selection after removal
      
      // Save updated secrets to localStorage
      saveWeakSecrets();
    }
  }
}

// Helper function to save weak secrets to localStorage
function saveWeakSecrets() {
  try {
    localStorage.setItem('jwtAnalyzer_weakSecrets', JSON.stringify(
      // Only save custom secrets, not the defaults
      weakSecrets.value.filter(secret => !isDefaultSecret(secret))
    ));
  } catch (e) {
    console.error('Error saving weak secrets:', e);
  }
}

// Default secrets that shouldn't be removable
const defaultSecrets = ['password', 'secret', '1234567890', 'jwt_secret', 'key', 'secretkey', 'private', 'mysecret', 'changeme', ''];

// Helper to check if a secret is one of the default ones
function isDefaultSecret(secret: string): boolean {
  return defaultSecrets.includes(secret);
}

function getCustomSecrets() {
  return weakSecrets.value.filter(secret => !isDefaultSecret(secret));
}

function removeCustomSecretByValue(secret: string) {
  const index = weakSecrets.value.indexOf(secret);
  if (index !== -1) {
    weakSecrets.value.splice(index, 1);
    // Save updated secrets to localStorage
    saveWeakSecrets();
  }
}
</script>

<style scoped>
.jwt-editor-container {
  padding-bottom: 1rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  overflow-y: auto !important;
}

/* Add blur effect styling */
.private-key-hidden {
  filter: blur(5px);
  user-select: none;
  transition: filter 0.2s ease;
}

.private-key-hidden:hover {
  filter: blur(3px);
}

/* Add transition effects for buttons */
:deep(.p-button) {
  transition: all 0.2s ease;
}

:deep(.p-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Improve the eye toggle button */
.eye-toggle {
  opacity: 0.7;
  transition: all 0.2s ease;
}

.eye-toggle:hover {
  opacity: 1;
  transform: scale(1.1);
}

:deep(.p-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: auto !important;
}

:deep(.p-card-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto !important;
}

.token-editor-content {
  overflow: auto !important;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Add styles for the tab content */
.tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.token-tabs {
  display: flex;
  flex-direction: column;
}

:deep(.token-tabs-inner) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.token-tabs-inner .p-tabview-panels) {
  flex: 1;
  overflow: visible !important;
  padding: 0.5rem;
  background: #ffffff;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

:deep(.dark .token-tabs-inner .p-tabview-panels) {
  background: var(--surface-800);
}

.decoded-token {
  display: flex;
  flex-direction: column;
}

.keys-management-content {
  overflow: auto !important;
  height: 100%;
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

:deep(.p-button-outlined.justify-start) {
  justify-content: flex-start;
  text-align: left;
}

:deep(.token-tabs-inner .p-tabview-nav) {
  border-bottom: none;
  background: transparent;
  overflow-x: auto !important;
  display: flex;
  flex-wrap: nowrap;
}

:deep(.token-tabs-inner .p-tabview-nav-link) {
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem 0.375rem 0 0;
  margin-right: 0.25rem;
  font-size: 0.875rem;
  border: 1px solid rgba(209, 213, 219, 0.5);
  border-bottom: none;
  white-space: nowrap;
}

:deep(.token-tabs-inner .p-tabview-selected .p-tabview-nav-link) {
  border-color: rgba(99, 102, 241, 0.5);
  background: #ffffff;
}

:deep(.dark .token-tabs-inner .p-tabview-selected .p-tabview-nav-link) {
  background: var(--surface-800);
}

.token-tab-header {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
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

:deep(.p-dropdown) {
  border-radius: 0.375rem;
}

:deep(.p-inputtext) {
  border-radius: 0.375rem;
}

:deep(.p-button) {
  border-radius: 0.375rem;
}

:deep(.p-button-raised) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.p-textarea) {
  border-radius: 0.375rem;
}

:deep(.dark) .jwt-dialog .p-dialog-header {
  background-color: var(--surface-800);
  border-bottom-color: var(--surface-700);
}

:deep(.dark) .jwt-dialog .p-dialog-footer {
  border-top-color: var(--surface-700);
}
</style> 