# Sanju Antony — Portfolio

Personal portfolio built in a **liquid glass** (visionOS-inspired) design language on a light "slate alabaster" theme: a pastel gradient-mesh background with a blueprint dot grid, frosted-glass panels with specular highlights, gel buttons, spring scroll reveals, and a "living" accent palette whose hue slowly drifts over time (clamped to a cool band so text contrast never degrades).

## Stack

Vanilla **HTML + CSS + JavaScript**. No framework, no build step.

- [GSAP 3.13](https://gsap.com/) (ScrollTrigger + ScrollToPlugin) — pinned CDN, loaded only on capable devices (see perf tiers below)
- [Pyodide](https://pyodide.org/) — fetched on demand when the terminal's Python REPL / pip is used; runs in a **Web Worker** (`py-worker.js`) so heavy Python execution never freezes the page (Ctrl+C in the REPL terminates and restarts the worker)
- Google Fonts: Outfit + Fira Code

## Run locally

```bash
npm start
```

Then open <http://localhost:8080>. (Runs `npx http-server` — no install needed.)

## Editing content

**All content lives in [`config.js`](config.js)** — profile, bio, social links, skills, experience, projects, education, and the blog dropdown. Edit that file and the UI updates automatically. Notes:

- `profile.avatarUrl` — set to an image path to replace the initials monogram in About (currently `Files/profile.jpg`).
- `profile.subTitleRotate` — the rotating hero tagline (prefix + crossfading words); clear it to show the static `subTitle`.
- `profile.proofLine` — the small monospace proof line under the hero CTAs.
- Project `codeLink` / `liveLink` — link buttons appear automatically when non-empty.
- Education entries render at the end of the Experience timeline (teal dot).
- `features.block*` flags — while `true`, the matching outbound action (Resume, GitHub, LinkedIn, Instagram, contact form) is intercepted with a "Profile Offline" notice instead of navigating. Set them to `false` to go live.
- The resume served by the "Resume" buttons is `Files/Resume.pdf`.

## Structure

| File | Purpose |
|---|---|
| `index.html` | Page skeleton, SEO/meta, perf-tier boot script, modals & overlays |
| `style.css` | Liquid-glass design system (tokens, glass recipe, sections, motion, terminal/reader themes) |
| `app.js` | Renders `config.js` content + all interactions (nav, tilt, gel, reveals, filters, drawers, reader, contact form) |
| `ai-clone.js` | "Ask AI" chat widget |
| `cli.js` | Full-screen terminal: registry-driven commands with tab completion, "did you mean", persistent history, site-bridge commands (`theme`, `mode`, `goto`, `open`), `neofetch`, touch quick-command chips, and a multi-line WebAssembly Python REPL via Pyodide |
| `py-worker.js` | Web Worker hosting the Pyodide runtime off the main thread |
| `python-course.js` | 8-chapter reader course content (lazy-loaded on first open) |
| `config.js` | **Your content** |
| `blog/` | Standalone article pages + shared `blog-article.css` (light/dark toggle) |
| `Files/` | Resume PDF + profile images |
| `favicon.svg` | Glass "SA" monogram |
| `og-image.jpg` | 1200×630 social share card (LinkedIn/Twitter unfurls) |

## Behavior notes

- **Deploys anywhere static** (built for GitHub Pages) — all asset paths are relative. The `og:url` / `og:image` tags in `index.html` assume the site is served at `https://sanjubibin.github.io/`; update them if it deploys under a sub-path (e.g. `/Portfolio/`) or a custom domain, or the link-preview image will 404.
- **Perf tiers**: every device gets a paint-free ambient background (aurora mesh + grain + color blobs) and solid "milky glass" (no live backdrop blur). Capable devices add a very slow compositor-only blob orbit; low-end / data-saver / reduced-motion devices get `perf-lite` instead — frozen background, frozen hue drift (a random per-visit color, zero recurring style-recalc cost), GSAP never downloaded, and a lightweight IntersectionObserver reveal system. Boot is chunked: only the visible page initializes immediately; interaction-gated surfaces (drawers, pickers, modals) wire up at browser idle.
- **Per-surface code splitting**: the terminal (`cli.js`), the AI chat (`ai-clone.js`) and the Python course content (`python-course.js`) download only when their surface is first opened — a brief loader veil appears if the fetch takes longer than ~150ms. Visitors who stay on the main page never download them.
- **Living hue**: on Cool Aurora the accent palette drifts ~0.9° every ~1.25s around the **full color wheel** (azure → violet → magenta → rose → red → amber → green → cyan → back, one lap ≈ 8 min). A co-animated lightness dip (`--l-drift`) deepens the accent while it crosses the bright orange→cyan zone, so accent text and white-on-accent buttons keep ≥ 4.5:1 contrast at every step; dark mode pins its own constant lightness instead. The other colored presets breathe more slowly (320s) inside narrow bands. Each visit starts at a random point.
- **Theme selector**: the fixed glass capsule beside the nav is a split button. The palette logo toggles **dark / light mode** (dark is the default for first-time visitors); the caret opens a five-preset color picker (Cool Aurora default, Emerald Matrix, Solar Sunset, Ruby Crimson, Obsidian Slate). Every colored preset re-anchors the living hue to a narrow drift band of its own — the palette stays "alive" in every theme (Obsidian is static monochrome). Mode and preset are orthogonal (any combination works): presets re-derive the color channels from `--hue`, and dark mode re-tunes the lightness knobs those formulas expose. Both choices persist in `localStorage` and are restored before first paint by the boot script in `index.html`.
- **Boot loader**: a theme-matched loading screen covers the page until the window `load` event and display fonts are in (with hard timeout fallbacks so a hung CDN can never strand it). The page lays out beneath the cover, so animation measurements stay correct.
- **Back/Forward aware overlays**: the full-screen surfaces (terminal, project drawer, guides drawer, learning reader, resume viewer) push a history entry on open — the browser Back button (or phone back gesture) closes them instead of leaving the site, and Forward re-opens them. Closing via Esc/✕/backdrop consumes the entry so Back never needs a dead press. Dropdown menus and small modals stay out of history on purpose.
- `prefers-reduced-motion` is respected: the hue drift pauses (frozen at the visit's random in-band hue) and scroll/hover animations collapse to gentle fades.
- The contact form is client-only (static host): it validates, shows a confirmation, then opens the visitor's mail client with a prefilled message via `mailto:` — unless `features.blockContactForm` is on, in which case it shows the offline notice instead.
- Blog articles and the in-page learning reader default to the light theme to match the site; both have a persisted light/dark toggle (`T` key).
