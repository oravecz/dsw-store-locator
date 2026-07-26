import type { IssueExport } from "./issue-tools";

const supportsHtmlClipboard = () =>
  typeof ClipboardItem !== "undefined" &&
  typeof navigator.clipboard?.write === "function" &&
  (typeof ClipboardItem.supports !== "function" ||
    ClipboardItem.supports("text/html"));

// @lat: [[dsw-store-locator#Clipboard Export#Browser Fallback]]
export async function writeIssueExportToClipboard(content: IssueExport) {
  if (supportsHtmlClipboard()) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([content.html], { type: "text/html" }),
          "text/plain": new Blob([content.plainText], {
            type: "text/plain",
          }),
        }),
      ]);
      return;
    } catch {
      // Retry below with the broadly supported plain-text representation.
    }
  }

  await navigator.clipboard.writeText(content.plainText);
}
