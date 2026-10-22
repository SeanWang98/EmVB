# packages/emvb/src/admin/widgets/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

Page 字段回传布局，宿主自动保存草稿并负责发布。

## 成员清单

CanvasField.test.tsx：回归验证 CanvasField 的行为及边界。
CanvasField.tsx：Page 受控字段；冻结打开快照，应用只调用 onChange。
LayoutField.test.tsx：回归验证 LayoutField 的行为及边界。
LayoutField.tsx：独立页面只读摘要；跳转 EmVB，不修改字段。

## 会话边界

Canvas Apply 调用字段 onChange，由宿主持久化。
原生 Page 自动保存草稿，须等待保存状态完成。
取消只丢弃当前尚未 Apply 的布局修改。
取消不回退之前已 Apply 的值。
Site styles、共享区块和媒体独立保存。
字段模式隐藏页面设置、预览、发布、历史及回退。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
