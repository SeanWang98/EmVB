# packages/emvb/src/admin/i18n/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

词典仅负责编辑器界面的简体中文显示。
后台根 lang 决定语言，不使用前台内容语言。
未支持语言与缺少词条均回退英文。
插值保留用户原值，不读取或改写内容数据。
React 组件通过 hook 订阅语言，不重挂画布。

## 成员清单

index.ts：语言解析、字典合并与共享根属性订阅。
index.test.tsx：验证语言回退、插值保真与订阅重连。
zh-chrome.ts：编辑器工具栏、对话框与命令文案。
zh-chrome-aux.ts：快捷键、历史、分享与检查工具文案。
zh-fields.ts：属性、绑定、表单与样式控件文案。
zh-field-style.ts：样式、单位、背景与效果控件文案。
zh-field-media.ts：媒体选择、图标与表单绑定控件文案。
zh-media.ts：媒体、图标、图片编辑与画布工具文案。
zh-metadata.ts：核心描述符的显示名，不改核心数据。
zh-pages.ts：页面列表、主题列表、初始化与字段入口文案。
zh-panels.ts：添加、图层、站点样式与页面设置文案。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
