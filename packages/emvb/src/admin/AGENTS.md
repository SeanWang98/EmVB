# packages/emvb/src/admin/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

Page 字段回传布局，宿主自动保存草稿并负责发布。

## 成员清单

`__snapshots__`/：API 契约快照。
access/：后台角色与侧栏兼容边界。
agents-api.ts：代理变更接口；读取代理修改记录。
api-client.test.ts：回归验证 api-client 的行为及边界。
api.ts：HTTP 客户端；统一 CSRF 标记、响应信封与错误。
content-api.ts：独立页面 API；读写草稿、发布及站点样式。
content-item.test.ts：回归验证 content-item 的行为及边界。
content-item.ts：条目摘要适配；统一后台列表字段。
design-api.ts：站点样式客户端；读取共享设计快照。
editor/：画布、状态与编辑命令编排。
entry-status.test.ts：回归验证 entry-status 的行为及边界。
entry-status.ts：发布状态适配；区分草稿、已发布及待发布变更。
forms-api.test.ts：回归验证 forms-api 的行为及边界。
forms-api.ts：表单插件探测与定义查询；容忍缺失插件。
icon-uploads-api.ts：图标媒体接口；上传与查询用户图标。
image-editor/：媒体副本编辑；保存独立媒体资源。
i18n/：跟随后台语言的显示词典与 React 订阅边界。
index.tsx：后台注册入口；导出独立页面与 layout、canvas 字段组件。
kumo-rules.test.ts：回归验证 kumo-rules 的行为及边界。
list-paging.test.ts：回归验证 list-paging 的行为及边界。
media-api.test.ts：回归验证 media-api 的行为及边界。
media-api.ts：媒体接口；查询素材与保存编辑副本。
pages/：插件独立页面与列表入口。
revert.test.ts：回归验证 revert 的行为及边界。
saved-sections-api.ts：复用区块接口；读取并保存共享区块。
search.test.ts：回归验证 search 的行为及边界。
search.ts：后台列表搜索；统一标题与 slug 匹配。
seo-fields.test.ts：回归验证 seo-fields 的行为及边界。
setup/：独立集合初始化与能力探测。
theme-api.test.ts：回归验证 theme-api 的行为及边界。
theme-api.ts：主题部件接口与条件摘要；译文只影响显示。
ui.test.ts：回归验证 ui 的行为及边界。
ui.ts：后台视觉常量；提供 Kumo 按钮与弹窗样式。
widgets/：受控 Page 画布与独立页面摘要。

## 会话边界

Canvas Apply 调用字段 onChange，由宿主持久化。
原生 Page 自动保存草稿，须等待保存状态完成。
取消只丢弃当前尚未 Apply 的布局修改。
取消不回退之前已 Apply 的值。
Site styles、共享区块和媒体独立保存。
字段模式隐藏页面设置、预览、发布、历史及回退。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
