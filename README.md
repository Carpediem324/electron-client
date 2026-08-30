# AlgoRun

AlgoRun is a Windows desktop app for practicing C++ coding test problems. It ships with a bundled MinGW-w64 GCC toolchain, so users do not need to install Visual Studio Build Tools, MinGW, GCC, or edit `PATH`.

## Project Structure

```text
electron-client/
├─ main.js
├─ preload.js
├─ index.html
├─ renderer.js
├─ styles.css
├─ services/
│  ├─ compilerService.js
│  └─ processRunner.js
├─ utils/
│  └─ paths.js
├─ compiler/
│  └─ mingw64/
│     ├─ bin/
│     │  └─ g++.exe
│     ├─ include/
│     ├─ lib/
│     └─ libexec/
├─ package.json
├─ THIRD_PARTY_NOTICES.md
└─ build.bat
```

## Run in Development

```bat
npm.cmd start
```

## Build Installer

```bat
npm.cmd run build
```

`electron-builder` copies the bundled toolchain with this setting:

```json
{
  "build": {
    "extraResources": [
      {
        "from": "compiler",
        "to": "compiler"
      }
    ]
  }
}
```

After packaging, the expected compiler path is:

```text
resources/compiler/mingw64/bin/g++.exe
```

## Compiler Location

Development mode:

```text
<project root>/compiler/mingw64/bin/g++.exe
```

Packaged mode:

```text
<process.resourcesPath>/compiler/mingw64/bin/g++.exe
```

The path calculation lives in `utils/paths.js`.

## IPC Flow

Renderer:

```text
renderer.js -> window.algorun.runCode({ source, input })
```

Preload:

```text
preload.js -> ipcRenderer.invoke('code:run', payload)
```

Main process:

```text
main.js -> services/compilerService.compileAndRun()
```

Node.js APIs and child processes are not exposed to the renderer. The window uses `contextIsolation: true` and `nodeIntegration: false`.

## Compile and Run Flow

1. Create a clean temp workspace under Electron `userData/temp/algorun`.
2. Write the editor contents to `main.cpp`.
3. Compile with:

```text
g++ main.cpp -std=c++17 -O2 -o main.exe
```

The actual app also passes `-fdiagnostics-color=never` so compiler errors are readable in the output panel.

4. Run `main.exe`.
5. Send the Custom Input panel text to stdin.
6. Capture stdout and stderr.
7. Show one of: `Ready`, `Compiling`, `Running`, `Success`, `Compile Error`, `Runtime Error`, `Timeout`.

Runtime timeout is 5 seconds. On Windows, timeout termination uses `taskkill /PID <pid> /T /F` so child processes are also terminated.

## Built-in Problems

AlgoRun includes an original beginner problem set at:

```text
problems/basic.json
```

The first set contains 60 self-authored practice problems covering beginner through intermediate topics:

```text
Input/Output, conditions, loops, arrays, strings, sorting, GCD, LCM, divisors, primes, prefix sums, maps, binary search, combinations, stacks, queues, sets, two pointers, sliding windows, greedy, DP, graphs, and grids
```

The renderer only receives public problem fields such as title, statement, samples, starter code, and test case count. Full test cases are loaded by the main process for judging.

## Run vs Submit

`Run` compiles the current code and executes it once with the text in the Custom Input panel.

`Submit` compiles the current code once, then runs the resulting `main.exe` against every test case in the selected problem.

Judging results:

```text
Accepted
Wrong Answer
Compile Error
Runtime Error
Timeout
```

Output comparison normalizes Windows line endings and ignores trailing whitespace at the end of the full output.

## Verify Problem Set

```bat
npm.cmd run verify:problems
```

This checks that the built-in problem set loads and that the judge can produce `Accepted`, `Wrong Answer`, `Compile Error`, and `Timeout`.

## Bundled Compiler

The bundled compiler is WinLibs MinGW-w64 GCC:

- Distribution: WinLibs standalone build of GCC and MinGW-w64 for Windows
- Version: GCC 15.2.0, MinGW-w64 14.0.0, POSIX threads, SEH exceptions, MSVCRT runtime, release 7
- Architecture: Windows x86_64
- Source: https://github.com/brechtsanders/winlibs_mingw/releases/tag/15.2.0posix-14.0.0-msvcrt-r7
- Download used: `winlibs-x86_64-posix-seh-gcc-15.2.0-mingw-w64msvcrt-14.0.0-r7.zip`

See `THIRD_PARTY_NOTICES.md` for license notes.

## Current Limitations

- Windows x64 is the supported target.
- The app runs one source file named `main.cpp`.
- There is no online judge integration, scoring, persistent problem library, or logging system yet.
- Compile timeout is fixed at 15 seconds and runtime timeout is fixed at 5 seconds.
