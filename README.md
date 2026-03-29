# pivm

`pivm` runs `pi` inside local QEMU VMs while keeping usage close to host UX.

## What it does

- Supports multiple named VM sessions
- Prompts to **resume** an existing session or **start a new one**
- Stores per-session VM state in `.pivm/sessions/<session-name>`
- Shares one downloaded Ubuntu base image across sessions (`.pivm/ubuntu-noble-base.img`)
- Mounts this folder into VM at `/workspace`
- Syncs host `~/.pi/agent` (excluding sessions/cache) into VM
- Syncs local pi extensions from `./extensions` into VM (`~/.pi/agent/extensions`)
- Ships a built-in `/paste` extension (`extensions/paste.ts`)
- Syncs gstack pi-port into VM (`~/.pi/agent/skills/gstack`) from a repo cache (auto clone/pull) and creates top-level skill symlinks
- Optionally snapshots host clipboard into VM for `/paste` fallback
- Exposes host GitHub auth to VM via `GH_TOKEN="$(gh auth token)"`
- Ensures latest `pi` version in VM (`npm i -g @mariozechner/pi-coding-agent@latest`)
- Configures npm global installs to a user-writable prefix (`~/.npm-global`) to avoid EACCES
- Runs `pi` in the VM with interactive TTY

## Host compatibility

- **Linux:** supported (uses KVM when available)
- **macOS:** supported (uses HVF when available, otherwise TCG)
- Guest image remains Ubuntu (`noble-server-cloudimg-amd64`) on both

Required host tools:

- `pi`
- `gh`
- `qemu-system-x86_64`
- `qemu-img`
- `ssh`
- `ssh-keygen`
- `curl`
- `rsync`
- `genisoimage` **or** `mkisofs`

macOS example (Homebrew):

```bash
brew install qemu cdrtools rsync gh
```

> On Apple Silicon, x86_64 Ubuntu may run in software emulation depending on your QEMU/HVF setup, so it can be slower than Linux+KVM.

## Usage

From this folder:

```bash
./pivm
```

If sessions already exist, `pivm` asks whether to resume or start a new one.

Create/resume explicitly:

```bash
./pivm new
./pivm new my-feature

./pivm resume
./pivm resume my-feature

./pivm sessions
```

Pass args to `pi`:

```bash
./pivm --model sonnet
./pivm -p "summarize this repo"
./pivm --resume my-feature --model sonnet
```

Session selection flags on default run mode:

```bash
./pivm --new --model sonnet
./pivm --resume                # resume last/running session
./pivm --resume my-feature
./pivm --session my-feature    # use this session (create if missing)
```

VM/session management:

```bash
./pivm init my-feature
./pivm start my-feature
./pivm ssh my-feature
./pivm status
./pivm status my-feature
./pivm stop my-feature
./pivm stop --all
```

## Session model

- A session is one VM state directory under `.pivm/sessions/<name>`.
- Multiple sessions can run at the same time.
- SSH ports are auto-assigned per session (starting from `22222`, incrementing if occupied).
- The last used session is remembered in `.pivm/last-session`.

## gstack port integration

By default, pivm clones/pulls this repo on the host and syncs `port/gstack` into VM skills:

```text
https://github.com/westn/gstack-pi-port.git
```

The clone is cached at:

```text
.pivm/sources/gstack-pi-port
```

Override repo source/branch/cache path:

```bash
export PIVM_GSTACK_REPO_URL=https://github.com/westn/gstack-pi-port.git
export PIVM_GSTACK_REPO_BRANCH=main
export PIVM_GSTACK_REPO_DIR="$PWD/.pivm/sources/gstack-pi-port"
export PIVM_GSTACK_PORT_SUBDIR=port/gstack
```

If you already have a prebuilt local port directory, use it directly:

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

## Recommended extensions (autonomy-first)

If your goal is minimal human intervention, start with automation-heavy extensions instead of confirmation guards:

- `trigger-compact.ts` (auto-compacts when context gets large)
- `subagent/` (delegates scoped work to subagents)
- `git-checkpoint.ts` (automatic branch-safe checkpoints)
- `auto-commit-on-exit.ts` (auto-commit on session end)
- `notify.ts` (only for completion signal; no interactive step)

Optional third-party packages:

- `npm:shitty-extensions` (includes `loop.ts` for autonomous looping)
- `npm:@netandreus/pi-auto` (usage-aware model selection / load balancing)

You can copy built-in examples from:

```text
/usr/local/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions
```

## Notes

- First run can take several minutes (cloud image + package bootstrap).
- One script handles both Linux and macOS host behavior (no separate launcher needed right now).
- If you want this tied to another repo/folder, copy `pivm` into that folder (or set `PIVM_HOST_WORKSPACE`).
- For full options, run `./pivm help`.
