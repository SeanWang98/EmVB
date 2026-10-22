# packages/emvb/src/admin/editor/panels/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

字段与独立页面复用画布，持久化边界由会话决定。

## 成员清单

AddPanel.tsx：元素插入入口；提供搜索及布局配方。
ClassesSection.tsx：共享类编辑；复用站点设计中的样式类。
ColorControl.tsx：颜色输入适配；连接颜色空间与设计变量。
ConditionsEditor.test.ts：回归验证 ConditionsEditor 的行为及边界。
ConditionsEditor.tsx：主题匹配条件编辑；按规则确定部件显示范围。
ElementPanel.tsx：元素设置；编辑布局节点属性、绑定及样式。
LayersPanel.tsx：布局树；支持选择、排序和层级操作。
LeftPanel.tsx：插入与图层切换；共享选择和节点动作。
PageSettings.tsx：独立条目设置；编辑标题、slug、SEO 与画布模式。
SavedSectionsGroup.tsx：已存区块列表；插入副本或共享引用。
SettingsPanel.tsx：元素及样式右栏；字段模式将页面元数据留给宿主。
SiteStylesDrawer.tsx：共享设计抽屉；站点样式独立保存和发布。
TokenScales.tsx：变量比例尺；生成共享设计变量序列。
TriggerSettings.tsx：触发设置编排；绑定主题部件高级触发参数。
TriggersEditor.test.ts：回归验证 TriggersEditor 的行为及边界。
TriggersEditor.tsx：触发规则编辑；配置浮层与弹窗开启条件。
VariableSection.tsx：设计变量编辑；保存到共享站点设计。
**snapshots**/：API 契约快照。
add-panel.test.tsx：回归验证 add-panel 的行为及边界。
add-search-recovery.test.tsx：回归验证 add-search-recovery 的行为及边界。
add-tile-script.test.tsx：回归验证 add-tile-script 的行为及边界。
color-control.test.tsx：回归验证 color-control 的行为及边界。
color-space.test.ts：回归验证 color-space 的行为及边界。
color-space.ts：颜色空间转换；支撑颜色控件数值编辑。
conditions-editor-ui.test.tsx：回归验证 conditions-editor-ui 的行为及边界。
design-import.test.tsx：回归验证 design-import 的行为及边界。
hex-input.test.ts：回归验证 hex-input 的行为及边界。
inline-error.test.tsx：回归验证 inline-error 的行为及边界。
inline-error.tsx：字段错误反馈；保持输入与错误关联。
layers-memo.test.tsx：回归验证 layers-memo 的行为及边界。
layers-panel.test.tsx：回归验证 layers-panel 的行为及边界。
layers-tree-key.test.ts：回归验证 layers-tree-key 的行为及边界。
page-settings.test.tsx：回归验证 page-settings 的行为及边界。
recipes-panel.test.tsx：回归验证 recipes-panel 的行为及边界。
settings/：元素字段、绑定与样式控件。
site-list.test.ts：回归验证 site-list 的行为及边界。
site-list.tsx：共享设计列表；提供搜索、重命名与选择。
site-search-retention.test.tsx：回归验证 site-search-retention 的行为及边界。
site-sections.test.tsx：回归验证 site-sections 的行为及边界。
site-styles-drawer.test.tsx：回归验证 site-styles-drawer 的行为及边界。
style-target.test.ts：回归验证 style-target 的行为及边界。
style-target.ts：样式目标计算；区分节点、类与状态。
token-scales.test.tsx：回归验证 token-scales 的行为及边界。
trigger-settings.test.tsx：回归验证 trigger-settings 的行为及边界。
triggers-editor.test.tsx：回归验证 triggers-editor 的行为及边界。
variable-values.test.ts：回归验证 variable-values 的行为及边界。
variable-values.ts：变量值适配；保留类型并校验输入。

## 会话边界

Canvas Apply 调用字段 onChange，由宿主持久化。
原生 Page 自动保存草稿，须等待保存状态完成。
取消只丢弃当前尚未 Apply 的布局修改。
取消不回退之前已 Apply 的值。
Site styles、共享区块和媒体独立保存。
字段模式隐藏页面设置、预览、发布、历史及回退。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
