/**
 * [INPUT]: 依赖元素设置面板的英文显示键。
 * [OUTPUT]: 提供简体中文界面文案；插值保留用户值。
 * [POS]: 后台语言字典的字段域；不改写布局数据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { zhFieldStyle } from "./zh-field-style.ts";
import { zhFieldMedia } from "./zh-field-media.ts";
export const zhFields: Record<string, string> = {
  ...zhFieldStyle,
  ...zhFieldMedia,
  "Couldn't read image dimensions.": "无法读取图片尺寸。",
  "CSS id": "CSS id",
  "Text direction": "文本方向",
  "Site default": "站点默认",
  "Left to right": "从左到右",
  "Right to left": "从右到左",
  "Use a whole number of px from 1 to 3840.": "请输入 1 到 3840 之间的整数像素值。",
  "Query container": "查询容器",
  "Styles from container width (px)": "从此容器宽度开始应用样式（px）",
  "Use current style at that width": "在此宽度使用当前样式",
  "Replace the {count} styles set for this width with the current style?":
    "用当前样式替换此宽度下的 {count} 项样式？",
  "Replace styles": "替换样式",
  "Keep them": "保留原样式",
  "Query container makes this box the size children measure. The styles listed here apply inside @container once the container is at least that wide, not the viewport.":
    "查询容器让子元素以此容器的尺寸为基准。当容器达到指定宽度时，@container 中的样式开始生效；宽度基于容器，而非视口。",
  Attributes: "属性",
  Name: "名称",
  "Add attribute": "添加属性",
  "data-* and aria-* names only. Event handlers are refused.":
    "仅允许 data-* 和 aria-* 属性。不允许事件处理程序。",
  Visitors: "访客",
  "Show to": "显示对象",
  Everyone: "所有人",
  "Only visitors who match": "仅匹配规则的访客",
  "Everyone except visitors who match": "除匹配规则以外的访客",
  "Countries (two-letter codes)": "国家或地区（两字母代码）",
  Devices: "设备",
  Visit: "访问类型",
  "New or returning": "新访客或回访访客",
  "First visit": "首次访问",
  "Returning visitor": "回访访客",
  "Segments (from your site)": "访客分组（来自站点）",
  "{name} isn't a segment name. Use letters, numbers, and : _ -":
    "{name} 不是有效的分组名称。请使用字母、数字和 : _ -",
  "Add a country, device, segment, or time. Until then, everyone sees this.":
    "请添加国家或地区、设备、分组或时间规则。在此之前，所有人均可见。",
  "Add a country, device, segment, or time. Until then, this is hidden from every visitor.":
    "请添加国家或地区、设备、分组或时间规则。在此之前，所有访客均不可见。",
  "Hours (24 h, empty = all day)": "时段（24 小时制，留空表示全天）",
  "From hour": "开始小时",
  "To hour": "结束小时",
  "Days (none = every day)": "星期（不选表示每天）",
  "Time zone": "时区",
  "Unknown time zone. Use a name such as America/Toronto.":
    "无法识别此时区。请使用 America/Toronto 等时区名称。",
  "Add a rule: with none, every visitor matches.": "请添加规则。不设置规则时，所有访客均匹配。",
  "The server checks these on each visit, with no script. A rule it can't check (no country from the host, or segments your site doesn't pass) doesn't match. The canvas shows this element to you either way.":
    "服务器在每次访问时检查规则，无需脚本。无法检查的规则不匹配，例如宿主未提供国家或地区，或站点未传递访客分组。画布始终向编辑者显示此元素。",
  "Dynamic data": "动态数据",
  "Show live data instead of the typed value. The typed value is used when there is none.":
    "显示实时数据。没有数据时，使用手动输入的值。",
  "{name} source": "{name}来源",
  "Typed value": "手动输入值",
  "Not a link on this site, so the typed value shows.": "此链接不属于本站，因此显示手动输入值。",
  "Not a usable URL, so the typed value shows.": "URL 无效，因此显示手动输入值。",
  "No value here, so the typed value shows.": "没有数据，因此显示手动输入值。",
  "Live: ": "实时值：",
  "Allow outside sites for {name}": "允许{name}使用外部站点",
  "Phishing risk: anyone can share a link to this page that sends visitors to any site or shows any image under your address. Only allow this if you trust where those links come from.":
    "钓鱼风险：任何人都能分享指向此页的链接，并将访客带到任意站点，或在你的地址下显示任意图片。仅在信任链接来源时允许。",
  "Only links and images on this site are used. Others show the typed value.":
    "仅使用本站的链接和图片。其他地址显示手动输入值。",
  "{name} parameter name": "{name}参数名",
  "{name} field name": "{name}字段名",
  "Preview URL parameters (editor only)": "预览 URL 参数（仅编辑器）",
  "Section part": "区块部件",
  "Another field in this form uses this name, so only one value is submitted. Give each field its own name.":
    "此表单中已有字段使用此名称，因此只能提交一个值。请为每个字段设置独立名称。",
  "Media library needs a signed-in session.": "请登录后使用媒体库。",
  "Tablet {value}": "平板 {value}",
  "Mobile {value}": "手机 {value}",
  "{values}. Switch the canvas to Tablet or Mobile to change them.":
    "{values}。切换画布到平板或手机以修改这些值。",
  "Same as {device} ({value})": "与{device}相同（{value}）",
  "{name} on {device}": "{device}上的{name}",
  "One of these lines can't be saved.": "其中一行无法保存。",
  "One per line.": "每行一项。",
  "Enter a whole number from {min} to {max}.": "请输入 {min} 到 {max} 之间的整数。",
  "Enter 0 or a positive whole number.": "请输入 0 或正整数。",
  "Enter a positive whole number.": "请输入正整数。",
  "Enter 0 or more.": "请输入大于或等于 0 的值。",
  "Enter a number up to {count}.": "请输入不大于 {count} 的数值。",
  "Text can be up to {count} characters. Shorten it.": "文本最多 {count} 个字符。请缩短文本。",
  "{name} can't be empty.": "{name}不能为空。",
  "This value can't be saved.": "此值无法保存。",
  "Give the field a name.": "请为字段命名。",
  "Use at most {count} characters.": "最多输入 {count} 个字符。",
  "Start with a letter, then use letters, digits, - or _ (no spaces).":
    "以字母开头，后续仅使用字母、数字、- 或 _，不含空格。",
  "Field name": "字段名",
  "Choose a form on the parent Form element to list its fields, or enter a field name manually.":
    "在父级表单元素中选择表单以列出字段，或手动输入字段名。",
  "Loading form fields… You can enter a field name.": "正在加载表单字段…也可直接输入字段名。",
  "Could not load form fields. Enter a field name manually.":
    "无法加载表单字段。请手动输入字段名。",
  "This form has no fields yet. Enter a field name manually.":
    "此表单还没有字段。请手动输入字段名。",
  Field: "字段",
  "Form fields status": "表单字段状态",
  "{name} (paused)": "{name}（已暂停）",
  "The forms plugin is not installed. Form elements are unavailable until it is added to the site.":
    "尚未安装表单插件。安装后才能使用表单元素。",
  "Current id (not in list)": "当前 id（不在列表中）",
  "Choose a form…": "选择表单…",
  "Choose a field…": "选择字段…",
  Form: "表单",
  "Form id": "表单 id",
  "Create or edit forms": "创建或编辑表单",
  "Paste a forms-plugin form id.": "粘贴表单插件中的表单 id。",
  "Open Forms": "打开表单",
  "{name} part id": "{name}部件 id",
  "Optional published {name} theme part. Leave blank to use nested elements.":
    "可选的已发布{name}主题部件。留空则使用嵌套元素。",
  "Open Theme Builder": "打开主题构建器",
  "Could not load {name} parts. Paste a theme-part id": "无法加载{name}部件。请粘贴主题部件 id",
  ", or ": "，或",
  "No {name} theme parts yet. Paste an id": "还没有{name}主题部件。请粘贴 id",
  "create one in Theme Builder": "在主题构建器中创建",
  "has no field on this form ({name}).": "在此表单中没有对应字段（{name}）。",
  "is hidden on every device.": "在所有设备上均隐藏。",
  "is hidden on {devices}.": "在{devices}上隐藏。",
  " and ": "和",
  "is shown only to some visitors: {who}.": "仅向部分访客显示：{who}。",
  "“{name}” is required by the form but has no field here, so the form can't be sent. Add a field bound to {field}, or make it optional in Forms.":
    "“{name}”是必填项，但此处没有对应字段，导致表单无法提交。请添加绑定 {field} 的字段，或在表单插件中改为选填。",
  "“{name}” is required but shown only to some visitors ({who}), so everyone else can't send the form. Remove the rule from the field, or make it optional in Forms.":
    "“{name}”是必填项，但仅向部分访客显示（{who}），其他访客无法提交表单。请移除字段规则，或在表单插件中改为选填。",
  "on every device": "在所有设备上",
  "on {devices}": "在{devices}上",
  "“{name}” is required but hidden {where}, so visitors there can't send the form. Show the field there, or make it optional in Forms.":
    "“{name}”是必填项，但{where}隐藏，导致这些访客无法提交表单。请显示此字段，或在表单插件中改为选填。",
  "A field needs a choice element": "一个字段需要选项元素",
  "{count} fields need a choice element": "{count} 个字段需要选项元素",
  "only accepts one of its options in Forms, so typed or ticked answers are refused. Use a Select or Radio element for it.":
    "在表单插件中仅接受预设选项，因此不接受手动输入或复选框答案。请使用下拉选择或单选元素。",
  "A field's limits can't be met": "一个字段的限制条件无法满足",
  "{count} fields' limits can't be met": "{count} 个字段的限制条件无法满足",
  "has a minimum length above its maximum length": "最小长度大于最大长度",
  "has a minimum length above its maximum length and a minimum value above its maximum":
    "最小长度大于最大长度，且最小值大于最大值",
  "has a minimum value above its maximum": "最小值大于最大值",
  ", so no answer is accepted. Fix the limits in Forms.":
    "，因此任何答案都不会被接受。请在表单插件中修正限制条件。",
  "A required field can't be filled in": "一个必填字段无法填写",
  "{count} required fields can't be filled in": "{count} 个必填字段无法填写",
  "Visitors who can't fill a required field can't send the form. Show the field to everyone, or make it optional in Forms.":
    "无法填写必填字段的访客无法提交表单。请向所有人显示此字段，或在表单插件中改为选填。",
  "No tabs yet. Add a tab, then put elements in its panel on the canvas.":
    "还没有选项卡。请添加选项卡，再在画布中的面板内放入元素。",
  "No items yet. Add an item, then put elements in its body on the canvas.":
    "还没有项目。请添加项目，再在画布中的正文内放入元素。",
  "Tab {count} label": "选项卡 {count} 标签",
  "Item {count} title": "项目 {count} 标题",
  "Edit {name} {count}": "编辑{name} {count}",
  "Select {name} {count} to edit its settings and content": "选择{name} {count} 以编辑设置和内容",
  "Move {name} {count} up": "上移{name} {count}",
  "Move {name} {count} down": "下移{name} {count}",
  "Delete {name} {count}": "删除{name} {count}",
  "Add {name}": "添加{name}",
  "Tabs can show up to {count} tabs.": "最多显示 {count} 个选项卡。",
  "Items can show up to {count} items.": "最多显示 {count} 个项目。",
  "Start with a letter; use letters, digits, - and _ only (up to 64).":
    "以字母开头，仅使用字母、数字、- 和 _，最多 64 个字符。",
  "Ids starting with emvb- are reserved; choose another.":
    "以 emvb- 开头的 id 为系统保留值，请换一个。",
  "Another element already uses this CSS id.": "其他元素已使用此 CSS id。",
  "Use data-* or aria-*, then a lowercase letter, digits or -.":
    "使用 data-* 或 aria-*，后接小写字母、数字或 -。",
  "This name is reserved for the editor or forms.": "此名称为编辑器或表单保留。",
  "This name is already used on this element.": "此元素已使用此名称。",
  "Values are at most {count} characters.": "属性值最多 {count} 个字符。",
  "Values can't hold line breaks or control characters.": "属性值不能包含换行或控制字符。",
  "This image has no alt text, so screen readers skip it. Describe it, or turn on Decorative if it only decorates.":
    "此图片没有替代文本，屏幕阅读器会跳过它。请描述图片；若仅作装饰，请启用“装饰性图片”。",
  "“{text}” doesn't say what the image shows. Describe it for people who can't see it.":
    "“{text}”没有说明图片内容。请为无法看见图片的人描述内容。",
  "1 external image": "1 张外部图片",
  "{count} external images": "{count} 张外部图片",
  "Left out {what}. An SVG can only show pictures from the media library or embedded PNG, JPEG, WebP or GIF data.":
    "已移除{what}。SVG 仅能显示媒体库图片或嵌入的 PNG、JPEG、WebP、GIF 数据。",
  "Paste SVG markup to show a graphic here.": "粘贴 SVG 标记以显示图形。",
  "This SVG can't be shown, so visitors see an empty box. Check that it is complete and has no scripts, event handlers (onload…), styles, links or outside URLs.":
    "此 SVG 无法显示，访客会看到空框。请检查标记是否完整，且不含脚本、事件处理程序（onload…）、样式、链接或外部 URL。",
  "This URL isn't allowed, so the button does nothing on the live page. Use a full URL or a path such as /contact.":
    "此 URL 不被允许，线上按钮不会执行动作。请使用完整 URL 或 /contact 等路径。",
  "No URL: this button does nothing on the live page. Add a URL, or give it an HTML id (Advanced) for a popup's click trigger.":
    "未设置 URL，线上按钮不会执行动作。请添加 URL，或在“高级”中设置 HTML id 作为弹窗的点击触发目标。",
  "This URL isn't allowed, so the link only jumps to the top of the page. Use a full URL or a path such as /contact.":
    "此 URL 不被允许，链接仅跳到页首。请使用完整 URL 或 /contact 等路径。",
  "No URL: this link only jumps to the top of the page. Add a URL.":
    "未设置 URL，链接仅跳到页首。请添加 URL。",
  "A Loop lists posts only in an Archive template. Here the editor shows sample posts, but the live page shows nothing. Build post lists in Theme Builder › Archive.":
    "循环仅在归档模板中列出文章。编辑器此处显示示例文章，线上页面不显示。请在“主题构建器 › 归档”中搭建文章列表。",
  "Pagination shows only in an Archive template with more than one page. Here the live page shows nothing.":
    "分页仅在超过一页的归档模板中显示。此处在线上页面不显示。",
  "Links can't contain spaces. Replace each space with %20.":
    "链接不能包含空格。请将空格替换为 %20。",
  "Only web (https://), email (mailto:) and phone (tel:) links are allowed.":
    "仅允许网页（https://）、邮箱（mailto:）和电话（tel:）链接。",
  Sun: "周日",
  Mon: "周一",
  Tue: "周二",
  Wed: "周三",
  Thu: "周四",
  Fri: "周五",
  Sat: "周六",
  tablet: "平板",
  mobile: "手机",
  desktop: "桌面",
  Tablet: "平板",
  Mobile: "手机",
  Desktop: "桌面",
  item: "项目",
  tab: "选项卡",
  Item: "项目",
  Tab: "选项卡",
  Items: "项目",
  Tabs: "选项卡",
  "Loop item": "循环项",
  "Use nested elements": "使用嵌套元素",
  "Inline section": "内联区块",
  draft: "草稿",
  published: "已发布",
  pending: "待审核",
  archived: "已归档",
  trash: "回收站",
  "For images that add nothing to the text. Screen readers skip them.":
    "用于不补充文字信息的图片。屏幕阅读器会跳过它们。",
  "For the first large image on the page. Others load as they scroll into view.":
    "用于页面首张大图。其他图片在滚动进入视口时加载。",
  "For icons that repeat nearby text. Screen readers skip them.":
    "用于重复附近文字的图标。屏幕阅读器会跳过它们。",
  "For graphics that add nothing to the text. Screen readers skip them.":
    "用于不补充文字信息的图形。屏幕阅读器会跳过它们。",
  "The dropdown spans the width of the menu.": "下拉面板占满菜单宽度。",
  "Post field": "文章字段",
  "Site setting": "站点设置",
  "URL parameter": "URL 参数",
  "Nothing inside this box has text, so screen readers announce it only as “link”. Add text inside it, or an aria-label under Custom attributes.":
    "此容器内没有文本，屏幕阅读器只能读作“链接”。请添加文本，或在“自定义属性”中添加 aria-label。",
  "This box's Link isn't used: something inside it is already a link, button, menu, form field, accordion or video, and links can't hold those. Put the Link on an element inside instead.":
    "此容器的链接不会生效：内部已有链接、按钮、菜单、表单字段、折叠面板或视频，链接不能包含这些元素。请改为在内部元素上设置链接。",
  "Use a full URL such as https://example.com or a path such as /pricing.":
    "请使用 https://example.com 等完整 URL，或 /pricing 等路径。",
  Row: "横向",
  Column: "纵向",
  "Row reverse": "横向反转",
  "Column reverse": "纵向反转",
  Start: "起始对齐",
  Center: "居中",
  End: "末端对齐",
  "Space between": "两端对齐",
  "Space around": "两侧等距",
  "Space evenly": "均匀分布",
  Stretch: "拉伸",
  Baseline: "基线对齐",
  "No wrap": "不换行",
  Wrap: "换行",
  "Wrap reverse": "反向换行",
};
