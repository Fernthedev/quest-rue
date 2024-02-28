# Quest Runtime Unity Editor (QRUE)

A _bLAzINg FaSt_ (hopefully) desktop app built using Tauri, Rust and TypeScript. Like the PC variant Unity Runtime Editor, this is intended to allow debugging and modifying Unity scene objects such as GameObjects. 

This is not Electron. 🦀
~~The rust backend handles the socket networking, packet parsing, protobuf and event invokes. The React frontend on the other hand is solely for _reacting_ to data from the Rust backend and _causing reactions_ to the Rust backend.~~
The entire app is built using TypeScript and Node. Tauri is just used as a package format. Rust could potentially be used to make specific speed improvements.

This is intended to connect to a Quest through sockets, websockets and protobuf3

Currently on the roadmap:
- [x] Connect to Quest (most of basic socket stuff done without testing)
- [ ] Finalize protobuf schema
- [x] Figure out events for parsing packets in rust and notifying frontend
- [x] Show components list
    - [x] Modifying fields
    - [x] Invoke methods
    - [ ] Invoke actions/events
    - [x] Invoking getters and setters
- [ ] Deleting objects
- [ ] Adding objects?
- [ ] Adding components?
- [x] Modifying transform values (position, rotation, etc.)

### Unlikely ideas
- [ ] 3D Space where objects are shown relative to each other (likely as cubes scaled to their Unity size)
    - Requires Tauri to have WebGL support of sorts. Likely will be done with wgpu and/or maybe a game engine such as Bevy, Godot or Unity?
- [x] Browser port with socket support
- [ ] One click install of mod from within the desktop app

## Contribute/Testing

### Common setup
Setup VCPKG on your system and set the `VCPKG_ROOT` environment on Windows or variable on Unix to the root of the vcpkg installation. Then, run `vcpkg install` in the qmod directory.

This will download protobuf which is required for both frontend and qmod to build.

Then finally run
```
pwsh ./make-proto.ps1
```

### Quest mod
To build the mod, run `pwsh ./build.ps1`

To copy the mod to your quest, run `pwsh ./copy.ps1`

### Node frontend
The project uses Typescript and Vite. ESLint is configured but is not actively used in the build process.

To start up the frontend, run `pnpm run dev` and open the URL in the browser (usually http://localhost:3000)


If you intend to test alongside the Rust backend, follow the rust instructions.

### Rust backend

Run `pnpm tauri dev`. This will start up both the web frontend and the rust backend.

### Building

#### Debug builds
As stated in the [Tauri docs](https://tauri.studio/docs/debugging/#create-a-debug-build), run `pnpm tauri build --debug` or `cargo tauri build --debug`

#### Release builds
`pnpm tauri build` or `cargo tauri build`