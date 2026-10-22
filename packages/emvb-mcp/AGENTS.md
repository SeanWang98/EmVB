# packages/emvb-mcp/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

本包把本地 stdio MCP 请求转发给远程 EmDash。
本地补充布局资源、工作流提示与代理技能。
远程站点继续执行角色、限流与发布策略。

## 成员清单

src/：CLI、远程传输与 MCP 资源注册。见 [模块地图](src/AGENTS.md)。
skill/：随桥接器分发的页面搭建技能与参考文档。
test/：桥接、选项、技能内容与真实工具回归验收。
evals/：技能触发提示的固定样本。
package.json：Node CLI 打包、发布文件与固定主插件依赖。
README.md：安装配置、Token 约束与工具入口。
LICENSE：MIT 许可证。

## Fork 版本边界

桥接器、主插件依赖与 BRIDGE_VERSION 同步版本。
当前 workspace 版本为 `0.8.0-dev.1`。
此同步满足源码与版本契约，不代表已经发布。
本次宿主只打包安装 `@perkyzz/emvb`。
不得把未发布桥接器版本当作 npm registry 产物。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
