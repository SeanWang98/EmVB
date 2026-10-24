/**
 * [INPUT]: 依赖英文翻译器与图片会话的异步异常。
 * [OUTPUT]: 提供 ImageMessage、ImageEditorError 与 imageError。
 * [POS]: 保存源文案与参数，语言切换不重启图片会话。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { createTranslator } from "../i18n/index.ts";

export type ImageMessage = {
  message: string;
  values?: Readonly<Record<string, string | number>>;
};

export class ImageEditorError extends Error implements ImageMessage {
  readonly source: string;
  readonly values: ImageMessage["values"];

  constructor(source: string, values?: ImageMessage["values"], options?: ErrorOptions) {
    super(createTranslator("en")(source, values), options);
    this.source = source;
    this.values = values;
  }
}

export function imageError(error: unknown, fallback: string): ImageMessage {
  if (error instanceof ImageEditorError) return { message: error.source, values: error.values };
  return { message: error instanceof Error && error.message ? error.message : fallback };
}
