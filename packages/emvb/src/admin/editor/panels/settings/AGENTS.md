# packages/emvb/src/admin/editor/panels/settings/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

内容字段与样式控件只编辑布局草稿。
翻译仅作用于界面文案，存储键与用户内容保持原值。

## 成员清单

AdvancedFields.tsx：高级属性编辑；校验 CSS id、方向、容器查询与自定义属性。
AudienceEditor.tsx：访客规则编辑；保存国家、设备、访客分组与时间条件。
BackgroundControls.tsx：背景样式编排；本地错误延迟翻译，API 错误保留原文。
BackgroundFill.tsx：背景填充选择；写入固有 CSS 填充值。
BindingsEditor.tsx：动态数据绑定；选择内容、站点设置与 URL 参数源。
BoxControl.tsx：盒型边距控件；支持四边联动与设计变量。
ChoiceGroup.tsx：布局单选组；支持键盘切换，翻译标签并保留 CSS 枚举值。
ClassChip.tsx：样式类标签；选择、移除与检查共享样式类。
ClassChipInput.tsx：样式类输入；保留命令错误源消息与 API 原文。
DraftTextField.tsx：文本字段草稿；按类型校验，并在提交时修改节点属性。
EffectsControls.tsx：视觉效果编辑；配置滤镜、阴影与透明度。
FieldBindControl.tsx：表单字段绑定；公开定义选择与手动字段名共享草稿。
FieldControl.tsx：内容字段路由；按字段描述选择控件并保留存储值。
FormBindControl.tsx：表单绑定；探测表单插件并选择表单 id。
HintedSwitch.tsx：布尔开关容器；调用方提供已翻译标签与帮助文本。
IconControls.tsx：图标样式编辑；配置大小、颜色、描边与填充。
IconPicker.tsx：图标内容选择；保留图标 id 与上传图标标题。
ImageSourcesField.tsx：响应式图片输入；解析不同宽度的图片 URL。
ItemList.tsx：子项目编辑；增删、排序与选择折叠项或选项卡。
LengthRow.tsx：长度控件；校验数值与 CSS 单位，支持变量绑定。
LoopItemBindControl.tsx：主题部件绑定；选择循环项或区块并保存部件 id。
MediaPicker.tsx：媒体选择；保留 API 原文，独立保存上传与编辑副本。
MotionControl.tsx：动效设置；保存预设、持续时间与触发参数。
NumberRow.tsx：数值控件；校验范围、默认值与变量绑定。
PanelSelect.tsx：下拉选择容器；调用方提供已翻译标签与原始选项值。
QueryStyleRows.tsx：容器查询样式编辑；逐行解析属性与 CSS 值。
RequiredFieldsNotice.tsx：表单风险提示；显示缺失必填字段、不可满足限制与控件类型冲突。
StateSwitcher.tsx：状态选择器；切换常态、悬停、焦点与激活状态。
StyleRow.tsx：样式字段路由；选择数值、枚举、颜色与布局控件。
StyleSources.tsx：样式来源说明；显示节点、样式类、设备和状态的有效值。
VariableBinding.tsx：变量绑定；选择指定变量组并保留变量 id。
VariantEditor.tsx：样式变体编辑；选择设备、模式与状态作用域。
`__snapshots__`/：设置面板的英文结构快照。
advanced-fields.test.tsx：验证 advanced-fields 的输入、提交与回归边界。
advanced-rules.ts：高级属性纯校验；拒绝保留名称与无效值。
audience-editor.test.tsx：验证 audience-editor 的输入、提交与回归边界。
background-controls.test.tsx：验证 background-controls 的输入、提交与回归边界。
background-mode.ts：背景模式适配；切换模式时移除冲突值。
bindings-editor.test.tsx：验证 bindings-editor 的输入、提交与回归边界。
box-control.test.tsx：验证 box-control 的输入、提交与回归边界。
box-link-name.test.tsx：验证 box-link-name 的输入、提交与回归边界。
box-link-name.ts：容器链接无障碍检测；说明无名称或内嵌交互冲突。
box-sides.ts：盒型字段定义；固定四边、分组与 CSS 键。
button-url.test.tsx：验证 button-url 的输入、提交与回归边界。
button-url.ts：链接提示；解释按钮和链接的无效 URL 行为。
choice-group.test.tsx：验证 choice-group 的输入、提交与回归边界。
class-chip-input.test.tsx：验证 class-chip-input 的输入、提交与回归边界。
class-suggest-unicode.test.ts：验证 class-suggest-unicode 的输入、提交与回归边界。
class-suggest.test.ts：验证 class-suggest 的输入、提交与回归边界。
class-suggest.ts：样式类查询；按 Unicode 名称筛选候选。
coverage.test.ts：验证 coverage 的输入、提交与回归边界。
draft-text-field.test.tsx：验证 draft-text-field 的输入、提交与回归边界。
element-panel-shapes.test.tsx：验证 element-panel-shapes 的输入、提交与回归边界。
element-panel.test.tsx：验证 element-panel 的输入、提交与回归边界。
field-control.test.tsx：验证 field-control 的输入、提交与回归边界。
error-locale.test.tsx：错误语言回归；保留草稿，语言切换不重载媒体。
field-i18n.test.tsx：中文字段回归；验证插值、用户内容和 CSS 值边界。
field-name.test.ts：验证 field-name 的输入、提交与回归边界。
form-bind.test.tsx：验证 form-bind 的输入、提交与回归边界。
form-names.test.ts：验证 form-names 的输入、提交与回归边界。
form-names.ts：字段名检测；统计同一表单中的重复名称。
grid-columns.test.tsx：验证 grid-columns 的输入、提交与回归边界。
grid-tracks-field.test.tsx：验证 grid-tracks-field 的输入、提交与回归边界。
heading-warning.test.tsx：验证 heading-warning 的输入、提交与回归边界。
heading-warning.ts：标题检测；识别共享主题部件中重复的一级标题。
icon-picker.test.tsx：验证 icon-picker 的输入、提交与回归边界。
icon-search.test.tsx：验证 icon-search 的输入、提交与回归边界。
icon-style-panel.test.tsx：验证 icon-style-panel 的输入、提交与回归边界。
image-alt.test.tsx：验证 image-alt 的输入、提交与回归边界。
image-alt.ts：图片无障碍提示；保留用户替代文本并翻译诊断。
image-sources-field.test.tsx：验证 image-sources-field 的输入、提交与回归边界。
item-list.test.tsx：验证 item-list 的输入、提交与回归边界。
length-row.test.tsx：验证 length-row 的输入、提交与回归边界。
length-units.ts：长度解析；校验单位、正负范围与属性可用值。
localized-error.ts：延迟错误翻译；保留失败参数并随语言显示。
link-rules.test.ts：验证 link-rules 的输入、提交与回归边界。
link-rules.ts：URL 校验提示；区分空格与不受支持的协议。
loop-context.test.tsx：验证 loop-context 的输入、提交与回归边界。
loop-context.ts：循环上下文提示；解释归档模板以外的线上限制。
loop-item-bind.test.tsx：验证 loop-item-bind 的输入、提交与回归边界。
loop-per-page.test.tsx：验证 loop-per-page 的输入、提交与回归边界。
media-picker.test.tsx：验证 media-picker 的输入、提交与回归边界。
media-reset.test.tsx：验证 media-reset 的输入、提交与回归边界。
media-upload.test.tsx：验证 media-upload 的输入、提交与回归边界。
motion-control.test.tsx：验证 motion-control 的输入、提交与回归边界。
node-props.ts：节点属性适配；只替换指定属性并保留其他节点值。
number-input.test.ts：验证 number-input 的输入、提交与回归边界。
number-input.ts：数值输入解析；区分输入草稿与最终数值。
number-row.test.tsx：验证 number-row 的输入、提交与回归边界。
panel-select.test.tsx：验证 panel-select 的输入、提交与回归边界。
query-style.test.tsx：验证 query-style 的输入、提交与回归边界。
query-style.ts：查询样式解析；按样式定义校验文本输入。
required-fields-notice.test.tsx：验证 required-fields-notice 的输入、提交与回归边界。
reserved-html-id.test.ts：验证 reserved-html-id 的输入、提交与回归边界。
rtl-fields.test.tsx：验证 rtl-fields 的输入、提交与回归边界。
spacing-ch-negative.test.ts：验证 spacing-ch-negative 的输入、提交与回归边界。
state-styles.test.tsx：验证 state-styles 的输入、提交与回归边界。
style-i18n.test.tsx：中文样式回归；验证语言切换与 CSS 存储边界。
style-row-default.test.tsx：验证 style-row-default 的输入、提交与回归边界。
style-sections.test.tsx：验证 style-sections 的输入、提交与回归边界。
style-sections.ts：样式元数据；定义分组、控件与语义上下文标签。
style-sources.test.tsx：验证 style-sources 的输入、提交与回归边界。
svg-images.test.ts：验证 svg-images 的输入、提交与回归边界。
svg-images.ts：SVG 安全反馈；说明外部图片移除和标记拒绝。
typography-units.test.ts：验证 typography-units 的输入、提交与回归边界。
variable-binding.test.tsx：验证 variable-binding 的输入、提交与回归边界。
zero-min-fields.test.tsx：验证 zero-min-fields 的输入、提交与回归边界。

## 语言边界

useI18n 订阅后台根语言，支持英文与简体中文。
字段元数据与内置选项标签经翻译后显示。
字段值、CSS 枚举、URL、单位与用户命名保持原样。
纯解析器默认返回英文，界面传入当前翻译器。
错误保留源文案或失败参数，显示时使用当前语言。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
