import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { PluginError, RayburstRpc } from './rayburst-service.mjs'

const executable = fileURLToPath(new URL('./vendor/aria2-next.exe', import.meta.url))
const loopback = '127.0.0.1'

function allocatePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer().once('error', reject)
    server.listen(0, loopback, () => {
      const { port } = server.address()
      server.close(error => error ? reject(error) : resolve(port))
    })
  })
}

export class BundledEngine {
  #instance = null
  #starting = null

  constructor(dataDirectory) {
    this.dataDirectory = dataDirectory
    this.downloadDirectory = path.join(os.homedir(), 'Downloads', 'Rayburst')
  }

  async rpc() {
    if (this.#instance && !this.#instance.exited) return this.#instance.client
    this.#starting ??= this.#start().finally(() => { this.#starting = null })
    return this.#starting
  }

  async #start() {
    if (process.platform !== 'win32' || process.arch !== 'x64') {
      throw new PluginError('UNSUPPORTED_PLATFORM', '内置下载引擎仅支持 Windows x64')
    }
    if (!existsSync(executable)) {
      throw new PluginError('ENGINE_MISSING', '插件包缺少内置下载引擎，请重新导入完整安装包')
    }
    if (!this.dataDirectory || !path.isAbsolute(this.dataDirectory)) {
      throw new PluginError('ENGINE_DATA', 'FISH-Dock 未提供有效的插件数据目录')
    }
    const workDir = path.join(this.dataDirectory, 'engine')
    const stateDir = path.join(workDir, 'state')
    const session = path.join(workDir, 'downloads.session')
    let instance, configDir
    try {
      await Promise.all([mkdir(stateDir, { recursive: true }), mkdir(this.downloadDirectory, { recursive: true })])
      const port = await allocatePort()
      const secret = randomBytes(32).toString('hex')
      configDir = await mkdtemp(path.join(workDir, 'rpc-'))
      const configPath = path.join(configDir, 'startup.conf')
      // 不把密钥放在进程命令行或持久设置里；引擎读完即删启动文件。
      await writeFile(configPath, `rpc-secret=${secret}\n`, { flag: 'wx', mode: 0o600 })
      const args = [
        `--conf-path=${configPath}`,
        '--enable-rpc=true', '--rpc-listen-all=false', '--rpc-allow-origin-all=false',
        `--rpc-listen-port=${port}`, `--stop-with-process=${process.pid}`,
        `--dir=${this.downloadDirectory}`, `--state-dir=${stateDir}`,
        `--save-session=${session}`, '--save-session-interval=15',
        '--state-save-interval=10', '--follow-torrent=false', '--auto-file-renaming-style=parentheses',
        '--quiet=true',
      ]
      if (existsSync(session)) args.push(`--input-file=${session}`)
      const child = spawn(executable, args, { cwd: workDir, stdio: 'ignore', windowsHide: true, shell: false })
      instance = { child, exited: false, port, secret, client: new RayburstRpc({ port, secret }) }
      instance.closed = new Promise(resolve => {
        child.once('error', () => { instance.exited = true })
        child.once('close', () => { instance.exited = true; resolve() })
      })
      await this.#waitForRpc(instance)
      this.#instance = instance
      return instance.client
    } catch {
      if (instance && !instance.exited) instance.child.kill()
      throw new PluginError('ENGINE_START', '内置下载引擎未能启动，请检查插件目录权限或重新导入安装包')
    } finally {
      if (configDir) await rm(configDir, { recursive: true, force: true, maxRetries: 2 }).catch(() => {})
    }
  }

  async #waitForRpc(instance) {
    const { port, secret, child } = instance
    const authenticated = new RayburstRpc({ port, secret, timeoutMs: 250 })
    const anonymous = new RayburstRpc({ port, timeoutMs: 250 })
    const deadline = performance.now() + 3500
    while (child.pid && !instance.exited && performance.now() < deadline) {
      let version
      try { version = await authenticated.call('aria2.getVersion') } catch (error) {
        if (!['RPC_UNREACHABLE', 'RPC_TIMEOUT'].includes(error?.code)) break
        await delay(75)
        continue
      }
      if (version?.product !== 'aria2-next') break
      // 端口分配和绑定之间若被其他监听器抢占，不使用未认证的服务。
      try { await anonymous.call('aria2.getVersion') } catch (error) {
        if (error?.code === 'RPC_AUTH' && !instance.exited) return
      }
      break
    }
    throw new Error('Bundled RPC did not become ready')
  }

  async stop() {
    await this.#starting?.catch(() => {})
    const instance = this.#instance
    this.#instance = null
    if (!instance || instance.exited) return
    const rpc = new RayburstRpc({ port: instance.port, secret: instance.secret, timeoutMs: 400 })
    await rpc.call('aria2.shutdown').catch(() => {})
    await Promise.race([instance.closed, delay(1000, undefined, { ref: false })])
    if (!instance.exited) {
      instance.child.kill()
      await instance.closed
    }
  }
}
