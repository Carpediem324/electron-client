# Third Party Notices

## WinLibs MinGW-w64 GCC

AlgoRun bundles a WinLibs standalone MinGW-w64 GCC toolchain for Windows x86_64.

- Distribution: WinLibs standalone build of GCC and MinGW-w64 for Windows
- Publisher/project: Brecht Sanders / WinLibs
- Version: GCC 15.2.0, MinGW-w64 14.0.0, POSIX threads, SEH exceptions, MSVCRT runtime, release 7
- Download file: `winlibs-x86_64-posix-seh-gcc-15.2.0-mingw-w64msvcrt-14.0.0-r7.zip`
- Project page: https://winlibs.com/
- Release page: https://github.com/brechtsanders/winlibs_mingw/releases/tag/15.2.0posix-14.0.0-msvcrt-r7

WinLibs is a standalone build that packages GCC, MinGW-w64, binutils, GDB, GNU Make, and related open source tools. The upstream projects use their own licenses, including GPL-family licenses, LGPL-family licenses, permissive licenses, and public domain style terms depending on the component.

Important upstream license references:

- GCC: GNU General Public License version 3, with GCC Runtime Library Exception
- MinGW-w64 runtime and headers: permissive MinGW-w64 runtime licensing terms
- GNU Binutils: GNU General Public License
- GDB: GNU General Public License
- GNU Make: GNU General Public License

When redistributing the packaged app, keep this notice with the application distribution and review the license files included in the bundled toolchain.

## Monaco Editor

AlgoRun uses Monaco Editor for the C++ code editor.

- Package: `monaco-editor`
- License: MIT
- Project: https://github.com/microsoft/monaco-editor
