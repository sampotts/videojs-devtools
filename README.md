# Video.js Dev Tools

A small Chrome/Chromium extension that automatically checks pages for Video.js. The popup uses shadcn/ui and system
fonts. Scans stay on the device; no data is sent to a server.

The toolbar dot is light gray before detection or when a page cannot be checked, green when Video.js is found, and
red when a scan finds none. It resets to gray on navigation. Scans run on page load, tab activation, and document
changes, with short retries for React hydration. Opening the popup also refreshes the result.

Automatic detection requires site access for HTTP and HTTPS pages. Allow the extension to run **On all sites** in
Chrome's extension settings, or grant access to the specific sites you want to check automatically.

## Build

Requires Node.js 24+ and pnpm 12.6.0. From the repository root:

```sh
pnpm install
pnpm build
pnpm zip
```

The unpacked extension is in `dist`. The distributable ZIP is `dist/videojs-devtools-<version>.zip`.

## Install locally

1. Download `videojs-devtools-<version>.zip` from the [latest GitHub release](https://github.com/sampotts/videojs-devtools/releases/latest).
2. Unzip the download into a folder you will keep on your computer.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Choose **Load unpacked** and select the folder containing `manifest.json`.
5. Pin **Video.js Dev Tools** and open it on a website.

For a local build, select `dist` directly. After rebuilding or replacing the files, click **Reload** on
the extension's card in `chrome://extensions`.
Refresh existing website tabs after reloading the extension so its automatic document watcher is installed.

## Detection

To generate a standalone DevTools Console snippet from the same detector:

```sh
pnpm snippet
```

Copy the contents of `dist/detect-videojs.js` into the page's DevTools Console and run it. You can also
save it under **Sources → Snippets** for reuse. No extension or site changes are required.

- HTML players: Request the existing `@videojs/player` context and check its branded Video.js store. This includes
  accessible player hosts with closed shadow roots.
- React players: Inspect React's DOM fiber references for a player context containing a branded Video.js store.
- Legacy players: Recognize the page's `videojs.VERSION` global, including a loaded library without an active player.
- Frames and shadow DOM: Search open shadow roots and same-origin iframe documents recursively.

React detection depends on private React internals and the current v10 context structure. Entirely hidden closed-root
players, cross-origin frames, standalone media without a player context, and unhydrated React markup may not be
detected. Browser-internal pages and other protected pages cannot be scanned. “Not found” means no supported runtime
was detected, not proof that the page contains no Video.js code.

The detector must remain self-contained: Chrome serializes it into the page's main execution world. The popup receives
only a serializable scan result; no player state leaves the page.

## UI and icon

The Card component comes from the official shadcn/ui `base-nova` registry (MIT). Only the parts used by this popup are
included. The icons are generated from `assets/icon.svg`; run `pnpm icons` to regenerate them. Attribution is in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Releases

Use Conventional Commits (`feat:`, `fix:`, and so on). CI runs lint, type checks, tests, and packaging.
Release Please opens a release PR that updates `package.json`, the Chrome manifest version, the release manifest,
and the changelog. Merge that PR to create the GitHub release and attach the versioned extension ZIP.

The workflow uses the repository's `GITHUB_TOKEN`; no publishing token or Chrome Web Store account is needed.
GitHub may require approval before running CI on a bot-created release PR. The full check job also runs on the
merge to `main` before the release is created. Asset uploads run in a separate job so a failed upload can be retried.

The first release is bootstrapped from version `0.0.0` to `0.1.0`. Chrome Web Store publishing is not configured.
