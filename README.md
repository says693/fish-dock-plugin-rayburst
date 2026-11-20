# Rayburst 下载 · FISH-Dock 插件

[![CI](https://github.com/says693/fish-dock-plugin-rayburst/actions/workflows/ci.yml/badge.svg)](https://github.com/says693/fish-dock-plugin-rayburst/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/says693/fish-dock-plugin-rayburst)](https://github.com/says693/fish-dock-plugin-rayburst/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

在 FISH-Dock 中管理下载任务。安装包自带 [Rayburst](https://github.com/AnInsomniacy/rayburst) 使用的 [Aria2 Next](https://github.com/AnInsomniacy/aria2-next) 下载内核，不需要安装 Rayburst 桌面版、安装 aria2 或手填 RPC 密钥。

> 非官方 Rayburst 集成。插件 ID：`says693.rayburst`；当前源码版本：`1.1.0`；宿主 API：1；平台：Windows x64。

## 功能

- 添加 HTTP、HTTPS、FTP、SFTP、磁力、ED2K、迅雷链接；支持每行一个的批量添加。
- 显示全局下载/上传速度、活动任务数、等待任务数。
- 显示任务进度、已下载/总大小、连接数、预计剩余时间与错误信息。
- 按状态和文件名/GID/目录筛选任务。
- 暂停、恢复、全部暂停、全部恢复。
- 移除活动任务或清除完成/错误记录；**不会删除磁盘文件**，移除前有页内二次确认。
- 使用 Windows 资源管理器打开文件所在目录。
- 自动刷新（1–10 秒可调）。外接模式的 RPC 密钥由 FISH-Dock 加密保存，页面不回显。

## 环境要求

- Windows x64。
- FISH-Dock 2.2.0 或更新版本，宿主插件 API 1。
- 使用 FISH-Dock 正式安装版随包提供的 Node.js 24；无需另外安装 Node 或修改 `PATH`。

## 安装与配置

1. 从 [最新 Release](https://github.com/says693/fish-dock-plugin-rayburst/releases/latest) 下载 `rayburst.fish-plugin`。
2. 在 FISH-Dock 插件页导入该文件。
3. 打开 Dock 中的「Rayburst 下载」，直接点击「添加下载」。首次打开时自动启动内核，下载默认保存到用户目录下的 `Downloads/Rayburst`。

**从 1.0.x 升级：** 已保存的 RPC 端口和密钥继续用于「连接本机 Rayburst」。需要独立运行时，在「下载设置 → 下载引擎」切换为「内置 Aria2 Next」。两种模式使用独立任务列表，不自动迁移桌面端的任务，也不移动或删除已下载的文件。

只有选择「连接本机 Rayburst」才需要桌面版运行。Rayburst 默认 RPC 地址为 `127.0.0.1:29100/jsonrpc`，可在桌面版「设置 → 高级 → RPC 设置」查看端口与密钥。只有在 Rayburst 密钥实际为空时，才勾选「保存时清除已存密钥」。不支持远程 RPC。

Release 同时提供：

| 文件 | 用途 |
| --- | --- |
| `rayburst.fish-plugin` | FISH-Dock 可导入安装包 |
| `rayburst-fish-plugin-source.zip` | 完整源码、测试、文档与工作流 |
| `aria2-next-3.1.1-source.tar.gz` | 内置二进制对应的 Aria2 Next 源码与构建脚本 |
| `manifest.json` | 版本、下载地址、大小和 SHA-256 |
| `catalog.json` | FISH-Dock 商店目录 schema 1 兼容元数据 |
| `SHA256SUMS.txt` | 上述发布文件的校验值 |

npm 包名为 `fish-dock-plugin-rayburst`。当 npm 安装的是 `1.1.0` 或更新版本时，安装包同样包含内核；以插件页显示的已装版本为准。

`catalog.json` 仅表示元数据格式兼容，不表示插件已被 FISH-Dock 官方商店收录。

## 从源码构建

首次构建需要 `curl`、`tar`（Windows 新版系统自带）和访问 GitHub；不需要安装 Rayburst 或 aria2：

```sh
npm ci
npm run vendor:engine
npm run check
npm test
npm run build
npm run verify
node scripts/assert-release.mjs v1.1.0
```

构建产物位于 `dist/`。`fflate` 与 `jsdom` 仅用于构建和测试，不会进入 `.fish-plugin` 运行包。ZIP 条目使用固定时间戳，同一源码可重复得到相同哈希。

`vendor:engine` 只在构建时取固定版本的上游二进制与对应源码，并校验大小和 SHA-256；安装和启动不再下载内核。`npm pack` 会通过 `prepack` 生成同一份资源清单。

## 后端命令

所有页面调用都带 `rayburst.` 前缀：

| 命令 | 用途 |
| --- | --- |
| `rayburst.settings` | 读取下载引擎模式、外接端口、刷新间隔和是否已存外接密钥 |
| `rayburst.saveSettings` | 保存设置；空密钥保留，显式 `clearSecret` 才清除 |
| `rayburst.test` | 调用 `aria2.getVersion` 验证连接 |
| `rayburst.snapshot` | 一次 `system.multicall` 读取引擎、统计和任务 |
| `rayburst.add` | 批量 `aria2.addUri`，返回逐项结果 |
| `rayburst.action` | 暂停、恢复或移除单个任务 |
| `rayburst.pauseAll` | 全部暂停 |
| `rayburst.resumeAll` | 恢复可恢复的暂停任务 |
| `rayburst.reveal` | 在资源管理器中显示文件或目录 |

`system.multicall` 的认证令牌按 Rayburst 原生规则注入每个子调用。任务快照在返回宿主前会裁剪字段、去重并限制在 850,000 字节以内，避免超过 FISH-Dock 的 1 MiB 单行协议上限。

## Dock 插件标准与测试

发布包结构、能力声明、SDK 协议、资源哈希、页面限制和 Release 规则见 [PLUGIN-COMPLIANCE.md](docs/PLUGIN-COMPLIANCE.md)。

自动化验证覆盖：

- 本机 HTTP 模拟 Rayburst RPC：认证、批量调用、任务快照、添加、暂停/恢复、移除、错误码。
- jsdom 页面测试：统计渲染、筛选、密钥不回显、添加任务、移除二次确认。
- 真实 FISH-Dock Node SDK：换行 JSON 协议、握手、激活、宿主存储回调、业务调用、停用。
- 发行包测试：ZIP 文件集合、资源 SHA-256、清单能力、无运行时开发依赖。

Windows 集成测试使用真实 Aria2 Next 和本机 HTTP 测试文件，验证内核启动、下载和停用；FISH-Dock 安装后也可用「保存并测试」检查当前模式。

## 当前边界

- 任务通过引擎 RPC 直接创建，不弹出 Rayburst 的扩展下载确认窗口；应用层站点规则和保存凭据不会由插件逐个重建，需要这些策略时请改用 Rayburst 自身的添加窗口。
- 支持磁力链接；未提供本地 `.torrent` 文件选择器。
- 内置模式不提供种子文件选择；需要手动选种或使用浏览器扩展、站点规则时，请使用 Rayburst 桌面版。
- 默认读取全部活动任务、前 100 条等待任务和最近 30 条停止记录；极端长文本下还会按宿主帧预算截断。
- “移除”只操作任务或记录，不提供删除下载文件功能。
- 内置模式在首次使用时启动；停用插件、切到外接模式或退出 Dock 时停止下载内核。未完成任务保存在插件内核会话，重新打开时继续读取；不导入桌面端任务历史。
- 仅声明 `storage`、`network`、`services` 能力，不申请系统代理、窗口、拖入或 Dock 状态能力。

## 隐私与安全

页面不加载远程脚本、字体、图片或分析服务。内置引擎使用动态本机端口与每次启动生成的随机密钥；RPC 仅开放回环接口。密钥不进入页面或普通设置，内核启动文件读取后即移除。插件通过 `node:http` 直连本机 RPC，不继承系统代理。内核和资源管理器均按独立参数启动，不经过 shell。

安全报告见 [SECURITY.md](SECURITY.md)，贡献与发布流程见 [CONTRIBUTING.md](CONTRIBUTING.md)，版本变化见 [CHANGELOG.md](CHANGELOG.md)。

## 许可

插件源码采用 [MIT](LICENSE) 许可；FISH-Dock SDK 原始许可保留在 `sdk/LICENSE.txt`。单独运行的 Aria2 Next 采用 GPL-2.0-or-later；对应源码与许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。本插件不包含 Rayburst 桌面应用，也不是官方插件。
