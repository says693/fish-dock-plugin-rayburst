# FISH-Dock 插件标准对照

本文记录 `says693.rayburst` v1.1.0 的发布契约。SDK 依据 FISH-Dock 源码提交 `0626a19`，运行时与包校验规则参考 FISH-Dock 2.3.9；本仓库是独立第三方插件仓库，不是官方插件集的一部分。

| 项目 | 发布实现 | 验证方式 |
| --- | --- | --- |
| 发行格式 | ZIP 格式的 `.fish-plugin` | `npm run verify` 解压并校验文件集合 |
| 清单版本 | `schema: 1`、`hostApi: 1` | `plugin.json` 与验包断言 |
| npm 包名 | `fish-dock-plugin-rayburst`，符合宿主第三方发现命名规则 | 包名和发布形状测试 |
| 插件标识 | `says693.rayburst` | 后端握手、页面 ticket 与协议测试一致 |
| 目标平台 | `windows-x86_64` | 清单、CI 与 Release 均使用 Windows |
| Node 运行时 | FISH-Dock 正式安装版自动提供的 Node.js 24 | `engines.node`，CI 固定 24 |
| 内置引擎 | Windows x64 Aria2 Next，打开插件使用时启动，停用时停止；不开机自启动 | Windows 内核运行测试与验包 |
| 页面设计 | 宿主主题、语义状态色、焦点与强制颜色模式 | 页面样式与键盘操作测试；真实 WebView 待验收 |
| SDK 入口 | 现行 `createPlugin` | 真实 SDK 子进程握手测试 |
| 宿主协议 | 换行 JSON、请求 ID、稳定错误码 | `tests/protocol.test.mjs` |
| 帧大小 | 快照压缩至 850,000 字节以内 | 超长中文任务快照测试 |
| 运行资源 | `package.json`、内核二进制、许可等文件逐项记录 SHA-256 | 独立验包重新计算摘要并核对内核上游固定值 |
| 文件集合 | ZIP 仅包含 `plugin.json` 与已声明资源 | 验包比较完整路径集合 |
| 路径安全 | 无绝对路径、反斜杠或 `..` | `scripts/verify-package.mjs` |
| 当前文档 | 运行包含 README、LICENSE、第三方声明 | 构建列表与验包断言 |
| 能力最小化 | 仅 `storage`、`network`、`services` | 清单与测试断言 |
| 普通配置 | 宿主 storage，dataSchema 1 | 宿主回调测试 |
| RPC 密钥 | 外接密钥通过宿主 `writeSecret` 保存；内置密钥每次随机生成且不进入页面 | 服务、页面、真实内核和协议测试 |
| 页面资源 | 无内联脚本、远程脚本、字体或图片 | HTML/CSS 验包规则与 jsdom 测试 |
| 网络安全 | 内置 RPC 仅监听回环；插件只连接 `127.0.0.1`，不继承代理 | 本机 RPC 与认证测试 |
| 删除边界 | 不接受删除文件参数，移除需二次确认 | 页面与 RPC 测试 |
| 外部进程 | 内核固定包内路径，内核和资源管理器均用独立参数、`shell: false` | 内核启动与资源管理器参数测试 |
| SDK 许可 | 原样保留 `sdk/LICENSE.txt` | 运行包与源码包检查 |
| Aria2 Next 许可 | 安装包含第三方许可，Release 同处提供对应源码与 SHA-256 | `npm run verify` |
| 可复现构建 | ZIP 固定 mtime，开发依赖不进入运行包 | 连续构建哈希比较 |
| 商店目录 | Release 生成 schema 1 `catalog.json` | 校验 ID、版本、平台、URL、大小与哈希 |
| CI | Windows 上准备固定上游资产，执行检查、测试、构建和验包 | `.github/workflows/ci.yml` |
| Release | `v*` 标签触发，重新构建并上传安装包和对应源码等六项资产 | `.github/workflows/release.yml` |

## 发布文件

1. `rayburst.fish-plugin`
2. `rayburst-fish-plugin-source.zip`
3. `aria2-next-3.1.1-source.tar.gz`
4. `manifest.json`
5. `catalog.json`
6. `SHA256SUMS.txt`

## 尚未覆盖的验收

验收使用真实 Windows Aria2 Next 进程、宿主随包 Node 和模拟宿主协议；浏览器验收以与 Dock 一致的 `sandbox="allow-scripts"` 加载安装包页面。尚未在本机现用的 FISH-Dock 中覆盖安装。`catalog.json` 的格式兼容不等于已被官方商店收录。
