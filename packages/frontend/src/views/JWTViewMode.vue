<script setup lang="ts">
import { type API, type RequestFull } from "@caido/sdk-frontend";
import { computed, ref } from "vue";

const props = defineProps<{
  sdk: API;
  request: RequestFull;
}>();

const activeTab = ref(0);

// Parse HTTP raw data
const parseHttpRaw = (raw: string) => {
  if (!raw) return null;
  
  const parts = raw.split('\r\n\r\n');
  if (parts.length < 2) return null;
  
  const headerSection = parts[0];
  const body = parts.slice(1).join('\r\n\r\n');
  
  const lines = headerSection?.split('\r\n') || [];
  const firstLine = lines[0];
  
  const methodMatch = firstLine?.match(/^(\w+)\s+/);
  const method = methodMatch ? methodMatch[1] : 'UNKNOWN';
  
  const headers: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const name = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      headers[name] = value;
    }
  }
  
  return { method, headers, body };
};

const parsedHttp = computed(() => {
  try {
    if (!props?.request?.raw) return null;
    return parseHttpRaw(props.request.raw);
  } catch (error) {
    console.error('[JWT View Mode] Error parsing HTTP raw:', error);
    return null;
  }
});

// JWT detection and extraction (supports unsigned tokens)
const jwtData = computed(() => {
  try {
    const parsed = parsedHttp.value;
    if (!parsed) return null;
    
    const tokens: string[] = [];
    const jwtPattern = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.?[a-zA-Z0-9_-]*/g;
    
    if (parsed.headers && typeof parsed.headers === 'object') {
      Object.entries(parsed.headers).forEach(([name, value]) => {
        if (typeof value === 'string') {
          const jwtMatches = value.match(jwtPattern);
          if (jwtMatches) {
            tokens.push(...jwtMatches);
          }
        }
      });
    }
    
    if (parsed.body && typeof parsed.body === 'string') {
      const bodyJwtMatches = parsed.body.match(jwtPattern);
      if (bodyJwtMatches) {
        tokens.push(...bodyJwtMatches);
      }
    }
    
    const uniqueTokens = [...new Set(tokens)];
    return uniqueTokens.length > 0 ? uniqueTokens : null;
  } catch (error) {
    console.error('[JWT View Mode] Error detecting JWT tokens:', error);
    return null;
  }
});

// Check if this request actually contains JWT tokens
const hasJWT = computed(() => {
  return jwtData.value !== null && jwtData.value.length > 0;
});

// Decode JWT token (supports unsigned tokens)
const decodeJWT = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2 || parts.length > 3) return null;
    
    // Helper to safely decode base64url
    const safeBase64Decode = (str: string) => {
      try {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        return JSON.parse(atob(padded));
      } catch (e) {
        return null;
      }
    };
    
    const header = safeBase64Decode(parts[0] || '');
    const payload = safeBase64Decode(parts[1] || '');
    
    if (!header || !payload) return null;
    
    const signature = parts[2] || ''; // Handle unsigned tokens
    
    return { header, payload, signature };
  } catch (error) {
    return null;
  }
};

// Decoded tokens
const decodedTokens = computed(() => {
  if (!jwtData.value) return [];
  
  return jwtData.value.map((token: string, index: number) => ({
    token,
    index,
    decoded: decodeJWT(token),
    truncated: token.length > 50 ? token.substring(0, 50) + '...' : token
  }));
});

// Check for important headers
const hasImportantHeaders = computed(() => {
  try {
    if (!parsedHttp.value?.headers) return false;
    const importantHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token', 'x-access-token'];
    return Object.keys(parsedHttp.value.headers).some(key => {
      if (typeof key !== 'string') return false;
      return importantHeaders.some(important => key.toLowerCase().includes(important));
    });
  } catch (error) {
    return false;
  }
});

// Copy token to clipboard
const copyToken = async (token: string) => {
  try {
    await navigator.clipboard.writeText(token);
    if (props.sdk?.window?.showToast) {
      props.sdk.window.showToast(`JWT token copied to clipboard`, { variant: 'success' });
    }
  } catch (error) {
    if (props.sdk?.window?.showToast) {
      props.sdk.window.showToast('Failed to copy token', { variant: 'error' });
    }
  }
};

// Send to JWT Analyzer - analyze each token via backend
const sendToJWTAnalyzer = async () => {
  if (!jwtData.value || jwtData.value.length === 0) return;
  
  try {
    if (props.sdk?.window?.showToast) {
      props.sdk.window.showToast(`Analyzing ${jwtData.value.length} JWT token(s)...`, { variant: 'info' });
    }
    
    // Analyze each token via backend
    const requestId = props.request?.id || `view-mode-${Date.now()}`;
    
    for (const token of jwtData.value) {
      try {
        await (props.sdk as any).backend.analyzeJWT({
          token,
          requestId,
          source: 'request'
        });
      } catch (error) {
        console.error('Error analyzing token:', error);
      }
    }
    
    // Navigate to JWT Analyzer
    window.location.hash = '/jwt-analyzer';
    
    if (props.sdk?.window?.showToast) {
      props.sdk.window.showToast(`${jwtData.value.length} token(s) sent to JWT Analyzer`, { variant: 'success', duration: 2000 });
    }
  } catch (error) {
    if (props.sdk?.window?.showToast) {
      props.sdk.window.showToast('Failed to send tokens', { variant: 'error' });
    }
  }
};

// JSON syntax highlighter
const highlightJSON = (obj: any): string => {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
      const isKey = /:$/.test(match);
      const color = isKey ? '#e06c75' : '#98c379'; // keys: red, values: green
      return `<span style="color: ${color}">${match}</span>`;
    })
    .replace(/\b(true|false)\b/g, '<span style="color: #56b6c2">$1</span>') // booleans: cyan
    .replace(/\b(null)\b/g, '<span style="color: #c678dd">$1</span>') // null: purple
    .replace(/\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span style="color: #d19a66">$1</span>'); // numbers: orange
};
</script>

<template>
  <div class="h-full flex flex-col bg-surface-800">
    <div v-if="hasJWT" class="h-full flex flex-col">
      <!-- Clean Action Toolbar -->
      <div class="flex items-center justify-between p-2 border-b border-surface-600">
        <div class="flex items-center gap-2 text-surface-300">
          <i class="fas fa-key text-primary-400"></i>
          <span class="text-sm font-medium">{{ parsedHttp?.method || 'GET' }} {{ props.request?.host || 'unknown' }}{{ props.request?.path || '/' }}</span>
          <span class="text-xs bg-primary-600 text-primary-100 px-2 py-0.5 rounded">{{ jwtData?.length || 0 }} JWT{{ (jwtData?.length || 0) !== 1 ? 's' : '' }}</span>
        </div>
        
        <div class="flex gap-1">
          <button
            class="px-2 py-1 text-xs rounded hover:bg-surface-700 text-primary-400"
            @click="sendToJWTAnalyzer"
            title="Send to JWT Analyzer"
          >
            <i class="fas fa-external-link-alt"></i>
          </button>
        </div>
      </div>

      <!-- Simple Tab Navigation -->
      <div class="border-b border-surface-600">
        <div class="flex">
          <button
            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 0 ? 'border-primary-500 text-primary-400' : 'border-transparent text-surface-400 hover:text-surface-200'"
            @click="activeTab = 0"
          >
            Tokens
          </button>
          <button
            v-if="hasImportantHeaders"
            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 1 ? 'border-primary-500 text-primary-400' : 'border-transparent text-surface-400 hover:text-surface-200'"
            @click="activeTab = 1"
          >
            Headers
          </button>
        </div>
      </div>

      <!-- Tab Content - Flexible height -->
      <div class="flex-1 min-h-0 overflow-auto p-2">
        <!-- Tokens Tab -->
        <div v-if="activeTab === 0" class="space-y-3 h-full">
          <div 
            v-for="(tokenData, index) in decodedTokens" 
            :key="index"
            class="border border-surface-600 rounded bg-surface-900 flex flex-col min-h-0"
          >
            <div class="p-3 border-b border-surface-600 flex items-center justify-between flex-shrink-0">
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-surface-200">JWT Token #{{ index + 1 }}</span>
                <div class="text-xs text-surface-400 mt-1 truncate">
                  <code class="bg-surface-800 px-1 rounded">{{ tokenData.truncated }}</code>
                </div>
              </div>
              <button
                class="px-2 py-1 text-xs rounded hover:bg-surface-700 text-surface-300 flex-shrink-0 ml-2"
                @click="copyToken(tokenData.token)"
                title="Copy Token"
              >
                <i class="fas fa-copy"></i>
              </button>
            </div>
            
            <div v-if="tokenData.decoded" class="flex-1 min-h-0 flex flex-col p-3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                <!-- Header -->
                <div class="flex flex-col min-h-0">
                  <h4 class="text-sm font-medium text-surface-200 mb-2 flex items-center flex-shrink-0">
                    <i class="fas fa-cog mr-2 text-surface-400"></i> Header
                  </h4>
                  <div class="flex-1 min-h-0 border border-surface-600 rounded overflow-auto bg-surface-800">
                    <pre class="p-3 text-xs font-mono leading-relaxed json-code" v-html="highlightJSON(tokenData.decoded.header)"></pre>
                  </div>
                </div>
                
                <!-- Payload -->
                <div class="flex flex-col min-h-0">
                  <h4 class="text-sm font-medium text-surface-200 mb-2 flex items-center flex-shrink-0">
                    <i class="fas fa-database mr-2 text-surface-400"></i> Payload
                  </h4>
                  <div class="flex-1 min-h-0 border border-surface-600 rounded overflow-auto bg-surface-800">
                    <pre class="p-3 text-xs font-mono leading-relaxed json-code" v-html="highlightJSON(tokenData.decoded.payload)"></pre>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="p-3 text-center text-surface-400">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              Invalid JWT format
            </div>
          </div>
        </div>

        <!-- Headers Tab -->
        <div v-if="activeTab === 1 && hasImportantHeaders" class="space-y-2">
          <div 
            v-for="(value, name) in parsedHttp?.headers" 
            :key="String(name)"
            v-show="typeof name === 'string' && ['authorization', 'cookie', 'x-api-key', 'x-auth-token', 'x-access-token'].some(h => String(name).toLowerCase().includes(h))"
            class="border border-surface-600 rounded p-3 bg-surface-900"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-surface-200">{{ name }}</span>
              <button
                class="px-2 py-1 text-xs rounded hover:bg-surface-700 text-surface-300"
                @click="copyToken(String(value))"
                title="Copy Value"
              >
                <i class="fas fa-copy"></i>
              </button>
            </div>
            <pre class="bg-surface-800 p-2 rounded text-xs text-surface-300 break-all font-mono">{{ value }}</pre>
          </div>
        </div>
      </div>

      <!-- Minimal Status Bar - Always at bottom -->
      <div class="flex items-center justify-between px-3 py-1.5 border-t border-surface-600 bg-surface-750 text-xs flex-shrink-0">
        <div class="flex items-center gap-3 text-surface-400">
          <span class="flex items-center gap-1">
            <i class="fas fa-server"></i>
            {{ props.request?.host || 'unknown' }}
          </span>
          <span v-if="decodedTokens.length > 0 && decodedTokens[0].decoded" class="flex items-center gap-1">
            <i class="fas fa-shield-alt"></i>
            {{ decodedTokens[0].decoded.header.alg || 'none' }}
          </span>
        </div>
        <div class="text-primary-400 font-medium">JWT</div>
      </div>
    </div>

    <!-- No JWT Found State -->
    <div v-else class="h-full flex flex-col items-center justify-center text-center p-4">
      <div class="text-surface-400 mb-4">
        <i class="fas fa-key text-4xl mb-3"></i>
      </div>
      <h3 class="text-lg font-semibold text-surface-200 mb-2">No JWT Tokens Found</h3>
      <p class="text-surface-400 text-sm max-w-md">
        This request doesn't appear to contain any JWT tokens in headers, body, or URL parameters.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* JSON syntax highlighting */
.json-code {
  white-space: pre;
  tab-size: 2;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  line-height: 1.6;
  color: #abb2bf;
}
</style>

