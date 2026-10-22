# packages/emvb/src/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

宿主从 `index.ts` 注册唯一 `emvb` 插件。
运行时按边界分别加载服务端、后台与 SSR。

## 成员清单

index.ts：插件描述符与配置入口，传递宿主画布配置。
constants.ts：包名、插件版本、集合名与稳定存储身份。
core/：布局 schema、纯校验、迁移、树操作与 HTML/CSS 生成。
server/：可信 hooks、角色校验、设计草稿与插件路由。
admin/：React 画布、后台页面、字段组件与公开 API 客户端。
astro/：请求内容解析、预览分流、主题匹配与服务端渲染。
mcp/：代理工具定义、输入约束与受控内容操作。

## Page canvas 数据流

宿主显式声明允许画布布局的集合。
React 字段组件读取表单中的布局值。
全屏画布 Apply 将布局交回同一表单。
宿主 Page 按自身机制保存，原生 Page 自动存草稿。
Cancel 不回退已 Apply 且已自动保存的值。
可信保存 hook 校验配置集合的布局字段。
宿主 Page 负责保存、修订、预览与发布。
SSR 解析器按显式集合读取布局。
旧 EmVB 页面继续使用默认独立集合。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
