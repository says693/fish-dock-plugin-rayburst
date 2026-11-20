# Third-party notices

## FISH-Dock SDK

The files below are copied from `Fish-under-sea/FISH-Dock` at commit `0626a19` and retain their upstream MIT license in `sdk/LICENSE.txt`:

- `sdk/node/plugin.mjs`
- `sdk/browser/bridge.js`

Upstream copyrights: Fish-under-sea, Pengjie Zhou, Ebony-Vinyl (2026).

## Rayburst protocol

The JSON-RPC methods, default port, authentication convention, and task semantics were checked against `AnInsomniacy/rayburst` at commit `0c880e5`. No Rayburst application source code is bundled in this plugin. Rayburst and its associated rights belong to their respective owners. This is an independent, unofficial integration.

## Bundled Aria2 Next

`vendor/aria2-next.exe` is the unmodified Windows x86_64 binary from [Aria2 Next v3.1.1](https://github.com/AnInsomniacy/aria2-next/releases/tag/v3.1.1). It runs as a separate process and communicates with the plugin using JSON-RPC. It is licensed under GPL-2.0-or-later, not under the plugin's MIT license. Copyright (C) 2006, 2019 Tatsuhiro Tsujikawa and (C) 2026 aria2-next contributors. The upstream licenses and notices are included in `vendor/aria2-next-licenses.txt`.

The corresponding source, including vendored libraries and the build scripts, is [available alongside the plugin binary](https://github.com/says693/fish-dock-plugin-rayburst/releases/download/v1.1.0/aria2-next-3.1.1-source.tar.gz) and at [upstream commit `1b8fb72`](https://github.com/AnInsomniacy/aria2-next/tree/1b8fb72fcf63dc9e78807f20039708184bce0ad2). See `scripts/prepare-engine.mjs` for the pinned binary and source SHA-256 values.

## Development-only packages

`fflate` (MIT) creates ZIP archives and `jsdom` (MIT) supports page tests. They are declared in `package.json` and `package-lock.json` for reproducible development but are not included in the runtime `.fish-plugin` archive.
