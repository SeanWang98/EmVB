# 将 EmVB 嵌入 Page

此功能由本 fork 提供。
EmVB 画布编辑现有 Page 的 `layout` 字段。
Page 持有唯一内容记录、slug、SEO 与发布状态。
无需为同一页面创建 `emvb_pages` 副本。
EmDash 核心保持官方依赖。

## 1. 声明宿主集合

在宿主 `astro.config.mjs` 注册：

```js
import { emvb } from "@perkyzz/emvb";

emvb({
  canvasCollections: ["pages"],
  canvasStyles: ["/styles/site.css"],
});
```

`canvasCollections` 允许服务器校验这些集合的画布布局。
此配置不会创建集合或字段。
仅列出使用 `layout` JSON 字段的集合。
配置接受小写字母开头的集合 slug。
其余字符限小写字母、数字与下划线。
最长 63 字符；空白会修剪，重复值会合并。
`emvb_` 与 `system_` 前缀保留给内部集合。
未配置时，旧独立页面模式保持原行为。

配置变化后，完整重启宿主开发进程。

## 2. 新增布局字段

通过 EmDash 结构 API，为 `pages` 新增字段：

```json
{
  "slug": "layout",
  "label": "Page canvas",
  "type": "json",
  "widget": "emvb:canvas",
  "required": false
}
```

空数据库可在集合种子中加入同一字段定义。
已有数据库须通过结构 API 新增字段。
修改种子不会替已有数据库补字段。
保留 Page 的 drafts、revisions、preview 与 seo 支持。

不要将既有 `content` Blocks 字段改为 JSON。
旧 Blocks 与新画布是两种数据格式。
需要保留原正文时，继续保留 `content` 字段。
迁移时显式转换布局，再写入 `layout`。
仅切换 widget 不会转换既有内容。

## 3. 在 Page 中编辑

1. 打开 EmDash 的 Page 表单。
2. 在 Page canvas 字段点击 **Edit with EmVB**。
3. 在全屏画布编辑正文与局部样式。
4. 点击 **Apply changes**，返回原表单。
5. 等待 Page 自动保存完成，再按需预览或发布。

Apply 仅调用字段的 `onChange`。
宿主 Page 决定如何持久化该字段值。
当前原生 Page 会自动保存草稿。
无需再点击 Save，但须等待自动保存完成。
Apply 不调用独立 EmVB 页面的保存接口。
它不会自动发布 Page。
表单内其他未保存字段会保留。
未保存的 Page 也能编辑画布。
离开 Page 前，确认宿主的草稿保存状态。

点击 **Cancel** 放弃本次尚未 Apply 的正文修改。
它不回退之前已经 Apply 的值。
之前 Apply 的值可能已由宿主自动保存。
上传媒体、保存片段与 Site styles 是共享资源。
这些资源的独立写入不随 Cancel 撤回。

Page 继续使用 EmDash 的权限、修订与发布流程。
服务器保存 hook 校验布局 schema 与节点嵌套。
无效布局会中止保存。
空 `layout` 保留原正文渲染路径。

低于编辑者的角色不能清空既有画布来绕过校验。
原本无画布的普通 Page 保留原有编辑权限。
MCP 发布策略作用于整个配置集合。
布局为空时，代理仍不能绕过发布开关。
此约束也覆盖 EmDash 通用内容工具的发布调用。
既有 EmVB MCP 页面工具仍操作独立 `emvb_pages`。
Page 字段接入不改变这些工具的目标集合。

## 4. 在 Astro 中读取同一 Page

公开路由显式选择宿主集合：

```astro
---
import { EmVBPage, resolveEmVBPage } from "@perkyzz/emvb/astro";

const canvas = await resolveEmVBPage(Astro, {
  collection: "pages",
});
---

{canvas && <EmVBPage page={canvas} />}
```

首页没有动态 slug，须显式指定：

```ts
const canvas = await resolveEmVBPage(Astro, {
  collection: "pages",
  slug: "home",
});
```

解析结果的 `entry` 就是原 Page。
用此条目读取 SEO，避免维护第二份元数据。
解析结果的 `collection` 保留来源集合。
签名预览读取该集合授权的草稿。
预览响应须使用 `Cache-Control: private, no-store`。

Page 不存在或 `layout` 为空时，解析器返回 `null`。
宿主随后选择原正文回退或 404。
宿主集合固定使用 `site-layout`。
页眉、页脚继续由宿主外壳与 Theme Builder 输出。
`blank` 独立文档模式仅适用于 `emvb_pages`。

按需挂载 forms、tabs 与 menu 运行时。
完整渲染例子见 [安装指南](install-in-a-host-site.md#3-public-route)。
SSR 渲染与编辑画布应加载相同宿主样式。

## 5. 保留独立发布边界

Page 发布只发布该 Page 的内容字段。
Site styles 仍有独立草稿与 **Publish styles**。
画布 Apply 不发布 Site styles 草稿。
共享片段与 Theme Builder 继续分别保存和发布。
页眉、页脚的显示条件仍由主题部件决定。

旧 `emvb:layout` 字段继续提供只读摘要入口。
旧 Pages VisualBuilder 继续保存 `emvb_pages`。
旧页面、主题部件与已存布局无需转换格式。
默认 `resolveEmVBPage(Astro)` 仍读取 `emvb_pages`。

若同一 slug 已有独立 EmVB 页面，先确定路由优先级。
将布局复制回原 Page 后，校验草稿与公开渲染。
确认 Page 发布成功，再撤回旧副本的发布。
保留旧副本作恢复点，避免两条发布记录争用 URL。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
