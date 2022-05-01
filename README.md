# Quest Runtime Unity Editor (QRUE)

A _bLAzINg FaSt_ (hopefully) desktop app built using Tauri, Rust and TypeScript. Like the PC variant Unity Runtime Editor, this is intended to allow debugging and modifying Unity scene objects such as GameObjects. 

This is not Electron. 🦀
The rust backend handles the socket networking, packet parsing, protobuf and event invokes. The React frontend on the other hand is solely for _reacting_ to data from the Rust backend and _causing reactions_ to the Rust backend.

This is intended to connect to a Quest through sockets and protobuf3

Currently on the roadmap:
- [ ] Connect to Quest (most of basic socket stuff done without testing)
- [ ] Finalize protobuf schema
- [ ] Figure out events for parsing packets in rust and notifying frontend
    - [ ] Somehow invoke state updates on these events (Redux? useEffect? I have no idea, React noob)
- [ ] Show components list
    - [ ] Modifying fields
    - [ ] Invoke methods
    - [ ] Invoke actions/events
    - [ ] Invoking getters and setters
- [ ] Deleting objects
- [ ] Adding objects?
- [ ] Adding components?
- [ ] Modifying transform values (position, rotation, etc.)

### Unlikely ideas
- [ ] 3D Space where objects are shown relative to each other (likely as cubes scaled to their Unity size)
    - Requires Tauri to have WebGL support of sorts. Likely will be done with wgpu and/or maybe a game engine such as Bevy, Godot or Unity?
- [ ] Browser port with socket support
- [ ] One click install of mod from within the desktop app

## Contribute/Testing

### Node frontend
The project uses Typescript and Vite. ESLint is configured but is not actively used in the build process.

To start up the frontend, run `yarn run dev` and open the URL in the browser (usually [http://localhost:3000]())


If you intend to test alongside the Rust backend, follow the rust instructions.

### Rust backend

Run `yarn tauri dev`. This will start up the web frontend and then the rust backend and web app.

### Building

#### Debug builds
As stated in the [Tauri docs](https://tauri.studio/docs/debugging/#create-a-debug-build), run `yarn tauri build --debug` or `cargo tauri build --debug`

#### Release builds
`yarn tauri build` or `cargo tauri build`