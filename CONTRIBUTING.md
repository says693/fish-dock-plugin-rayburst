# 贡献指南

## 开发环境

- Windows x64
- 开发、测试与打包：Node.js 24.15.0 或更高的 24.x，或 Node.js 26+（jsdom 31 的测试要求）。插件运行时仍使用 FISH-Dock 提供的 Node.js 24，不随开发依赖升级。
- npm 11.17.0（发布工作流固定版本，满足 OIDC 的 npm >=11.5.1 要求）
- `curl`、`tar`（仅构建时准备引擎；Windows 新版系统自带）

## 验证流程

```sh
npm ci
npm run vendor:engine
npm run check
npm test
npm run build
npm run verify
npm run release:check -- v1.1.0
```

提交 Pull Request 前必须完成上述检查。涉及 RPC 的修改需要增加模拟服务测试；涉及页面的修改需要增加 jsdom 测试；涉及清单或打包的修改必须更新验包规则。

## 代码约定

- 使用原生 ESM，不增加运行时 npm 依赖。
- 页面禁止内联脚本和远程资源。
- 不引入删除磁盘文件、远程 RPC 或绕过 Rayburst 种子选择流程的能力。
- 新能力必须同步更新 `plugin.json`、README、测试和合规文档。
- 不修改 `sdk/` 下的第三方源码；确需升级时保留原始许可。

## 发布

1. 更新 `package.json`、`plugin.json` 和 `CHANGELOG.md` 的版本。
2. 完整执行验证流程。
3. 合并到 `main` 后创建 `vX.Y.Z` 标签并推送。
4. `release.yml` 在 GitHub 托管 Windows runner 上重新测试、验包并上传安装包、插件源码、内核对应源码、清单和校验文件；随后通过 npm OIDC 发布同一个已校验的包。发布时使用 `--ignore-scripts`，不重复执行 `prepack` 改变已验证文件。
5. npm 包的 Settings → Trusted Publisher 必须绑定 GitHub 用户 `says693`、仓库 `fish-dock-plugin-rayburst`、工作流文件 `release.yml`，不设置 Environment name，并允许 `npm publish`。不用保存 `NPM_TOKEN` 或逐次输入 OTP；不要只允许 `npm stage publish`。
6. 首次绑定后须在两天内完成一次成功发布。补发已存在标签时，从 `main` 手动运行 Release 工作流并填写该标签；不要重打或移动版本标签。npm 已发布的版本不可覆盖。
7. 更新内核版本时同步更新 `scripts/prepare-engine.mjs` 的固定来源及第三方声明。

## 提交信息

使用简明祈使句，例如 `Add task filtering` 或 `Fix RPC authentication`。不要在提交中包含 RPC 密钥、个人下载目录或真实下载链接。
