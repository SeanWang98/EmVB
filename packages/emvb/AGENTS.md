# packages/emvb/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

本包导出 TypeScript 与 Astro 源码。
宿主 Vite 编译源码，无独立预编译步骤。
包名保持 `@perkyzz/emvb`。
公开导出与 peer 约束由包清单定义。
Zod 使用 4.6.7 修复线，宿主须统一验证器版本。
EmDash 1.3.1 的根覆盖约定见宿主安装指南。

## 成员清单

src/：插件、编辑器、布局与 SSR。见 [模块地图](src/AGENTS.md)。
test/：服务端、DOM 与 Astro 容器验收及固定样本。
licenses/：随图标和图片编辑器分发的第三方许可。
package.json：公开导出、包文件白名单、版本与依赖。
tsconfig.json：源码检查范围，继承 workspace 严格规则。
vitest.config.ts：通过 Astro 容器运行组件 SSR 验收。
README.md：安装、公开路由与 Page canvas 接入入口。
LICENSE：MIT 许可证。
THIRD_PARTY_NOTICES.md：图标及图片编辑器的归属与许可声明。

## 接口边界

`.` 导出插件描述符与可信插件工厂。
`./admin` 导出后台页面与 React 字段组件。
`./core` 导出无副作用的布局能力。
`./astro` 导出请求解析器与 SSR 组件。
`./astro/*` 导出按需交互运行时。
`./mcp` 导出代理工具定义。
旧公开路径须保持兼容。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
