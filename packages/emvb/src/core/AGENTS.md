# packages/emvb/src/core/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

本模块只定义布局、校验与纯转换。
后台、服务端与 SSR 共享同一套约束。
本模块不读取数据库、React 状态或 DOM。

## 直接文件

arrange.ts：布局移动、插入、复制与包裹，统一拒绝原因。
arrange.test.ts：验证树操作、拖放限制与选择位置。
arrange-forms.test.ts：验证表单与字段的父子限制。
arrange-golden.test.ts：固定拖放与键盘移动的历史结果。
arrange-keyboard-in.test.ts：验证键盘进入容器与首个子元素。
arrange-tabs.test.ts：验证标签面板归属、数量与重排。
arrange-wrap.test.ts：验证包裹操作保留合法父子结构。
canvas-styles.ts：筛选宿主画布样式 URL，限制协议与数量。
canvas-styles.test.ts：验证样式 URL 白名单与数量上限。
clipboard.ts：校验剪贴板封装，清洗并插入元素或样式。
clipboard.test.ts：验证复制、粘贴、清洗与缺失引用提示。
css-keywords.ts：共享 CSS 关键字白名单与长度单位。
features-w332.test.ts：覆盖打印、作用域、样式合并与页面特性。
host-fields.ts：规范宿主集合白名单，识别空画布字段。
index.ts：聚合公开纯函数、布局类型与校验接口。
limits.ts：统一布局字节、深度、节点与文本预算。
local-style.ts：读取与替换局部样式，保留类与数据绑定。
nesting.ts：复用拖放规则，检测保存时的非法父子结构。
nesting.test.ts：验证孤立菜单、标签与表单字段拒绝结果。
record.ts：识别普通对象，排除数组与 null。
record.test.ts：固定普通对象判断边界。
saved-sections.ts：快照与插入可复用区块，合并所用样式类。
saved-sections.test.ts：验证区块快照、类冲突与新节点身份。
stable-json.ts：排序对象键，提供稳定序列化与值比较。
stats.ts：在不可信输入上统计节点与布局版本。
stats.test.ts：验证大规模子节点统计不耗尽调用栈。
tree-ops.ts：不可变树读写、节点索引、初始布局与 slug。
tree-ops.test.ts：验证树读写、未知节点与输入不变性。
validate.ts：迁移并校验布局和设计，强制资源预算。
validate.test.ts：验证 schema、迁移、错误路径与预算。

## 直接子目录

a11y/：布局可访问性审计与可读问题报告。
audience/：访客分群、显示条件与 A/B 变体选择。
css/：响应式、状态、打印与作用域 CSS 生成。
data/：元素字段的数据绑定与引用解析。
design/：设计变量、样式类、层叠与冲突合并。
elements/：元素默认值、描述符与可编辑属性定义。
forms/：公开表单定义、字段绑定与成功布局。
history/：区块差异与局部历史恢复。
icons/：图标目录、几何数据与动画轨迹。
image-edit/：图片编辑参数 schema 与摘要。
migrate/：布局与设计文档的版本迁移链。
perf/：性能计量与运行时脚本预算。
recipes/：预设区块布局，供画布插入。
render/：布局生成安全 VNode、HTML 与动态区块。
sanitize/：清洗 URL、CSS、SVG 与嵌入源。
schema/：布局、设计、样式与元素数据契约。
share/：可分享布局链接的封装与解码。
tabs/：检测布局所需的标签与菜单运行时。
theme/：主题条件、内容模板、浮层与查询规则。

## 宿主字段边界

`host-fields.ts` 不访问内容存储。
宿主集合必须显式加入白名单。
空画布允许宿主继续渲染原正文。
服务端保存与 SSR 共同使用此判断。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
