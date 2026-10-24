# e2e/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

Playwright 通过真实后台与公开页面验收行为。
生产用例单独读取构建后的宿主服务。

## 成员清单

a11y.e2e.ts：已发布页面的严重无障碍缺陷验收。
access.e2e.ts：真实角色访问边界与侧栏入口验收。
auth.setup.ts：登录状态初始化与浏览器认证快照。
background.e2e.ts：背景图片、渐变和遮罩的编辑与发布验收。
box-control.e2e.ts：间距、边框和圆角联动控件验收。
canvas-boxes.e2e.ts：空容器尺寸与画布布局验收。
canvas-scale.e2e.ts：画布缩放、点击和选中轮廓验收。
canvas-text.e2e.ts：画布内正文编辑与保存验收。
class-chips.e2e.ts：样式类输入、自动补全和标签验收。
clipboard.e2e.ts：跨页面与主题部件复制粘贴验收。
color-feedback.e2e.ts：颜色保存、焦点和失败重试验收。
color.e2e.ts：颜色输入校验和变量绑定验收。
create-feedback.e2e.ts：新建表单的状态反馈与聚焦验收。
devices.e2e.ts：设备可见性与发布 CSS 验收。
dialog-motion.e2e.ts：弹窗减弱动画和焦点恢复验收。
drag.e2e.ts：元素拖入画布与插入位置验收。
duplicate.e2e.ts：元素复制后内容、样式和标识隔离验收。
editing.e2e.ts：页面新建、路径冲突和编辑流程验收。
editor.e2e.ts：编辑器弹窗堆叠与点击入口验收。
element-links.e2e.ts：元素链接编辑与输出验收。
entrance.e2e.ts：入场动画及减弱动画输出验收。
field-feedback.e2e.ts：字段定义加载、错误和空状态验收。
forms.e2e.ts：表单绑定选择与保存验收。
grid.e2e.ts：网格列数与跨列发布验收。
history.e2e.ts：撤销与重做的键盘流程验收。
icon-search-recovery.e2e.ts：图标空搜索和键盘恢复验收。
icon-upload-feedback.e2e.ts：图标上传状态与失败反馈验收。
image-editor.prod.ts：生产 CSP 下图片编辑 worker 验收。
image-save-recovery.e2e.ts：图片保存失败后的取消保护与重试验收。
interaction-feedback.e2e.ts：交互状态反馈和恢复验收。
items.e2e.ts：多项元素的初始内容与逐项编辑验收。
keyboard.e2e.ts：键盘移动、复制和删除的保存验收。
layout-section.e2e.ts：布局区块插入、拖放和内容宽度验收。
list-loading.e2e.ts：列表加载状态验收。
list-retry.e2e.ts：页面和主题列表的失败重试验收。
list-search-recovery.e2e.ts：列表空搜索后的恢复验收。
live-data.e2e.ts：实时数据绑定与内容循环验收。
media-library-feedback.e2e.ts：媒体库重试与焦点保留验收。
media.e2e.ts：媒体上传和后续图片编辑的并发验收。
node-label.e2e.ts：图层重命名、保存和公开页面隔离验收。
overlay.e2e.ts：窄屏替代提示与编辑器入口验收。
page-template-create.e2e.ts：模板加载失败后的创建恢复验收。
panel-scroll.e2e.ts：设置面板滚动位置保留验收。
parity.e2e.ts：嵌套布局的画布与公开页面一致性验收。
personalize.e2e.ts：服务端访客条件和 A/B 分流验收。
public.prod.ts：生产 SSR 的内容、样式和脚本输出验收。
save-as-class.e2e.ts：局部样式转为样式类的保存与撤销验收。
saved-sections.e2e.ts：共享区块复制、插入、重命名和删除验收。
sections.e2e.ts：同步区块引用与公开输出验收。
security.e2e.ts：公开页面的 XSS 输入隔离验收。
setup.e2e.ts：初始化收敛、双语静态入口和布局字段验收。
site-style-feedback.e2e.ts：站点样式发布反馈与失败恢复验收。
smoke.e2e.ts：宿主加载插件的基础验收。
state-styles.e2e.ts：元素与样式类交互状态编辑验收。
style-sections.e2e.ts：尺寸、溢出和比例的编辑与发布验收。
success.e2e.ts：搭建、预览、发布、表单和改版流程验收。
theme-s8.e2e.ts：主题部件创建与共享编辑器验收。
timeline-feedback.e2e.ts：修订历史加载、空状态和失败恢复验收。
toast-feedback.e2e.ts：短反馈消息的展示与恢复验收。
top-bar-feedback.e2e.ts：编辑器顶栏状态与交互反馈验收。

support/：认证请求、内容构造和编辑器操作。见 [模块地图](support/AGENTS.md)。
fixtures/：图片编辑与媒体上传的固定素材。见 [模块地图](fixtures/AGENTS.md)。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
