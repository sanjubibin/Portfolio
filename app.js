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
    const stats = [
      { n: 99, suffix: '%', label: 'Uptime SLA' },
      { n: (CONFIG.projects || []).length, suffix: '+', label: 'One-Click Templates' },
      { n: (CONFIG.skills || []).reduce((n, g) => n + (g.items || []).length, 0), suffix: '+', label: 'Tech Integrations' }
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

      // Close all submenus when closing the main dropdown
      if (!show) {
        $$('.nav__dropdown-group').forEach(group => {
          group.classList.remove('is-open');
          const trigger = group.querySelector('.nav__dropdown-trigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
      }
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

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

<<<<<<< HEAD
    // Float-up reveals. Hidden state applied here (JS only), and only to
    // elements still below the fold — anything already on screen stays
    // visible so late engine load never blanks rendered content.
    // The blur-in flourish is desktop-only: animating filter re-rasterizes
    // every frame, which is exactly what stutters on phones.
    // Reveals animate transform + opacity only (no filter): identical on
    // every device, and pure compositor work.
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
=======
    // Snappy float-up + blur-in reveals triggered earlier.
    const reveals = $$('.reveal');
    gsap.set(reveals, { autoAlpha: 0, y: 16, filter: 'blur(4px)' });
    ScrollTrigger.batch(reveals, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        autoAlpha: 1, y: 0, filter: 'blur(0px)',
        duration: 0.4, ease: 'power2.out', stagger: 0.02,
        clearProps: 'filter',
>>>>>>> 090c4db29739d2bf109a8a1242efb667846590bb
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
<<<<<<< HEAD
        start: 'top 115%',
        once: true,
        onEnter: () => gsap.from(pills, {
          scale: 0.8, autoAlpha: 0, duration: 0.28,
          ease: 'power2.out', stagger: 0.02, clearProps: 'all'
=======
        start: 'top 92%',
        once: true,
        onEnter: () => gsap.from(pills, {
          scale: 0.6, autoAlpha: 0, duration: 0.3,
          ease: 'back.out(1.8)', stagger: 0.015, clearProps: 'all'
>>>>>>> 090c4db29739d2bf109a8a1242efb667846590bb
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
<<<<<<< HEAD
          scale: 0, duration: 0.6, ease: 'back.out(2.5)',
          scrollTrigger: { trigger: dot.closest('.xp-entry'), start: 'top 105%', once: true }
=======
          scale: 0, duration: 0.3, ease: 'back.out(2.5)',
          scrollTrigger: { trigger: dot.closest('.xp-entry'), start: 'top 88%', once: true }
>>>>>>> 090c4db29739d2bf109a8a1242efb667846590bb
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

      $('#drawer-body').innerHTML = bodyHtml;

      // Open Panel
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-hidden', 'false');
      
      // Wire up special play handlers if injected
      if (p.title === "Model Context Protocol & Custom AI Chatbot Server") initMCPPlayground();
      if (p.title === "Decentralized Asset Tokenization Platform") initDAppSandbox();
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
    }

    function closeGuidesDrawer() {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; // Restore background scroll
    }

    // Expose openGuidesDrawer globally so it can be called from blog dropdown click
    window.openGuidesDrawer = openGuidesDrawer;

    closeBtn.addEventListener('click', closeGuidesDrawer);
    overlay.addEventListener('click', closeGuidesDrawer);

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

    // Launch Python from Scratch Reader
    if (btnPython) {
      btnPython.addEventListener('click', () => {
        closeGuidesDrawer();
        openPythonReader();
      });
    }
  }

  // Interactive Python learning chapters database
  const PYTHON_CHAPTERS = [
    {
      title: "1. Syntax & Indentation",
      subtitle: "Aligning the System",
      category: "Syntax & Indentation",
      content: `
        <p>In most programming languages, curly brackets <code>{}</code> are used to group blocks of code. Python does not use brackets; instead, it relies entirely on <strong>whitespace indentation</strong> (usually 4 spaces) to define execution hierarchy.</p>
        <h2>The Alignment Analogy</h2>
        <p>Think of indentation in Python like aligning keyways on a rotational shaft. If a keyway is misaligned by even half a millimeter, the assembly binds, and the machine crashes. Similarly, if your indentation is off in Python, the interpreter raises an <code>IndentationError</code> and halts execution.</p>
        <pre># CORRECT: The block sits inside the check
if pressure > 100:
    print("Release relief valve!") # Indented 4 spaces

# INCORRECT: This raises an IndentationError!
if pressure > 100:
print("Release relief valve!") # No indentation!</pre>
        <p>Indentations tell Python which lines belong to a specific conditional branch, loop cycle, or functional block. Maintain correct alignment to keep your software engine running smoothly!</p>
      `
    },
    {
      title: "2. Variables & Casting",
      subtitle: "Data Storage Tanks & Converters",
      category: "Variables & Casting",
      content: `
        <p>Variables in Python are created dynamically when you assign a value to them using the assignment operator <code>=</code>. Unlike statically typed languages, you do not need to pre-declare their data capacity.</p>
        <h2>The Storage Tank Analogy</h2>
        <p>Think of a variable as a <strong>storage tank</strong>. By typing <code>pressure = 120</code>, you create a tank named <code>pressure</code> and fill it with the value <code>120</code>. You can change this fluid at any point in the cycle: <code>pressure = "Decompressed"</code>.</p>
        <h2>Data Casting (Modifying Flow Types)</h2>
        <p>Sometimes you need to convert data from one state to another (casting). This is like running a fluid through a converter valve:
        <ul>
          <li><code>int(x)</code> - Converts a value to a solid whole number.</li>
          <li><code>float(x)</code> - Converts a value to a precise decimal measurement.</li>
          <li><code>str(x)</code> - Converts a value to text format.</li>
        </ul>
        </p>
        <pre>temp_sensor = "98.6" # Text string
numeric_temp = float(temp_sensor) # Casts to 98.6 (decimal float)</pre>
        <h2>Variable Scope (Local vs. Global)</h2>
        <p>Variables declared inside a function are <strong>local</strong> (only accessible within that local subsystem). Variables declared in the main script are <strong>global</strong> (accessible by any subsystem across the main application). Use the <code>global</code> keyword to modify a global variable from inside a local subsystem.</p>
      `
    },
    {
      title: "3. Data Types & Booleans",
      subtitle: "Materials & Binary Switches",
      category: "Data Types & Booleans",
      content: `
        <p>Every variable holds a specific data type. Understanding your data types is like selecting the correct engineering materials for a mechanical structure.</p>
        <h2>Core Python Materials</h2>
        <ul>
          <li><strong>Int / Float (Integers / Decimals):</strong> Used for dimensions, sensor readings, and math operations.</li>
          <li><strong>Str (Strings / Text):</strong> Text characters wrapped in quotes, used for log messages or serial commands.</li>
          <li><strong>Bool (Booleans / Binary Switches):</strong> Holds either <code>True</code> or <code>False</code>.</li>
        </ul>
        <h2>The Boolean Analogy</h2>
        <p>Booleans are simple binary toggles. Think of them like a limit switch on a linear actuator: either the actuator has hit the limit switch (<code>True</code>) or it hasn't (<code>False</code>). There is no middle ground.</p>
        <pre>actuator_active = True
safety_tripped = False</pre>
        <h2>String Slicing & Formatting</h2>
        <p>You can extract segments of a text string (slicing) using index ranges <code>[start:end]</code>, or format strings dynamically using f-strings (prefixed with <code>f</code>) to inject variables directly into messages:</p>
        <pre>serial_code = "ERR_OVERTEMP_95C"
err_type = serial_code[0:3] # Extracts "ERR"
curr_temp = 98.2
status_log = f"System Report: {curr_temp}°C" # Injects curr_temp</pre>
      `
    },
    {
      title: "4. Operators & Logical Gears",
      subtitle: "Mathematical & Relational Interactions",
      category: "Operators",
      content: `
        <p>Operators are the symbols used to perform calculations, comparison gates, and logical routing checks in your system.</p>
        <h2>Mathematical Operators (Gears & Accelerators)</h2>
        <p>Standard math operators perform calculations on variables:
        <ul>
          <li><code>+</code>, <code>-</code>, <code>*</code>, <code>/</code> - Addition, subtraction, multiplication, division.</li>
          <li><code>%</code> (Modulus) - Returns the remainder of division (useful for repeating cycles).</li>
          <li><code>**</code> (Exponentiation) - Raises a number to a power.</li>
        </ul>
        </p>
        <h2>Comparison Gates (Check Valves)</h2>
        <p>Comparison operators return a Boolean (<code>True</code> or <code>False</code>) by comparing values:
        <ul>
          <li><code>==</code> (Equal to), <code>!=</code> (Not equal to)</li>
          <li><code>></code> (Greater than), <code><</code> (Less than)</li>
          <li><code>>=</code>, <code><=</code> (Greater than or equal to, Less than or equal to)</li>
        </ul>
        </p>
        <h2>Logical Operators (Compound Valves)</h2>
        <p>Combine multiple checks to route logic flows:
        <ul>
          <li><code>and</code> - Returns <code>True</code> if both pathways are active.</li>
          <li><code>or</code> - Returns <code>True</code> if at least one pathway is active.</li>
          <li><code>not</code> - Reverses the input signal (inverts <code>True</code> to <code>False</code>).</li>
        </ul>
        <pre># True only if temperature is safe AND pressure is stable
system_safe = (temp < 100) and (pressure <= 120)</pre>
      `
    },
    {
      title: "5. Lists & Collections",
      subtitle: "Conveyor Belts & Catalog Indexes",
      category: "Collections",
      content: `
        <p>Python offers four built-in collection types to store lists of variables in a single database. Selecting the correct collection is like choosing the appropriate material handling system.</p>
        <h2>The Four Collection Mechanisms</h2>
        <ul>
          <li><strong>List (Conveyor Belt):</strong> Ordered, changeable, and indexable. It can hold duplicates. You can append, remove, or sort items on the fly.</li>
          <li><strong>Tuple (Fixed Bracket):</strong> Ordered but immutable (cannot be altered after creation). Useful for coordinate sets or fixed configuration constants.</li>
          <li><strong>Set (Sorting Bin):</strong> Unordered and unindexed. No duplicate entries allowed. Perfect for filtering out duplicate serial codes.</li>
          <li><strong>Dictionary (Part Catalog):</strong> Unordered, changeable, and indexed using key-value pairs. You look up a specific item using its unique label instead of an index number.</li>
        </ul>
        <h2>The Dictionary Analogy</h2>
        <p>Think of a Dictionary like a parts catalog drawer. Instead of searching by shelf number (index), you search by the part name (key) to get its specifications (value).</p>
        <pre># Creating a dictionary of parts
part_catalog = {
    "sku_120": "Rotary Gear 40mm",
    "sku_155": "Stainless Steel Bolt",
    "sku_210": "Hydraulic Seal"
}

# Accessing a value by its key
selected_part = part_catalog["sku_155"] # Returns "Stainless Steel Bolt"</pre>
      `
    },
    {
      title: "6. Conditionals (If...Else)",
      subtitle: "Directional Routing Valves",
      category: "Conditionals",
      content: `
        <p>Conditional statements allow your software system to make choices and branch its execution pathway based on logical gates.</p>
        <h2>The Fluid Gate Analogy</h2>
        <p>Think of conditional statements like a fluid distribution manifold with safety valves. If pressure exceeds the threshold, the manifold closes flow-gate A and routes the fluid down safety pathway B. If not, it executes path C.</p>
        <pre>pressure = 115

if pressure > 120:
    print("ALERT: Safety valve tripped!")
elif pressure > 100:
    print("WARNING: Pressure is rising, monitor closely.")
else:
    print("Report: System pressures stable.")</pre>
        <h2>Logical Shorthand</h2>
        <p>For simple routing decisions, you can use Python's ternary shorthand to keep code compact:
        <pre>status = "Alert" if pressure > 120 else "Normal"</pre>
        </p>
      `
    },
    {
      title: "7. Loops (While & For)",
      subtitle: "Rotational Cycles & RPMs",
      category: "Loops",
      content: `
        <p>Loops instruct the computer to execute a block of code repeatedly. Managing loops is like configuring the RPM cycle of an engine.</p>
        <h2>While Loops (Continuous Operation)</h2>
        <p>A <code>while</code> loop runs indefinitely as long as a conditional check remains <code>True</code>. If you forget to modify the checking condition, you trigger an infinite loop, causing your program engine to lock up!</p>
        <pre>rpm = 0
while rpm < 3000:
    rpm += 500 # Accelerates cycle
    print(f"RPM speed: {rpm}")</pre>
        <h2>For Loops (Iterating Conveyor Belts)</h2>
        <p>A <code>for</code> loop iterates over a collection (like a list, tuple, or dictionary) or a range of numbers. It is used to run a specific action on every item on a conveyor belt in sequence.</p>
        <pre>critical_valves = ["valve_A", "valve_B", "valve_C"]
for valve in critical_valves:
    print(f"Auditing actuator status for: {valve}")</pre>
        <h2>Interrupt Commands (Break & Continue)</h2>
        <ul>
          <li><code>break</code> - Instantly terminates the loop cycle and exits.</li>
          <li><code>continue</code> - Skips the current iteration and jumps directly to the start of the next cycle.</li>
        </ul>
      `
    },
    {
      title: "8. Functions & OOP Classes",
      subtitle: "Modular Assemblies & Blueprint Blueprints",
      category: "Functions & OOP",
      content: `
        <p>As applications scale, writing unstructured scripts becomes unmanageable. Functions and Object-Oriented Programming (OOP) allow you to modularize your code into reusable subsystems and structural blueprints.</p>
        <h2>Functions (Subsystems / Valves)</h2>
        <p>A function is a block of code which only runs when it is called. You can pass inputs (arguments <code>*args</code> or keyword arguments <code>**kwargs</code>) and return outputs.</p>
        <pre>def calculate_torque(force, radius=0.2):
    return force * radius # Torque = F * r</pre>
        <h2>Classes & OOP (Engine Blueprints)</h2>
        <p>A Class is an extensible program code template for creating objects, providing initial values for state (properties) and implementations of behavior (methods).</p>
        <h2>The Blueprint Analogy</h2>
        <p>Think of a **Class** like a mechanical blueprint of an engine. The blueprint itself is not a machine—it is just the documentation of dimensions and actions. 
        When you construct a physical engine from that blueprint, you are creating an **Object** (instantiation). You can build multiple independent engines (objects) from the same blueprint (class).</p>
        <pre># The Blueprint (Class)
class Engine:
    def __init__(self, cylinders, horse_power):
        self.cylinders = cylinders # Property
        self.horse_power = horse_power # Property
        self.active = False # Property

    def start_ignition(self): # Method (Action)
        self.active = True
        return "Vroom! System active."

# Creating objects (instantiation)
engine_A = Engine(4, 150)
engine_B = Engine(8, 450)

# Running methods on objects
print(engine_A.start_ignition()) # Returns "Vroom! System active."
print(engine_A.active) # Returns True
print(engine_B.active) # Returns False (independent instances!)</pre>
      `
    }
  ];

  function openPythonReader() {
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
    const savedTheme = localStorage.getItem('reader-theme') || 'dark';
    reader.classList.toggle('reader-light-theme', savedTheme === 'light');

    // Show Reader
    reader.classList.add('is-active');
    reader.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Lock background scroll

    // Load WebAssembly Pyodide runtime helpers
    let pyodideInstance = null;
    let pyodidePromise = null;

    async function getPyodide() {
      if (pyodideInstance) return pyodideInstance;
      if (pyodidePromise) return pyodidePromise;

      pyodidePromise = new Promise((resolve, reject) => {
        if (window.loadPyodide) {
          loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/" })
            .then(py => { pyodideInstance = py; resolve(py); })
            .catch(err => { pyodidePromise = null; reject(err); });
          return;
        }
        
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js";
        script.onload = async () => {
          try {
            const py = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/" });
            pyodideInstance = py;
            resolve(py);
          } catch (err) {
            pyodidePromise = null;
            reject(err);
          }
        };
        script.onerror = (err) => {
          pyodidePromise = null;
          reject(err);
        };
        document.head.appendChild(script);
      });

      return pyodidePromise;
    }

    async function executePython(code, outputEl, buttonEl) {
      const originalText = buttonEl.textContent;
      buttonEl.disabled = true;
      buttonEl.textContent = "Running...";
      outputEl.textContent = "Running...";
      outputEl.classList.remove('err');

      try {
        const py = await getPyodide();

        // Set up output redirect
        py.runPython(`
          import sys
          import io
          sys.stdout = io.StringIO()
          sys.stderr = io.StringIO()
        `);

        // Execute code
        await py.runPythonAsync(code);

        const stdout = py.runPython("sys.stdout.getvalue()");
        const stderr = py.runPython("sys.stderr.getvalue()");

        if (stderr) {
          outputEl.textContent = stderr;
          outputEl.classList.add('err');
        } else {
          outputEl.textContent = stdout || "Executed successfully (no output).";
        }
      } catch (err) {
        let errMsg = "";
        try {
          if (pyodideInstance) {
            const capturedStderr = pyodideInstance.runPython("sys.stderr.getvalue()");
            if (capturedStderr && capturedStderr.trim()) {
              errMsg = capturedStderr;
            }
          }
        } catch (e) {
          // ignore
        }
        if (!errMsg) {
          errMsg = (err && (err.message || err.description)) || String(err);
        }
        outputEl.textContent = errMsg;
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
      reader.classList.remove('is-active');
      reader.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; // Restore background scroll
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
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; // Restore background scrolling
    };

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

  // ================================================================= INIT
  renderHero();
  initMarqueeDupes();
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
  initBlogDropdown();
  initForm();
  initFilters();
  initAudioEvents();
  initProjectDrawer();
  initGuidesDrawer();
  initResumeModal();
  initStatusWarningModal();
  initMarqueeAutoPause();

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
<<<<<<< HEAD
      // Tilt/magnet effects need a hovering cursor — pointless on touch.
      if (!COARSE) initPointerFX();
    });
  } else {
    initLiteReveals();
  }


=======
      initCanvasDots();
      if (!COARSE) initPointerFX();
    }
  }

  // ========================================================= BACKGROUND INTERACTIVE CANVAS DOTS
  function initCanvasDots() {
    const canvas = $('#bg-canvas-dots');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let dots = [];
    let spacing = 22; // Very compact dot grid spacing
    
    const state = {
      mx: -1000, my: -1000,
      active: false,
      targetStrength: 0,
      currentStrength: 0
    };

    let isLooping = false;
    
    function wake() {
      if (!isLooping) {
        isLooping = true;
        requestAnimationFrame(loop);
      }
    }
    
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      
      // Build/Rebuild the coordinate grid
      dots = [];
      const cols = Math.ceil(window.innerWidth / spacing) + 1;
      const rows = Math.ceil(window.innerHeight / spacing) + 1;
      
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const bx = c * spacing;
          const by = r * spacing;
          dots.push({
            x: bx, y: by,
            baseX: bx, baseY: by,
            vx: 0, vy: 0
          });
        }
      }
      wake();
    }
    
    window.addEventListener('resize', resize, { passive: true });
    
    let moveTimeout = null;
    
    window.addEventListener('pointermove', (e) => {
      // Check if cursor is over any interactive container, tab, or glass element from the landing page
      const isOverInteractive = e.target && (
        e.target.closest('.glass') || 
        e.target.closest('a') || 
        e.target.closest('button') || 
        e.target.closest('.cli-terminal') ||
        e.target.closest('.ai-chat-container') ||
        e.target.closest('.resume-modal')
      );

      if (isOverInteractive) {
        clearTimeout(moveTimeout);
        state.active = false;
        state.targetStrength = 0;
        wake();
        return;
      }

      state.mx = e.clientX;
      state.my = e.clientY;
      state.active = true;
      state.targetStrength = 1;
      wake();
      
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        state.active = false;
        state.targetStrength = 0;
        wake();
      }, 150);
    }, { passive: true });
    
    document.addEventListener('pointerleave', () => {
      clearTimeout(moveTimeout);
      state.active = false;
      state.targetStrength = 0;
      wake();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        wake();
      }
    });
    
    resize();
    
    const forceRadius = 110;
    const forceRadiusSq = forceRadius * forceRadius;
    
    function loop() {
      if (document.hidden) {
        isLooping = false;
        return;
      }
      
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      
      const time = Date.now() * 0.04;
      let animating = false;

      // Ease the active repulsion strength smoothly
      state.currentStrength += (state.targetStrength - state.currentStrength) * 0.08;
      if (state.currentStrength < 0.002) {
        state.currentStrength = 0;
      } else {
        animating = true;
      }
      
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        const dx = state.mx - dot.x;
        const dy = state.my - dot.y;
        const distSq = dx * dx + dy * dy;
        
        let force = 0;
        let angle = 0;
        let ratio = 0;
        
        // Repulsion physics inside the force bubble (calculated when strength is fading in/out)
        if (state.currentStrength > 0 && distSq < forceRadiusSq) {
          const dist = Math.sqrt(distSq);
          force = (forceRadius - dist) / forceRadius;
          angle = Math.atan2(dy, dx);
          
          // Push away from cursor scaled by current strength
          dot.vx -= Math.cos(angle) * force * 1.6 * state.currentStrength;
          dot.vy -= Math.sin(angle) * force * 1.6 * state.currentStrength;
          
          ratio = force * state.currentStrength;
          animating = true;
        }
        
        // Spring return forces to snap back to base anchors
        const accelX = (dot.baseX - dot.x) * 0.08;
        const accelY = (dot.baseY - dot.y) * 0.08;
        dot.vx = (dot.vx + accelX) * 0.80;
        dot.vy = (dot.vy + accelY) * 0.80;
        
        dot.x += dot.vx;
        dot.y += dot.vy;
        
        // Check if dot is still in motion or displaced from home
        if (Math.abs(dot.vx) > 0.005 || Math.abs(dot.vy) > 0.005 || Math.abs(dot.x - dot.baseX) > 0.05 || Math.abs(dot.y - dot.baseY) > 0.05) {
          animating = true;
        }
        
        // Smoothly blend color and radius from standard slate (hsla(222, 47%, 11%, 0.16)) to active rainbow HSL
        const activeHue = (dot.baseX + dot.baseY + time) % 360;
        const activeAlpha = 0.35 + force * 0.65; // Max opacity 1.0
        
        const h = 222 + (activeHue - 222) * ratio;
        const s = 47 + (100 - 47) * ratio; // Interpolate saturation to 100% (pure color)
        const l = 11 + (50 - 11) * ratio;  // Interpolate lightness to 50% (peak vibrancy)
        const a = 0.16 + (activeAlpha - 0.16) * ratio;
        
        const color = `hsla(${h}, ${s}%, ${l}%, ${a})`;
        const r = 0.9 + (force * 2.1) * state.currentStrength; // Max radius 3.0 for better visual presence
        
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      
      if (animating) {
        requestAnimationFrame(loop);
      } else {
        isLooping = false;
      }
    }
  }
>>>>>>> 090c4db29739d2bf109a8a1242efb667846590bb
})();
