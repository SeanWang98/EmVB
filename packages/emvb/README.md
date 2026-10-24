# @perkyzz/emvb

[![Website](https://img.shields.io/badge/website-emvb.dev-1f6feb)](https://emvb.dev) [![npm](https://img.shields.io/npm/v/@perkyzz/emvb)](https://www.npmjs.com/package/@perkyzz/emvb)

A visual page builder plugin for [EmDash CMS](https://github.com/emdash-cms/emdash) 1.0–1.3. Pages are built in a full-screen editor inside the EmDash admin and published as plain HTML and CSS. It runs on Node (SQLite) and Cloudflare Workers (D1).

![The EmVB editor](https://raw.githubusercontent.com/PerkyZZ999/EmVB/main/site/public/screenshots/editor-1600.webp)

## Image editor

Library pictures can be cropped, adjusted, filtered and saved as a new media item from Image settings, the media library and the command palette. See [the image editor guide](../../docs/guides/image-editor.md). Third-party notices for the editor engine are in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Install

```bash
npm i @perkyzz/emvb
```

Peers, which an EmDash 1.x site already has: `emdash` ^1.0.0, `astro` ^7, `react` and `react-dom` ^19, `@cloudflare/kumo` 2.6.0 and `@phosphor-icons/react` ^2.1.10. `@emdash-cms/plugin-forms` ^0.2.9 is optional and enables forms. This repository tests Astro 7.3.5 with patched Zod 4.6.7. Keep that Astro version until a newer host combination passes the same checks.

Dependencies installed with it: `zod` and [`@perkyzz/emvb-icons`](https://www.npmjs.com/package/@perkyzz/emvb-icons), the icon sets for the editor's Icon library. Only the editor loads them; a placed icon is saved into the page as SVG.

This fork requires patched Zod `~4.6.7`. EmDash 1.3.1 still pins an older Zod, so applications using this build must set `"overrides": { "zod": "4.6.7" }` in their own root `package.json` and reinstall. Root overrides from this repository do not propagate to consumers. See [the host Zod setup](https://github.com/SeanWang98/EmVB/blob/main/docs/guides/install-in-a-host-site.md#patched-zod).

## Register the plugin

```js
// astro.config.mjs
import { emvb } from "@perkyzz/emvb";

export default defineConfig({
  integrations: [
    emdash({
      plugins: [emvb()],
      // …database, storage…
    }),
  ],
});
```

## Serve EmVB pages

```astro
---
// src/pages/[slug].astro
import { getEmDashEntry, decodeSlug } from "emdash";
import { EmVBPage, resolveEmVBPage } from "@perkyzz/emvb/astro";
// With @emdash-cms/plugin-forms installed and registered:
import { EmVBFormsRuntime } from "@perkyzz/emvb/astro/forms/client";
import { EmVBMenuRuntime } from "@perkyzz/emvb/astro/menu";
import { EmVBTabsRuntime } from "@perkyzz/emvb/astro/tabs";

const emvb = await resolveEmVBPage(Astro);
if (!emvb && !(await getEmDashEntry("pages", decodeSlug(Astro.params.slug)))) {
  return Astro.rewrite("/404");
}
---

{emvb && (
  <EmVBPage page={emvb}>
    {emvb.needsFormsRuntime && <EmVBFormsRuntime />}
    {emvb.needsTabsRuntime && <EmVBTabsRuntime />}
    {emvb.needsMenuRuntime && <EmVBMenuRuntime />}
  </EmVBPage>
)}
```

Each runtime is a small script mounted only on pages that need it; the rest of the page is plain HTML and CSS. Theme parts (`resolveThemeParts`) also report popups and floats, served from `@perkyzz/emvb/astro/popups` and `@perkyzz/emvb/astro/floats`.

Without the forms plugin, import `EmVBFormsRuntime` from `@perkyzz/emvb/astro/forms` (it renders nothing and does not import the plugin) or leave the element out. The `/client` subpath is the one that calls `initForms`.

A fixed route has no slug parameter. Pass the page's slug: `await resolveEmVBPage(Astro, { slug: "home" })`. Visitor rules can use the same call's `visitor` option (`{ segments: ["member"] }`, and country, device or returning when the site knows better); `resolveThemeParts` takes it too. The [install guide](https://github.com/PerkyZZ999/EmVB/blob/main/docs/guides/install-in-a-host-site.md) shows both, and the `canvasStyles` option that loads your site's stylesheets into the editor canvas: `emvb({ canvasStyles: ["/styles/site.css"] })`.

Then sign in as an admin, open **Pages VisualBuilder** and click **Set up EmVB** once.

## Edit an existing Page (fork extension)

Register `emvb({ canvasCollections: ["pages"] })`, add an optional `layout` JSON field with `widget: "emvb:canvas"`, and resolve it with `resolveEmVBPage(Astro, { collection: "pages" })`. The full-screen canvas applies changes to the Page form, whose native autosave persists the draft. Page owns preview, revisions, SEO and publishing; Site styles keep their separate publish flow. Cancel only discards canvas changes that have not been applied. Existing `emvb_pages` and Theme Builder remain compatible. See [the Page canvas guide](../../docs/guides/page-canvas-field.md).

## AI agents (MCP)

On EmDash 1.2+ with `emdash({ mcp: true, … })`, AI agents can build and edit draft EmVB pages. An admin turns them on in **Pages VisualBuilder → AI agents** (off by default) and approves the EmVB tools on EmDash's Plugins screen. Agents connect to EmDash's own endpoint (`/_emdash/api/mcp`) or through the local bridge, `npx -y @perkyzz/emvb-mcp --site https://your.site` with the token in `EMVB_TOKEN`. Tokens need the `mcp:tools:emvb` scope and an editor (not an admin) user. Agents only change drafts unless an admin allows publishing; each token may make 300 reads and 60 changes a minute and 10 publishes an hour. Every agent change shows in the version timeline with an **Agent** badge. See the [MCP guide](https://github.com/PerkyZZ999/EmVB/blob/main/docs/guides/mcp.md).

Website: <https://emvb.dev>. The full guide, the demos and the source are on GitHub: <https://github.com/PerkyZZ999/EmVB>.

## License

MIT. The editor's Icon library includes Lucide (ISC), Font Awesome Free (icons CC BY 4.0, by Fonticons, Inc.), Tabler Icons (MIT) and Remix Icon 4.8.0 (Apache-2.0). Their notices and license texts are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and `licenses/`. Icons you insert are saved into the page as SVG; a site that uses Font Awesome icons should credit Font Awesome (CC BY 4.0), for example "Icons by Font Awesome (fontawesome.com), CC BY 4.0" in its footer or credits.
