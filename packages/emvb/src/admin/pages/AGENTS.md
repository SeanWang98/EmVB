# packages/emvb/src/admin/pages/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

后台页面只翻译界面，不翻译内容值。

## 成员清单

AgentsPage.tsx：助手配置入口；恢复通知跟随当前语言，保留 API 原文。
CreateDialog.tsx：新建公共表单；缓存错误原因，按当前语言渲染提示。
EditorPage.tsx：编辑路由入口；解析稳定集合和条目标识。
NewPageDialog.tsx：独立页面创建；模板失败保留源文与稳定错误码。
NewThemePartDialog.tsx：主题部件创建；类型值与校验源文保持稳定。
PageList.tsx：独立页面列表；按标题和路径名搜索。
PagesPage.tsx：独立页面路由；组合权限与初始化外壳。
SetupShell.tsx：初始化外壳；展示加载、冲突和升级说明。
ThemeBuilderPage.tsx：主题构建器路由；组合权限与初始化外壳。
ThemePartList.tsx：主题部件列表；按类型筛选并兼容中英文条件检索。
list-kit.tsx：列表共用组件；翻译状态、搜索提示与重试动作。
agents.test.tsx：助手设置与只读活动的回归验收。
create-dialogs.test.tsx：新建表单、聚焦与创建失败的回归验收。
edge-hints.test.tsx：主题类型横向滚动边缘提示的回归验收。
list-retry.test.tsx：列表重试与聚焦恢复的回归验收。
list-search.test.tsx：列表搜索与筛选组合的回归验收。
lists.test.tsx：列表结构、状态与时间输出的快照验收。
page-template-create.test.tsx：页面模板复制和模板缺失的回归验收。
setup-busy.test.tsx：初始化与升级期间聚焦状态的回归验收。
localization.test.tsx：语言切换、现有错误提示和内容原值的回归验收。
`__snapshots__`/lists.test.tsx.snap：英文列表结构基线；用户内容不受界面翻译影响。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
