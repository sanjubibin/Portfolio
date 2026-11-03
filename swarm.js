// =========================================================================
// SWARM BUILD — a crew of AI "agent cursors" assembles the page.
//
// Two pieces:
//  1. runOpening(): the boot loader hands over to a swarm intro — twenty
//     hue-wheel cursors spiral around the SA mark, it bursts, and every
//     agent dispatches to the part of the page it is about to build.
//  2. init(): every [data-swarm] block gets an agent layer (wireframe,
//     typing / paste previews, image placement box, check stamp, five role
//     agents + seven helpers). Its children fly in from alternating sides
//     while the agents work. Intro blocks (nav, hero) play on dispatch;
//     every other block is scrubbed by scroll, so it assembles on the way
//     down and comes apart again on the way back up.
//
// Loaded only on capable devices (the <head> boot script injects it next
// to GSAP), and app.js only calls it when motion is allowed — so the lite
// tier and reduced-motion visitors never pay for any of it. The agent
// layer is pure decoration: aria-hidden, pointer-events: none, and the
// real content underneath stays in the DOM, readable and focusable.
// =========================================================================

(() => {
  'use strict';

  const CURSOR = '<svg width="20" height="24" viewBox="0 0 20 24" aria-hidden="true"><path d="M2 1 18 14 10 15 7 23Z"/></svg>';
  const ROLES = [
    ['draw', 'DRAWING'],
    ['type', 'TYPING'],
    ['image', 'PLACING IMAGE'],
    ['paste', 'COPY / PASTE'],
    ['check', 'CHECKING']
  ].concat(Array.from({ length: 7 }, () => ['support', '']));
  const TEXT_SEL = 'p, h1, h2, h3, h4, li, label, a, .badge, .pill, .chip, .tag, .stat__num, .stat__label';
  const OPENING_AGENTS = 20;

  let gsap = null;
  let ScrollTrigger = null;
  const builds = new Map(); // element -> timeline

  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clean = (s) => s.replace(/\s+/g, ' ').trim();

  // ------------------------------------------------------------- markup
  // The layer is injected by JS (never in index.html), so no-JS, lite and
  // reduced-motion visitors never get it.
  function mount(el, mode, name) {
    if (el.querySelector(':scope > .swarm-agents')) return;
    el.classList.add('swarm-build');
    el.dataset.swarm = mode;
    // The swarm owns this block's entrance now — drop the float-up reveal
    // classes (on it, inside it, and on a direct wrapper such as a timeline
    // entry) so the two systems never both hide the same element.
    el.classList.remove('reveal');
    $$('.reveal', el).forEach((r) => r.classList.remove('reveal'));
    if (el.parentElement) el.parentElement.classList.remove('reveal');

    const layer = document.createElement('div');
    layer.className = 'swarm-agents';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML =
      '<span class="swarm-wireframe">' +
        ['top', 'right', 'bottom', 'left'].map((s) => `<span class="swarm-draw-line draw-${s}"></span>`).join('') +
      '</span>' +
      '<span class="swarm-typing-preview"></span>' +
      '<span class="swarm-paste-preview"></span>' +
      '<span class="swarm-placement-box"></span>' +
      '<span class="swarm-check-stamp">✓</span>' +
      ROLES.map(([role, label], i) =>
        `<span class="swarm-agent" data-agent-role="${role}" style="--i:${i}">${CURSOR}` +
        (label ? `<span>AI ${String(i + 1).padStart(2, '0')} · ${label}</span>` : '') +
        '</span>').join('') +
      `<span class="swarm-build-label">SWARM BUILD · ${name} <span class="swarm-build-state">· ASSEMBLING</span></span>`;
    el.appendChild(layer);
  }

  // Longest text becomes the typing preview, the runner-up the pasted
  // chip; the first child holding an image gets the placement box.
  function buildTargets(kids) {
    const texts = kids
      .flatMap((k) => [k, ...k.querySelectorAll(TEXT_SEL)])
      .filter((e) => e.matches(TEXT_SEL))
      .map((e) => ({ element: e, text: clean(e.textContent) }))
      .filter((t) => t.text)
      .sort((a, b) => b.text.length - a.text.length);
    return {
      typing: texts[0] ? texts[0].text.slice(0, 100) : '',
      paste: (texts[1] || texts[0] || { text: '' }).text.slice(0, 65),
      image: kids.find((k) => k.matches('img') || k.querySelector('img')),
      textPiece: kids.find((k) => texts[0] && (k === texts[0].element || k.contains(texts[0].element)))
    };
  }

  // ----------------------------------------------------- role choreography
  function animateRoles(tl, el, t) {
    const layer = el.querySelector(':scope > .swarm-agents');
    const q = (s) => layer.querySelector(s);
    const agent = (role) => q(`[data-agent-role="${role}"]`);
    const move = (x, y, d = 0.3) => ({ x, y, duration: d, ease: 'power1.inOut' });
    const fadeIn = (e, at) => tl.fromTo(e, { opacity: 0 }, { opacity: 1, duration: 0.15 }, at);
    const fadeOut = (e, at) => tl.to(e, { opacity: 0, duration: 0.22 }, at);
    const W = () => Math.max(20, el.clientWidth - 16);
    const H = () => Math.max(20, el.clientHeight - 16);

    // AI 01 traces the outline while the four wireframe edges draw after it.
    const draw = agent('draw');
    fadeIn(draw, 0);
    tl.fromTo(draw, { x: 8, y: 8 }, move(W, 8), 0);
    tl.to(draw, move(W, H), 0.3);
    tl.to(draw, move(8, H), 0.6);
    tl.to(draw, move(8, 8), 0.9);
    ['top', 'right', 'bottom', 'left'].forEach((side, i) => {
      const vertical = side === 'right' || side === 'left';
      tl.fromTo(q(`.draw-${side}`),
        { [vertical ? 'scaleY' : 'scaleX']: 0 },
        { [vertical ? 'scaleY' : 'scaleX']: 1, duration: 0.3, ease: 'none' }, i * 0.3);
    });
    fadeOut(draw, 1.2);

    // AI 02 types the block's longest line into a preview chip.
    if (t.typing) {
      const preview = q('.swarm-typing-preview');
      const typist = agent('type');
      const typed = { n: 0 };
      tl.fromTo(preview, { x: 12, y: 30 }, { x: 12, y: 30, duration: 0.01 }, 0.3);
      fadeIn(preview, 0.3);
      fadeIn(typist, 0.3);
      tl.fromTo(typist, { x: 12, y: 28 }, move(() => Math.max(12, Math.min(W() - 85, 210)), 55, 1.1), 0.3);
      tl.to(typed, {
        n: t.typing.length, duration: 1.1, ease: 'none',
        onUpdate: () => { preview.textContent = t.typing.slice(0, Math.floor(typed.n)); }
      }, 0.3);
      fadeOut([preview, typist], 1.5);
    }

    // AI 03 drops a selection box (with resize handles) over the image.
    if (t.image) {
      const img = t.image;
      const box = q('.swarm-placement-box');
      const placer = agent('image');
      tl.fromTo(box, {
        x: () => img.offsetLeft, y: () => img.offsetTop,
        width: () => img.clientWidth, height: () => Math.min(img.clientHeight, 380),
        scale: 0.9, opacity: 0
      }, { scale: 1, opacity: 1, duration: 0.7 }, 0.5);
      fadeIn(placer, 0.45);
      tl.fromTo(placer,
        { x: () => img.offsetLeft + 30, y: () => img.offsetTop + 75 },
        move(() => img.offsetLeft + Math.max(12, Math.min(img.clientWidth - 75, 180)), () => img.offsetTop + 25, 0.75), 0.45);
      fadeOut([box, placer], 1.3);
    }

    // AI 04 slides in a "copied content" chip and pastes it.
    if (t.paste) {
      const chip = q('.swarm-paste-preview');
      const paster = agent('paste');
      chip.textContent = t.paste;
      fadeIn(paster, 0.65);
      tl.fromTo(chip, { x: () => W() * 0.35, y: 70, scale: 0.88, opacity: 0 },
        { x: 16, y: 100, scale: 1, opacity: 1, duration: 0.55 }, 0.65);
      tl.fromTo(paster, { x: () => W() * 0.35, y: 60 }, move(22, 90, 0.55), 0.65);
      tl.to(chip, { scale: 1.03, duration: 0.12 }, 1.2);
      fadeOut([chip, paster], 1.4);
    }

    // AI 05 inspects the block top to bottom and stamps it.
    const checker = agent('check');
    const stamp = q('.swarm-check-stamp');
    fadeIn(checker, 1.1);
    tl.fromTo(checker, { x: () => Math.max(20, W() - 145), y: () => Math.min(H(), 150) },
      move(() => Math.max(20, W() - 145), 20, 0.4), 1.1);
    tl.to(checker, move(() => Math.max(20, W() - 145), () => Math.min(H(), 150), 0.4), 1.5);
    tl.fromTo(stamp, { x: () => W() - 28, y: 12, scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2.4)' }, 1.85);
    fadeOut([checker, stamp], 2.2);
  }

  // ---------------------------------------------------------- one block
  function createBuild(el) {
    const kids = Array.from(el.children).filter((c) => !c.classList.contains('swarm-agents'));
    if (!kids.length) return null;
    const t = buildTargets(kids);
    const layer = el.querySelector(':scope > .swarm-agents');
    const agents = $$(':scope > .swarm-agent', layer);
    const wire = layer.querySelector('.swarm-wireframe');
    const label = layer.querySelector('.swarm-build-label');
    const state = layer.querySelector('.swarm-build-state');
    const intro = el.dataset.swarm === 'intro';
    let done = false;

    // Fully built: hand the children back to their stylesheet (hover
    // transitions, rest states) and sweep the glass shine across once.
    const settle = () => {
      el.classList.remove('is-building');
      el.classList.add('is-built');
      kids.forEach((k) => { k.style.removeProperty('transform'); k.style.removeProperty('opacity'); });
      if (done) return;
      done = true;
      if (el.classList.contains('glass')) {
        el.classList.add('reveal-shine');
        setTimeout(() => el.classList.remove('reveal-shine'), 1050);
      }
    };

    const tl = gsap.timeline({
      paused: intro,
      defaults: { ease: 'power2.out' },
      scrollTrigger: intro ? undefined : {
        trigger: el,
        start: 'top 98%',
        // clamp(): blocks near the page bottom still finish at max scroll.
        end: 'clamp(top 52%)',
        scrub: 1.25,
        invalidateOnRefresh: true
      },
      onUpdate() {
        const p = this.progress();
        if (p >= 1) { settle(); return; }
        done = false;
        el.classList.remove('is-built');
        el.classList.toggle('is-building', p > 0);
        if (state) state.textContent = p > 0.86 ? '· VERIFIED ✓' : '· ASSEMBLING';
      },
      onComplete: settle
    });

    const spread = () => Math.min(135, el.clientWidth * 0.26);
    tl.fromTo([wire, label], { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0);

    kids.forEach((kid, i) => {
      const side = i % 2 ? 1 : -1;
      const at = (kid === t.image ? 0.5 : kid === t.textPiece ? 0.3 : 0.1) + i * 0.12;
      tl.fromTo(kid,
        { x: () => side * spread(), y: 55 + (i % 3) * 18, rotation: side * 4, scale: 0.92, opacity: 0 },
        { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.8 }, at);
    });

    // Seven helper cursors buzz over the children while they settle.
    Array.from({ length: Math.max(kids.length, agents.length) }, (_, i) => {
      const a = agents[i % agents.length];
      if (!a || a.dataset.agentRole !== 'support') return;
      const kid = kids[i % kids.length];
      const side = i % 2 ? 1 : -1;
      const at = 0.1 + (i % kids.length) * 0.12;
      tl.fromTo(a,
        { x: () => kid.offsetLeft + side * spread() + (i % 4) * 16, y: () => kid.offsetTop + 55 + (i % 4) * 18, opacity: 0 },
        { opacity: 1, duration: 0.14 }, at);
      tl.to(a, {
        x: () => kid.offsetLeft + Math.min(kid.clientWidth * (0.15 + (i % 4) * 0.19), Math.max(8, el.clientWidth - 120)),
        y: () => kid.offsetTop + Math.min(kid.clientHeight * (0.2 + (i % 4) * 0.18), 140),
        duration: 0.8
      }, at);
      tl.to(a, { x: '+=24', y: '-=16', opacity: 0, duration: 0.25 }, at + 0.8);
    });

    animateRoles(tl, el, t);
    tl.to([wire, label], { opacity: 0, duration: 0.2 }, '>-=0.1');
    return tl;
  }

  // ------------------------------------------------------------- public
  // targets: [{ el, mode: 'intro' | 'scroll', name }]
  function init(opts) {
    gsap = opts.gsap;
    ScrollTrigger = opts.ScrollTrigger;
    const vh = window.innerHeight;
    (opts.targets || []).forEach(({ el, mode, name }) => {
      if (!el || builds.has(el)) return;
      // A scroll block already on screen at boot would sit frozen half-
      // built until the first scroll — build it with the intro instead.
      if (mode === 'scroll' && opts.boot) {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.98 && r.bottom > 0) {
          mode = 'intro';
          el.dataset.swarmLate = '';
        }
      }
      mount(el, mode, name);
      const tl = createBuild(el);
      if (tl) builds.set(el, tl);
    });
  }

  // Start (or, for a skipped / late intro, finish instantly) the nav and
  // hero builds.
  function playIntro(instant) {
    let late = 0;
    builds.forEach((tl, el) => {
      if (el.dataset.swarm !== 'intro') return;
      if (instant) tl.progress(1);
      // Nav + hero first, then any on-screen section blocks in page order.
      else tl.delay('swarmLate' in el.dataset ? 0.7 + 0.18 * late++ : 0.15).play();
    });
  }

  // Re-sync after content re-renders (project filters): drop builds whose
  // element left the DOM and mount any new targets.
  function refresh(targets) {
    builds.forEach((tl, el) => {
      if (el.isConnected) return;
      tl.scrollTrigger && tl.scrollTrigger.kill();
      tl.kill();
      builds.delete(el);
    });
    init({ gsap, ScrollTrigger, targets });
  }

  // --------------------------------------------------------- the opening
  // Called by the <head> boot script's loader handoff once the page has
  // fully loaded. dests: elements the agents fly to on dispatch.
  function runOpening(loader, { dests = [], onDispatch, onDone }) {
    const ring = loader.querySelector('.page-loader__ring');
    const mark = loader.querySelector('.page-loader__mark');
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    let dispatched = false;
    let finished = false;

    // The loader's own fill moves onto a backdrop layer so it can fade
    // while the agents (inside the same fixed loader) stay visible.
    const backdrop = document.createElement('div');
    backdrop.className = 'swarm-backdrop';
    loader.prepend(backdrop);
    loader.style.background = 'transparent';

    const flight = document.createElement('div');
    flight.className = 'swarm-flight';
    flight.setAttribute('aria-hidden', 'true');
    flight.innerHTML = Array.from({ length: OPENING_AGENTS }, (_, i) =>
      `<svg class="swarm-flight__agent" style="--i:${i}" width="20" height="24" viewBox="0 0 20 24"><path d="M2 1 18 14 10 15 7 23Z"/></svg>`).join('') +
      '<span class="swarm-burst"></span>';
    const caption = document.createElement('p');
    caption.className = 'swarm-caption';
    caption.innerHTML = 'Booting swarm · <b>00</b>/' + OPENING_AGENTS + ' agents online';
    const count = caption.querySelector('b');
    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'swarm-skip';
    skip.textContent = 'Skip intro ↗';
    loader.append(flight, caption, skip);

    const agents = $$('.swarm-flight__agent', flight);
    const burst = flight.querySelector('.swarm-burst');

    const dispatch = (instant) => {
      if (dispatched) return;
      dispatched = true;
      loader.style.pointerEvents = 'none';
      if (onDispatch) onDispatch(instant);
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      dispatch(true);
      loader.classList.add('is-done');
      setTimeout(() => loader.remove(), 700);
      if (onDone) onDone();
    };

    // Landing spot for agent i: a point inside one of the destination
    // rects, as an offset from the viewport centre (the flight origin).
    const destination = (i) => {
      const target = dests[i % dests.length];
      if (!target) return { x: (i % 2 ? 1 : -1) * vw * 0.3, y: ((i % 3) - 1) * vh * 0.25 };
      const r = target.getBoundingClientRect();
      return {
        x: Math.max(20, Math.min(vw - 30, r.left + r.width * (0.2 + (i % 3) * 0.3))) - vw / 2,
        y: Math.max(20, Math.min(vh - 30, r.top + r.height * (0.2 + (i % 3) * 0.25))) - vh / 2
      };
    };

    const tl = gsap.timeline({ onComplete: finish });
    const counter = { n: 0 };
    if (ring) tl.to(ring, { opacity: 0, scale: 1.35, duration: 0.45, ease: 'power2.out' }, 0);
    tl.fromTo(caption, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3 }, 0.05);
    tl.to(counter, {
      n: OPENING_AGENTS, duration: 1.05, ease: 'none',
      onUpdate: () => { count.textContent = String(Math.round(counter.n)).padStart(2, '0'); }
    }, 0.1);

    // Orbit: half a turn on a slightly inward spiral, so the swarm visibly
    // tightens around the mark before it bursts.
    const orbit = (i) => Math.min(165, vw * 0.36) * (0.65 + (i % 4) * 0.12);
    agents.forEach((a, i) => {
      const start = (i / agents.length) * Math.PI * 2;
      const r = orbit(i);
      tl.fromTo(a, { opacity: 0, scale: 0.7 }, {
        opacity: 1, duration: 1.2, ease: 'none',
        onUpdate() {
          const p = this.progress();
          const angle = start + p * Math.PI;
          const rr = r * (1 - 0.18 * p);
          gsap.set(a, { x: Math.cos(angle) * rr, y: Math.sin(angle) * rr * 1.15, rotation: (angle * 180) / Math.PI + 100 });
        }
      }, 0.1);
    });

    if (mark) {
      tl.to(mark, { scale: 0.86, duration: 0.2, ease: 'power2.in' }, 1.1);
      tl.to(mark, { scale: 1.55, opacity: 0, duration: 0.32, ease: 'power2.out' }, 1.3);
    }
    tl.fromTo(burst, { scale: 0.4, opacity: 0.9 }, { scale: 6, opacity: 0, duration: 0.7, ease: 'power2.out' }, 1.3);
    tl.to([caption, skip], { opacity: 0, duration: 0.25 }, 1.3);
    tl.to(backdrop, { opacity: 0, duration: 0.4 }, 1.4);
    tl.call(() => dispatch(false), null, 1.4);

    agents.forEach((a, i) => {
      const angle = (i / agents.length) * Math.PI * 2 + Math.PI;
      const r = orbit(i) * 0.82;
      tl.fromTo(a, {
        x: Math.cos(angle) * r, y: Math.sin(angle) * r * 1.15,
        rotation: (angle * 180) / Math.PI + 100, scale: 0.7, opacity: 1
      }, {
        x: () => destination(i).x, y: () => destination(i).y,
        rotation: 0, scale: 1, duration: 0.75, ease: 'power2.inOut'
      }, 1.4 + 0.012 * i);
    });
    tl.to(agents, { opacity: 0, duration: 0.22 }, 2.35);

    const skipNow = () => { tl.kill(); finish(); };
    skip.addEventListener('click', skipNow);
    // Failsafe: a stalled tab (backgrounded mid-intro) can never strand the
    // cover over the page.
    setTimeout(() => { if (!finished) skipNow(); }, 6000);
  }

  window.Swarm = { init, playIntro, refresh, runOpening };
})();
