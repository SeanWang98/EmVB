# packages/emvb-mcp/test/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

测试通过内存协议连接和宿主运行时验证桥接器。
连接重试测试注入等待函数，不依赖真实网络。

## 成员清单

bridge.test.ts：验证工具权限、站点行为一致性、资源与超时反馈。
remote.test.ts：验证建连退避、三次上限与凭据拒绝不重试。
options.test.ts：验证配置、版本一致性与错误凭据脱敏。
live-round2.test.ts：验证 Token 文件、撤销提示与资源约束。
skill.test.ts：验证分发技能的结构、引用与工具名称。
evals.test.ts：验证技能触发语句与工具输入契约，无模型调用。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
