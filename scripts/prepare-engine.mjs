import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const version = '3.1.1'
const commit = '1b8fb72fcf63dc9e78807f20039708184bce0ad2'
const repo = 'AnInsomniacy/aria2-next'
const exe = `aria2-next-${version}-windows-x86_64.exe`
export const engine = {
  version, commit,
  executable: 'vendor/aria2-next.exe',
  licenses: 'vendor/aria2-next-licenses.txt',
  binary: {
    name: exe,
    url: `https://github.com/${repo}/releases/download/v${version}/${exe}`,
    bytes: 18334208,
    sha256: '33f13b297ebe219b99f098b1b21c9ec34eff90e20ed106cf3c86b210a7567351',
  },
  source: {
    name: `aria2-next-${version}-source.tar.gz`,
    url: `https://codeload.github.com/${repo}/tar.gz/${commit}`,
    bytes: 41323480,
    sha256: 'e8e51902807737df512971709a0e143c134ed411e33c6a6037c9ca53992b4326',
  },
}

const cacheDir = path.join(root, '.work', 'upstream')
export const engineSourcePath = path.join(cacheDir, engine.source.name)

export function verifyAsset(bytes, asset) {
  if (bytes?.length !== asset.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) {
    throw new Error(`${asset.name} 大小或 SHA-256 不符`)
  }
  return bytes
}

function download(asset, directory) {
  const cached = path.join(cacheDir, asset.name)
  if (fs.existsSync(cached)) return verifyAsset(fs.readFileSync(cached), asset)
  const temporary = path.join(directory, asset.name)
  execFileSync(process.platform === 'win32' ? 'curl.exe' : 'curl', [
    '--fail', '--silent', '--show-error', '--location', '--proto', '=https', '--proto-redir', '=https',
    '--connect-timeout', '15', '--max-time', '180', '--max-filesize', String(asset.bytes),
    '--output', temporary, asset.url,
  ], { stdio: 'inherit' })
  const bytes = verifyAsset(fs.readFileSync(temporary), asset)
  fs.renameSync(temporary, cached)
  return bytes
}

function prepare() {
  fs.mkdirSync(cacheDir, { recursive: true })
  const temporary = fs.mkdtempSync(path.join(cacheDir, 'fetch-'))
  try {
    const bytes = download(engine.binary, temporary)
    download(engine.source, temporary)
    const files = [
      'COPYING', 'docs/licenses/OPENSSL.md', 'third_party/boost/LICENSE_1_0.txt',
      'third_party/curl/COPYING', 'third_party/curl/LICENSES/BSD-4-Clause-UC.txt', 'third_party/curl/LICENSES/ISC.txt',
      'third_party/expat/COPYING', 'third_party/ffmpeg/LICENSE.md', 'third_party/ffmpeg/COPYING.LGPLv2.1',
      'third_party/ffmpeg/COPYING.LGPLv3', 'third_party/ffmpeg/COPYING.GPLv2', 'third_party/ffmpeg/COPYING.GPLv3',
      'third_party/gpac/COPYING', 'third_party/libssh2/COPYING', 'third_party/libtorrent/COPYING',
      'third_party/libtorrent/LICENSE', 'third_party/libtorrent/src/ed25519/LICENSE', 'third_party/nghttp2/COPYING',
      'third_party/openssl/LICENSE.txt', 'third_party/spdlog/LICENSE', 'third_party/zlib/LICENSE',
    ]
    const archiveRoot = `aria2-next-${commit}`
    execFileSync('tar', ['-xf', engineSourcePath, '-C', temporary, ...files.map(file => `${archiveRoot}/${file}`)], { stdio: 'inherit' })
    const notices = files.map(file => `\n===== ${file} =====\n${fs.readFileSync(path.join(temporary, archiveRoot, file), 'utf8')}`)
    fs.mkdirSync(path.join(root, 'vendor'), { recursive: true })
    fs.writeFileSync(path.join(root, engine.executable), bytes)
    fs.writeFileSync(path.join(root, engine.licenses), `Aria2 Next v${version} (${commit}) — upstream licenses and notices\nSQLite is in the public domain. See the corresponding source archive for additional notices.\n${notices.join('\n')}`)
    console.log(`已校验并准备 Aria2 Next ${version} 与对应源码`)
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true })
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) prepare()
