# scripts/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

脚本验证发布包、运行时边界与性能预算。
缺陷注入清单必须保持可应用与可检测。
脚本通过公开布局 API 验证真实行为。

## 成员清单

bench-render.ts：生成 300 节点样本并测量渲染中位数。
bench-render.test.ts：验证节点数、真实计时与结果排序。
build-icon-sets.ts：清洗固定来源的 SVG，生成图标数据与许可检查。
check-runtime.ts：核对 Node CLI 与运行时显式例外。
check-runtime.test.ts：验证命令识别、例外缺失与过期例外。
css-budget.ts：计算页面 CSS 的 gzip 大小。
css-budget.test.ts：限制 CSS 大小与 300 节点渲染耗时。
image-editor-budget.ts：检查图片编辑器懒加载分块与 worker 大小。
image-editor-budget.test.ts：验证分块唯一性、动态导入与体积预算。
image-editor-docs.test.ts：核对图片编辑器文档、工具、许可与默认值。
mcp-inspector.sh：从文件读取 Token，启动本地 MCP Inspector。
pack-smoke.ts：打包插件，核对源码导出、包身份与依赖范围。
pack-smoke.test.ts：验证真实产物与错误包形状检测。
seeded-bug.ts：应用缺陷、执行检查并恢复文件。
seeded-bug.test.ts：验证缺陷捕获、失效清单与文件恢复。
seeded-bugs.json：缺陷修改、检测命令与预期失败的固定清单。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
