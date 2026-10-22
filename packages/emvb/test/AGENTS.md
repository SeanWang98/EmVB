# packages/emvb/test/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

单元测试与源码同置。
本目录承担跨模块与真实运行时验收。
Bun 运行服务端与 DOM 测试。
Vitest 通过 Astro 容器运行 SSR 组件。

## 成员清单

server/：内存 SQLite 中的真实 EmDash 生命周期验收。见 [模块地图](server/AGENTS.md)。
dom/：React 画布、焦点、快捷键与字段表单交互验收。
astro/：Astro 组件 SSR、公开 HTML 与可选运行时验收。
deps/：EmDash 依赖约束与发布包身份断言。
fixtures/：布局样本、恶意输入与固定渲染结果。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
