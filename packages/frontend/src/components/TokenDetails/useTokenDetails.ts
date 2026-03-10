import type { TokenDetailsData } from "@/composables/useTokenDetailsState";
import { useSDK } from "@/plugins/sdk";

export function useTokenDetails() {
  const sdk = useSDK();

  function copyToken(token: string): void {
    if (token.length === 0) return;
    try {
      navigator.clipboard.writeText(token);
      sdk.window.showToast("Token copied", { variant: "success" });
    } catch {
      const ta = document.createElement("textarea");
      ta.value = token;
      ta.style.cssText = "position:fixed;left:-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        sdk.window.showToast("Token copied", { variant: "success" });
      } catch {
        sdk.window.showToast("Copy failed", { variant: "error" });
      }
      document.body.removeChild(ta);
    }
  }

  function sendToEditor(token: string): void {
    if (token.length === 0) return;
    window.dispatchEvent(
      new CustomEvent("add-token-to-editor", { detail: { token } }),
    );
    sdk.window.showToast("Opening JWT Editor", { variant: "success" });
  }

  function exportAsMarkdown(data: TokenDetailsData): string {
    const lines: string[] = ["# JWT Token Details", ""];
    lines.push("## Header");
    lines.push("```json");
    lines.push(JSON.stringify(data.header, null, 2));
    lines.push("```");
    lines.push("");
    lines.push("## Payload");
    lines.push("```json");
    lines.push(JSON.stringify(data.payload, null, 2));
    lines.push("```");
    lines.push("");
    lines.push("## Security Risks");
    if (data.risks.length === 0) {
      lines.push("No risks detected.");
    } else {
      for (const r of data.risks) {
        lines.push(`- **${r.severity}**: ${r.description}`);
      }
    }
    lines.push("");
    lines.push("## Suggestions");
    for (const s of data.suggestions) {
      lines.push(`- ${s}`);
    }
    return lines.join("\n");
  }

  function exportAsJson(data: TokenDetailsData): string {
    return JSON.stringify(
      {
        token: data.token,
        header: data.header,
        payload: data.payload,
        risks: data.risks,
        suggestions: data.suggestions,
      },
      null,
      2,
    );
  }

  function downloadBlob(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    /* eslint-disable compat/compat  */
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    /* eslint-enable compat/compat */
    sdk.window.showToast("Export downloaded", { variant: "success" });
  }

  return {
    copyToken,
    sendToEditor,
    exportAsMarkdown,
    exportAsJson,
    downloadBlob,
  };
}
