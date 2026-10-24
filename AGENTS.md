# EmVB - EmDash 原生可视化页面编辑器

Bun workspace + TypeScript 7.0.2 + React 19 + Astro 7 + EmDash 1.3.1。
代码基线为上游 v0.8.0。
此 fork 为 `@perkyzz/emvb@0.8.0-dev.2`。
包版本与 `PLUGIN_VERSION` 须保持一致。
MCP 桥接器同步版本，但本次未安装或发布桥接器。

<directory>
packages/ - 发布包。见 [模块地图](packages/AGENTS.md)。
demos/ - Node 与 Cloudflare 宿主示例。
docs/ - 安装指南与数据契约。见 [模块地图](docs/AGENTS.md)。
e2e/ - Playwright 后台与公开页面验收。
scripts/ - 打包、运行时与缺陷注入。见 [模块地图](scripts/AGENTS.md)。
site/ - emvb.dev 展示站与交互示例。
test/ - 跨包、宿主与文档回归检查。
.github/ - 上游协作模板与 CI 工作流。
</directory>

<config>
package.json - workspace、检查命令与开发依赖。
flake.nix - Bun 1.4.3、Node 24 开发环境与 Nix 格式器。
flake.lock - nixpkgs 修订与内容哈希。
.envrc - direnv 自动加载默认开发环境。
bun.lock - workspace 精确依赖解析。
bunfig.toml - Bun 测试的 DOM 与虚拟 EmDash 预加载。
tsconfig.base.json - 严格 TypeScript 公共约束。
tsconfig.json - 脚本、测试与站点示例的检查范围。
.oxlintrc.json - Oxlint 规则与导入边界。
.oxfmtrc.json - Oxfmt 格式规则。
.fallowrc.json - 死代码检查入口与例外。
runtime-exceptions.json - 运行时导入边界的显式例外。
playwright.shared.ts - 浏览器与测试运行时公共配置。
playwright.config.ts - 开发服务端到端验收。
playwright.prod.config.ts - 生产产物端到端验收。
README.md - 上游能力、安装入口与 fork 扩展导航。
CONTRIBUTING.md - 上游开发与贡献流程。
CHANGELOG.md - 上游发布记录。
SECURITY.md - 漏洞报告入口。
LICENSE - MIT 许可证。
</config>

## 依赖方向

`core` 定义布局数据、校验与纯转换。
`server` 依赖 `core`，接入可信 CMS 生命周期。
`admin` 依赖 `core`，通过公开 API 读写草稿。
`astro` 依赖 `core`，只渲染请求可见的内容。
浏览器代码不得导入服务端内容接口。
纯布局逻辑不得依赖 React、数据库或 DOM。

## Page canvas 扩展

Page canvas 将布局存入宿主集合的 JSON 字段。
Page 继续持有标题、slug、SEO、修订与发布状态。
画布 Apply 调用字段 onChange，交回 Page 表单。
原生 Page 随后自动保存草稿，发布仍需显式操作。
Cancel 只丢弃尚未 Apply 的局部画布修改。
Page 是正文的唯一持久化与发布入口。
Site styles 继续使用独立草稿与发布流程。
旧 `emvb_pages` 与 Theme Builder 保持兼容。
完整契约见 [Page canvas 指南](docs/guides/page-canvas-field.md)。

## 后台语言边界

后台语言通过根 lang 驱动 React 词典。
简体中文界面与英文界面共享同一编辑状态。
未知语言和缺少词条回退英文。
静态插件入口使用中英双语标签。
用户内容、存储枚举与 CSS 值不进入翻译器。
内容翻译不属于界面适配。
扩展约定见 [后台语言指南](docs/guides/admin-localization.md)。

## 修改约束

分支与版本标识使用功能名或中性名称，不含个人姓名。
保留插件 ID、存储键与既有 schema 迁移。
发布前同步包版本与 `PLUGIN_VERSION`。
保留上游许可证与第三方声明。
修改文件前读取所在目录地图与文件契约。
修改依赖、职责或接口时同步 L3 与目录地图。
业务文件补齐 INPUT、OUTPUT、POS 头部。
新增文件应少于 800 行。

运行 `nix develop` 进入固定开发环境。
可选运行 `direnv allow` 启用自动加载。
Bun 与 CI 同为 1.4.3，Node 使用 24 系列。
依赖安装显式运行 `bun install --frozen-lockfile`。
运行 `bun run check` 检查 workspace。
运行 `bun run pack:smoke` 检查发布包形状。
宿主还须验证保存、预览、发布与生产 SSR。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
