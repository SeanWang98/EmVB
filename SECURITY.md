# Security policy

## Reporting a vulnerability

Please don't open a public issue. Use GitHub's private vulnerability reporting: on the repository's **Security** tab, choose **Report a vulnerability**. Include the steps to reproduce, and the layout JSON or request that triggers the problem if you have one.

Expect a reply within a week. A fix goes out on `main`, credited to you if you like.

## Supported versions

Security fixes go into the latest release of each package on npm (`@perkyzz/emvb`, `@perkyzz/emvb-mcp` and `@perkyzz/emvb-icons`) and into `main`. Older releases don't get backported fixes, so upgrade to the latest release.

## Scope

In scope: script or markup injection through a layout, a design document or a theme part; CSS sanitizer bypasses; URL checks that let `javascript:` or another site's URL through; EmVB routes or saves reachable below the editor role; anything EmVB writes to logs that it shouldn't.

Out of scope: the demo sites' dev-only sign-in (`/_emdash/api/setup/dev-bypass`), which exists only on dev servers, and bugs in EmDash itself, which go to [EmDash](https://github.com/emdash-cms/emdash).

## Monitoring

EmVB is a plugin that runs inside your EmDash site. Health checks and request tracing belong to the host EmDash site and its hosting; EmVB adds no endpoints of its own for them. EmVB's own meter measures page weight only (HTML, CSS, JS and image bytes against its budgets).

Dependency advisories are checked in CI with `bun audit --audit-level=high`, separately from the offline checks.

## Temporary dependency overrides

This repository uses patched Zod 4.6.7 throughout the workspace. EmDash 1.3.1, its auth package and plugin types still pin Zod 4.5.4, so the root `package.json` overrides that pin. This removes the [Zod memory-exhaustion advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) and keeps host and plugin schema types on the same version.

The root also overrides only Miniflare's Undici dependency to 7.30.1. Other Undici consumers retain their own major version; the lockfile carries the patched Undici 8 version used by Astro's font loader. `body-parser` and `fast-uri` use fixes within their existing dependent ranges.

Root overrides are not inherited by applications that install the plugin. Hosts using this repository's build with EmDash 1.3.1 must apply the [Zod override in the install guide](docs/guides/install-in-a-host-site.md#patched-zod).

Remove each override when its upstream dependency accepts a patched version. Rerun the dependency audit, workspace checks and host builds before removing it.
