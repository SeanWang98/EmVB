# packages/emvb/test/server/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

本目录在真实内存 SQLite 中验证原生插件。
测试经 EmDash 生命周期与插件路由读写内容。
宿主 Page 与旧独立页面共用相同测试运行时。

## 成员清单

before-save.test.ts：验证布局字符串、升级、预算与嵌套拒绝。
canvas-styles-options.test.ts：验证宿主配置传递与后台配置路由。
host-fields.test.ts：验证宿主画布配置、角色、修订及发布策略。
icon-uploads.test.ts：验证 SVG 上传清洗、权限与存储读写。
mcp-deep-input.test.ts：验证极深 MCP 输入被明确拒绝。
mcp-live-round2.test.ts：回归变量引用、样式合并与代理输入边界。
mcp-publish.test.ts：验证代理开关、发布授权与活动历史。
mcp-rate-limit.test.ts：验证并发速率计数、窗口与重试提示。
mcp-read.test.ts：验证工具声明、读取结果与输出 schema。
mcp-write.test.ts：验证草稿写入、版本冲突与布局操作。
plugin.test.ts：验证原生 hooks、设计路由与真实内容存储。
runtime.ts：构建独立 EmDash 运行时及宿主集合测试夹具。
saved-sections.test.ts：验证 MCP 区块复用、类合并与权限。
theme-part-hooks.test.ts：验证主题条件、触发器与非法保存拒绝。

## 验收边界

宿主集合通过 `canvasCollections` 显式启用。
合法布局经过 EmDash 保存与修订流程。
旧内容无画布字段时不受布局校验影响。
过期修订不能覆盖后续草稿。
代理发布权限仍由可信 hook 强制执行。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
