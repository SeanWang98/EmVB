# image-editor/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

图片会话与响应式界面分离。
界面翻译留在显示边界；配方和媒体身份保持原值。

## 成员清单

BlurFocus.test.tsx：验证BlurFocus 的运算与边界。
BlurFocus.tsx：BlurFocus 二维滑块组件；模糊工具的无障碍坐标输入，不更改数值单位。
Canvas.tsx：EditorCanvas 预览、缩放与比较视图；图片工具的预览舞台，叠加裁剪与透视手柄。
CropOverlay.tsx：CropFrameOverlay 与 CornerHandlesOverlay；裁剪及透视的指针层，提交归一化坐标。
CurvesPanel.tsx：CurvesPanel 色调曲线工具；曲线工具的交互边界，保留 RGB 通道标识。
ExportDialog.tsx：ExportDialog 与导出设置、结果类型；导出选项及结果入口，下载与媒体副本各自提交。
ImageEditButton.tsx：ImageEditButton、ImageEditorLauncher 与预加载函数；主编辑器的轻量入口，按需加载图片编辑器。
ImageEditorDialog.tsx：图片编辑对话框、SavedCopy 与入口属性类型；编辑会话编排层，隔离源图、编辑配方与保存副本。
MetadataPanel.test.ts：验证MetadataPanel 的运算与边界。
MetadataPanel.tsx：MetadataPanel、metadataRows 与格式化函数；媒体信息视图，仅翻译字段标签并保留元数据值。
announce.test.ts：验证announce 的运算与边界。
announce.tsx：Announcer、useEditSummary 与英文摘要函数；延迟播报编辑结果，不把显示语言写入配方。
crop-geometry.test.ts：验证crop-geometry 的运算与边界。
crop-geometry.ts：裁剪坐标换算、缩放插值与矩形约束函数；CropOverlay 的纯几何模型，可独立验证。
curve-math.test.ts：验证curve-math 的运算与边界。
curve-math.ts：曲线插值、增删控制点与键盘步进函数；CurvesPanel 的纯曲线模型，约束点数与相邻间距。
data-url-fetch.test.ts：验证data-url-fetch 的运算与边界。
data-url-fetch.ts：decodeDataUrl 与 withDataUrlFetch；主线程导出的 CSP 适配层，其他请求仍走原 fetch。
edit-summary.ts：localizeImageEditSummary 与 localizedImageEditSummary；媒体摘要的纯显示适配层，不加载图片引擎。
editor-layouts.tsx：DesktopLayout、CompactLayout 与保存上下文；图片编辑器的响应式界面，不负责加载源图。
engine.ts：引擎 React API、几何类型与 planEngine；图片编辑器唯一引擎入口，随对话框懒加载。
exif.test.ts：验证exif 的运算与边界。
exif.ts：stripJpegGps；导出隐私边界，清除 GPS 并保留其他 EXIF 标签。
flatten.test.ts：验证flatten 的运算与边界。
flatten.ts：needsFlatten、flattenToJpeg 与 downloadBlob；JPEG 导出前铺白底，避免透明区域变黑。
gpu-fit.test.ts：验证gpu-fit 的运算与边界。
gpu-fit.ts：fitWithin 与 fitSourceToGpu；加载前的尺寸限制层，记录原始尺寸供界面说明。
image-editor-css.test.ts：验证image-editor-css 的运算与边界。
image-editor-css.ts：IMAGE_EDITOR_CSS；图片编辑器的局部样式，不输出站点 CSS。
image-editor-dialog.test.tsx：验证图片会话、加载恢复与保存副本。
load.test.ts：验证load 的运算与边界。
load.ts：editableSource、loadEditableSource 与结果类型；源图读取边界，拒绝外站及 SVG、GIF。
media-labels.ts：隔离图片与图标同词异义；英文保留原标签。
messages.ts：保存异步错误源文案与参数；切换语言不重启会话。
localization.test.tsx：验证语言切换、未提交状态及原始数据边界。
panels.tsx：ToolPanel；工具面板分派与裁剪界面，配方枚举保持原值。
parts.tsx：工具按钮、滑块、页签与直方图组件；图片编辑器的交互控件层，统一焦点与显示文案。
save.test.ts：验证save 的运算与边界。
save.ts：副本构造、配方导入导出与尺寸计算函数；保存数据模型，保持文件名、配方及格式标识稳定。
tone-panels.tsx：AdjustPanel、FiltersPanel 与 BlurPanel；色调工具的显示边界，保留滤镜名和配方键。
tools.test.ts：验证tools 的运算与边界。
tools.ts：工具元信息、显示名与元素宽高比选项；图片工具的轻量模型；显示名仅翻译缺省值。
worker.test.ts：验证worker 的运算与边界。
worker.ts：probeWorker、planRendering 与渲染模式类型；引擎启动决策层，在画布转交前选择渲染线程。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
