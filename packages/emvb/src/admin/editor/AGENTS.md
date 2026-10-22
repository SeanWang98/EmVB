# packages/emvb/src/admin/editor/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

字段与独立页面复用画布，持久化边界由会话决定。

## 成员清单

A11yCopilot.tsx：无障碍审计入口；展示分数、问题和可撤销修复。
CommandPalette.tsx：命令检索弹窗；统一插入、选择与编辑动作。
DialogCloseButton.tsx：Kumo 关闭按钮；保持弹窗焦点返回契约。
Editor.tsx：编辑器编排；复用 EditorApp，字段模式阻断页面持久化。
EditorOverlay.tsx：全屏 Portal；隔离宿主表单、快捷键与焦点。
EditorToasts.tsx：编辑器通知层；统一操作反馈与焦点边界。
FieldEditor.tsx：字段会话适配；只读取站点样式，宿主拥有布局草稿。
PerfMeter.tsx：页面体积审计；显示媒体、布局及样式预算。
SavedSectionDialogs.tsx：区块保存弹窗；区分独立副本与同步部件。
ShareLink.tsx：分享链接导出；编码布局及设计到演示地址。
ShortcutsDialog.tsx：快捷键说明；展示当前编辑器操作。
SmallScreenNotice.tsx：窄屏提示；字段返回复用脏状态确认。
Timeline.tsx：独立条目版本历史；比较并恢复布局快照。
TopBar.tsx：顶部操作栏；字段模式显示应用与取消，隐藏发布。
a11y-copilot.test.tsx：回归验证 a11y-copilot 的行为及边界。
canvas/：沙箱画布、选择与响应式视口。
clipboard-store.test.ts：回归验证 clipboard-store 的行为及边界。
clipboard-store.ts：跨页面剪贴板；持久保存节点与样式快照。
clipboard.test.tsx：回归验证 clipboard 的行为及边界。
collection-preview-filter.test.ts：回归验证 collection-preview-filter 的行为及边界。
collection-previews.ts：集合循环预览；将真实条目适配为绑定值。
confirm-copy.test.ts：回归验证 confirm-copy 的行为及边界。
design-conflict.test.tsx：回归验证 design-conflict 的行为及边界。
design-queue.test.tsx：回归验证 design-queue 的行为及边界。
dialog-actions.test.tsx：回归验证 dialog-actions 的行为及边界。
dialogs.test.tsx：回归验证 dialogs 的行为及边界。
dialogs.tsx：确认弹窗；字段取消只丢弃局部布局。
dnd/：节点拖放与插入规则。
edited-noun.test.tsx：回归验证 edited-noun 的行为及边界。
edited-noun.ts：编辑对象文案上下文；区分页面与主题部件。
editing.test.tsx：回归验证 editing 的行为及边界。
editor-chrome.test.tsx：回归验证 editor-chrome 的行为及边界。
editor-chrome.tsx：弹窗编排与初始状态；字段模式排除条目历史及回退。
editor-commands.test.ts：回归验证 editor-commands 的行为及边界。
editor-commands.ts：动作注册表；统一面板、画布及快捷键命令。
editor-css.test.ts：回归验证 editor-css 的行为及边界。
editor-css.ts：编辑器外壳样式；隔离后台布局和控件。
editor-overlay.test.tsx：回归验证 editor-overlay 的行为及边界。
editor-toasts.test.tsx：回归验证 editor-toasts 的行为及边界。
editor.test.tsx：回归验证 editor 的行为及边界。
element-chrome.test.ts：回归验证 element-chrome 的行为及边界。
element-chrome.ts：元素文案与图标；供图层和面板共同使用。
exit.ts：独立编辑器退出地址；限制同源后台跳转。
feature-css.test.ts：回归验证 feature-css 的行为及边界。
feature-css.ts：扩展面板样式；补充时间线、绑定与审计界面。
file-inputs.test.ts：回归验证 file-inputs 的行为及边界。
focus-when-lost.ts：焦点回收；优先选择图层，再进入画布。
history.test.ts：回归验证 history 的行为及边界。
history.test.tsx：回归验证 history 的行为及边界。
host.test.tsx：回归验证 host 的行为及边界。
host.ts：宿主上下文；提供退出目标与画布样式。
icons/：图标选择与用户图标查询。
ime.test.ts：回归验证 ime 的行为及边界。
ime.ts：输入法提交判定；区分组合确认和字段提交。
keyboard.test.tsx：回归验证 keyboard 的行为及边界。
live-data.tsx：实时绑定上下文；提供站点设置与预览参数。
load-entry.test.ts：回归验证 load-entry 的行为及边界。
open-in-new-tab.test.ts：回归验证 open-in-new-tab 的行为及边界。
palette-accents.test.ts：回归验证 palette-accents 的行为及边界。
palette-focus.test.tsx：回归验证 palette-focus 的行为及边界。
palette-hint.test.tsx：回归验证 palette-hint 的行为及边界。
palette-items.ts：检索项装配；合并元素、图层、类和编辑命令。
palette-list-text.test.ts：回归验证 palette-list-text 的行为及边界。
palette-long-text.test.ts：回归验证 palette-long-text 的行为及边界。
palette-scroll.test.tsx：回归验证 palette-scroll 的行为及边界。
palette.test.tsx：回归验证 palette 的行为及边界。
palette.ts：命令检索模型；统一匹配、排序与分组。
panels/：布局元素与共享样式面板。
perf-meter.test.tsx：回归验证 perf-meter 的行为及边界。
remote-change.test.ts：回归验证 remote-change 的行为及边界。
remote-change.ts：远端版本轮询；仅独立条目启用。
restore-deleted.test.ts：回归验证 restore-deleted 的行为及边界。
restore-deleted.ts：撤销共享样式删除；恢复变量、类及布局引用。
s2-parity.test.tsx：回归验证 s2-parity 的行为及边界。
save-failure.test.ts：回归验证 save-failure 的行为及边界。
saved-sections.test.tsx：回归验证 saved-sections 的行为及边界。
section-templates.test.ts：回归验证 section-templates 的行为及边界。
section-templates.ts：主题部件加载；按布局引用递归读取共享区块。
share-link.test.tsx：回归验证 share-link 的行为及边界。
shortcut-focus.test.tsx：回归验证 shortcut-focus 的行为及边界。
shortcuts-list.test.ts：回归验证 shortcuts-list 的行为及边界。
shortcuts.ts：键位定义与按键归一化；兼容非拉丁键盘。
store.test.ts：回归验证 store 的行为及边界。
store.ts：不可变编辑状态；维护布局、撤销及保存版本。
timeline-filter.test.tsx：回归验证 timeline-filter 的行为及边界。
timeline-retry.test.tsx：回归验证 timeline-retry 的行为及边界。
timeline.test.tsx：回归验证 timeline 的行为及边界。
top-bar.test.tsx：回归验证 top-bar 的行为及边界。
use-save.test.tsx：回归验证 use-save 的行为及边界。
useClipboardActions.ts：剪贴板动作；校验粘贴并反馈拒绝原因。
useEditorCommands.ts：编辑命令编排；共享样式独立保存和发布。
useEditorData.ts：独立条目加载；读取内容及站点样式快照。
useEditorShortcuts.ts：编辑快捷键；排除文本输入和对话框冲突。
useMediaQuery.ts：响应式媒体订阅；区分编辑器宽度和减弱动效。
useNodeActions.test.tsx：回归验证 useNodeActions 的行为及边界。
useNodeActions.ts：节点动作；组织插入、删除、排序及包装。
useSave.ts：持久化边界；页面写 API，字段应用只回传布局。
useSavedSections.ts：复用区块会话；读取列表并保存独立共享资源。

## 会话边界

Canvas Apply 调用字段 onChange，由宿主持久化。
原生 Page 自动保存草稿，须等待保存状态完成。
取消只丢弃当前尚未 Apply 的布局修改。
取消不回退之前已 Apply 的值。
Site styles、共享区块和媒体独立保存。
字段模式隐藏页面设置、预览、发布、历史及回退。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
