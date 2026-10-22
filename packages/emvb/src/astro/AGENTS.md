# packages/emvb/src/astro/

> L2 | 父级: [../AGENTS.md](../AGENTS.md)

本模块按请求解析公开内容与签名预览。
宿主页面可显式指定带画布字段的集合。
布局解析不创建内容、不改变发布状态。

## 直接文件

EmVBPage.astro：输出页面 HTML 与 CSS，支持独立文档及 SEO。
content-port.ts：封装 EmDash 内容读取端口，供测试替换。
env.d.ts：补齐普通 TypeScript 的 Astro 模块声明。
forms-definitions.ts：收集表单引用并加载公开字段定义。
forms-definitions.test.ts：验证表单引用去重与公开定义降级。
index.ts：公开页面、主题解析与请求上下文接口。
loop-options.test.ts：验证循环查询过滤、分页与链接选项。
render-session.ts：按请求复用设计、表单、站点与布局读取。
render-session.test.ts：验证同请求去重与跨请求隔离。
render.ts：读取已发布设计，校验布局并生成渲染结果。
render.test.ts：验证设计读取降级与布局渲染边界。
request-data.ts：组装访客、URL 参数、站点与循环绑定数据。
request-data.test.ts：验证同步区块的数据依赖与缓存边界。
resolve-theme.ts：匹配主题部件并解析所引用的区块模板。
resolve-theme.test.ts：验证主题匹配顺序、预览与无效部件降级。
resolve.ts：按集合和 slug 解析画布，空宿主字段返回回退。
resolve.test.ts：验证路由、集合身份、签名预览与空字段回退。
theme-context.ts：将路径与内容身份转换为主题请求上下文。
theme-context.test.ts：验证首页、归档、正文与特殊页上下文。
theme-context-golden.test.ts：固定路径与上下文提示的历史输出。
theme-posts.ts：将内容字段投影为主题正文及媒体绑定值。
theme-posts.test.ts：验证正文、图片、时间与原始字段投影。
visitor.ts：组装宿主访客事实与持久化 A/B 分配。
visitor.test.ts：验证访客识别、Cookie 与私有缓存行为。

## 直接子目录

floats/：浮动主题部件的浏览器定位与交互。
forms/：公开表单提交与成功布局运行时。
menu/：菜单弹出层的键盘、焦点与开合行为。
popups/：弹窗触发、频率与关闭运行时。
tabs/：标签面板的键盘交互运行时。

## Page canvas 数据流

`resolveEmVBPage` 默认读取旧独立页面集合。
指定 `collection` 后读取同一宿主 Page。
返回值保留条目与集合，供宿主生成 SEO。
宿主画布始终使用站点外壳。
空 `layout` 返回 null，宿主渲染原正文。
请求级会话复用主题与正文的设计读取。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
