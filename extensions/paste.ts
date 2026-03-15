import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

type ClipboardProbe = {
  command: string;
  args: string[];
};

const CLIPBOARD_PROBES: ClipboardProbe[] = [
  { command: "wl-paste", args: ["-n"] },
  { command: "xclip", args: ["-selection", "clipboard", "-o"] },
  { command: "xsel", args: ["--clipboard", "--output"] },
  { command: "pbpaste", args: [] },
  { command: "termux-clipboard-get", args: [] },
  {
    command: "powershell.exe",
    args: ["-NoProfile", "-Command", "Get-Clipboard"],
  },
];

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function readFromSnapshotFile(): string {
  const file = process.env.PIVM_CLIPBOARD_FILE;
  if (!file || !existsSync(file)) return "";

  try {
    return normalize(readFileSync(file, "utf-8"));
  } catch {
    return "";
  }
}

function readFromCommands(): string {
  for (const probe of CLIPBOARD_PROBES) {
    const result = spawnSync(probe.command, probe.args, {
      encoding: "utf-8",
      timeout: 2000,
      stdio: ["ignore", "pipe", "ignore"],
    });

    if (result.status === 0 && result.stdout) {
      const text = normalize(result.stdout);
      if (text.trim().length > 0) return text;
    }
  }

  return "";
}

function resolveClipboardText(): string {
  const fromCommands = readFromCommands();
  if (fromCommands.trim().length > 0) return fromCommands;

  return readFromSnapshotFile();
}

export default function pasteExtension(pi: ExtensionAPI): void {
  pi.registerCommand("paste", {
    description:
      "Paste clipboard text into the editor. Uses local clipboard tools and falls back to PIVM_CLIPBOARD_FILE.",
    handler: async (args, ctx) => {
      const inline = (args ?? "").trim();
      const text = inline.length > 0 ? inline : resolveClipboardText();

      if (!text || text.trim().length === 0) {
        ctx.ui.notify(
          "Clipboard is empty or unavailable. You can also pass text directly: /paste <text>",
          "warning",
        );
        return;
      }

      ctx.ui.pasteToEditor(text);
      ctx.ui.notify(`Pasted ${text.length} characters into editor`, "info");
    },
  });
}
