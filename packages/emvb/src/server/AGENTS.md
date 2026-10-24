# packages/emvb/src/server/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

本模块将纯布局规则接入可信 EmDash 生命周期。
宿主集合继续使用 EmDash 内容与修订存储。
画布字段不新增保存或发布 API。

## 成员清单

agent-settings.ts：代理开关、活动记录与画布发布策略。
agent-log.test.ts：验证活动日志保留期限与删除能力降级。
design-routes.ts：设计文档草稿、发布与版本冲突校验。
hooks.ts：校验画布与主题文档，拒绝无权或非法保存。
icon-routes.ts：清洗上传 SVG，提供列举与重命名路由。
logging.test.ts：验证日志含错误码，不泄漏布局或凭据。
mcp-routes.ts：桥接 MCP 与内容接口，施加权限和速率限制。
plugin.ts：装配插件、双语静态入口、字段组件与可信 hooks。
saved-sections.ts：持久化可复用区块，向 MCP 暴露存储端口。

## 宿主字段配置

`createPlugin` 规范 `canvasCollections`。
`editor/config` 将白名单与画布样式交给后台。
`hooks.ts` 只校验白名单集合的 `layout` 字段。
原始 Page 持有标题、slug、SEO 与发布状态。
代理发布策略覆盖整个显式配置集合。
低角色清空画布前读取最新草稿再校验权限。
旧独立页面与主题部件继续遵守原规则。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
