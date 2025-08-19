# Quest Runtime Unity Editor (QRUE)

## Overview

A _bLAzINg FaSt_ (hopefully) desktop app built using Tauri and SolidJS. Like the PC Runtime Unity Editor, this is intended to allow for debugging and modifying Unity objects at runtime, but for games built with il2cpp. It also supports arbitrary C# objects, not only those from Unity.

This is not Electron. 🦀
The app is built using TypeScript and Node. Tauri is mostly used as a package format, but is also needed to run some ADB commands.

Currently on the roadmap:

- [x] Connect to Quest
- [ ] Reconnection and state
- [x] Wired-only connection
- [x] Unity components list
- [x] Adding components
- [x] Modifying fields
- [ ] Modifying properties
- [x] Invoking methods
- [ ] Byref support
- [ ] Type completion
- [ ] Enumerations
- [ ] Object finding
- [ ] Structure editor
- [ ] Creating objects
- [x] Destroying objects
- [ ] Finalize protobuf schema

### Unlikely ideas

- [ ] Streamed unity camera in the app
- [ ] Browser-only port
- [ ] One-click install of mod
- [ ] Some sort of scripting support

## Build instructions

### Quest mod

Install QPM and the normal quest mod build tools. In the `qmod` directory, run `qpm restore` and `qpm s qmod`. To copy changes to your quest without a qmod, run `qpm s copy`.

> [!TIP]
> For code editing, opening the `qmod` directory instead of the root project in your editor is recommended.

### Client app

Install [pnpm](https://pnpm.io/installation) and [rust](https://www.rust-lang.org/tools/install).

In the `app` directory, run `pnpm install` and `pnpm tauri dev`. This will start up both the web frontend and the rust backend, and launch the app when both are ready.

If modifying the protobuf schemas, follow the steps to build the quest mod after running `pnpm install`, and the Typescript protobuf files will also be updated.

#### Node frontend

To start up the frontend by itself, run `pnpm run dev` and open the URL in the browser (usually <http://localhost:1420>)

Some features may not work without the backend.

#### Debug builds

As stated in the [Tauri docs](https://tauri.studio/docs/debugging/#create-a-debug-build), run `pnpm tauri build --debug`.

#### Release builds

`pnpm tauri build`.
