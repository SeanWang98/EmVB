# editor/icons/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

图标数据按需加载，界面与上传状态分别建模。
显示语言不改图标身份、搜索草稿与 SVG。

## 成员清单

IconLibraryDialog.tsx：IconLibraryDialog 与网格导航计算函数；图标选择界面，保持图标名、SVG 和上传标识原值。
icon-library.test.tsx：验证虚拟网格、键盘导航及选中值。
icon-uploads.test.tsx：验证上传、重命名、复制及删除边界。
library.test.ts：验证library 的运算与边界。
library.ts：图标分类、懒加载、搜索与上传图标适配；图标数据边界，选中后保存 SVG 而非加载整个图标集。
localization.test.tsx：验证语言切换、原始数据及 API 错误原文。
set-format.ts：IconSetStyle、IconEntry 与 IconSetFile 类型；构建脚本与编辑器懒加载共享的数据协议。
use-icon-library.ts：图标状态与计数格式化；模板随语言切换，API 错误保持原文。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
