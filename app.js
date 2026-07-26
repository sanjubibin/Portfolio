// =========================================================================
// LIQUID GLASS PORTFOLIO — APPLICATION LOGIC
// Renders all content from window.CONFIG (config.js) and wires the
// interaction layer: cursor light, 3D tilt, gel buttons, GSAP scroll
// reveals, project filters, and the mailto contact form.
//
// Progressive enhancement rules:
//  - Content renders and is fully readable with NO GSAP (blocked CDN).
//  - Hidden "reveal" states are only ever applied by JS, never by CSS.
//  - prefers-reduced-motion disables every continuous animation.
// =========================================================================

(() => {
  'use strict';

  const CONFIG = window.CONFIG;
  if (!CONFIG) {
    console.error('config.js not loaded — content cannot be rendered.');
    return;
  }

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COARSE = window.matchMedia('(pointer: coarse)').matches;
  const LITE = !!window.PERF_LITE;
  // GSAP is injected by the inline <head> script only on capable devices;
  // this flips to true once the engine has actually loaded (see bottom init).
  let HAS_GSAP = false;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  // ----------------------------------------------------------------- icons
  const ICONS = {
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    location: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
  };
  ICONS.gmail = ICONS.mail;

  // ================================================================ RENDER
  const initials = (name) =>
    name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  function renderHero() {
    const badge = $('#hero-badge');
    if (badge) badge.textContent = CONFIG.profile.name;
    $('#hero-title').textContent = CONFIG.profile.title;
    // Always render the static subtitle; the rotating variant is swapped in
    // by initTaglineRotator() only after the animation engine has loaded.
    $('#hero-sub').textContent = CONFIG.profile.subTitle || '';
    const proof = $('#hero-proof');
    if (proof && Array.isArray(CONFIG.profile.proofLine) && CONFIG.profile.proofLine.length) {
      proof.innerHTML = CONFIG.profile.proofLine
        .map((item) => `<span>${esc(item)}</span>`)
        .join('<span class="hero__proof-dot" aria-hidden="true">·</span>');
    }
  }

  function initTaglineRotator() {
    const rot = CONFIG.profile.subTitleRotate;
    if (!rot || !rot.prefix || !Array.isArray(rot.words) || rot.words.length < 2) return;
    const sub = $('#hero-sub');
    sub.innerHTML = `${esc(rot.prefix)} <span class="rotate-stack" id="rotate-stack">` +
      rot.words.map((w) => `<span>${esc(w)}</span>`).join('') + '</span>';
    const stack = $('#rotate-stack');
    if (!stack) return;
    const words = $$('span', stack);
    gsap.set(words.slice(1), { autoAlpha: 0, y: 12 });

    // Width-drive the stack so the line hugs the active phrase instead of
    // reserving the widest one (which left a big gap after the prefix).
    let widths = [];
    let i = 0;
    const measure = () => {
      const cs = getComputedStyle(words[0]);
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;';
      probe.style.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      probe.style.letterSpacing = cs.letterSpacing;
      document.body.appendChild(probe);
      widths = words.map((w) => {
        probe.textContent = w.textContent;
        return probe.getBoundingClientRect().width;
      });
      probe.remove();
      gsap.set(stack, { width: widths[i] });
    };
    measure();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    setInterval(() => {
      if (document.hidden) return;
      const current = words[i];
      i = (i + 1) % words.length;
      gsap.to(current, { autoAlpha: 0, y: -12, duration: 0.4, ease: 'power2.in' });
      gsap.to(stack, { width: widths[i], duration: 0.5, ease: 'power2.inOut', delay: 0.1 });
      gsap.fromTo(words[i], { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.25 });
    }, 3200);
  }

  function renderAbout() {
    const avatar = $('#about-avatar');
    if (CONFIG.profile.avatarUrl) {
      avatar.innerHTML = `<img src="${esc(CONFIG.profile.avatarUrl)}" alt="${esc(CONFIG.profile.name)}" loading="lazy" decoding="async" onerror="this.style.display='none'; this.parentElement.textContent='${esc(initials(CONFIG.profile.name))}'">`;
    } else {
      avatar.textContent = initials(CONFIG.profile.name);
    }
    $('#about-name').textContent = CONFIG.profile.name;
    $('#about-bio').textContent = CONFIG.profile.about;
  }



  function renderStats() {
    // First full year on the job is 2023 (see CONFIG.experience durations).
    const stats = [
      { n: Math.max(1, new Date().getFullYear() - 2023), suffix: '+', label: 'Years Experience' },
      { n: (CONFIG.projects || []).length, suffix: '+', label: 'Production Projects' },
      { n: (CONFIG.skills || []).reduce((n, g) => n + (g.items || []).length, 0), suffix: '+', label: 'Technologies & Tools' }
    ];
    $('#about-stats').innerHTML = stats.map((s) => `
      <div class="glass stat reveal">
        <span class="stat__num" data-count="${s.n}" data-suffix="${s.suffix}">${s.n}${s.suffix}</span>
        <span class="stat__label">${s.label}</span>
      </div>`).join('');
  }

  function renderSkills() {
    $('#skills-groups').innerHTML = (CONFIG.skills || []).map((group) => `
      <div class="glass skill-group reveal" data-tilt>
        <h4>${esc(group.category)}</h4>
        <div class="pills">
          ${(group.items || []).map((it) => `<span class="pill" data-tech="${esc(it.name.toLowerCase())}">${esc(it.name)}</span>`).join('')}
        </div>
      </div>`).join('');
  }

  function renderFilterChips() {
    const cats = ['All', ...new Set((CONFIG.projects || []).map((p) => p.category))];
    $('#project-filters').innerHTML = cats.map((c, i) => `
      <button class="chip" type="button" data-filter="${esc(c)}" aria-pressed="${i === 0}" data-gel>
        ${i === 0 ? 'All Projects' : esc(c)}
      </button>`).join('');
  }

  // Per-category visual identity for project cards: a 2-letter mark on a
  // category-colored gradient tile (pure CSS, rides the hue-drift system).
  const CATEGORY_MARKS = {
    'AI & Machine Learning': { mark: 'AI', mod: 'ai' },
    'Blockchain & Web3': { mark: 'W3', mod: 'web3' },
    'Backend & Cloud': { mark: 'BE', mod: 'backend' }
  };

  function projectCard(p, reveal) {
    const links = [
      p.codeLink ? `<a href="${esc(p.codeLink)}" target="_blank" rel="noopener">View Code →</a>` : '',
      p.liveLink ? `<a href="${esc(p.liveLink)}" target="_blank" rel="noopener">Live Demo →</a>` : ''
    ].join('');
    const techTags = (p.tags || []).map(t => t.toLowerCase()).join(',');
    const cat = CATEGORY_MARKS[p.category] ||
      { mark: initials(p.category || p.title), mod: 'backend' };
    return `
      <article class="glass card project-card${reveal ? ' reveal' : ''}" data-tech-tags="${esc(techTags)}" data-tilt>
        <div class="project-card__head">
          <span class="project-card__mark project-card__mark--${cat.mod}" aria-hidden="true">${esc(cat.mark)}</span>
          <h3>${esc(p.title)}</h3>
          <span class="badge">${esc(p.category)}</span>
        </div>
        <p class="project-card__desc">${esc(p.description)}</p>
        <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="project-card__footer">
          <button type="button" class="btn btn--sm glass open-details-btn" data-project-title="${esc(p.title)}" data-gel>Explore Details →</button>
          ${links ? `<div class="project-card__links">${links}</div>` : ''}
        </div>
      </article>`;
  }

  function renderProjects(filter = 'All', reveal = false) {
    const list = (CONFIG.projects || []).filter((p) => filter === 'All' || p.category === filter);
    $('#projects-grid').innerHTML = list.map((p) => projectCard(p, reveal)).join('');
  }

  function renderExperience() {
    const jobs = (CONFIG.experience || []).map((job) => `
      <div class="xp-entry reveal">
        <span class="xp-dot" aria-hidden="true"></span>
        <article class="glass xp-item" data-tilt>
          <div class="xp-item__head">
            <h3>${esc(job.role)}</h3>
            <span class="badge">${esc(job.duration)}</span>
          </div>
          <p class="xp-item__meta">${esc(job.company)} · ${esc(job.location)}</p>
          <p class="xp-item__desc">${esc(job.description)}</p>
          <ul class="xp-item__highlights">
            ${(job.highlights || []).map((h) => `<li>${esc(h)}</li>`).join('')}
          </ul>
        </article>
      </div>`);
    // Education closes out the timeline (teal dot) instead of its own section.
    const edu = (CONFIG.education || []).map((e) => `
      <div class="xp-entry xp-entry--edu reveal">
        <span class="xp-dot" aria-hidden="true"></span>
        <article class="glass xp-item" data-tilt>
          <div class="xp-item__head">
            <h3>${esc(e.degree)}</h3>
            <span class="badge">${esc(e.duration)}</span>
          </div>
          <p class="xp-item__meta">${esc(e.institution)}</p>
          ${e.description ? `<p class="xp-item__desc">${esc(e.description)}</p>` : ''}
        </article>
      </div>`);
    $('#xp-timeline').insertAdjacentHTML('beforeend', jobs.concat(edu).join(''));
  }

  function renderSocials() {
    const html = (CONFIG.socialLinks || []).map((link) => {
      const icon = ICONS[(link.icon || '').toLowerCase()] || ICONS.mail;
      const external = /^(https?:|mailto:)/i.test(link.url);
      return `<a class="social" href="${esc(link.url)}"${external ? ' target="_blank" rel="noopener"' : ''} aria-label="${esc(link.name)}" data-gel data-magnet>${icon}</a>`;
    }).join('');
    $('#social-links').innerHTML = html;
    $('#footer-socials').innerHTML = html;
  }

  function renderContactMeta() {
    const items = [];
    if (CONFIG.profile.email) {
      items.push(`<li>${ICONS.mail}<a href="mailto:${esc(CONFIG.profile.email)}" target="_blank" rel="noopener">${esc(CONFIG.profile.email)}</a></li>`);
    }
    if (CONFIG.profile.location) {
      items.push(`<li>${ICONS.location}<span>${esc(CONFIG.profile.location)}</span></li>`);
    }
    $('#contact-meta').innerHTML = items.join('');
    if (CONFIG.profile.resumeUrl) {
      $('#resume-btn').href = CONFIG.profile.resumeUrl;
      $('.nav__resume').href = CONFIG.profile.resumeUrl;
    }
  }

  function renderFooter() {
    $('#footer-line').textContent =
      `© ${new Date().getFullYear()} ${CONFIG.profile.name}`;
  }

  function renderBlogDropdown() {
    const dropdown = $('#blog-dropdown');
    if (!dropdown || !CONFIG.blog || !Array.isArray(CONFIG.blog.links)) return;

    const html = `
      <div class="nav__dropdown-header">${esc(CONFIG.blog.title || 'Tech Publications')}</div>
      <div class="nav__dropdown-items">
        ${CONFIG.blog.links.map(l => {
          if (l.hasSubmenu) {
            return `
              <div class="nav__dropdown-group">
                <button type="button" class="nav__dropdown-trigger" aria-expanded="false">
                  <span class="nav__dropdown-title">${esc(l.title)}</span>
                  <span class="nav__dropdown-desc">${esc(l.description)}</span>
                </button>
                <div class="nav__dropdown-submenu">
                  ${(l.submenu || []).map(sub => `
                    <a class="nav__dropdown-subitem" href="${esc(sub.url)}" target="_blank" rel="noopener">
                      <span class="nav__dropdown-title">${esc(sub.title)}</span>
                      <span class="nav__dropdown-desc">${esc(sub.description)}</span>
                    </a>
                  `).join('')}
                </div>
              </div>
            `;
          } else {
            return `
              <a class="nav__dropdown-item" href="${esc(l.url)}" target="_blank" rel="noopener">
                <span class="nav__dropdown-title">${esc(l.title)}</span>
                <span class="nav__dropdown-desc">${esc(l.description)}</span>
              </a>
            `;
          }
        }).join('')}
      </div>
    `;
    dropdown.innerHTML = html;
  }

  // =============================================================== NAV
  function scrollToTarget(target, immediate = false) {
    if (HAS_GSAP && !REDUCED) {
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 88 },
        duration: immediate ? 0 : 0.45,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    } else {
      target.scrollIntoView({ behavior: (REDUCED || immediate) ? 'auto' : 'smooth', block: 'start' });
    }
  }

  // -------------------------------------- overlay history (Back / Forward)
  // Full-screen surfaces (terminal, drawers, reader, resume viewer) push a
  // history entry when they open, so the browser / phone-gesture Back
  // closes them instead of leaving the site, and Forward re-opens them.
  // Dropdown menus and small modals stay out of history on purpose.
  // This module's popstate listener registers before initNav()'s, and
  // initNav's hash-scroll handler yields via tookLastPop() whenever a pop
  // belonged to an overlay.
  const OverlayHistory = (() => {
    const openers = {};
    const closers = {};
    const stack = [];       // overlays currently holding a history entry
    const seen = new Set(); // opened this session — never revive stale entries after a reload
    let suppress = 0;       // pops we triggered ourselves via history.back()
    let reopening = false;  // Forward-reopen in progress: opened() must not re-push
    let replaceNextOpen = false;
    let lastPopHandled = false;

    window.addEventListener('popstate', (e) => {
      if (suppress > 0) {
        suppress--;
        lastPopHandled = true;
        return;
      }
      const entering = e.state && e.state.overlay;
      const top = stack[stack.length - 1];

      if (top && entering !== top) {
        // Back crossed our newest entry: close that overlay.
        stack.pop();
        lastPopHandled = true;
        if (closers[top]) closers[top]();
        return;
      }
      if (entering && entering !== top && seen.has(entering) && openers[entering]) {
        // Forward onto an overlay entry created this session: re-open it.
        stack.push(entering);
        lastPopHandled = true;
        reopening = true;
        openers[entering]();
        reopening = false;
      }
    });

    return {
      // Wire an overlay in. `open` re-opens it on Forward; `close` hides it
      // on Back (a visual-only close — it may safely call closed() again,
      // which no-ops once the entry is consumed).
      register(name, fns) {
        openers[name] = fns.open;
        closers[name] = fns.close;
      },
      // Call when the overlay opens through its own UI.
      opened(name) {
        if (reopening) return;
        seen.add(name);
        if (replaceNextOpen) {
          // Hand-off (e.g. guides drawer -> reader): reuse the entry so one
          // Back press leaves the whole flow.
          replaceNextOpen = false;
          stack.pop();
          stack.push(name);
          history.replaceState({ overlay: name }, '');
        } else {
          stack.push(name);
          history.pushState({ overlay: name }, '');
        }
      },
      // Call when the overlay closes through its own UI (Esc / close button /
      // backdrop): consume the entry so Back doesn't need a dead press.
      closed(name) {
        const i = stack.lastIndexOf(name);
        if (i === -1) return; // already consumed (closed via Back)
        stack.splice(i, 1);
        suppress++;
        history.back();
      },
      // The next opened() replaces the current overlay entry instead of pushing.
      replaceNext() { replaceNextOpen = true; },
      // One-shot: did the last popstate belong to an overlay?
      tookLastPop() {
        const v = lastPopHandled;
        lastPopHandled = false;
        return v;
      },
    };
  })();
  // cli.js (loaded after this file) registers the terminal through this.
  window.OverlayHistory = OverlayHistory;

  // ------------------------------------------- Python runtime (Web Worker)
  // Pyodide lives in py-worker.js on a background thread: heavy Python
  // execution can never freeze the UI. Requests are serialized (one at a
  // time) so stdout/stderr always belongs to the in-flight request.
  // Shared by the reader playgrounds here and the terminal REPL (cli.js).
  const PyRuntime = (() => {
    let worker = null;
    let seq = 0;
    const pending = new Map(); // id -> { resolve, reject, onOut, onErr }
    let current = 0;           // id whose stdout/stderr is streaming
    let queue = Promise.resolve();

    function ensureWorker() {
      if (worker) return worker;
      worker = new Worker('py-worker.js');
      worker.onmessage = (e) => {
        const m = e.data;
        if (m.type === 'stdout' || m.type === 'stderr') {
          const req = pending.get(current);
          if (req) (m.type === 'stdout' ? req.onOut : req.onErr)(m.text);
          return;
        }
        const req = pending.get(m.id);
        if (!req) return;
        pending.delete(m.id);
        if (m.type === 'error') req.reject(new Error(m.message));
        else req.resolve(m.value !== undefined ? m.value : null);
      };
      worker.onerror = () => {
        // Worker crashed (e.g. CDN failure inside importScripts): fail
        // everything pending and start cold next time.
        pending.forEach((req) => req.reject(new Error('Python runtime failed to start.')));
        pending.clear();
        worker = null;
      };
      return worker;
    }

    function request(msg, onOut, onErr) {
      const run = () => new Promise((resolve, reject) => {
        const id = ++seq;
        current = id;
        pending.set(id, {
          resolve,
          reject,
          onOut: onOut || (() => {}),
          onErr: onErr || onOut || (() => {}),
        });
        ensureWorker().postMessage(Object.assign({ id }, msg));
      });
      const p = queue.then(run, run);
      queue = p.catch(() => {});
      return p;
    }

    return {
      warm: (onOut, onErr) => request({ type: 'init' }, onOut, onErr),
      run: (code, onOut, onErr) => request({ type: 'run', code }, onOut, onErr),
      pip: (pkg, onOut, onErr) => request({ type: 'pip', pkg }, onOut, onErr),
      busy: () => pending.size > 0,
      // Kill a runaway execution (Ctrl+C in the REPL): pending requests
      // reject and the runtime restarts cold on the next request.
      terminate: () => {
        if (!worker) return;
        worker.terminate();
        worker = null;
        pending.forEach((req) => req.reject(new Error('KeyboardInterrupt: execution terminated, runtime restarted')));
        pending.clear();
        queue = Promise.resolve();
      },
    };
  })();
  window.PyRuntime = PyRuntime;

  // --------------------------------------------------------- lazy surfaces
  // Per-surface code splitting: the terminal (cli.js), the AI chat
  // (ai-clone.js) and the Python course content (python-course.js) are NOT
  // loaded up front — each arrives the first time its surface is opened.
  // A translucent veil with the loader ring appears only when a fetch
  // takes longer than ~150ms, so cached loads never flash.
  const LazySurface = (() => {
    const loading = new Map(); // src -> Promise
    let veilEl = null;

    function veil(on) {
      if (!veilEl) {
        veilEl = document.createElement('div');
        veilEl.className = 'surface-loader';
        veilEl.setAttribute('role', 'status');
        veilEl.setAttribute('aria-label', 'Loading');
        veilEl.innerHTML = '<div class="page-loader__ring" aria-hidden="true"></div>';
        document.body.appendChild(veilEl);
      }
      veilEl.classList.toggle('is-on', on);
    }

    function load(src) {
      if (!loading.has(src)) {
        loading.set(src, new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = src;
          s.onload = resolve;
          s.onerror = () => {
            loading.delete(src); // allow a retry on the next attempt
            reject(new Error(src + ' failed to load'));
          };
          document.head.appendChild(s);
        }));
      }
      return loading.get(src);
    }

    async function withVeil(src) {
      let shown = false;
      const timer = setTimeout(() => { shown = true; veil(true); }, 150);
      try {
        return await load(src);
      } finally {
        clearTimeout(timer);
        if (shown) veil(false);
      }
    }

    return { load, withVeil };
  })();

  function initNav() {
    // Disable automatic browser scroll restoration on refresh/navigate
    if (history.scrollRestoration) {
      history.scrollRestoration = 'manual';
    }

    // Track last user scroll position to undo browser's default instant jump on popstate
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      // Don't update tracking coordinate while GSAP is scrolling
      if (HAS_GSAP && !REDUCED && gsap.isTweening(window)) return;
      lastScrollY = window.scrollY;
    }, { passive: true });

    // Click events on navigation anchors
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (a) {
        const hash = a.getAttribute('href');
        const target = document.querySelector(hash);
        if (target) {
          e.preventDefault();

          // Update URL hash without causing a page jump
          if (history.pushState) {
            history.pushState(null, null, hash);
          } else {
            window.location.hash = hash;
          }

          scrollToTarget(target);
        }
      }
    });

    // Clear hash and force scroll to top on load/reload
    if (window.location.hash) {
      if (history.replaceState) {
        history.replaceState(null, null, window.location.pathname + window.location.search);
      } else {
        window.location.hash = '';
      }
    }
    window.scrollTo(0, 0);
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    }, { once: true });

    // Handle browser Back/Forward navigation smoothly
    window.addEventListener('popstate', () => {
      // Pops that opened/closed an overlay are not scroll navigations.
      if (OverlayHistory.tookLastPop()) return;
      const hash = window.location.hash || '#hero';
      const target = document.querySelector(hash);
      if (target) {
        // Instantly restore previous position to undo default browser jump
        window.scrollTo(0, lastScrollY);
        // Smoothly animate to the new target
        scrollToTarget(target);
      }
    });
  }

  function initActiveNav() {
    $$('main section[id]').forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (!self.isActive) return;
          let anyActive = false;
          $$('.nav__links a').forEach((a) => {
            const active = a.getAttribute('href') === '#' + sec.id;
            a.classList.toggle('is-active', active);
            if (active) {
              anyActive = true;
              updateNavIndicator(a);
            }
          });
          // Hide the nav indicator if we are in a section with no matching nav link (e.g. Hero)
          if (!anyActive) {
            updateNavIndicator(null);
          }
        }
      });
    });
  }

  function initBlogDropdown() {
    const btn = $('#blog-nav-btn');
    const dropdown = $('#blog-dropdown');
    if (!btn || !dropdown) return;

    const toggleDropdown = (open) => {
      const show = open !== undefined ? open : !dropdown.classList.contains('is-open');
      dropdown.classList.toggle('is-open', show);
      dropdown.setAttribute('aria-hidden', String(!show));
      btn.setAttribute('aria-expanded', String(show));

      // Close all submenus when closing the main dropdown
      if (!show) {
        $$('.nav__dropdown-group').forEach(group => {
          group.classList.remove('is-open');
          const trigger = group.querySelector('.nav__dropdown-trigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
      }
    };

    // No stopPropagation: letting the click bubble means the theme
    // dropdown's outside-click handler closes it — only one nav dropdown
    // stays open at a time. Our own outside-click check below ignores
    // clicks inside this wrapper, so the fresh toggle survives.
    btn.addEventListener('click', () => toggleDropdown());

    // Submenu click toggles
    dropdown.addEventListener('click', (e) => {
      const trigger = e.target.closest('.nav__dropdown-trigger');
      if (trigger) {
        e.stopPropagation();
        
        // Intercept "Simplified Learning Guides" to launch guides drawer
        const titleSpan = trigger.querySelector('.nav__dropdown-title');
        if (titleSpan && titleSpan.textContent.includes('Simplified Learning Guides')) {
          toggleDropdown(false);
          if (typeof window.openGuidesDrawer === 'function') {
            window.openGuidesDrawer();
          }
          return;
        }

        const group = trigger.closest('.nav__dropdown-group');
        if (group) {
          const isOpen = group.classList.contains('is-open');
          group.classList.toggle('is-open', !isOpen);
          trigger.setAttribute('aria-expanded', String(!isOpen));
        }
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#blog-nav-wrapper')) {
        toggleDropdown(false);
      }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleDropdown(false);
      }
    });
  }

  function initThemeSwitcher() {
    const modeBtn = $('#theme-nav-btn');   // palette logo: dark/light toggle
    const caretBtn = $('#theme-caret-btn'); // caret: opens the preset menu
    const dropdown = $('#theme-dropdown');
    if (!caretBtn || !dropdown) return;

    const toggleDropdown = (open) => {
      const show = open !== undefined ? open : !dropdown.classList.contains('is-open');
      dropdown.classList.toggle('is-open', show);
      dropdown.setAttribute('aria-hidden', String(!show));
      caretBtn.setAttribute('aria-expanded', String(show));
    };

    // Bubbles on purpose — see the matching note in initBlogDropdown().
    caretBtn.addEventListener('click', () => toggleDropdown());

    // Dark / light mode: orthogonal to the color presets. The boot script
    // in <head> restores the saved mode before first paint; here we only
    // toggle and persist it.
    const applyMode = (mode) => {
      document.documentElement.classList.toggle('mode-dark', mode === 'dark');
      localStorage.setItem('portfolio-color-mode', mode);
      if (modeBtn) modeBtn.setAttribute('aria-pressed', String(mode === 'dark'));
    };
    if (modeBtn) {
      modeBtn.setAttribute('aria-pressed', String(document.documentElement.classList.contains('mode-dark')));
      modeBtn.addEventListener('click', () => {
        applyMode(document.documentElement.classList.contains('mode-dark') ? 'light' : 'dark');
      });
    }

    const applyTheme = (themeName) => {
      const doc = document.documentElement;
      doc.classList.remove('theme-aurora', 'theme-emerald', 'theme-solar', 'theme-ruby', 'theme-obsidian');
      doc.classList.add(`theme-${themeName}`);

      localStorage.setItem('portfolio-theme-preset', themeName);

      $$('#theme-dropdown .theme-option').forEach(opt => {
        opt.classList.toggle('is-active', opt.dataset.theme === themeName);
      });
    };

    // Load saved theme on boot
    const savedTheme = localStorage.getItem('portfolio-theme-preset') || 'aurora';
    applyTheme(savedTheme);

    // Click handler for theme options
    dropdown.addEventListener('click', (e) => {
      const option = e.target.closest('.theme-option');
      if (option) {
        e.stopPropagation();
        const selected = option.dataset.theme;
        applyTheme(selected);
        toggleDropdown(false);
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#theme-nav-wrapper')) {
        toggleDropdown(false);
      }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleDropdown(false);
      }
    });
  }

  // =============================================================== FORM
  // The site is static (GitHub Pages): simulate the send, then hand off
  // to the visitor's mail client via a prefilled mailto link.
  function initForm() {
    const form = $('#contact-form');
    if (!form) return;
    const status = $('#form-status');
    const btn = $('#cf-submit');

    // Intercept click/focus on inputs if form is blocked
    const inputs = $$('.form-control', form);
    inputs.forEach((input) => {
      const handleBlockedInput = (e) => {
        if (CONFIG.features && CONFIG.features.blockContactForm) {
          e.preventDefault();
          input.blur();
          if (typeof window.showStatusWarning === 'function') {
            window.showStatusWarning('contact');
          }
        }
      };
      input.addEventListener('focus', handleBlockedInput);
      input.addEventListener('click', handleBlockedInput);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (CONFIG.features && CONFIG.features.blockContactForm) {
        if (typeof window.showStatusWarning === 'function') {
          window.showStatusWarning('contact');
        }
        return;
      }
      const name = $('#cf-name').value.trim();
      const email = $('#cf-email').value.trim();
      const subject = $('#cf-subject').value.trim();
      const message = $('#cf-message').value.trim();

      if (!name || !email || !subject || !message) {
        status.className = 'err';
        status.textContent = 'Please fill in every field before sending.';
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        status.className = 'err';
        status.textContent = 'Please enter a valid email address.';
        return;
      }

      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = 'Sending…';
      status.className = '';
      status.textContent = '';

      setTimeout(() => {
        status.className = 'ok';
        status.textContent = `Thank you, ${name}! Routing message…`;
        const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
        const mailto = `mailto:${CONFIG.profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        const modal = $('#contact-success-modal');
        if (modal) {
          modal.classList.add('is-open');
          modal.setAttribute('aria-hidden', 'false');
          
          const closeBtn = $('#contact-success-close');
          if (closeBtn) {
            closeBtn.onclick = () => {
              modal.classList.remove('is-open');
              modal.setAttribute('aria-hidden', 'true');
            };
          }
        }

        setTimeout(() => {
          window.location.href = mailto;
          btn.disabled = false;
          btn.textContent = originalLabel;
          form.reset();
          setTimeout(() => { status.textContent = ''; status.className = ''; }, 4000);
        }, 1200);
      }, 900);
    });
  }

  // ============================================================ FILTERS
  function initFilters() {
    $('#project-filters').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      $$('#project-filters .chip').forEach((c) =>
        c.setAttribute('aria-pressed', String(c === chip)));
      const cat = chip.dataset.filter;
      const grid = $('#projects-grid');

      if (HAS_GSAP && !REDUCED) {
        gsap.to(grid, {
          autoAlpha: 0, y: 6, duration: 0.1, ease: 'power1.in',
          onComplete: () => {
            renderProjects(cat, false);
            gsap.set(grid, { autoAlpha: 1, y: 0 });
            gsap.from(grid.children, {
              autoAlpha: 0, y: 10, duration: 0.25, stagger: 0.03,
              ease: 'power2.out', clearProps: 'all'
            });
            ScrollTrigger.refresh();
          }
        });
      } else {
        renderProjects(cat, false);
      }
    });
  }

  // ======================================================== GEL BUTTONS
  // Everything tagged [data-gel] squishes like gel on press and springs
  // back on release (works for both mouse and touch).
  function initGelButtons() {
    let active = null;
    document.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('[data-gel]');
      if (!el) return;
      active = el;
      gsap.to(el, { scale: 0.94, duration: 0.12, ease: 'power2.out' });
    });
    const release = () => {
      if (!active) return;
      gsap.to(active, { scale: 1, duration: 0.7, ease: 'elastic.out(1.1, 0.4)' });
      active = null;
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  }

  // ========================================== POINTER FX (fine pointers)
  // One shared rAF loop drives: the hovered card's 3D tilt and the magnetic pull.
  function initPointerFX() {
    const state = {
      px: innerWidth / 2, py: innerHeight / 2,
      tiltEl: null, rect: null, rx: 0, ry: 0,
      magnetEl: null, magnetRect: null
    };

    window.addEventListener('pointermove', (e) => {
      state.px = e.clientX;
      state.py = e.clientY;
    }, { passive: true });

    document.addEventListener('pointerover', (e) => {
      const tilt = e.target.closest('[data-tilt]');
      if (tilt && tilt !== state.tiltEl) {
        state.tiltEl = tilt;
        state.rect = tilt.getBoundingClientRect();
        state.rx = 0;
        state.ry = 0;
      }
      const magnet = e.target.closest('[data-magnet]');
      if (magnet && magnet !== state.magnetEl) {
        state.magnetEl = magnet;
        state.magnetRect = magnet.getBoundingClientRect();
      }
      if (tilt || magnet) wake();
    });

    document.addEventListener('pointerout', (e) => {
      if (state.tiltEl && !state.tiltEl.contains(e.relatedTarget)) {
        gsap.to(state.tiltEl, {
          rotateX: 0, rotateY: 0, y: 0,
          duration: 0.9, ease: 'elastic.out(1, 0.45)'
        });
        state.tiltEl = null;
        state.rect = null;
      }
      if (state.magnetEl && !state.magnetEl.contains(e.relatedTarget)) {
        gsap.to(state.magnetEl, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
        state.magnetEl = null;
        state.magnetRect = null;
      }
    });

    // rAF loop only runs while something is actually hovered — it sleeps
    // (zero CPU) the rest of the time instead of spinning forever.
    let running = false;
    function wake() {
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    }

    function frame() {
      if (state.tiltEl && state.rect) {
        const r = state.rect;
        const nx = clamp((state.px - r.left) / r.width - 0.5, -0.5, 0.5);
        const ny = clamp((state.py - r.top) / r.height - 0.5, -0.5, 0.5);
        state.rx += (clamp(-ny * 12, -6, 6) - state.rx) * 0.16;
        state.ry += (clamp(nx * 16, -8, 8) - state.ry) * 0.16;
        gsap.set(state.tiltEl, {
          rotateX: state.rx, rotateY: state.ry, y: -6, transformPerspective: 900
        });
      }

      // Magnetic pull: element leans toward the cursor while hovered.
      if (state.magnetEl && state.magnetRect) {
        const m = state.magnetRect;
        const dx = clamp((state.px - (m.left + m.width / 2)) * 0.3, -10, 10);
        const dy = clamp((state.py - (m.top + m.height / 2)) * 0.3, -8, 8);
        gsap.set(state.magnetEl, { x: dx, y: dy });
      }

      if (state.tiltEl || state.magnetEl) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }
  }

  // ============================================================ SCROLL FX
  function initScrollFX() {
    // Hero intro.
    // Skipped when the engine arrived late (slow network): the hero is
    // already visible by then and re-hiding it would flash.
    if (performance.now() < 2000) {
      const introSel = '.hero__badge, .hero__title, .hero__sub, .hero__cta .btn, .hero__proof';
      const tl = gsap.timeline({
        delay: 0.15,
        onComplete: () => gsap.set(introSel, { clearProps: 'all' })
      });
      tl.from('.hero__badge', { y: 26, autoAlpha: 0, duration: 0.9, ease: 'power3.out' })
        .from('.hero__title', { y: 34, autoAlpha: 0, duration: 1, ease: 'power3.out' }, '-=0.62')
        .from('.hero__sub', { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out' }, '-=0.7')
        .from('.hero__cta .btn', { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out' }, '-=0.62')
        .from('.hero__proof', { y: 14, autoAlpha: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5');
    }

    // Float-up reveals. Hidden state applied here (JS only), and only to
    // elements still below the fold — anything already on screen stays
    // visible so late engine load never blanks rendered content.
    // Transform + opacity only (no filter): identical on every device,
    // and pure compositor work.
    const reveals = $$('.reveal').filter((el) =>
      el.getBoundingClientRect().top > window.innerHeight * 0.9);
    gsap.set(reveals, { autoAlpha: 0, y: 16 });
    ScrollTrigger.batch(reveals, {
      // Fire well BELOW the viewport (120% = one-fifth of a screen early):
      // at fast scroll speeds the animation has already finished by the
      // time the element arrives, so content never appears to "load" late.
      start: 'top 120%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        autoAlpha: 1, y: 0,
        duration: 0.35, ease: 'power2.out', stagger: 0.035,
        onComplete: () => {
          batch.forEach((el) => {
            if (el.classList.contains('glass')) {
              el.classList.add('reveal-shine');
              setTimeout(() => el.classList.remove('reveal-shine'), 1050);
            }
          });
        }
      })
    });

    // Skill pills pop in instantly with faster spring stagger.
    $$('.skill-group').forEach((group) => {
      const pills = $$('.pill', group);
      ScrollTrigger.create({
        trigger: group,
        start: 'top 115%',
        once: true,
        onEnter: () => gsap.from(pills, {
          scale: 0.8, autoAlpha: 0, duration: 0.28,
          ease: 'power2.out', stagger: 0.02, clearProps: 'all'
        })
      });
    });

    // Page scroll progress along the nav pill's bottom edge.
    const progress = $('.nav__progress');
    if (progress) {
      gsap.fromTo(progress, { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
      });
    }

    // Stat counters.
    $$('.stat__num').forEach((el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || '';
      el.textContent = '0' + suffix;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; }
      });
    });

    // Experience timeline draws itself; dots pop as entries pass.
    if ($('#xp-line')) {
      gsap.from('#xp-line', {
        scaleY: 0, transformOrigin: 'top center', ease: 'none',
        scrollTrigger: {
          trigger: '#xp-timeline', start: 'top 78%', end: 'bottom 55%', scrub: 0.6
        }
      });
      $$('.xp-dot').forEach((dot) => {
        gsap.from(dot, {
          scale: 0, duration: 0.6, ease: 'back.out(2.5)',
          scrollTrigger: { trigger: dot.closest('.xp-entry'), start: 'top 105%', once: true }
        });
      });
    }

    initActiveNav();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    }
  }

  // -------------------------------------------------------- audio synthesizer
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSynthSound(freqStart, freqEnd, duration, type = 'sine', volume = 0.06) {
    try {
      initAudioContext();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);

      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }

  const playTick = () => playSynthSound(1800, 1100, 0.012, 'sine', 0.02);
  const playClick = () => playSynthSound(550, 180, 0.045, 'triangle', 0.05);

  function initAudioEvents() {
    // Hover sound registers
    document.addEventListener('pointerover', (e) => {
      const target = e.target.closest('a, button, .chip, .pill, .social');
      if (target) playTick();
    });

    // Press sound registers
    document.addEventListener('pointerdown', (e) => {
      const target = e.target.closest('[data-gel], button, .chip, #ai-chat-toggle, #ai-chat-close');
      if (target) playClick();
    });
  }


  // -------------------------------------------------------- sliding indicator
  let currentActiveLink = null;

  function updateNavIndicator(a) {
    const indicator = $('#nav-indicator');
    if (!indicator) return;
    if (!a) {
      indicator.classList.remove('is-visible');
      currentActiveLink = null;
      return;
    }
    
    currentActiveLink = a;
    const nav = $('#site-nav');
    const rectA = a.getBoundingClientRect();
    const rectNav = nav.getBoundingClientRect();
    
    const left = rectA.left - rectNav.left;
    const width = rectA.width;
    
    indicator.classList.add('is-visible');
    gsap.to(indicator, {
      left: left,
      width: width,
      duration: 0.45,
      ease: 'back.out(1.15)',
      overwrite: 'auto'
    });
  }

  // Handle window resizing to keep indicator aligned and marquee filled.
  // Debounced: resize fires continuously (mobile URL-bar show/hide included)
  // and this work forces layout reads.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (currentActiveLink) {
        updateNavIndicator(currentActiveLink);
      }
      initMarqueeDupes();
    }, 150);
  });

  // ------------------------------------------------------------- project drawer
  function initProjectDrawer() {
    const drawer = $('#project-drawer');
    const overlay = $('#drawer-overlay');
    const closeBtn = $('#project-drawer-close');
    if (!drawer || !overlay || !closeBtn) return;

    let lastProjectTitle = null; // lets Forward re-open the same project

    // Each project's detail panel is built ONCE as a detached node (the
    // innerHTML parse is the expensive part on phone CPUs) — ideally at
    // browser idle, before the user ever taps Explore Details.
    const panelCache = new Map(); // title -> { node, wired }

    function buildPanel(p) {
      // Build Body Content
      let bodyHtml = `
        <div class="drawer-section">
          <h4>Category</h4>
          <p class="mm-value">${esc(p.category)}</p>
        </div>
        
        <div class="drawer-section">
          <h4>Description</h4>
          <p style="font-size: 0.95rem; line-height: 1.5; color: var(--ink-mid);">${esc(p.description)}</p>
        </div>

        <div class="drawer-section">
          <h4>Technologies</h4>
          <div class="tags" style="margin-top: 0.25rem;">
            ${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}
          </div>
        </div>
      `;

      // System Architecture
      if (p.architecture) {
        bodyHtml += `
          <div class="drawer-section">
            <h4>System Architecture</h4>
            <div class="drawer-arch-box">${esc(p.architecture)}</div>
          </div>
        `;
      }

      // Technical Challenges & Bullet Points
      if (p.deepDive && p.deepDive.length > 0) {
        bodyHtml += `
          <div class="drawer-section">
            <h4>Technical Accomplishments</h4>
            <ul class="drawer-bullets">
              ${p.deepDive.map((d) => `<li>${esc(d)}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      // Special Interactive Playground: Model Context Protocol & Custom AI Chatbot Server
      if (p.title === "Model Context Protocol & Custom AI Chatbot Server") {
        bodyHtml += `
          <div class="drawer-section" style="margin-top: 1rem;">
            <h4>Interactive MCP Playground</h4>
            <p style="font-size: 0.85rem; color: var(--ink-low); margin-bottom: 0.5rem;">
              Test real-time tool calls against your local portfolio context using the Model Context Protocol:
            </p>
            <div class="mcp-play">
              <div class="mcp-play__row">
                <label for="mcp-tool-select">Select MCP Tool</label>
                <select id="mcp-tool-select" class="mcp-play__select">
                  <option value="tools/list">tools/list</option>
                  <option value="tools/call:get_skills">tools/call: get_skills()</option>
                  <option value="tools/call:get_experience">tools/call: get_experience()</option>
                  <option value="tools/call:get_profile">tools/call: get_profile()</option>
                </select>
              </div>
              <div class="mcp-play__row">
                <label>JSON Request</label>
                <pre class="mcp-play__code" id="mcp-req-code">{ "method": "tools/list", "params": {} }</pre>
              </div>
              <button type="button" class="btn btn--primary glass btn--sm mcp-play__btn" id="mcp-run-btn" data-gel>Execute Tool</button>
              <div class="mcp-play__row">
                <label>JSON Response</label>
                <pre class="mcp-play__code mcp-play__code--output" id="mcp-res-code">Click 'Execute Tool' to query local workspace...</pre>
              </div>
            </div>
          </div>
        `;
      }

      // Special Interactive Playground: Decentralized Asset Tokenization Platform (MetaMask DApp Sandbox)
      if (p.title === "Decentralized Asset Tokenization Platform") {
        bodyHtml += `
          <div class="drawer-section" style="margin-top: 1rem;">
            <h4>Simulated DApp Sandbox</h4>
            <p style="font-size: 0.85rem; color: var(--ink-low); margin-bottom: 0.75rem;">
              Interact with deployed smart contracts by simulating a transaction signature on the Ethereum network:
            </p>
            <button type="button" class="btn btn--primary glass open-dapp-btn" id="open-dapp-btn" data-gel style="width: 100%;">
              Launch DApp Sandbox (Simulate Mint)
            </button>
          </div>
        `;
      }

      const node = document.createElement('div');
      node.style.display = 'contents'; // children join the body's flex layout
      node.innerHTML = bodyHtml;
      return { node, wired: false };
    }

    function getPanel(p) {
      let entry = panelCache.get(p.title);
      if (!entry) {
        entry = buildPanel(p);
        panelCache.set(p.title, entry);
      }
      return entry;
    }

    // Pre-parse every panel while the browser is idle so even the first
    // open skips the parse cost.
    const prebuildPanels = () => (CONFIG.projects || []).forEach(getPanel);
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prebuildPanels, { timeout: 3000 });
    } else {
      setTimeout(prebuildPanels, 2000);
    }

    function openDrawer(projectTitle) {
      const p = (CONFIG.projects || []).find((x) => x.title === projectTitle);
      if (!p) return;
      lastProjectTitle = projectTitle;

      // Set Title
      $('#drawer-title').textContent = p.title;

      const entry = getPanel(p);
      const body = $('#drawer-body');
      if (body.firstChild !== entry.node) body.replaceChildren(entry.node);

      // Open on a double-rAF: the attached panel finishes style/layout
      // BEFORE the slide starts, so the transition frames stay clean.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        drawer.classList.add('is-open');
        overlay.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        overlay.setAttribute('aria-hidden', 'false');
        OverlayHistory.opened('project-drawer');

        // Wire the interactive playgrounds once per project, after the
        // slide has settled so its frames stay clean. Listeners live on
        // the cached node, so they survive detach/re-attach.
        if (!entry.wired) {
          setTimeout(() => {
            if (!body.contains(entry.node)) return; // closed too fast — retry next open
            entry.wired = true;
            if (p.title === "Model Context Protocol & Custom AI Chatbot Server") initMCPPlayground();
            if (p.title === "Decentralized Asset Tokenization Platform") initDAppSandbox();
          }, 500);
        }
      }));
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-hidden', 'true');
      OverlayHistory.closed('project-drawer');
    }

    OverlayHistory.register('project-drawer', {
      open: () => { if (lastProjectTitle) openDrawer(lastProjectTitle); },
      close: closeDrawer,
    });

    // Bind explorer click delegation on grid
    const grid = $('#projects-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.open-details-btn');
        if (btn) {
          openDrawer(btn.dataset.projectTitle);
        }
      });
    }

    closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    // Escape Key closes drawer
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  }

  // ------------------------------------------------------------- guides drawer & reader
  function initGuidesDrawer() {
    const drawer = $('#guides-drawer');
    const overlay = $('#guides-drawer-overlay');
    const closeBtn = $('#guides-drawer-close');
    const slider = $('#guides-drawer-slider');
    
    const btnBackend = $('#guides-btn-backend');
    const btnBackL2 = $('#guides-back-l2-btn');
    const btnPython = $('#guides-btn-python');

    if (!drawer || !overlay || !closeBtn || !slider) return;

    function openGuidesDrawer() {
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-hidden', 'false');

      // Reset to Level 1
      slider.style.transform = 'translateX(0)';
      document.body.style.overflow = 'hidden'; // Lock background scroll
      OverlayHistory.opened('guides-drawer');
    }

    // skipHistory: the reader hand-off closes the drawer visually but keeps
    // the history entry — the reader takes it over via replaceNext().
    function closeGuidesDrawer(skipHistory) {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; // Restore background scroll
      if (skipHistory !== true) OverlayHistory.closed('guides-drawer');
    }

    // Expose openGuidesDrawer globally so it can be called from blog dropdown click
    window.openGuidesDrawer = openGuidesDrawer;

    OverlayHistory.register('guides-drawer', {
      open: openGuidesDrawer,
      close: closeGuidesDrawer,
    });

    closeBtn.addEventListener('click', () => closeGuidesDrawer());
    overlay.addEventListener('click', () => closeGuidesDrawer());

    // Escape Key closes guides drawer
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeGuidesDrawer();
      }
    });

    // Level 1 -> Level 2 navigation
    if (btnBackend) {
      btnBackend.addEventListener('click', () => {
        slider.style.transform = 'translateX(-50%)';
      });
    }

    // Level 2 -> Level 1 navigation
    if (btnBackL2) {
      btnBackL2.addEventListener('click', () => {
        slider.style.transform = 'translateX(0)';
      });
    }

    // Launch Python from Scratch Reader — the reader takes over the guides
    // drawer's history entry so a single Back press exits the whole flow.
    if (btnPython) {
      btnPython.addEventListener('click', () => {
        closeGuidesDrawer(true);
        OverlayHistory.replaceNext();
        openPythonReader();
      });
    }
  }

  // Visual-only close, shared by the close button and the Back-button path.
  function closeReaderVisual() {
    const reader = $('#learning-reader');
    if (!reader) return;
    reader.classList.remove('is-active');
    reader.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restore background scroll
  }

  async function openPythonReader() {
    const reader = $('#learning-reader');
    const closeBtn = $('#reader-close-btn');
    const themeBtn = $('#reader-theme-btn');
    const tocList = $('#reader-toc-list');
    const contentArea = $('#reader-chapter-content');
    const prevBtn = $('#reader-prev-btn');
    const nextBtn = $('#reader-next-btn');
    const progressInfo = $('#reader-progress-info');
    const headerChapter = $('#reader-header-chapter');

    if (!reader || !closeBtn || !tocList || !contentArea) return;

    // The course database is a separate on-demand module: show the reader
    // shell with an inline loading state while it arrives (cached from
    // the second open onwards).
    if (!window.PYTHON_CHAPTERS) {
      reader.classList.add('is-active');
      reader.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      contentArea.innerHTML = '<p style="padding: 2rem 0; color: var(--ink-low);">Loading course content…</p>';
      try {
        await LazySurface.load('python-course.js');
      } catch (err) {
        contentArea.innerHTML = '<p style="padding: 2rem 0; color: var(--ink-low);">Failed to load the course content — check your connection and try again.</p>';
        closeBtn.onclick = () => closeReaderVisual();
        return;
      }
    }
    const PYTHON_CHAPTERS = window.PYTHON_CHAPTERS;

    let activeChapter = 0;
    
    // Read active chapter from storage
    const savedChapter = localStorage.getItem('python-active-chapter');
    if (savedChapter !== null) {
      const idx = parseInt(savedChapter, 10);
      if (idx >= 0 && idx < PYTHON_CHAPTERS.length) {
        activeChapter = idx;
      }
    }

    // Theme Switcher Initialization
    // Default to light so the reader matches the light site on first open.
    const savedTheme = localStorage.getItem('reader-theme') || 'light';
    reader.classList.toggle('reader-light-theme', savedTheme === 'light');

    // Show Reader
    reader.classList.add('is-active');
    reader.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Lock background scroll
    OverlayHistory.opened('reader');

    // Python execution rides the shared Web Worker runtime (PyRuntime),
    // so a heavy or runaway snippet can never freeze the reader UI.
    async function executePython(code, outputEl, buttonEl) {
      const originalText = buttonEl.textContent;
      buttonEl.disabled = true;
      buttonEl.textContent = "Running...";
      outputEl.textContent = "Running...";
      outputEl.classList.remove('err');

      const out = [];
      const errOut = [];
      try {
        await PyRuntime.run(code, (t) => out.push(t), (t) => errOut.push(t));
        if (errOut.length) {
          outputEl.textContent = errOut.join('\n');
          outputEl.classList.add('err');
        } else {
          outputEl.textContent = out.join('\n') || "Executed successfully (no output).";
        }
      } catch (err) {
        const msg = errOut.length ? errOut.join('\n') : ((err && err.message) || String(err));
        outputEl.textContent = msg;
        outputEl.classList.add('err');
      } finally {
        buttonEl.disabled = false;
        buttonEl.textContent = originalText;
      }
    }

    function makeInteractiveLive() {
      const pres = contentArea.querySelectorAll('.content pre');
      
      pres.forEach((pre) => {
        const code = pre.textContent.trim();
        const shell = document.createElement('div');
        shell.className = 'interactive-shell';
        shell.innerHTML = `
          <div class="shell-header">
            <span>Interactive Shell</span>
            <button class="shell-run-btn" type="button">Run Code</button>
          </div>
          <textarea class="shell-editor" spellcheck="false" rows="${code.split('\n').length + 2}">${esc(code)}</textarea>
          <pre class="shell-output">Click 'Run Code' to execute...</pre>
        `;
        
        const runBtn = shell.querySelector('.shell-run-btn');
        const editor = shell.querySelector('.shell-editor');
        const output = shell.querySelector('.shell-output');
        
        runBtn.onclick = () => executePython(editor.value, output, runBtn);

        // Support Tab key inside editor
        editor.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 4;
          }
        });
        
        pre.replaceWith(shell);
      });
    }

    function renderActiveChapter() {
      const ch = PYTHON_CHAPTERS[activeChapter];
      contentArea.innerHTML = `
        <h1>${ch.title}</h1>
        <div class="metadata">
          <span>📖 Chapter ${activeChapter + 1} of ${PYTHON_CHAPTERS.length}</span>
          <span>⏱️ ${ch.category}</span>
          <span>⚙️ ${ch.subtitle}</span>
        </div>
        <div class="content">
          ${ch.content}
        </div>
      `;

      // Convert code blocks to active playgrounds
      makeInteractiveLive();

      // Update sidebar states
      $$('.reader-sidebar .toc-item').forEach((item, idx) => {
        item.classList.toggle('active', idx === activeChapter);
      });

      // Update pagination info
      prevBtn.disabled = activeChapter === 0;
      nextBtn.disabled = activeChapter === PYTHON_CHAPTERS.length - 1;
      progressInfo.textContent = `Chapter ${activeChapter + 1} of ${PYTHON_CHAPTERS.length}`;
      headerChapter.textContent = `Chapter ${activeChapter + 1} of ${PYTHON_CHAPTERS.length}`;

      // Save state
      localStorage.setItem('python-active-chapter', activeChapter);
      
      // Scroll content area back to top
      contentArea.parentElement.scrollTop = 0;
    }

    // Render TOC Sidebar
    tocList.innerHTML = PYTHON_CHAPTERS.map((ch, idx) => `
      <li class="toc-item ${idx === activeChapter ? 'active' : ''}">
        <button type="button" data-chapter-index="${idx}">${ch.title}</button>
      </li>
    `).join('');

    // Bind sidebar chapter selection
    tocList.onclick = (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        activeChapter = parseInt(btn.dataset.chapterIndex, 10);
        renderActiveChapter();
      }
    };

    // Pagination Click Listeners
    prevBtn.onclick = () => {
      if (activeChapter > 0) {
        activeChapter--;
        renderActiveChapter();
      }
    };

    nextBtn.onclick = () => {
      if (activeChapter < PYTHON_CHAPTERS.length - 1) {
        activeChapter++;
        renderActiveChapter();
      }
    };

    // Theme Switch Click Listener
    themeBtn.onclick = () => {
      const isLight = reader.classList.toggle('reader-light-theme');
      localStorage.setItem('reader-theme', isLight ? 'light' : 'dark');
    };

    // Close / Go Back Click Listener
    closeBtn.onclick = () => {
      closeReaderVisual();
      OverlayHistory.closed('reader');
    };

    // Keyboard navigation
    const handleKeyboardNav = (e) => {
      if (!reader.classList.contains('is-active')) {
        window.removeEventListener('keydown', handleKeyboardNav);
        return;
      }
      
      // Bypass if inside textarea editor
      if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
        return;
      }

      const key = e.key.toLowerCase();
      if (e.key === 'ArrowRight' || key === 'd') {
        if (activeChapter < PYTHON_CHAPTERS.length - 1) {
          activeChapter++;
          renderActiveChapter();
        }
      } else if (e.key === 'ArrowLeft' || key === 'a') {
        if (activeChapter > 0) {
          activeChapter--;
          renderActiveChapter();
        }
      } else if (key === 't') {
        themeBtn.click();
      } else if (e.key === 'Escape') {
        closeBtn.click();
      }
    };
    window.addEventListener('keydown', handleKeyboardNav);

    // Initial render
    renderActiveChapter();
  }

  OverlayHistory.register('reader', {
    open: openPythonReader,
    close: closeReaderVisual,
  });

  // -------------------------------------------------- mcp tools simulation logic
  function initMCPPlayground() {
    const select = $('#mcp-tool-select');
    const reqCode = $('#mcp-req-code');
    const resCode = $('#mcp-res-code');
    const runBtn = $('#mcp-run-btn');

    if (!select || !reqCode || !resCode || !runBtn) return;

    const requestTemplates = {
      'tools/list': { method: 'tools/list', params: {} },
      'tools/call:get_skills': { method: 'tools/call', params: { name: 'get_skills', arguments: {} } },
      'tools/call:get_experience': { method: 'tools/call', params: { name: 'get_experience', arguments: { limit: 2 } } },
      'tools/call:get_profile': { method: 'tools/call', params: { name: 'get_profile', arguments: {} } }
    };

    select.addEventListener('change', () => {
      const template = requestTemplates[select.value];
      reqCode.textContent = JSON.stringify(template, null, 2);
    });

    runBtn.addEventListener('click', () => {
      resCode.textContent = '// Sending request to portfolio client...';
      
      // Simulate tool call execution
      setTimeout(() => {
        const value = select.value;
        let response = {};

        if (value === 'tools/list') {
          response = {
            tools: [
              { name: 'get_profile', description: 'Returns standard bio and social handles' },
              { name: 'get_skills', description: 'Fetches technical matrix levels' },
              { name: 'get_experience', description: 'Lists job histories' }
            ]
          };
        } else if (value === 'tools/call:get_skills') {
          response = {
            result: CONFIG.skills.map(s => ({ category: s.category, count: s.items.length }))
          };
        } else if (value === 'tools/call:get_experience') {
          response = {
            result: CONFIG.experience.map(e => ({ role: e.role, company: e.company, duration: e.duration }))
          };
        } else if (value === 'tools/call:get_profile') {
          response = {
            result: {
              name: CONFIG.profile.name,
              role: CONFIG.profile.role,
              location: CONFIG.profile.location
            }
          };
        }

        resCode.textContent = JSON.stringify({ jsonrpc: '2.0', id: 1, result: response }, null, 2);
      }, 700);
    });
  }

  // ---------------------------------------------------- metamask simulation logic
  function initDAppSandbox() {
    const btn = $('#open-dapp-btn');
    const modal = $('#dapp-modal');
    const box = $('#dapp-modal-box');

    if (!btn || !modal || !box) return;

    function renderMetaMaskPrompt() {
      box.innerHTML = `
        <div class="mm-header">
          <div class="mm-header__logo">
            <svg style="width: 24px; height: 24px; fill: #f6851b;" viewBox="0 0 24 24"><path d="M22 11.603l-2.072-5.753-2.928.718L22 11.603zm-10 1.22l-1.396-4.636 1.396 2.148 1.396-2.148L12 12.823zm10-1.22l-4.529 1.488.625 2.144L22 11.603zM2.072 5.85L0 11.603l4.904 3.809.625-2.144L2.072 5.85zm12.928 2.052L12 3l-3 4.902h6zm-9.928-.718L3.072 5.85 0 11.603l4.904 3.809.096-7.562zM12 21l3.668-5.328H8.332L12 21zm-7.096-9.397L1.236 15.412l7.096-.282-3.428-3.527zM22.764 15.412l-3.668-3.809-3.428 3.527 7.096.282z"/></svg>
            <span>MetaMask Notification</span>
          </div>
          <span class="mm-header__network">Ethereum Sepolia</span>
        </div>
        <div class="mm-body">
          <div class="mm-row">
            <span class="mm-label">Contract Call Origin</span>
            <span class="mm-value">sanjubibin.github.io</span>
          </div>
          <div class="mm-row">
            <span class="mm-label">Interaction Method</span>
            <span class="mm-value mm-value--mono">mintAssetToken(uint256 estateId)</span>
          </div>
          <div class="mm-row">
            <span class="mm-label">Parameters</span>
            <span class="mm-value mm-value--mono">estateId: 44</span>
          </div>
          <div class="mm-row">
            <span class="mm-label">Estimated Gas Fee</span>
            <span class="mm-value mm-value--gas">0.00042 ETH ($1.35)</span>
          </div>
        </div>
        <div class="mm-buttons">
          <button type="button" class="btn btn--sm glass mm-reject" id="mm-reject" data-gel>Reject</button>
          <button type="button" class="btn btn--sm btn--primary glass mm-confirm" id="mm-confirm" data-gel>Confirm</button>
        </div>
      `;

      // Bind prompt confirmation events
      $('#mm-reject').addEventListener('click', () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      });

      $('#mm-confirm').addEventListener('click', () => {
        renderMetaMaskLoading();
      });
    }

    function renderMetaMaskLoading() {
      box.innerHTML = `
        <div class="mm-loader">
          <div class="mm-spinner"></div>
          <p style="font-weight: 600; color: #fff;">Mining Transaction Block...</p>
          <p style="font-size: 0.8rem; color: #94a3b8;">Simulating network state transitions on Sepolia Testnet</p>
        </div>
      `;

      setTimeout(() => {
        renderMetaMaskSuccess();
      }, 2000);
    }

    function renderMetaMaskSuccess() {
      box.innerHTML = `
        <div class="mm-success">
          <div class="mm-success__icon">✓</div>
          <h4 style="color: #fff; font-weight: 700; font-size: 1.15rem;">Transaction Confirmed</h4>
          <div class="mm-token-card">
            <div class="mm-token-card__media">#44</div>
            <div class="mm-token-card__info">
              <h5>Ionixx Tokenized Estate</h5>
              <p>Owner: ${esc(CONFIG.profile.name)}</p>
              <p style="font-family: var(--font-code); font-size: 0.7rem; color: #34d399; margin-top: 0.2rem;">
                Tx: 0x7b58f8b...32a1f
              </p>
            </div>
          </div>
          <button type="button" class="btn btn--sm glass" id="mm-close" data-gel style="width: 100%;">
            Close Sandbox
          </button>
        </div>
      `;

      $('#mm-close').addEventListener('click', () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      });
    }

    btn.addEventListener('click', () => {
      renderMetaMaskPrompt();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    });
  }

  // Dynamic marquee group duplicator to support massive screens / high zoom-out without gaps
  function initMarqueeDupes() {
    const tracks = $$('.tech-marquee__track');
    const viewportWidth = window.innerWidth;

    tracks.forEach((track) => {
      const firstGroup = $('.tech-marquee__group', track);
      if (!firstGroup) return;

      const groupWidth = firstGroup.getBoundingClientRect().width;
      if (!groupWidth) return;

      // We need enough groups to cover at least twice the viewport width (plus a safety buffer)
      const neededWidth = viewportWidth * 2.2;
      const currentGroups = $$('.tech-marquee__group', track);
      const currentCount = currentGroups.length;

      let neededCount = Math.ceil(neededWidth / groupWidth);
      if (neededCount < 2) neededCount = 2;

      // Make sure neededCount is an even number to keep the TranslateX(-50%) infinite loop seamless
      if (neededCount % 2 !== 0) neededCount += 1;

      if (neededCount > currentCount) {
        const clonesNeeded = neededCount - currentCount;
        for (let i = 0; i < clonesNeeded; i++) {
          const clone = firstGroup.cloneNode(true);
          track.appendChild(clone);
        }
      }
    });
  }

  // Resume Viewer Modal handler with download/print block protections
  function initResumeModal() {
    const modal = $('#resume-modal');
    const closeBtn = $('#resume-modal-close');
    const iframe = $('#resume-iframe');
    const resumeBtn = $('#resume-btn');
    const navResumeBtn = $('.nav__resume');

    if (!modal || !closeBtn || !iframe) return;

    const openModal = (e) => {
      e.preventDefault();
      // If resume is blocked, let the global warning interceptor handle it
      if (CONFIG.features && CONFIG.features.blockResume) return;

      // Load PDF dynamically to prevent auto-focus scroll-down on page load
      const dataSrc = iframe.getAttribute('data-src');
      if (dataSrc && (!iframe.src || iframe.src === 'about:blank' || iframe.src.endsWith('about:blank'))) {
        iframe.src = dataSrc;
      }

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // Lock background scrolling
      OverlayHistory.opened('resume');
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; // Restore background scrolling
      OverlayHistory.closed('resume');
    };

    OverlayHistory.register('resume', {
      open: () => openModal({ preventDefault() {} }),
      close: closeModal,
    });

    if (resumeBtn) resumeBtn.addEventListener('click', openModal);
    if (navResumeBtn) navResumeBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);

    // Close on overlay backdrop clicks
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Discourage Print (Ctrl+P) and Save (Ctrl+S) inside parent window
    window.addEventListener('keydown', (e) => {
      if (modal.classList.contains('is-open')) {
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 's')) {
          e.preventDefault();
        }
      }
    });

    // Discourage right click on the modal container
    modal.addEventListener('contextmenu', (e) => e.preventDefault());

    // Inject same-origin protection script inside the iframe document after load
    iframe.addEventListener('load', () => {
      try {
        const frameDoc = iframe.contentWindow.document;
        
        // 1. Disable contextmenu (right-click) inside iframe
        frameDoc.addEventListener('contextmenu', (e) => {
          e.preventDefault();
        });
        
        // 2. Disable Save / Print shortcuts inside iframe
        frameDoc.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 's')) {
            e.preventDefault();
          }
        });
      } catch (err) {
        console.warn('Cross-origin frame policy prevented document event blocking.', err);
      }
    });
  }

  // Dynamic Status Warning Modal for blocked socials/resume
  function initStatusWarningModal() {
    const modal = $('#status-warning-modal');
    const closeBtn = $('#status-warning-close');
    const iconEl = $('#status-warning-icon');
    const titleEl = $('#status-warning-title');
    const textEl = $('#status-warning-text');

    if (!modal || !closeBtn || !iconEl || !titleEl || !textEl) return;

    window.showStatusWarning = (type) => {
      let icon = '🔗';
      let title = 'Link Offline';
      let text = 'This profile is currently offline for updates. Please reach out via email!';

      if (type === 'resume') {
        icon = '📄';
        title = 'Resume Under Update';
        text = 'My resume is currently undergoing updates with recent projects. Please feel free to reach out via email or check back shortly!';
      } else if (type === 'github') {
        icon = '💻';
        title = 'GitHub Profile Offline';
        text = 'My GitHub profile is currently undergoing repository maintenance and structure updates. Please check back shortly or connect with me via email!';
      } else if (type === 'linkedin') {
        icon = '💼';
        title = 'LinkedIn Profile Offline';
        text = 'My LinkedIn profile is currently offline for updates. Please feel free to reach out via email or send a message using the contact form!';
      } else if (type === 'instagram') {
        icon = '📸';
        title = 'Instagram Offline';
        text = 'My Instagram profile is temporarily offline for maintenance. Please check back shortly or reach out via email/contact form!';
      } else if (type === 'contact') {
        icon = '✉️';
        title = 'Contact Form Offline';
        text = 'The contact form is temporarily offline for maintenance. Please feel free to reach out directly via email at sanjubibin44@gmail.com!';
      }

      iconEl.textContent = icon;
      titleEl.textContent = title;
      textEl.textContent = text;

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // Lock background scrolling
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; // Restore background scrolling
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Intercept clicks globally
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href') || '';
      const ariaLabel = (anchor.getAttribute('aria-label') || '').toLowerCase();
      const textContent = (anchor.textContent || '').toLowerCase();
      const classes = anchor.className;

      // 1. Check Resume
      const isResume = classes.includes('nav__resume') || 
                       classes.includes('contact__resume') || 
                       href.includes('Resume.pdf');
      if (isResume && CONFIG.features && CONFIG.features.blockResume) {
        e.preventDefault();
        window.showStatusWarning('resume');
        return;
      }

      // 2. Check GitHub
      const isGitHub = href.includes('github.com') || ariaLabel.includes('github') || textContent.includes('github');
      if (isGitHub && CONFIG.features && CONFIG.features.blockGitHub) {
        e.preventDefault();
        window.showStatusWarning('github');
        return;
      }

      // 3. Check LinkedIn
      const isLinkedIn = href.includes('linkedin.com') || ariaLabel.includes('linkedin') || textContent.includes('linkedin');
      if (isLinkedIn && CONFIG.features && CONFIG.features.blockLinkedIn) {
        e.preventDefault();
        window.showStatusWarning('linkedin');
        return;
      }

      // 4. Check Instagram
      const isInstagram = href.includes('instagram.com') || ariaLabel.includes('instagram') || textContent.includes('instagram');
      if (isInstagram && CONFIG.features && CONFIG.features.blockInstagram) {
        e.preventDefault();
        window.showStatusWarning('instagram');
        return;
      }
    });
  }

  // ---------------------------------------------- lite reveal system
  // Used on perf-lite devices (GSAP never loads there) and as the fallback
  // when the GSAP CDN fails: an IntersectionObserver plus CSS transitions
  // (see .lite-anim in style.css) keeps the scroll reveals alive. The
  // .lite-anim class that hides .reveal elements is only added here, after
  // IO support is confirmed, so content can never be stuck invisible.
  function initLiteReveals() {
    if (!('IntersectionObserver' in window) || REDUCED) return;
    document.documentElement.classList.add('lite-anim');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    // Positive bottom margin = observe one-third of a viewport BELOW the
    // fold, so reveals fire before elements scroll into sight and fast
    // scrolling never outruns them.
    }, { rootMargin: '0px 0px 35% 0px' });
    $$('.reveal').forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.94) {
        el.classList.add('is-in'); // already on screen — show instantly
      } else {
        io.observe(el);
      }
    });
  }

  // Pause the marquee animation while it is scrolled out of view (all tiers).
  function initMarqueeAutoPause() {
    const marquee = $('.tech-marquee');
    if (!marquee || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => {
      marquee.classList.toggle('is-offscreen', !entry.isIntersecting);
    });
    io.observe(marquee);
  }

  // Lazy-surface stubs: the terminal (cli.js) and AI chat (ai-clone.js)
  // scripts download the first time their surface is opened. Each script
  // self-initializes and flags itself (__CLI_BOOTED / __AI_BOOTED); the
  // stub then re-triggers the click so the surface opens seamlessly.
  function initLazySurfaces() {
    const cliBtn = $('#cli-nav-btn');
    let cliBooting = false;
    const bootTerminal = async () => {
      if (window.__CLI_BOOTED || cliBooting) return;
      cliBooting = true;
      try {
        await LazySurface.withVeil('cli.js');
        if (cliBtn) cliBtn.click(); // cli.js's own listener opens it now
      } catch (err) {
        console.warn(err);
      } finally {
        cliBooting = false;
      }
    };
    if (cliBtn) cliBtn.addEventListener('click', () => { bootTerminal(); });
    window.addEventListener('keydown', (e) => {
      if ((e.key === '`' || e.key === '~') && !window.__CLI_BOOTED) {
        e.preventDefault();
        bootTerminal();
      }
    });

    const chatBtn = $('#ai-chat-toggle');
    let chatBooting = false;
    if (chatBtn) chatBtn.addEventListener('click', async () => {
      if (window.__AI_BOOTED || chatBooting) return;
      chatBooting = true;
      try {
        await LazySurface.withVeil('ai-clone.js');
        chatBtn.click(); // ai-clone.js's own listener opens it now
      } catch (err) {
        console.warn(err);
      } finally {
        chatBooting = false;
      }
    });
  }

  // ================================================================= INIT
  // Phase 1 — critical path, runs now: everything the visitor can see or
  // click in the first moments. Renders are cheap string templating into
  // the static skeleton; initNav wires scrolling; the status-warning
  // interceptor must be live before any outbound link can be clicked.
  renderHero();
  renderAbout();
  renderStats();
  renderSkills();
  renderFilterChips();
  renderProjects('All', true);
  renderExperience();
  renderSocials();
  renderContactMeta();
  renderFooter();
  renderBlogDropdown();

  initNav();
  initStatusWarningModal();
  initLazySurfaces();

  // Phase 2 — deferred to browser idle: wiring for surfaces that sit
  // behind an interaction (pickers, drawers, modals, forms) plus marquee
  // cloning (a layout read). Deferring keeps the main thread free right
  // when low-end devices are busy with first paint and first scroll.
  const initDeferred = () => {
    initMarqueeDupes();
    initThemeSwitcher();
    initBlogDropdown();
    initForm();
    initFilters();
    initAudioEvents();
    initProjectDrawer();
    initGuidesDrawer();
    initResumeModal();
    initMarqueeAutoPause();
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(initDeferred, { timeout: 1500 });
  } else {
    setTimeout(initDeferred, 300);
  }

  // Enhancement layer: waits for the conditionally-injected GSAP bundle.
  // On perf-lite devices (no bundle) or if the CDN fails, the site stays on
  // the cheap CSS-only path — fully readable and interactive either way.
  if (!LITE && window.__gsapReady) {
    window.__gsapReady.then(() => {
      if (!(window.gsap && window.ScrollTrigger && window.ScrollToPlugin)) {
        initLiteReveals();
        return;
      }
      HAS_GSAP = true;
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
      if (REDUCED) return;
      initGelButtons();
      initScrollFX();
      initTaglineRotator();
      // Tilt/magnet effects need a hovering cursor — pointless on touch.
      if (!COARSE) initPointerFX();
    });
  } else {
    initLiteReveals();
  }


})();
