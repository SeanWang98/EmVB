# packages/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

发布包保持独立职责与公开导出。
主插件通过依赖加载图标包。
MCP 桥接器通过公开工具定义接入主插件。

## 成员清单

emvb/：EmDash 插件、React 画布与 Astro SSR。见 [模块地图](emvb/AGENTS.md)。
emvb-icons/：编辑器图标数据与许可证，不参与公开页面运行。
emvb-mcp/：本地 MCP 桥接器与代理技能。见 [模块地图](emvb-mcp/AGENTS.md)。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
