import { afterEach, describe, expect, it, vi } from "vitest";
import { writeIssueExportToClipboard } from "./clipboard";

const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);

class ClipboardItemMock {
  static supports = vi.fn(() => true);
  readonly data: Record<string, Blob>;

  constructor(data: Record<string, Blob>) {
    this.data = data;
  }
}

const setClipboard = (clipboard: {
  write?: ReturnType<typeof vi.fn>;
  writeText: ReturnType<typeof vi.fn>;
}) => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: clipboard,
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalClipboard) {
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
});

describe("writeIssueExportToClipboard", () => {
  const content = {
    html: "<table><tr><td>29051</td></tr></table>",
    plainText: "Store\n29051",
  };

  it("writes HTML and plain text in one clipboard item", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ write, writeText });
    vi.stubGlobal("ClipboardItem", ClipboardItemMock);

    await writeIssueExportToClipboard(content);

    expect(write).toHaveBeenCalledTimes(1);
    expect(writeText).not.toHaveBeenCalled();
    const item = write.mock.calls[0][0][0] as ClipboardItemMock;
    expect(Object.keys(item.data)).toEqual(["text/html", "text/plain"]);
    expect(item.data["text/html"].type).toBe("text/html");
    expect(item.data["text/plain"].type).toBe("text/plain");
  });

  it("falls back to plain text when rich clipboard writing fails", async () => {
    const write = vi.fn().mockRejectedValue(new DOMException("Denied"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ write, writeText });
    vi.stubGlobal("ClipboardItem", ClipboardItemMock);

    await writeIssueExportToClipboard(content);

    expect(write).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(content.plainText);
  });

  it("uses plain text when HTML clipboard content is unsupported", async () => {
    class UnsupportedClipboardItem extends ClipboardItemMock {
      static supports = vi.fn(() => false);
    }
    const write = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ write, writeText });
    vi.stubGlobal("ClipboardItem", UnsupportedClipboardItem);

    await writeIssueExportToClipboard(content);

    expect(write).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith(content.plainText);
  });

  it("uses plain text when ClipboardItem is unavailable", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ write, writeText });
    vi.stubGlobal("ClipboardItem", undefined);

    await writeIssueExportToClipboard(content);

    expect(write).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith(content.plainText);
  });

  it("rejects when rich and plain-text writes both fail", async () => {
    const write = vi.fn().mockRejectedValue(new DOMException("Denied"));
    const writeText = vi.fn().mockRejectedValue(new DOMException("Denied"));
    setClipboard({ write, writeText });
    vi.stubGlobal("ClipboardItem", ClipboardItemMock);

    await expect(writeIssueExportToClipboard(content)).rejects.toThrow();
  });
});
