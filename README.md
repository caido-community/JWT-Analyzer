<div align="left">
  <img src="banner.jpg" alt="JWT Analyzer Banner" width="100%">

  <p>  <br>
    <strong>A powerful plugin for Caido that automatically detects, analyzes, and helps security professionals test JSON Web Tokens (JWTs)</strong>
  </p>
  <br>
</div>

---

<details closed>
<summary><b>Table of Contents</b></summary>
<br>

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Security Testing Workflows](#security-testing-workflows)
- [Documentation](#documentation)
- [Updates](#updates)
- [Feedback & Issues](#feedback--issues)
- [License](#license)
</details>

## Overview

JWT Analyzer is a comprehensive security tool designed for penetration testers and web application security professionals. It seamlessly integrates with Caido to provide real-time detection, analysis, and testing capabilities for JSON Web Tokens found in web traffic.

## Features

<details>
<summary><b>Automatic Token Detection & Analysis</b></summary>
<br>

- **Real-time JWT Detection:** Automatically identifies and captures JWT tokens in requests and responses
- **Token Security Analysis:** Evaluates token security including algorithm strength, signature validation, and claims verification
- **Vulnerability Detection:** Identifies common JWT security issues like missing claims, weak algorithms, and token tampering opportunities
</details>

<details>
<summary><b>Comprehensive Dashboard</b></summary>
<br>

- **JWT Summary Statistics:** Get at-a-glance view of all detected tokens and critical security issues
- **Algorithm Distribution:** Visual breakdown of JWT signing algorithms used across the application
- **Filterable Token List:** Sort and filter tokens by severity, algorithm, or source
</details>

<details>
<summary><b>Advanced JWT Decoder</b></summary>
<br>

- **Visual Token Breakdown:** See color-coded header, payload, and signature sections
- **Expiration Verification:** Visual indicators for token validity status
- **Interactive Claims Explorer:** Browse through standard and custom claims with detailed explanations
</details>

<details>
<summary><b>JWT View Mode (NEW!)</b></summary>
<br>

- **Inline Token Viewing:** View JWT tokens directly within Caido's HTTP History
- **Automatic Detection:** Instantly see when requests contain JWT tokens
- **Quick Analysis:** Decode header and payload inline with syntax highlighting
- **One-Click Analysis:** Send tokens to JWT Analyzer for full security analysis
</details>

<details>
<summary><b>Security Testing Tools</b></summary>
<br>

- **JWT Token Editor:** Manipulate token content and sign with different algorithms
- **Attack Simulation Tools:** Ready-to-use attacks including algorithm switching, 'none' algorithm, and key injection
- **Key Management:** Generate, import and use custom keys for token signing
- **Cryptographic Key Generation:** Full support for HS256/384/512, RS256/384/512, PS256/384/512, and ES256/384/512 algorithms
</details>

<details>
<summary><b>Detailed Token Analysis</b></summary>
<br>

- **Security Risk Assessment:** Detailed explanations of token risks and exploitability
- **Claims Validation:** Verify critical security claims like 'exp', 'nbf', 'iss', and 'aud'
- **Export Capabilities:** Save findings for security reports in different formats
</details>

<details>
<summary><b>Educational Resources</b></summary>
<br>

- **Built-in Documentation:** Comprehensive help section with JWT security best practices
- **Testing Workflows:** Step-by-step guides for common JWT security testing scenarios
- **References:** Links to common JWT vulnerabilities and CVEs
</details>

## Installation

1. Open Caido
2. Navigate to **Settings > Plugins** 
3. Click the **Plugin Store** tab
4. Search for "JWT Analyzer"
5. Click **Install**

## Usage

### Finding JWT Tokens

1. Start capturing traffic in Caido
2. Browse through the application while Caido records traffic
3. JWT Analyzer will automatically detect JWT tokens in requests and responses
4. Detected tokens will appear in the JWT Analyzer dashboard

### Analyzing Tokens

1. Click on any token in the dashboard to view details
2. Check the security assessment and identified risks
3. Review token claims and validate expiration status

### Testing for Vulnerabilities

1. Send a token to the JWT Editor using the "Send to Editor" button
2. Modify claims or header parameters
3. Try different attacks like algorithm switching or signature stripping
4. Use the modified token in your requests to test for vulnerabilities

## Security Testing Workflows

### Common Attack Scenarios

<div align="left">
  
| Attack | Description |
|--------|-------------|
| **Algorithm Confusion** | Switch RS256 to HS256 and use the public key as the HMAC secret |
| **None Algorithm Attack** | Change the algorithm to 'none' and remove the signature |
| **Key ID (kid) Manipulation** | Modify the 'kid' parameter to point to a different key |
| **Claim Tampering** | Modify role claims or user identifiers to test authorization controls |

</div>

## Documentation

Complete documentation is available within the plugin under the Help & Docs tab.

## Updates

JWT Analyzer is actively maintained. Updates may include new features, additional attack vectors, and improved token analysis.

## Feedback & Issues

If you encounter any issues or have suggestions for improvements, please report them on our [GitHub repository](https://github.com/amrelsagaei/JWT-Analyzer/issues).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ by <a href="https://amrelsagaei.com">Amr Elsagaei</a> for the Caido and security community</p>
</div>
