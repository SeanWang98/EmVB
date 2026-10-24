/**
 * [INPUT]: 依赖核心设计导入错误及本地化翻译器。
 * [OUTPUT]: 导出 designImportError，适配已知导入错误模板。
 * [POS]: UI 文案边界；只翻译已知错误，不改写用户标识或核心协议。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import type { Translate } from "../../i18n/index.ts";

const REPEATED =
  /^That file has two (classes|variables) with the id "([^"]*)"\. Give one of them a different id, then import it again\.$/;
const TOO_LARGE =
  /^That design is (\d+) KB; site styles can be at most (\d+) KB\. Remove some classes or variables from the file, then import it again\.$/;

export function designImportError(message: string, t: Translate): string {
  const repeated = REPEATED.exec(message);
  if (repeated) {
    return t(
      repeated[1] === "classes"
        ? 'That file has two classes with the id "{id}". Give one of them a different id, then import it again.'
        : 'That file has two variables with the id "{id}". Give one of them a different id, then import it again.',
      { id: repeated[2] ?? "" },
    );
  }
  const size = TOO_LARGE.exec(message);
  return size
    ? t(
        "That design is {size} KB; site styles can be at most {limit} KB. Remove some classes or variables from the file, then import it again.",
        { size: size[1] ?? "", limit: size[2] ?? "" },
      )
    : t(message);
}
