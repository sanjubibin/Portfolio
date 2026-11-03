# Sanju Antony — Portfolio

Personal portfolio built as a **multiplayer design canvas**: the site is a live design file that a swarm of AI agents is editing. A dotted canvas, every section a labelled frame (name + live pixel size + selection handles), a file top bar with the agents' presence stack, a Figma-style layers panel, a bottom toolbar as the navigation, comment pins on projects, a FigJam sticky note — and the visitor joins as their own "You" cursor. Light and dark canvas, five accent presets, and a "living" accent hue that slowly drifts over time.

## Stack

Vanilla **HTML + CSS + JavaScript**. No framework, no build step.

- [GSAP 3.13](https://gsap.com/) (ScrollTrigger + ScrollToPlugin) — pinned CDN, loaded only on capable devices (see perf tiers below)
- [Pyodide](https://pyodide.org/) — fetched on demand when the terminal's Python REPL / pip is used; runs in a **Web Worker** (`py-worker.js`) so heavy Python execution never freezes the page (Ctrl+C in the REPL terminates and restarts the worker)
- Google Fonts: Inter (canvas UI) + Fira Code (labels, terminal)

## Run locally

```bash
npm start
```

Then open <http://localhost:8080>. (Runs `npx http-server` — no install needed.)

## Editing content

**All content lives in [`config.js`](config.js)** — profile, bio, social links, skills, experience, projects, education, and the blog dropdown. Edit that file and the UI updates automatically. Notes:

- `profile.avatarUrl` — the portrait placed in the Hero frame (as a `profile.jpg` layer) and in About (currently `Files/profile.jpg`). Leave it empty for an initials monogram and a single-column hero.
- The Hero sticky note shows the first `experience` entry (role @ company, duration).
- Each project's comment pin counts its `deepDive` notes and opens the project details.
- `profile.subTitleRotate` — the rotating hero tagline (prefix + crossfading words); clear it to show the static `subTitle`.
- `profile.proofLine` — the small monospace proof line under the hero CTAs.
- Project `codeLink` / `liveLink` — link buttons appear automatically when non-empty.
- Education entries render at the end of the Experience timeline (teal dot).
- `features.block*` flags — while `true`, the matching outbound action (Resume, GitHub, LinkedIn, Instagram, contact form) is intercepted with a "Profile Offline" notice instead of navigating. Set them to `false` to go live.
- The resume served by the "Resume" buttons is `Files/Resume.pdf`.

## Structure

| File | Purpose |
|---|---|
| `index.html` | Canvas skeleton (top bar, layers panel, frames, toolbar), SEO/meta, perf-tier boot script, modals & overlays |
| `style.css` | Canvas design system (living-hue tokens, light/dark × presets, frames, chrome, sections) + the feature surfaces (chat, terminal, drawers, modals, reader) and the swarm layer |
| `app.js` | Renders `config.js` content + all interactions (frame labels/selection, layers, presence, "You" cursor, toolbar, theme menu, reveals, filters, drawers, reader, contact form) |
| `swarm.js` | Swarm build: the AI-agent-cursor opening and the per-block build animations (capable devices only) |
| `ai-clone.js` | "Ask AI" chat widget |
| `cli.js` | Full-screen terminal: registry-driven commands with tab completion, "did you mean", persistent history, site-bridge commands (`theme`, `mode`, `goto`, `open`), `neofetch`, touch quick-command chips, and a multi-line WebAssembly Python REPL via Pyodide |
| `py-worker.js` | Web Worker hosting the Pyodide runtime off the main thread |
| `python-course.js` | 8-chapter reader course content (lazy-loaded on first open) |
| `config.js` | **Your content** |
| `blog/` | Standalone article pages + shared `blog-article.css` (light/dark toggle) |
| `Files/` | Resume PDF + profile images |
| `favicon.svg` | "SA" monogram |
| `og-image.jpg` | 1200×630 social share card (LinkedIn/Twitter unfurls) |

## Behavior notes

- **Deploys anywhere static** (built for GitHub Pages) — all asset paths are relative. The canonical, `og:url` / `og:image` and `twitter:url` / `twitter:image` tags in `index.html` point at the live GitHub Pages URL, `https://sanjubibin.github.io/Portfolio/`; update them if the site moves (e.g. to a custom domain), or the link-preview image will 404.
- **Perf tiers**: every device gets a static dot-grid canvas and solid panels (no backdrop blur). Capable devices add GSAP, the swarm build and the "You" cursor; low-end / data-saver / reduced-motion devices get `perf-lite` instead — frozen hue drift (a random per-visit color, zero recurring style-recalc cost), GSAP + `swarm.js` never downloaded, and a lightweight IntersectionObserver reveal system. Frame labels, live sizes, selection and the layers panel work on every tier. Boot is chunked: only the visible page initializes immediately; interaction-gated surfaces (drawers, pickers, modals) wire up at browser idle.
- **Per-surface code splitting**: the terminal (`cli.js`), the AI chat (`ai-clone.js`) and the Python course content (`python-course.js`) download only when their surface is first opened — a brief loader veil appears if the fetch takes longer than ~150ms. Visitors who stay on the main page never download them.
- **Living hue**: on Cool Aurora the accent palette drifts ~0.9° every ~1.25s around the **full color wheel** (azure → violet → magenta → rose → red → amber → green → cyan → back, one lap ≈ 8 min). A co-animated lightness dip (`--l-drift`) deepens the accent while it crosses the bright orange→cyan zone, so accent text and white-on-accent buttons keep ≥ 4.5:1 contrast at every step; dark mode pins its own constant lightness instead. The other colored presets breathe more slowly (320s) inside narrow bands. Each visit starts at a random point.
- **Canvas chrome**: the **top bar** shows the file name, the frame you are reading (`# Projects`), the five build agents' presence avatars, a sun/moon mode toggle and Resume. The **toolbar** docked at the bottom jumps between frames (the active one is highlighted) and holds the terminal, the blog/guides menu and the theme menu; on narrow screens it collapses to icons. On screens ≥ 1360px a **layers panel** lists every frame plus its projects and roles. The frame crossing the reading line is "selected" (accent outline + handles). Every frame shows its live pixel size.
- **Theme menu** (palette tool in the toolbar): a **Light / Dark** switch (dark canvas is the default for first-time visitors; the top-bar sun/moon flips it too) and a five-preset accent picker (Cool Aurora default, Emerald Matrix, Solar Sunset, Ruby Crimson, Obsidian Slate). Every colored preset re-anchors the living hue to a narrow drift band of its own — the palette stays "alive" in every theme (Obsidian is static monochrome). Mode and preset are orthogonal (any combination works): presets re-derive the color channels from `--hue`, and dark mode re-tunes the lightness knobs those formulas expose. Both choices persist in `localStorage` and are restored before first paint by the boot script in `index.html`.
- **Boot loader**: a theme-matched loading screen covers the page until the window `load` event and display fonts are in (with hard timeout fallbacks so a hung CDN can never strand it). The page lays out beneath the cover, so animation measurements stay correct.
- **Swarm build** (`swarm.js`): on capable devices the loader hands over to a ~2.5s opening — twenty cursors fanned around the living hue wheel spiral around the SA mark while an "agents online" counter ticks up, the mark bursts, and each agent flies to the file chrome and the hero blocks it is about to build ("Skip intro ↗" finishes everything instantly; a 6s failsafe can never strand the cover). Every block then gets a crew of agent cursors: `AI 01 · DRAWING` traces a glowing wireframe, `02 · TYPING` types the block's longest line, `03 · PLACING IMAGE` drops a selection box over images, `04 · COPY / PASTE` slides in a copied chip, `05 · CHECKING` stamps a ✓, and seven unlabeled helpers wear hue-wheel colors that drift with the theme. Each block is tagged `SWARM BUILD · <FRAME> · NN`. The hero copy, portrait and sticky note (plus any block already on screen at load) build right after the opening; everything below the fold is **scrubbed by scroll** — it assembles on the way down and comes apart on the way back up. When a block finishes, its children are handed back to the stylesheet (hover states return) and its selection ring flashes once. The build list lives in `SWARM_BLOCKS` in `app.js`. Lite-tier and reduced-motion visitors never download or run any of it, and the agent layer is `aria-hidden` and click-through; focusing inside a half-built block shows it fully.
- **"You" cursor**: on mouse devices (capable tier) a `You` tag rides beside the visitor's real pointer, so they appear in the file like any other collaborator; it hides over form fields and full-screen surfaces.
- **Back/Forward aware overlays**: the full-screen surfaces (terminal, project drawer, guides drawer, learning reader, resume viewer) push a history entry on open — the browser Back button (or phone back gesture) closes them instead of leaving the site, and Forward re-opens them. Closing via Esc/✕/backdrop consumes the entry so Back never needs a dead press. Dropdown menus and small modals stay out of history on purpose.
- `prefers-reduced-motion` is respected: the hue drift pauses (frozen at the visit's random in-band hue) and scroll/hover animations collapse to gentle fades.
- The contact form is client-only (static host): it validates, shows a confirmation, then opens the visitor's mail client with a prefilled message via `mailto:` — unless `features.blockContactForm` is on, in which case it shows the offline notice instead.
- Blog articles and the in-page learning reader default to the light theme to match the site; both have a persisted light/dark toggle (`T` key).
