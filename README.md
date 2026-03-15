# pivm PoC

`pivm` runs `pi` inside a local QEMU VM while keeping usage close to host UX.

## What it does

- Starts/resumes a sandbox VM
- Mounts this folder into VM at `/workspace`
- Syncs host `~/.pi/agent` (excluding sessions/cache) into VM
- Syncs local pi extensions from `./extensions` into VM (`~/.pi/agent/extensions`)
- Ships a built-in `/paste` extension (`extensions/paste.ts`)
- Syncs your local gstack pi-port into VM (`~/.pi/agent/skills/gstack`) and creates top-level skill symlinks
- Optionally snapshots host clipboard into VM for `/paste` fallback
- Exposes host GitHub auth to VM via `GH_TOKEN="$(gh auth token)"`
- Ensures latest `pi` version in VM (`npm i -g @mariozechner/pi-coding-agent@latest`)
- Runs `pi` in the VM with interactive TTY

## Usage

From this folder:

```bash
./pivm
```

Pass args to pi:

```bash
./pivm --model sonnet
./pivm -p "summarize this repo"
```

VM management:

```bash
./pivm init
./pivm start
./pivm ssh
./pivm status
./pivm stop
```

## gstack port integration

By default, pivm tries to sync this host path into VM skills:

```text
~/gstack-pi-port/port/gstack
```

Override if needed:

```bash
export PIVM_GSTACK_PORT_DIR=/path/to/gstack-pi-port/port/gstack
```

Disable gstack sync:

```bash
export PIVM_SYNC_GSTACK=0
```

Run gstack `./setup` in VM after sync (build browse runtime):

```bash
export PIVM_GSTACK_BUILD=1
```

## `/paste` extension

`pivm` includes `extensions/paste.ts`, exposed as `/paste`.

Behavior:

1. Reads local guest clipboard via `wl-paste`, `xclip`, `xsel`, `pbpaste`, etc.
2. Falls back to `PIVM_CLIPBOARD_FILE` (clipboard snapshot synced from host by pivm).
3. Pastes text into pi editor via `ctx.ui.pasteToEditor(...)`.

Usage:

```text
/paste
/paste some inline text to insert
```

## Extension source sync

Set extra extension files/dirs (colon-separated):

```bash
export PIVM_PI_EXTENSION_SOURCES="$PWD/extensions:/path/to/more/extensions"
```

## Recommended extensions

If you want more than `/paste`, I recommend starting with:

- `permission-gate.ts` (confirm dangerous commands)
- `protected-paths.ts` (guard `.env`, `.git`, `node_modules`)
- `plan-mode/` (read-only planning mode)
- `notify.ts` (desktop notification when agent finishes)
- `tools.ts` (interactive tool toggling)

You can copy these from pi examples:

```text
/usr/local/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions
```

## Notes

- First run can take several minutes (cloud image + package bootstrap).
- Default SSH port is `22222` (auto-increments if taken).
- If you want this tied to another repo/folder, copy `pivm` into that folder (or set `PIVM_HOST_WORKSPACE`).
