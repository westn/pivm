# pivm PoC

This script runs `pi` inside a local QEMU VM while keeping usage close to host UX.

## What it does
- Starts/resumes a sandbox VM
- Mounts this folder into VM at `/workspace`
- Syncs host `~/.pi/agent` (excluding sessions/cache) into VM
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

## Notes
- First run can take several minutes (cloud image + package bootstrap).
- Default SSH port is `22222` (auto-increments if taken).
- If you want this tied to another repo/folder, copy `pivm` into that folder (or set `PIVM_HOST_WORKSPACE`).
