<template>
  <div class="max-w-3xl space-y-4 pb-24">
    <!-- Welcome -->
    <section id="welcome" class="rounded p-4">
      <h2 class="text-2xl font-semibold mb-4 text-surface-200">
        Welcome to JWT Analyzer
      </h2>
      <p class="text-surface-300 leading-relaxed mb-4">
        JWT Analyzer is a Caido plugin built for penetration testers and web
        application security professionals. It lets you detect, decode, inspect,
        edit, sign, and attack JSON Web Tokens directly inside your Caido
        workflow. This guide walks you through every feature so you can get the
        most out of the plugin.
      </p>
      <div class="border border-surface-700 rounded p-4">
        <p class="text-sm text-surface-400 mb-2 font-medium">
          The plugin is organized into five tabs:
        </p>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            <strong class="text-surface-200">Dashboard</strong> - Central view
            of all captured JWT tokens
          </li>
          <li>
            <strong class="text-surface-200">JWT Decoder</strong> - Quick decode
            and analysis for any token
          </li>
          <li>
            <strong class="text-surface-200">Token Details</strong> - Full
            security breakdown with export options
          </li>
          <li>
            <strong class="text-surface-200">JWT Editor</strong> - Edit, sign,
            validate, and run attacks on tokens
          </li>
          <li>
            <strong class="text-surface-200">Help & Docs</strong> - This page
          </li>
        </ul>
      </div>
    </section>

    <!-- Dashboard -->
    <section id="dashboard" class="rounded p-4">
      <h2 class="text-2xl font-semibold mb-4 text-surface-200">Dashboard</h2>
      <p class="text-surface-300 leading-relaxed mb-4">
        The Dashboard is the main landing page of the plugin. Every JWT token
        detected in your web traffic is listed here in a sortable, filterable
        table.
      </p>

      <div class="border border-surface-700 rounded p-4 mb-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          What you see in the table
        </h3>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            <strong class="text-surface-200">Token</strong> - A truncated
            preview of the raw JWT. Click the copy icon next to it to copy the
            full token to your clipboard.
          </li>
          <li>
            <strong class="text-surface-200">Severity</strong> - A color-coded
            badge (Critical, High, Medium, Low, Info) based on the security
            analysis of the token. You can sort the table by this column.
          </li>
          <li>
            <strong class="text-surface-200">Algorithm</strong> - The signing
            algorithm from the token header (e.g. HS256, RS256). Also sortable.
          </li>
          <li>
            <strong class="text-surface-200">Source</strong> - Where the token
            was found: <em>request</em>, <em>response</em>, or
            <em>manual</em> (pasted by you).
          </li>
          <li>
            <strong class="text-surface-200">Expiration</strong> - Shows how
            much time is left before the token expires. Expired tokens are
            highlighted in red.
          </li>
        </ul>
      </div>

      <div class="border border-surface-700 rounded p-4 mb-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          Filtering and searching
        </h3>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            Use the <strong class="text-surface-200">search bar</strong> at the
            top to search across token values, payloads, and headers.
          </li>
          <li>
            Use the
            <strong class="text-surface-200">severity toggle buttons</strong>
            (Critical, High, Medium, Low, Info) to filter the table by one or
            more severity levels.
          </li>
          <li>
            Click
            <strong class="text-surface-200">Refresh</strong> to reload findings
            from storage.
          </li>
          <li>
            Click
            <strong class="text-surface-200">Clear All</strong> to remove every
            finding at once.
          </li>
        </ul>
      </div>

      <div class="border border-surface-700 rounded p-4 mb-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          Expanding a row
        </h3>
        <p class="text-sm text-surface-300 mb-2">
          Click on any row to expand it. The expanded view shows a quick summary
          of the token: algorithm, issuer, subject, expiration status, and
          audience. From there you can:
        </p>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            <strong class="text-surface-200">Decode</strong> - Sends the token
            to the JWT Decoder tab for a quick decode.
          </li>
          <li>
            <strong class="text-surface-200">Details</strong> - Opens the token
            in the Token Details tab for a full security assessment.
          </li>
          <li>
            <strong class="text-surface-200">Editor</strong> - Sends the token
            to the JWT Editor tab for editing and attack testing.
          </li>
        </ul>
      </div>

      <div class="border border-surface-700 rounded p-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          Row actions
        </h3>
        <p class="text-sm text-surface-300">
          Each row also has action icons on the right side: Decode, Token
          Details, Send to Editor, and Delete. These do the same thing as the
          buttons in the expanded view, plus a delete option to remove
          individual findings.
        </p>
      </div>
    </section>

    <!-- JWT Decoder -->
    <section id="decoder" class="rounded p-4">
      <h2 class="text-2xl font-semibold mb-4 text-surface-200">JWT Decoder</h2>
      <p class="text-surface-300 leading-relaxed mb-4">
        The JWT Decoder gives you a quick way to decode and analyze any JWT
        token. Paste a token into the input field, hit Decode (or press Enter),
        and see the results instantly.
      </p>

      <div class="border border-surface-700 rounded p-4 mb-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          How to use it
        </h3>
        <ol class="list-decimal pl-5 space-y-1 text-sm text-surface-300">
          <li>Paste a JWT token into the input field at the top.</li>
          <li>
            Click <strong class="text-surface-200">Decode</strong> or press
            Enter.
          </li>
          <li>
            The decoded token opens in a new tab below. You can decode multiple
            tokens and each one gets its own tab (up to 10 tabs at a time).
          </li>
        </ol>
      </div>

      <div class="border border-surface-700 rounded p-4 mb-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          What you see after decoding
        </h3>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            <strong class="text-surface-200">Header</strong> - The decoded
            header JSON displayed in a read-only editor. You can copy it with
            the copy button.
          </li>
          <li>
            <strong class="text-surface-200">Payload</strong> - The decoded
            payload JSON, also with a copy button.
          </li>
          <li>
            <strong class="text-surface-200">Security Analysis</strong> - An
            inline list of detected risks (color-coded by severity) and
            suggestions for improving the token's security posture.
          </li>
        </ul>
      </div>

      <div class="border border-surface-700 rounded p-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          Actions
        </h3>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            <strong class="text-surface-200">View Details</strong> - Sends the
            decoded token to the Token Details tab for a full security
            breakdown.
          </li>
          <li>
            <strong class="text-surface-200">Send to Editor</strong> - Opens the
            token in the JWT Editor for editing, signing, or running attacks.
          </li>
        </ul>
      </div>
    </section>

    <!-- JWT View Mode -->
    <section id="view-mode" class="rounded p-4">
      <h2 class="text-2xl font-semibold mb-4 text-surface-200">
        JWT View Mode
      </h2>
      <p class="text-surface-300 leading-relaxed mb-4">
        JWT View Mode adds a "JWT" tab to Caido's HTTP History, Replay, Search,
        Sitemap, and Intercept surfaces. When a request or response contains a
        JWT token, you will see this tab appear automatically.
      </p>
      <div class="border border-surface-700 rounded p-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          What you see in the JWT tab
        </h3>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            <strong class="text-surface-200">Token selector</strong> - If the
            request or response contains multiple JWTs, you can switch between
            them.
          </li>
          <li>
            <strong class="text-surface-200">Raw token</strong> - The full JWT
            string displayed in a selectable block.
          </li>
          <li>
            <strong class="text-surface-200">Header & Payload</strong> - The
            decoded JSON with syntax highlighting (keys in blue, strings in
            green, numbers in amber, booleans in violet).
          </li>
          <li>
            <strong class="text-surface-200">Actions</strong> - Copy the token,
            send it to the Decoder, or send it to the Editor with one click.
          </li>
        </ul>
      </div>
      <p class="text-surface-300 leading-relaxed mt-4 text-sm">
        You can also right-click a request or response in Caido and select "Send
        to JWT Analyzer" from the context menu. This will extract the first JWT
        found and send it directly to the Dashboard.
      </p>
    </section>

    <!-- Token Details -->
    <section id="token-details" class="rounded p-4">
      <h2 class="text-2xl font-semibold mb-4 text-surface-200">
        Token Details
      </h2>
      <p class="text-surface-300 leading-relaxed mb-4">
        Token Details provides the most thorough view of a JWT token. You get
        here by clicking "View Details" from the Dashboard, Decoder, or any
        other place that offers that action. Up to 10 tokens can be open in tabs
        at the same time.
      </p>

      <div class="border border-surface-700 rounded p-4 mb-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          Header & Payload
        </h3>
        <p class="text-sm text-surface-300">
          Displays the full decoded header and payload as formatted JSON. Each
          standard claim (like <code>iss</code>, <code>sub</code>,
          <code>aud</code>, <code>exp</code>, <code>nbf</code>,
          <code>iat</code>) is shown individually along with custom claims.
        </p>
      </div>

      <div class="border border-surface-700 rounded p-4 mb-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          Security Analysis
        </h3>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            <strong class="text-surface-200">Overall Assessment</strong> - A
            summary of the token's security posture with a color-coded
            background (red for critical, orange for high, yellow for medium,
            blue for low, neutral for clean).
          </li>
          <li>
            <strong class="text-surface-200">Severity Badge</strong> - The
            overall severity level of the token.
          </li>
          <li>
            <strong class="text-surface-200">Token Validity</strong> -
            Expiration status and remaining time.
          </li>
          <li>
            <strong class="text-surface-200">Risk Summary</strong> - Counts of
            critical, high, medium, and low risks detected.
          </li>
          <li>
            <strong class="text-surface-200">Security Considerations</strong> -
            Observations based on the algorithm, header fields, and payload
            contents.
          </li>
          <li>
            <strong class="text-surface-200">Risk List</strong> - Each
            individual risk displayed with its severity badge, description, and
            impact.
          </li>
          <li>
            <strong class="text-surface-200">Suggestions</strong> -
            Recommendations for improving the token's security.
          </li>
        </ul>
      </div>

      <div class="border border-surface-700 rounded p-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          Actions
        </h3>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            <strong class="text-surface-200">Copy token</strong> - Copies the
            raw JWT string to your clipboard.
          </li>
          <li>
            <strong class="text-surface-200">Send to JWT Editor</strong> - Opens
            the token in the JWT Editor.
          </li>
          <li>
            <strong class="text-surface-200">Export as Markdown</strong> -
            Downloads a .md file with the header, payload, risks, and
            suggestions formatted for reports.
          </li>
          <li>
            <strong class="text-surface-200">Export as JSON</strong> - Downloads
            a .json file with the full token data for further processing.
          </li>
        </ul>
      </div>
    </section>

    <!-- JWT Editor -->
    <section id="jwt-editor" class="rounded p-4">
      <h2 class="text-2xl font-semibold mb-4 text-surface-200">JWT Editor</h2>
      <p class="text-surface-300 leading-relaxed mb-4">
        The JWT Editor is the main testing workbench. It has a three-panel
        layout: the editor on the left, and the Key Manager and Quick Attacks
        panels on the right. The panels are resizable by dragging the dividers.
      </p>

      <div class="border border-surface-700 rounded p-4 mb-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          Editor panel
        </h3>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            <strong class="text-surface-200">Raw JWT Token</strong> - Paste or
            type a JWT in the text area. You can also receive tokens from the
            Dashboard, Decoder, or Token Details via "Send to Editor."
          </li>
          <li>
            <strong class="text-surface-200">Decode</strong> - Parses the raw
            token and populates the Header and Payload JSON editors below.
          </li>
          <li>
            <strong class="text-surface-200">Header & Payload editors</strong> -
            Editable JSON views where you can modify claims, change the
            algorithm, add fields, or remove them. Validation errors are shown
            inline if the JSON is malformed.
          </li>
          <li>
            <strong class="text-surface-200">Update Token from JSON</strong> -
            After editing the header or payload JSON, click this to re-encode
            the token parts (the signature will become stale until you re-sign).
          </li>
          <li>
            <strong class="text-surface-200">Signature stale</strong> warning -
            Appears when you edit the header or payload, reminding you that the
            current signature no longer matches.
          </li>
        </ul>
      </div>

      <div class="border border-surface-700 rounded p-4 mb-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          Toolbar actions
        </h3>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            <strong class="text-surface-200">Sign</strong> - Opens a dialog
            where you pick a key from the Key Manager and a signing algorithm,
            then signs the token with the selected key.
          </li>
          <li>
            <strong class="text-surface-200">Validate</strong> - Verifies the
            token's signature using a key from the Key Manager. Pick a key from
            the dropdown and click Validate to see if the signature matches.
          </li>
          <li>
            <strong class="text-surface-200">Attack</strong> - Opens the attack
            dialog with all available attack types (see Quick Attacks below).
          </li>
        </ul>
      </div>

      <div class="border border-surface-700 rounded p-4 mb-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          Key Manager
        </h3>
        <p class="text-sm text-surface-300 mb-2">
          The Key Manager sits in the top-right panel. It stores keys used for
          signing and validating tokens.
        </p>
        <ul class="list-disc pl-5 space-y-1 text-sm text-surface-300">
          <li>
            <strong class="text-surface-200">Add Key</strong> - Create a new key
            by giving it an ID, selecting the algorithm (HS256/384/512,
            RS256/384/512, PS256/384/512, ES256/384/512), and providing the key
            material. Symmetric keys (HMAC) require a shared secret. Asymmetric
            keys (RSA/EC) require a private key and optionally a public key.
          </li>
          <li>
            <strong class="text-surface-200">Edit</strong> - Update an existing
            key's algorithm or key material.
          </li>
          <li>
            <strong class="text-surface-200">Delete</strong> - Remove a key from
            the manager.
          </li>
        </ul>
      </div>

      <div class="border border-surface-700 rounded p-4">
        <h3
          class="text-sm font-semibold text-surface-200 mb-2 uppercase tracking-wide"
        >
          Quick Attacks
        </h3>
        <p class="text-sm text-surface-300 mb-2">
          The Quick Attacks panel is in the bottom-right. Each attack is a
          one-click shortcut that opens the attack dialog pre-configured. The
          attacks require a decoded token to be active.
        </p>
        <div class="overflow-x-auto">
          <table class="text-sm text-surface-300 w-full border-collapse mt-2">
            <thead>
              <tr class="border-b border-surface-700">
                <th
                  class="text-left py-2 pr-4 text-surface-400 font-medium text-xs uppercase tracking-wide"
                >
                  Attack
                </th>
                <th
                  class="text-left py-2 text-surface-400 font-medium text-xs uppercase tracking-wide"
                >
                  What it does
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-surface-700/50">
                <td class="py-2 pr-4 text-surface-200 font-medium">
                  'none' Algorithm
                </td>
                <td class="py-2">
                  Sets the algorithm to "none" and removes the signature
                  entirely.
                </td>
              </tr>
              <tr class="border-b border-surface-700/50">
                <td class="py-2 pr-4 text-surface-200 font-medium">
                  HMAC Key Confusion
                </td>
                <td class="py-2">
                  Switches an RS/ES algorithm to HS256 and signs with the public
                  key as the HMAC secret.
                </td>
              </tr>
              <tr class="border-b border-surface-700/50">
                <td class="py-2 pr-4 text-surface-200 font-medium">
                  Empty Key Signature
                </td>
                <td class="py-2">
                  Signs the token using an empty string as the key.
                </td>
              </tr>
              <tr class="border-b border-surface-700/50">
                <td class="py-2 pr-4 text-surface-200 font-medium">
                  Psychic Signature
                </td>
                <td class="py-2">
                  Exploits CVE-2022-21449 by injecting a blank ECDSA signature.
                  Only works on ES-algorithm tokens.
                </td>
              </tr>
              <tr class="border-b border-surface-700/50">
                <td class="py-2 pr-4 text-surface-200 font-medium">
                  Embedded JWK
                </td>
                <td class="py-2">
                  Generates a new RSA key pair, embeds the public key as a JWK
                  in the token header, and signs with the corresponding private
                  key.
                </td>
              </tr>
              <tr class="border-b border-surface-700/50">
                <td class="py-2 pr-4 text-surface-200 font-medium">
                  Weak HMAC Secret
                </td>
                <td class="py-2">
                  Signs the token with a common weak secret (e.g. "password",
                  "secret", "changeme"). You can also add your own custom
                  secrets to the list.
                </td>
              </tr>
              <tr>
                <td class="py-2 pr-4 text-surface-200 font-medium">
                  Algorithm Substitution
                </td>
                <td class="py-2">
                  Changes the algorithm header field to a different one of your
                  choice without re-signing.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Security Testing Workflows -->
    <section id="workflows" class="rounded p-4">
      <h2 class="text-2xl font-semibold mb-4 text-surface-200">
        Security Testing Workflows
      </h2>
      <p class="text-surface-300 leading-relaxed mb-4">
        Here is a general workflow for testing JWT security in a web
        application:
      </p>
      <ol class="list-decimal pl-5 space-y-2 text-sm text-surface-300">
        <li>
          <strong class="text-surface-200">Capture traffic</strong> - Browse the
          target application while Caido records HTTP traffic. JWT tokens are
          detected automatically and appear in the Dashboard.
        </li>
        <li>
          <strong class="text-surface-200">Review token structure</strong> -
          Open a token in the Decoder or Token Details to understand the header,
          payload claims, and signing algorithm.
        </li>
        <li>
          <strong class="text-surface-200">Assess security risks</strong> -
          Check the security analysis for weak algorithms, missing claims, and
          known vulnerabilities.
        </li>
        <li>
          <strong class="text-surface-200">Test in the Editor</strong> - Send
          the token to the JWT Editor. Try modifying claims (e.g. changing a
          role from "user" to "admin"), then re-sign or run attacks to see if
          the server accepts the modified token.
        </li>
        <li>
          <strong class="text-surface-200">Run attacks</strong> - Use the Quick
          Attacks panel to try 'none' algorithm, HMAC confusion, or other attack
          vectors against the server's validation logic.
        </li>
        <li>
          <strong class="text-surface-200">Export findings</strong> - Use the
          Export options in Token Details to save your findings as Markdown or
          JSON for your report.
        </li>
      </ol>
    </section>

    <!-- About -->
    <section id="about" class="border border-surface-700 rounded p-4">
      <h2 class="text-2xl font-semibold mb-4 text-surface-200">About</h2>
      <div class="flex items-center justify-between mb-6">
        <p class="text-sm text-surface-400">JWT Analyzer · Version 2.0.0</p>
        <a
          href="https://github.com/amrelsagaei/JWT-Analyzer"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 rounded px-4 py-2 bg-primary-800 hover:bg-primary-700"
        >
          <i class="fab fa-github"></i>
          Star on GitHub
        </a>
      </div>
      <p class="text-surface-300 leading-relaxed mb-6">
        JWT Analyzer helps security professionals analyze and assess JWT tokens
        in real time within your Caido workflow.
      </p>
      <div
        class="border-t border-surface-700 pt-4 text-sm text-surface-400 flex items-center justify-between"
      >
        <div class="flex gap-4">
          <a
            href="https://amrelsagaei.com"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-surface-200"
          >
            <i class="fas fa-link mr-2"></i>
            amrelsagaei.com
          </a>
          <a href="mailto:info@amrelsagaei.com" class="hover:text-surface-200">
            <i class="fas fa-envelope mr-2"></i>
            Email
          </a>
        </div>
        <span
          >Made with <i class="fas fa-heart text-red-400"></i> by Amr
          Elsagaei</span
        >
      </div>
    </section>
  </div>
</template>
