# packages/emvb/src/admin/setup/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

初始化写入稳定规格，界面单独翻译说明。

## 成员清单

plan.ts：纯集合初始化计划；翻译只改变冲突说明。
run.ts：公开 schema API 客户端；顺序执行依赖步骤。
spec.ts：稳定集合与字段规格；不随界面语言写入中文标签。
useSetupStatus.ts：缓存原始集合；渲染时翻译冲突，切换语言不重读 API。
setup.test.ts：规格收敛、冲突与幂等计划的回归验收。
useSetupStatus.test.tsx：初始化冲突随语言刷新且不增加请求的回归验收。
plan-golden.test.ts：初始化计划的稳定数据快照验收。
`__snapshots__`/plan-golden.test.ts.snap：英文集合规格快照；不因显示语言变化而迁移。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
