# editor/canvas/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

沙箱文档呈现核心渲染结果。
编辑提示使用后台语言，页面内容保留用户原文。

## 成员清单

CanvasFrame.tsx：CanvasFrame、缩放函数与画布几何类型；沙箱预览边界，仅翻译编辑提示并原样渲染用户内容。
CanvasTextEdit.tsx：CanvasTextEdit；画布内文本输入层，提交用户原文。
DeviceBar.tsx：DeviceBar；画布视口切换入口，设备标识保持原值。
EmptyCanvas.tsx：EmptyCanvas；空布局入口，引导添加首个容器。
SelectionOverlay.tsx：SelectionOverlay、位置计算与选区类型；选区工具条及拖放反馈层，元素名称由选择器提供。
canvas-events.ts：useCanvasEvents 与 ResolvedDrop 类型；每次文档加载后接入选择、编辑和拖放事件。
canvas-memo.test.tsx：验证画布重渲染隔离。
canvas-scale.test.ts：验证canvas-scale 的运算与边界。
canvas-scale.ts：canvasScale 与 CanvasZoom 类型；画布视口的纯尺寸计算，区分适应与原始尺寸。
canvas-styles.test.tsx：验证宿主样式与页面样式隔离。
canvas-text-edit.test.tsx：验证文本编辑提交及取消。
drag-feedback.test.ts：验证drag-feedback 的运算与边界。
drop-line.test.ts：验证drop-line 的运算与边界。
drop-line.ts：dropLineBox；拖放插入位置的纯几何计算，供选区层绘制。
empty-root.test.ts：验证空容器提示和 iframe 语言切换。
frame-focus-ring.test.tsx：验证frame-focus-ring 的运算与边界。
frame-focus-ring.ts：useFrameFocusRing；跨文档焦点环适配，区分键盘进入和指针点击。
menu-reveal.test.ts：验证menu-reveal 的运算与边界。
selection-overlay.test.tsx：验证选区工具条位置及动作。
state-preview.test.ts：验证state-preview 的运算与边界。
state-preview.ts：applyStatePreview 与 StatePreview 类型；编辑态样式预览，只改文档临时属性。
tab-reveal.ts：页签、折叠项和菜单的选择揭示函数；仅展开选区所在结构，不修改保存的展开状态。
use-canvas-dnd.ts：useCanvasDnD；拖放目标解析及临时反馈，不保存翻译后的标签。
use-canvas-session.ts：useCanvasSession、CanvasSelection 与 boxOf；画布文档会话层，同步选区及文本编辑几何。
vnode-react-attrs.test.tsx：验证核心属性与 React 属性映射。
vnode-react.test.tsx：验证核心 VNode 与 React 输出一致性。
vnode-react.tsx：vnodeToReact；核心渲染到 React 的适配层，保留内容与属性语义。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
