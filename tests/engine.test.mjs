import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { BundledEngine } from '../bundled-engine.mjs'
import { RayburstRpc, RayburstService } from '../rayburst-service.mjs'
import { engine as pinned } from '../scripts/prepare-engine.mjs'

const skip = process.platform !== 'win32' || process.arch !== 'x64'

test('真实内置进程无需外接设置，可下载、隔离 RPC 并在重启后恢复会话', { skip, timeout: 20000 }, async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'rayburst-engine-'))
  const dataDirectory = path.join(root, '插件 数据')
  const engine = new BundledEngine(dataDirectory)
  engine.downloadDirectory = path.join(root, '下载 目录')
  const payload = Buffer.from('Rayburst 内置引擎验收文件\n')
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': payload.length })
    res.end(payload)
  })
  t.after(async () => {
    await engine.stop()
    if (server.listening) await new Promise(resolve => server.close(resolve))
    await rm(root, { recursive: true, force: true, maxRetries: 3 })
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const url = `http://127.0.0.1:${server.address().port}/payload`
  const service = new RayburstService({ storage: { read: async () => null } }, { engine })
  assert.equal((await service.testConnection()).version, pinned.version)
  const rpc = await engine.rpc()
  const unauthenticated = new RayburstRpc({ port: rpc.port })
  await assert.rejects(unauthenticated.call('aria2.getVersion'), { code: 'RPC_AUTH' })
  assert.ok((await readdir(path.join(dataDirectory, 'engine'))).every(name => !name.startsWith('rpc-')))
  const added = await service.add({ urls: url, filename: 'fixture.bin' })
  assert.equal(added.added, 1, JSON.stringify(added))
  const gid = added.results[0].gid
  const deadline = performance.now() + 5000
  let task
  while (performance.now() < deadline) {
    task = (await service.snapshot()).tasks.find(candidate => candidate.gid === gid)
    if (task?.status === 'complete' || task?.status === 'error') break
    await delay(50)
  }
  assert.equal(task?.status, 'complete', JSON.stringify(task))
  assert.deepEqual(await readFile(path.join(engine.downloadDirectory, 'fixture.bin')), payload)

  // 暂停任务写入独立会话；关闭的是本插件的监听器，下一次启动使用新密钥。
  const paused = await rpc.call('aria2.addUri', [[url], { out: 'pending.bin', pause: 'true' }])
  await service.stop()
  await assert.rejects(rpc.call('aria2.getVersion'), { code: 'RPC_UNREACHABLE' })
  assert.equal((await service.snapshot()).tasks.find(candidate => candidate.gid === paused)?.status, 'paused')
})
