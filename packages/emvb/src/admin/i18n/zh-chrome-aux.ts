/**
 * [INPUT]: 依赖后台英文显示文案。
 * [OUTPUT]: 提供分域简体中文词典。
 * [POS]: i18n 的显示字典，不保存用户内容。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
export const zhChromeAux: Record<string, string> = {
  "Accessibility: no issues found": "无障碍：未发现问题",
  "Accessibility: {count} issue": "无障碍：{count} 个问题",
  "Accessibility: {count} issues": "无障碍：{count} 个问题",
  "Accessibility score {score} of 100, {count} issue":
    "无障碍评分 {score}，满分 100，{count} 个问题",
  "Accessibility score {score} of 100, {count} issues":
    "无障碍评分 {score}，满分 100，{count} 个问题",
  A11y: "无障碍",
  Accessibility: "无障碍",
  Element: "元素",
  Page: "页面",
  Error: "错误",
  Warning: "警告",
  issue: "问题",
  Fix: "修复",
  Close: "关闭",
  Cancel: "取消",
  "No issues found. Automated checks catch some problems, not all: try the page with a keyboard and a screen reader too.":
    "未发现问题。自动检查无法覆盖所有情况，请同时用键盘和屏幕阅读器测试页面。",
  "Fixed: {fix}": "已修复：{fix}",
  "Fixed {count} accessibility issues": "已修复 {count} 个无障碍问题",
  "Fix {count} issues": "修复 {count} 个问题",
  'The alt text "{text}" doesn\'t describe the image.': "替代文本“{text}”没有描述图片内容。",
  'Another menu on this page is also named "{name}"; give each menu its own label.':
    "此页面有另一个菜单也叫“{name}”，请为每个菜单设置不同的标签。",
  '"{text}" doesn\'t say where the link goes; screen reader users often list links alone.':
    "“{text}”没有说明链接去向；屏幕阅读器用户常会单独浏览链接列表。",
  "This H{level} skips a level after an H{previous}.":
    "此 H{level} 跳过了 H{previous} 后的一级标题。",
  "This H{level} skips a level after the page start.": "页面开头的 H{level} 跳过了标题层级。",
  "Make it H{level}": "改为 H{level}",
  "Text contrast is {ratio}:1; it needs {needed}:1.":
    "文字对比度为 {ratio}:1，要求至少为 {needed}:1。",
  "Text contrast is {ratio}:1; it needs {needed}:1. Opacity on this element or a parent fades it; raise the opacity.":
    "文字对比度为 {ratio}:1，要求至少为 {needed}:1。此元素或父元素的透明度使文字变淡，请提高不透明度。",
  "This image is a link but is marked decorative, so the link has no name.":
    "此图片用作链接，却被标记为装饰性图片，导致链接没有名称。",
  "This image has no alt text.": "此图片没有替代文本。",
  "Mark as decorative": "标记为装饰性图片",
  "This SVG has no title, so screen readers can't say what it shows.":
    "此 SVG 没有标题，屏幕阅读器无法说明其内容。",
  "This icon animates for more than 5 seconds and visitors can't pause it. Shorten the duration, or keep it only if the motion is essential.":
    "此图标的动画超过 5 秒且无法暂停。请缩短时长，仅在动画必不可少时保留。",
  "This image has extra sizes but no Width (px), so the main image is left out of the list the browser picks from.":
    "此图片设置了额外尺寸，却没有宽度（px），主图片因此未进入浏览器的候选列表。",
  "This image link opens a new tab without saying so; say so in the alt text.":
    "此图片链接会在新标签页中打开，请在替代文本中说明。",
  "This field has only a placeholder, which disappears once you type; give it a label.":
    "此字段只有占位文本，输入后会消失，请为它设置标签。",
  "This field has no label, so screen readers can't say what it's for.":
    "此字段没有标签，屏幕阅读器无法说明其用途。",
  "This tab's label is blank, so the tab has no name.": "此标签页的标签为空，因此没有名称。",
  "This video's title is blank, so the player has no name.":
    "此视频的标题为空，因此播放器没有名称。",
  "This accordion item's title is blank, so it has no name.": "此折叠项的标题为空，因此没有名称。",
  "This heading is empty; screen readers list it as a heading with no words.":
    "此标题为空，屏幕阅读器会列出一个没有文字的标题。",
  "The page already has an H1; screen readers use it as the page title.":
    "此页面已有 H1，屏幕阅读器将其用作页面标题。",
  "This box is a link, but nothing inside it has text, so the link has no name.":
    "此容器用作链接，但内部没有文字，导致链接没有名称。",
  "This icon link has no title, so it has no name.": "此图标链接没有标题，因此没有名称。",
  "This icon-only button has no text or title, so it has no name.":
    "此纯图标按钮没有文字或标题，因此没有名称。",
  "This button has no text.": "此按钮没有文字。",
  "This link has no text.": "此链接没有文字。",
  "This link opens a new tab without saying so; add “(opens in a new tab)”.":
    "此链接会在新标签页中打开，请添加“（在新标签页中打开）”。",
  "Use white text": "使用白色文字",
  "Use dark text": "使用深色文字",
  "aria-hidden hides this from screen readers, but the keyboard still reaches it.":
    "aria-hidden 对屏幕阅读器隐藏了此元素，但键盘仍能访问它。",
  "Remove aria-hidden": "移除 aria-hidden",
  "This sits inside an element with aria-hidden, so screen readers skip it, but the keyboard still reaches it.":
    "此元素位于设有 aria-hidden 的元素内，屏幕阅读器会跳过它，但键盘仍能访问它。",
  "The page has no H1. Pages that use the site layout may get one from it.":
    "此页面没有 H1。使用站点布局的页面可由布局提供 H1。",
  Images: "图片",
  "Page weight": "页面体积",
  "{kind} weight": "{kind} 体积",
  "{size} of {budget}": "{size}，预算 {budget}",
  "Zero JavaScript: this {noun} is plain HTML and CSS.":
    "零 JavaScript：此{noun}仅包含 HTML 和 CSS。",
  page: "页面",
  "theme part": "主题部件",
  "Scripts: {scripts}.": "脚本：{scripts}。",
  "Form submission script": "表单提交脚本",
  "Tabs keyboard script": "标签页键盘脚本",
  "Dropdown menu script": "下拉菜单脚本",
  "Heaviest sections": "体积最大的区块",
  " · {count} image": " · {count} 张图片",
  " · {count} images": " · {count} 张图片",
  "HTML and CSS are gzipped estimates; image sizes come from their width and height.":
    "HTML 和 CSS 按 gzip 压缩后的体积估算；图片体积根据宽度和高度估算。",
  "{kind} is {size}, over the {budget} budget.": "{kind} 为 {size}，超出 {budget} 的预算。",
  "{count} video embed load a third-party player (about {size} each).":
    "{count} 个嵌入视频会加载第三方播放器（每个约 {size}）。",
  "{count} video embeds load a third-party player (about {size} each).":
    "{count} 个嵌入视频会加载第三方播放器（每个约 {size}）。",
  "The first section's image isn't marked Priority, so it loads late; mark the hero image Priority.":
    "首个区块的图片未标记为优先加载，会较晚加载；请将首屏主图标记为优先加载。",
  "Share as a playground link": "分享为演示链接",
  "Anyone with the link can open a copy of this page in the EmVB playground and edit it in their own browser. The page travels inside the link; nothing is uploaded.":
    "获得链接的人可以在 EmVB 演示环境中打开此页面的副本，并在自己的浏览器中编辑。页面数据包含在链接内，不会上传。",
  "Include Site styles (colours, fonts, sizes, classes)": "包含站点样式（颜色、字体、尺寸、类）",
  "Couldn't build the link: {error}": "无法生成链接：{error}",
  Link: "链接",
  "Building the link…": "正在生成链接…",
  "{count} characters": "{count} 个字符",
  ". That's long: some chat apps cut links this size, so paste it somewhere that keeps it whole.":
    "。链接较长，部分聊天应用会截断，请粘贴到能保留完整链接的位置。",
  "{count} image or video uses an address on this site only, so the playground shows it empty.":
    "{count} 个图片或视频使用仅此站点可用的地址，在演示环境中将显示为空。",
  "{count} images or videos use an address on this site only, so the playground shows them empty.":
    "{count} 个图片或视频使用仅此站点可用的地址，在演示环境中将显示为空。",
  "Unsaved changes are included. Posts, forms and uploads stay on this site.":
    "包含未保存的修改。文章、表单和上传文件仍保留在此站点。",
  "Copied.": "已复制。",
  "Copy didn't work here: select the link and copy it.": "复制失败，请选中链接后手动复制。",
  "Copy link": "复制链接",
  "Keyboard shortcuts": "键盘快捷键",
  " or ": " 或 ",
  "Shortcuts don't fire while a text field has focus, except Ctrl/Cmd+S and Ctrl/Cmd+K. In a dialog, only Ctrl/Cmd+S fires.":
    "文本输入框获得焦点时，仅 Ctrl/Cmd+S 和 Ctrl/Cmd+K 可用。弹窗内仅 Ctrl/Cmd+S 可用。",
  "Command palette: insert, jump, apply a class, run an action":
    "命令面板：插入、跳转、应用类、执行操作",
  "Move focus between regions": "在区域间移动焦点",
  "Next or previous element": "下一个或上一个元素",
  "Select first child / parent": "选择第一个子元素 / 父元素",
  "Clear selection": "取消选择",
  "Expand or collapse (Layers)": "展开或折叠（图层）",
  "Rename (layer or class chip)": "重命名（图层或类标签）",
  "Move up / down": "上移 / 下移",
  "Move out / in": "移出 / 移入",
  Duplicate: "复制副本",
  "Copy / paste element": "复制 / 粘贴元素",
  "Paste style": "粘贴样式",
  Delete: "删除",
  "Undo / redo": "撤销 / 重做",
  "Save draft": "保存草稿",
  "EmVB needs a larger screen": "EmVB 需要更宽的屏幕",
  "The editor works on screens at least 1024 px wide, and 1280 px or wider is best.":
    "编辑器要求屏幕宽度至少为 1024 px，建议使用 1280 px 或更宽的屏幕。",
  "Back to {name}": "返回{name}",
  "Give the section a name.": "请为区块命名。",
  "Save as section": "另存为区块",
  "Reuse this element and everything inside it on any page.":
    "在任意页面中复用此元素及其全部内容。",
  Name: "名称",
  Kind: "类型",
  Copy: "副本",
  "Adds to My sections. Each insert is its own copy you edit on that page.":
    "添加到“我的区块”。每次插入都会创建独立副本，可在该页面中单独编辑。",
  Synced: "同步",
  "Makes a Section theme part. Edit it once in Theme Builder and every page that uses it changes.":
    "创建区块主题部件。在主题构建器中修改后，所有使用它的页面都会同步更新。",
  "Saving section…": "正在保存区块…",
  "Make synced section": "创建同步区块",
  "Save section": "保存区块",
  "Delete “{name}”?": "删除“{name}”？",
  "It leaves My sections. Pages that already use a copy keep it.":
    "此区块将从“我的区块”中移除。页面中已有的副本会保留。",
  "Delete section": "删除区块",
  "This site doesn't keep saved versions of this {noun}, so there's no timeline to show.":
    "此站点不保留此{noun}的已保存版本，因此无法显示版本历史。",
  "Couldn't load versions: {error}": "无法加载版本：{error}",
  "Version timeline": "版本历史",
  "Version timeline status": "版本历史状态",
  "Loading versions…": "正在加载版本…",
  Retry: "重试",
  "No saved versions yet. Each save adds one.": "暂无已保存版本。每次保存都会新增一个版本。",
  "No saved versions match this filter. Choose All to see every version.":
    "没有符合筛选条件的已保存版本。选择“全部”以查看所有版本。",
  "Show versions by": "按保存者筛选版本",
  All: "全部",
  People: "人工",
  Agents: "代理",
  "Saved versions": "已保存版本",
  " (no layout)": "（无布局）",
  Agent: "代理",
  "Saved version": "已保存版本",
  Now: "当前",
  "Current page": "当前页面",
  "Added since": "此后新增",
  "Removed since": "此后移除",
  Changed: "已修改",
  Moved: "已移动",
  Unchanged: "未修改",
  " · {count} element": " · {count} 个元素",
  " · {count} elements": " · {count} 个元素",
  "That section isn't in this version.": "此版本中没有该区块。",
  "The page would have too many elements.": "恢复后页面元素数量将超出限制。",
  "Section restored": "已恢复区块",
  "Restore this section": "恢复此区块",
  "Restoring changes the page here; undo takes it back, and nothing is saved until you save.":
    "恢复会修改当前页面，可通过撤销回退。点击保存后才会保存修改。",
  "Version restored": "已恢复版本",
  "Restore this whole version": "恢复整个版本",
  "This version has no page layout to compare.": "此版本没有可供比较的页面布局。",
};
