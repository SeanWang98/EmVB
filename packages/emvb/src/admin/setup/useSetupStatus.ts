/**
 * [INPUT]: 依赖集合探测、初始化计划与界面翻译。
 * [OUTPUT]: 提供初始化、升级和重试状态。
 * [POS]: 缓存原始集合，渲染时翻译冲突；语言切换不重读 API。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import * as React from "react";
import { PAGES_COLLECTION, THEME_PARTS_COLLECTION } from "../../constants.ts";
import type { Fetcher } from "../api.ts";
import { planSetup, type CollectionState } from "./plan.ts";
import { readCollection, runSetup } from "./run.ts";

/** EmDash's ADMIN role; only admins hold `schema:manage`. */
const ADMIN_ROLE = 50;

type SetupStatus =
  | { state: "loading" }
  | { state: "missing" | "outdated" | "ready"; isAdmin: boolean; conflicts: string[] }
  | { state: "error"; message: string };

type SetupSnapshot =
  | { state: "loading" }
  | {
      state: "loaded";
      isAdmin: boolean;
      pages: CollectionState | null;
      themeParts: CollectionState | null;
    }
  | { state: "error"; message: string };

export function useSetupStatus(fetcher: Fetcher, role: number) {
  const t = useI18n();
  const [snapshot, setSnapshot] = React.useState<SetupSnapshot>({ state: "loading" });
  const [running, setRunning] = React.useState(false);

  const status = React.useMemo<SetupStatus>(() => {
    if (snapshot.state !== "loaded") return snapshot;
    const { pages, themeParts, isAdmin } = snapshot;
    const { steps, conflicts } = planSetup(pages, themeParts, t);
    const state =
      !pages || !themeParts
        ? "missing"
        : steps.length > 0 || conflicts.length > 0
          ? "outdated"
          : "ready";
    return { state, isAdmin, conflicts };
  }, [snapshot, t]);

  const refresh = React.useCallback(async () => {
    try {
      const [pages, themeParts] = await Promise.all([
        readCollection(fetcher, PAGES_COLLECTION),
        readCollection(fetcher, THEME_PARTS_COLLECTION),
      ]);
      setSnapshot({ state: "loaded", isAdmin: role >= ADMIN_ROLE, pages, themeParts });
    } catch (error) {
      setSnapshot({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, [fetcher, role]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const setup = React.useCallback(async () => {
    setRunning(true);
    try {
      await runSetup(fetcher);
    } catch (error) {
      setSnapshot({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    } finally {
      setRunning(false);
    }
    await refresh();
  }, [fetcher, refresh]);

  return { status, running, setup, retry: refresh };
}
