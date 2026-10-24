# packages/emvb-mcp/src/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

CLI 只把协议数据写入 stdout。
诊断信息写入 stderr，不输出 Token。
远程站点是内容权限与发布状态的可信边界。

## 成员清单

bridge.ts：注册 MCP 工具、资源与提示，统一桥接版本与超时反馈。
cli.ts：解析配置，创建远程客户端并启动 stdio 服务。
content.ts：在打包时载入布局说明与代理技能文本。
options.ts：校验站点地址、Token 来源与发布工具开关。
remote.ts：重试建连并限制调用时长，工具调用不重放，错误凭据脱敏。
token-file.ts：读取 Token 文件，提示文件权限与读取失败。
text.d.ts：为打包时内联的 Markdown 文本声明类型。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
