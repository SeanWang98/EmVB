/**
 * [INPUT]: 依赖图片节点与后台翻译器。
 * [OUTPUT]: 提供缺失或无效替代文本的说明。
 * [POS]: 图片字段的无障碍提示；不改写图片描述。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { createTranslator, type Translate } from "../../../i18n/index.ts";
import type { LayoutNode } from "../../../../core/index.ts";

/** Alt text that names the file or the element rather than the picture (W-265). */
const PLACEHOLDER = /^(image|picture|photo|img)$/i;
const FILE_NAME =
  /\.(jpe?g|png|gif|webp|avif|svg|bmp|tiff?)$|^(img|dsc|dscn|pxl|image|photo|screenshot|screen shot)[\s_-]*\d/i;

/**
 * W-265: a note for an Image whose alt won't help a screen reader user: none on a non-decorative
 * image (it then reads as decorative), the "Image" placeholder, or a camera or file name. Undefined
 * when the alt looks fine, the image is decorative or has no picture yet.
 */
export function imageAltNote(
  node: LayoutNode,
  t: Translate = createTranslator("en"),
): string | undefined {
  if (node.type !== "image") return undefined;
  const props = node.props as { src?: string; alt?: string; decorative?: boolean };
  if (props.decorative === true || !props.src?.trim()) return undefined;
  const alt = (props.alt ?? "").trim();
  if (!alt) {
    return t(
      "This image has no alt text, so screen readers skip it. Describe it, or turn on Decorative if it only decorates.",
    );
  }
  if (PLACEHOLDER.test(alt) || FILE_NAME.test(alt)) {
    return t(
      "“{text}” doesn't say what the image shows. Describe it for people who can't see it.",
      { text: alt },
    );
  }
  return undefined;
}
