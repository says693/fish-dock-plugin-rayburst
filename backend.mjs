import { createPlugin } from './sdk/node/plugin.mjs'
import { PluginError, RayburstService } from './rayburst-service.mjs'
import { BundledEngine } from './bundled-engine.mjs'

let service

function handle(operation) {
  return async params => {
    try {
      return await operation(params || {})
    } catch (error) {
      if (error instanceof PluginError) throw error
      throw new PluginError('PLUGIN_OPERATION_FAILED', '插件操作失败，请检查下载设置后重试')
    }
  }
}

async function stop() {
  const active = service
  service = null
  await active?.close()
}

// 宿主正常停用走 deactivate；管道先关闭时也要收回内核。
process.stdin.once('end', () => { void stop().catch(() => {}) })

createPlugin({
  id: 'says693.rayburst',
  activate(context) {
    service = new RayburstService(context, { engine: new BundledEngine(context.dataDirectory) })
  },
  deactivate: stop,
  commands: {
    'plugin.health': () => ({ ready: true }),
    'rayburst.settings': handle(() => service.settings()),
    'rayburst.saveSettings': handle(params => service.saveSettings(params)),
    'rayburst.test': handle(() => service.testConnection()),
    'rayburst.snapshot': handle(() => service.snapshot()),
    'rayburst.add': handle(params => service.add(params)),
    'rayburst.action': handle(params => service.action(params)),
    'rayburst.pauseAll': handle(() => service.pauseAll()),
    'rayburst.resumeAll': handle(() => service.resumeAll()),
    'rayburst.reveal': handle(params => service.reveal(params)),
  },
})
