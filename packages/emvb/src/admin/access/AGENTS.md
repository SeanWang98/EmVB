# packages/emvb/src/admin/access/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

权限以角色为准。界面翻译不改变访问判断。

## 成员清单

RequireEditor.tsx：路由访问边界；翻译加载与拒绝提示，保留 API 错误。
role.ts：当前角色读取与重试 hook；编辑者角色阈值来自常量。
sidebar-shim.ts：侧栏兼容入口；按角色显示插件链接并移动分组。
access.test.tsx：角色阈值、侧栏隔离与编辑路由的回归验收。
load-recovery.test.tsx：角色探测、初始化和编辑器读取的重试验收。
localization.test.tsx：中文访问状态、原始错误和权限隔离的回归验收。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
