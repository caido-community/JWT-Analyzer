<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 min-h-0 overflow-auto p-4">
    <!-- Help & Documentation Card -->
    <Card class="mb-4 bg-gray-50 dark:bg-surface-700">
      <template #title>
        <div class="flex items-center">
          <span class="tab-icon">
            <i class="pi pi-info-circle"></i>
          </span>
          <span>Help & Documentation</span>
        </div>
      </template>
      <template #content>
        <div class="space-y-6">
          <!-- Introduction Section -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
            <h3 class="text-xl font-semibold mb-2">Welcome to JWT Analyzer</h3>
            <p class="leading-relaxed">
              This knowledge base will help you understand how to use all features of the JWT Analyzer plugin effectively.
              Learn how to analyze, decode, edit and secure JWT tokens in your penetration testing workflow.
            </p>
          </div>

          <!-- Main Documentation Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Dashboard Section -->
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="flex items-center mb-3">
                <span class="tab-icon text-xl mr-2">
                  <i class="pi pi-chart-bar"></i>
                </span>
                <h3 class="text-lg font-bold">Dashboard</h3>
              </div>
              <p class="text-sm mb-3">
                The Dashboard provides a central view of all JWT tokens detected in your web traffic.
              </p>
              <div class="space-y-2">
                <h4 class="font-medium text-blue-600 dark:text-blue-400">Key Features:</h4>
                <ul class="list-disc pl-5 space-y-1 text-sm">
                  <li>View all detected JWT tokens in one place</li>
                  <li>Filter tokens by severity, status, and algorithm</li>
                  <li>Sort and search tokens easily</li>
                  <li>Quick access to token details</li>
                  <li>Export token data for reporting</li>
                </ul>
                <h4 class="font-medium text-blue-600 dark:text-blue-400 mt-3">How to Use:</h4>
                <ol class="list-decimal pl-5 space-y-1 text-sm">
                  <li>Browse to websites using JWT tokens while Caido is capturing traffic</li>
                  <li>JWT tokens will automatically appear in your dashboard</li>
                  <li>Click on any token to see detailed security analysis</li>
                  <li>Use filters to focus on high-risk tokens</li>
                </ol>
              </div>
            </div>

            <!-- JWT Decoder Section -->
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="flex items-center mb-3">
                <span class="tab-icon text-xl mr-2">
                  <i class="pi pi-eye"></i>
                </span>
                <h3 class="text-lg font-bold">JWT Decoder</h3>
              </div>
              <p class="text-sm mb-3">
                The JWT Decoder allows you to manually analyze any JWT token by pasting it directly.
              </p>
              <div class="space-y-2">
                <h4 class="font-medium text-blue-600 dark:text-blue-400">Key Features:</h4>
                <ul class="list-disc pl-5 space-y-1 text-sm">
                  <li>Decode and visualize any JWT token structure</li>
                  <li>View header, payload, and signature details</li>
                  <li>Check token expiration status</li>
                  <li>Perform security analysis on manually input tokens</li>
                  <li>Send tokens to the JWT Editor for manipulation</li>
                </ul>
                <h4 class="font-medium text-blue-600 dark:text-blue-400 mt-3">How to Use:</h4>
                <ol class="list-decimal pl-5 space-y-1 text-sm">
                  <li>Copy a JWT token from any source</li>
                  <li>Paste it into the text input field</li>
                  <li>Click "Decode" to analyze the token</li>
                  <li>View the decoded information and security assessment</li>
                  <li>Click "Send to Editor" to modify the token</li>
                </ol>
              </div>
            </div>
          </div>

          <!-- JWT View Mode Section (NEW) - Full Width -->
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-6">
            <div class="flex items-center mb-3">
              <span class="tab-icon text-xl mr-2">
                <i class="pi pi-eye"></i>
              </span>
              <h3 class="text-lg font-bold">JWT View Mode</h3>
              <span class="ml-2 text-xs bg-primary-600 text-white px-2 py-0.5 rounded">NEW</span>
            </div>
            <p class="text-sm">
              The JWT View Mode is integrated directly into Caido's HTTP History for viewing JWT tokens inline with requests. 
              Open any request containing a JWT token in HTTP History, click on the "JWT" tab in the request viewer, and instantly view decoded token header and payload with syntax highlighting. 
              Click "Send to JWT Analyzer" to perform full security analysis on the tokens you find.
            </p>
          </div>

          <!-- Second Grid Row: Token Details and JWT Editor -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <!-- Token Details Section -->
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="flex items-center mb-3">
                <span class="tab-icon text-xl mr-2">
                  <i class="pi pi-key"></i>
                </span>
                <h3 class="text-lg font-bold">Token Details</h3>
              </div>
              <p class="text-sm mb-3">
                The Token Details tab provides comprehensive security analysis and technical information about JWT tokens.
              </p>
              <div class="space-y-2">
                <h4 class="font-medium text-blue-600 dark:text-blue-400">Key Features:</h4>
                <ul class="list-disc pl-5 space-y-1 text-sm">
                  <li>Full token breakdown (header, payload, signature)</li>
                  <li>Security vulnerability assessment</li>
                  <li>Expiration status and timing information</li>
                  <li>Potential attack vectors and exploitability</li>
                  <li>Security recommendations with CVE references</li>
                  <li>Export functionality for reporting (Markdown/JSON)</li>
                </ul>
                <h4 class="font-medium text-blue-600 dark:text-blue-400 mt-3">Understanding the Analysis:</h4>
                <ul class="list-disc pl-5 space-y-1 text-sm">
                  <li>Review the overall security assessment</li>
                  <li>Pay attention to "Identified Risks" for specific vulnerabilities</li>
                  <li>Check "Potential Attack Vectors" for exploitation methods</li>
                  <li>Follow security recommendations to remediate issues</li>
                  <li>Use the export feature to document findings</li>
                </ul>
              </div>
            </div>

            <!-- JWT Editor Section -->
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="flex items-center mb-3">
                <span class="tab-icon text-xl mr-2">
                  <i class="pi pi-code"></i>
                </span>
                <h3 class="text-lg font-bold">JWT Editor</h3>
              </div>
              <p class="text-sm mb-3">
                The JWT Editor enables you to modify tokens and test different attack scenarios.
              </p>
              <div class="space-y-2">
                <h4 class="font-medium text-blue-600 dark:text-blue-400">Key Features:</h4>
                <ul class="list-disc pl-5 space-y-1 text-sm">
                  <li>Edit token header and payload contents</li>
                  <li>Generate new cryptographic keys (symmetric/asymmetric)</li>
                  <li>Sign tokens with different algorithms and keys</li>
                  <li>Apply common JWT attacks with a single click</li>
                  <li>Test token modifications immediately</li>
                </ul>
                <h4 class="font-medium text-blue-600 dark:text-blue-400 mt-3">Common JWT Attacks:</h4>
                <ul class="list-disc pl-5 space-y-1 text-sm">
                  <li><strong>'none' Algorithm Attack:</strong> Removes signature verification (CVE-2015-9235)</li>
                  <li><strong>HMAC Confusion Attack:</strong> Exploits algorithm switching (CVE-2016-5431)</li>
                  <li><strong>Key ID (kid) Injection:</strong> Manipulates the key selection process</li>
                  <li><strong>Signature Stripping:</strong> Removes the signature entirely</li>
                  <li><strong>Expiration Bypass:</strong> Modifies token timing claims</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Security Testing Workflows card with two columns -->
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-6">
            <h3 class="text-xl font-bold mb-4">Security Testing Workflows</h3>
            
            <!-- Two-column layout for the workflows -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Finding JWT Vulnerabilities Column -->
              <div>
                <div class="flex items-center mb-3">
                  <span class="tab-icon text-xl mr-2">
                    <i class="pi pi-search"></i>
                  </span>
                  <h4 class="font-semibold text-lg text-blue-600 dark:text-blue-400">Finding JWT Vulnerabilities</h4>
                </div>
                <ol class="list-decimal pl-6 space-y-2 mt-2 text-sm">
                  <li>
                    <strong>Capture Authentication Flow:</strong> 
                    <p class="text-sm mt-1">Browse through the login and authenticated pages while Caido captures traffic. JWT tokens are typically found in Authorization headers, cookies, or localStorage.</p>
                  </li>
                  <li>
                    <strong>Review Token Structure:</strong> 
                    <p class="text-sm mt-1">Analyze token claims and headers in the Token Details tab. Look for sensitive information, weak algorithms, and missing security claims (exp, nbf, aud).</p>
                  </li>
                  <li>
                    <strong>Test for Algorithm Vulnerabilities:</strong> 
                    <p class="text-sm mt-1">Use the JWT Editor to switch algorithm types (RS256 to HS256) or test the 'none' algorithm attack. If the server accepts these modified tokens, it's vulnerable to signature bypass.</p>
                  </li>
                  <li>
                    <strong>Manipulate Token Claims:</strong> 
                    <p class="text-sm mt-1">Edit payload claims like user roles, permissions, or IDs to test for authorization bypasses. A secure implementation should validate these claims server-side.</p>
                  </li>
                  <li>
                    <strong>Check for Key Disclosure:</strong> 
                    <p class="text-sm mt-1">Search for leaked keys in the application's JavaScript files, error messages, or documentation. Use discovered keys to sign forged tokens.</p>
                  </li>
                </ol>
              </div>

              <!-- JWT Security Best Practices Column -->
              <div>
                <div class="flex items-center mb-3">
                  <span class="tab-icon text-xl mr-2">
                    <i class="pi pi-shield"></i>
                  </span>
                  <h4 class="font-semibold text-lg text-blue-600 dark:text-blue-400">JWT Security Best Practices</h4>
                </div>
                <ul class="list-disc pl-6 space-y-2 mt-2 text-sm">
                  <li>
                    <strong>Use Strong Algorithms:</strong> 
                    <p class="text-sm mt-1">RS256, RS384, RS512, ES256, ES384, or ES512 are recommended over HS256.</p>
                  </li>
                  <li>
                    <strong>Set Appropriate Expiration:</strong> 
                    <p class="text-sm mt-1">All tokens should have an expiration (exp) claim set to a reasonable value based on your security requirements.</p>
                  </li>
                  <li>
                    <strong>Validate All Claims:</strong> 
                    <p class="text-sm mt-1">Always validate issuer (iss), audience (aud), subject (sub), and timing claims (exp, nbf, iat) server-side.</p>
                  </li>
                  <li>
                    <strong>Implement Proper Key Management:</strong> 
                    <p class="text-sm mt-1">Use adequate key sizes, rotate keys regularly, and secure your signing keys properly.</p>
                  </li>
                  <li>
                    <strong>Don't Store Sensitive Data:</strong> 
                    <p class="text-sm mt-1">JWT payloads are base64-encoded, not encrypted. Never store sensitive information in tokens.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="text-center pt-4 text-gray-500 dark:text-gray-400 text-sm">
            <p>For questions, feature requests, or bug reports, please visit our GitHub repository.</p>
          </div>
        </div>
      </template>
    </Card>

    <!-- About Card -->
    <Card class="flex-grow bg-gray-50 dark:bg-surface-700">
      <template #title>
        <div class="flex items-center">
          <span class="tab-icon">
            <i class="pi pi-info-circle"></i>
          </span>
          <span>About</span>
        </div>
      </template>
      <template #content>
        <div class="about-section">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">JWT Analyzer</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Version 1.0.3</p>
            </div>
            <a
              href="https://github.com/amrelsagaei/JWT-Analyzer"
              target="_blank"
              rel="noopener noreferrer"
              class="github-btn inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <i class="pi pi-github mr-2"></i>
              Star on GitHub
            </a>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6 border-l-4 border-blue-500">
            <p class="leading-relaxed">
              JWT Analyzer is a powerful Caido plugin designed to help security professionals analyze and assess JWT tokens in real-time. 
              It provides comprehensive token analysis, risk assessment, and detailed token information directly within your Caido workflow.
            </p>
          </div>

          <div class="py-4 border-t border-gray-200 dark:border-gray-700">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Connect</h4>
            <div class="flex justify-between items-center">
              <div class="flex space-x-4">
                <a 
                  href="#"
                  @click.prevent="copyToClipboard('https://www.linkedin.com/in/amrelsagaei')" 
                  class="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  <i class="pi pi-linkedin mr-2"></i>
                  LinkedIn
                </a>
                <a 
                  href="#"
                  @click.prevent="copyToClipboard('info@amrelsagaei.com')"
                  class="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  <i class="pi pi-envelope mr-2"></i>
                  Email
                </a>
              </div>
              <div class="flex items-center text-sm">
                Made with ❤️ by <a href="#" @click.prevent="copyToClipboard('https://amrelsagaei.com')"><strong class="ml-1">Amr Elsagaei</strong></a>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card';

// Methods
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      if ((window as any).caidoSDK?.window?.showToast) {
        (window as any).caidoSDK.window.showToast('Link copied to clipboard', {
          variant: 'success',
          duration: 3000
        });
      }
    })
    .catch(err => {
      console.error('Failed to copy text:', err);
      
      // Fallback method
      try {
        const tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        if ((window as any).caidoSDK?.window?.showToast) {
          (window as any).caidoSDK.window.showToast('Link copied to clipboard', {
            variant: 'success',
            duration: 3000
          });
        }
      } catch (e) {
        console.error('Fallback copy method failed:', e);
        if ((window as any).caidoSDK?.window?.showToast) {
          (window as any).caidoSDK.window.showToast('Failed to copy to clipboard', {
            variant: 'error',
            duration: 3000
          });
        }
      }
    });
};
</script>

<style scoped>
.help-container {
  padding-bottom: 1rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
}

:deep(.p-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.p-card-content) {
  flex: 1;
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

.github-btn {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.github-btn:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style> 