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
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger && window.ScrollToPlugin);

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
    $('#hero-eyebrow').textContent = CONFIG.profile.title;
    $('#hero-title').textContent = CONFIG.profile.name;
    const sub = $('#hero-sub');
    const rot = CONFIG.profile.subTitleRotate;
    if (HAS_GSAP && !REDUCED && rot && rot.prefix && Array.isArray(rot.words) && rot.words.length > 1) {
      sub.innerHTML = `${esc(rot.prefix)} <span class="rotate-stack" id="rotate-stack">` +
        rot.words.map((w) => `<span>${esc(w)}</span>`).join('') + '</span>';
    } else {
      sub.textContent = CONFIG.profile.subTitle || '';
    }
  }

  function initTaglineRotator() {
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

  const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'];

  // Earliest start date across experience entries → whole years since then.
  function computeYears() {
    let earliest = null;
    for (const job of CONFIG.experience || []) {
      const m = String(job.duration || '').match(/(\d{4})\s*([A-Za-z]+)?/);
      if (!m) continue;
      const month = m[2] ? Math.max(0, MONTHS.indexOf(m[2].toLowerCase())) : 0;
      const d = new Date(+m[1], month, 1);
      if (!earliest || d < earliest) earliest = d;
    }
    if (!earliest) return (CONFIG.experience || []).length;
    const now = new Date();
    let years = now.getFullYear() - earliest.getFullYear();
    if (now.getMonth() < earliest.getMonth()) years -= 1;
    return Math.max(1, years);
  }

  function renderStats() {
    const stats = [
      { n: computeYears(), suffix: '+', label: 'Years Experience' },
      { n: (CONFIG.projects || []).length, suffix: '', label: 'Projects' },
      { n: (CONFIG.skills || []).reduce((n, g) => n + (g.items || []).length, 0), suffix: '', label: 'Technologies' }
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

  function projectCard(p, reveal) {
    const links = [
      p.codeLink ? `<a href="${esc(p.codeLink)}" target="_blank" rel="noopener">View Code →</a>` : '',
      p.liveLink ? `<a href="${esc(p.liveLink)}" target="_blank" rel="noopener">Live Demo →</a>` : ''
    ].join('');
    const techTags = (p.tags || []).map(t => t.toLowerCase()).join(',');
    return `
      <article class="glass card project-card${reveal ? ' reveal' : ''}" data-tech-tags="${esc(techTags)}" data-tilt>
        <div class="project-card__head">
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
      const external = /^https?:/i.test(link.url);
      return `<a class="social" href="${esc(link.url)}"${external ? ' target="_blank" rel="noopener"' : ''} aria-label="${esc(link.name)}" data-gel data-magnet>${icon}</a>`;
    }).join('');
    $('#social-links').innerHTML = html;
    $('#footer-socials').innerHTML = html;
  }

  function renderContactMeta() {
    const items = [];
    if (CONFIG.profile.email) {
      items.push(`<li>${ICONS.mail}<a href="mailto:${esc(CONFIG.profile.email)}">${esc(CONFIG.profile.email)}</a></li>`);
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

  // =============================================================== NAV
  function initNav() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (HAS_GSAP && !REDUCED) {
        gsap.to(window, { scrollTo: { y: target, offsetY: 88 }, duration: 1.1, ease: 'power4.inOut' });
      } else {
        target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
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
          $$('.nav__links a').forEach((a) => {
            const active = a.getAttribute('href') === '#' + sec.id;
            a.classList.toggle('is-active', active);
            if (active) {
              updateNavIndicator(a);
            }
          });
        }
      });
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

    form.addEventListener('submit', (e) => {
      e.preventDefault();
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
          autoAlpha: 0, y: 10, duration: 0.2, ease: 'power1.in',
          onComplete: () => {
            renderProjects(cat, false);
            gsap.set(grid, { autoAlpha: 1, y: 0 });
            gsap.from(grid.children, {
              autoAlpha: 0, y: 16, duration: 0.45, stagger: 0.06,
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





      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ============================================================ SCROLL FX
  function addIdleFloat(els) {
    els.forEach((el, i) => {
      if (!el.classList || !el.classList.contains('glass')) return;
      gsap.to(el, {
        y: -7, duration: 2.6 + (i % 3) * 0.5, ease: 'sine.inOut',
        yoyo: true, repeat: -1, delay: (i % 4) * 0.35
      });
    });
  }

  function initScrollFX() {
    // Hero intro. clearProps at the end so the CSS orb-crossfade rule
    // ([data-orb="on"] .hero__title { opacity: 0 }) can take effect.
    const introSel = '.hero__eyebrow, .hero__title, .hero__sub, .hero__cta .btn';
    const tl = gsap.timeline({
      delay: 0.15,
      onComplete: () => gsap.set(introSel, { clearProps: 'all' })
    });
    tl.from('.hero__eyebrow', { y: 26, autoAlpha: 0, duration: 0.9, ease: 'power3.out' })
      .from('.hero__title', { y: 34, autoAlpha: 0, duration: 1, ease: 'power3.out' }, '-=0.62')
      .from('.hero__sub', { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out' }, '-=0.7')
      .from('.hero__cta .btn', { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out' }, '-=0.62');

    // Float-up + blur-in reveals. Hidden state applied here (JS only).
    const reveals = $$('.reveal');
    gsap.set(reveals, { autoAlpha: 0, y: 44, filter: 'blur(12px)' });
    ScrollTrigger.batch(reveals, {
      start: 'top 85%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        autoAlpha: 1, y: 0, filter: 'blur(0px)',
        duration: 0.9, ease: 'back.out(1.4)', stagger: 0.08,
        clearProps: 'filter',
        onComplete: () => {
          if (COARSE) addIdleFloat(batch);
          batch.forEach((el) => {
            if (el.classList.contains('glass')) {
              el.classList.add('reveal-shine');
              setTimeout(() => el.classList.remove('reveal-shine'), 1050);
            }
          });
        }
      })
    });

    // Skill pills pop in with a spring stagger.
    $$('.skill-group').forEach((group) => {
      const pills = $$('.pill', group);
      ScrollTrigger.create({
        trigger: group,
        start: 'top 85%',
        once: true,
        onEnter: () => gsap.from(pills, {
          scale: 0.6, autoAlpha: 0, duration: 0.5,
          ease: 'back.out(1.8)', stagger: 0.045, clearProps: 'all'
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
          scrollTrigger: { trigger: dot.closest('.xp-entry'), start: 'top 82%', once: true }
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
  let isAudioMuted = false;

  function initAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSynthSound(freqStart, freqEnd, duration, type = 'sine', volume = 0.06) {
    if (isAudioMuted) return;
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
      if (isAudioMuted) return;
      const target = e.target.closest('a, button, .chip, .pill, .social');
      if (target) playTick();
    });

    // Press sound registers
    document.addEventListener('pointerdown', (e) => {
      if (isAudioMuted) return;
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

  // Handle window resizing to keep indicator aligned
  window.addEventListener('resize', () => {
    if (currentActiveLink) {
      updateNavIndicator(currentActiveLink);
    }
  });

  // ------------------------------------------------------- context highlights
  function initContextHighlights() {
    const skillsGroup = $('#skills-groups');
    if (!skillsGroup) return;

    skillsGroup.addEventListener('pointerover', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;

      const tech = pill.dataset.tech;
      if (!tech) return;

      const projectCards = $$('.project-card');
      const xpItems = $$('.xp-item');

      projectCards.forEach((card) => {
        const tags = (card.dataset.techTags || '').split(',');
        if (tags.includes(tech)) {
          card.classList.add('context-highlight');
        } else {
          card.classList.add('context-fade');
        }
      });

      xpItems.forEach((card) => {
        const descText = card.textContent.toLowerCase();
        if (descText.includes(tech)) {
          card.classList.add('context-highlight');
        } else {
          card.classList.add('context-fade');
        }
      });
    });

    skillsGroup.addEventListener('pointerout', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;

      $$('.project-card, .xp-item').forEach((card) => {
        card.classList.remove('context-highlight', 'context-fade');
      });
    });
  }

  // ------------------------------------------------------------- project drawer
  function initProjectDrawer() {
    const drawer = $('#project-drawer');
    const overlay = $('#drawer-overlay');
    const closeBtn = $('#project-drawer-close');
    if (!drawer || !overlay || !closeBtn) return;

    function openDrawer(projectTitle) {
      const p = (CONFIG.projects || []).find((x) => x.title === projectTitle);
      if (!p) return;

      // Set Title
      $('#drawer-title').textContent = p.title;

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

      // Special Interactive Playground: Ionixx GPT (MCP Client Tools)
      if (p.title === "Ionixx GPT") {
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

      // Special Interactive Playground: Real Estate Tokenization (MetaMask DApp Sandbox)
      if (p.title === "Real Estate Tokenization") {
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

      $('#drawer-body').innerHTML = bodyHtml;

      // Open Panel
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-hidden', 'false');
      
      // Wire up special play handlers if injected
      if (p.title === "Ionixx GPT") initMCPPlayground();
      if (p.title === "Real Estate Tokenization") initDAppSandbox();
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-hidden', 'true');
    }

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
          <p style="font-size: 0.8rem; color: var(--ink-low);">Simulating network state transitions on Sepolia Testnet</p>
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

  // ================================================================= INIT
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

  initNav();
  initForm();
  initFilters();
  initAudioEvents();
  initContextHighlights();
  initProjectDrawer();

  if (HAS_GSAP) {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    if (!REDUCED) {
      initGelButtons();
      initScrollFX();
      initTaglineRotator();
      if (!COARSE) initPointerFX();
    }
  }
})();
