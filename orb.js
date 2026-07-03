// =========================================================================
// HERO GLASS ORB — Three.js (ES module, loaded via import map CDN)
//
// A morphing glass blob with real transmission/refraction. The name is
// drawn onto a canvas texture on a plane BEHIND the orb, so the type
// genuinely refracts through the glass (transmission only refracts
// in-scene content, never the DOM).
//
// Fallback ladder (all leave the page fully usable):
//   - No import-map support / CDN down  -> this module never runs
//   - No WebGL / any init error         -> bail, data-orb stays "off"
//   - WebGL context lost                -> data-orb reset to "off"
// While data-orb="off", CSS shows a static glass disc + the DOM <h1>.
// =========================================================================

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const REDUCED_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const COARSE = window.matchMedia('(pointer: coarse)').matches;

// Ashima 3D simplex noise (public domain) + displacement uniforms,
// injected into MeshPhysicalMaterial's vertex shader.
const NOISE_GLSL = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uAmp;
vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

async function buildTextTexture(renderer, text) {
  const W = COARSE ? 2048 : 4096;
  const H = W / 4;
  const cnv = document.createElement('canvas');
  cnv.width = W;
  cnv.height = H;
  const ctx = cnv.getContext('2d');
  const family = "'Outfit', ui-sans-serif, system-ui, sans-serif";

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    let size = H * 0.52;
    ctx.font = `800 ${size}px ${family}`;
    const w = ctx.measureText(text).width;
    const maxW = W * 0.92;
    if (w > maxW) {
      size *= maxW / w;
      ctx.font = `800 ${size}px ${family}`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const grad = ctx.createLinearGradient(0, H * 0.18, 0, H * 0.85);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#c7d2fe');
    ctx.fillStyle = grad;
    ctx.fillText(text, W / 2, H / 2);
  };

  // Wait for Outfit (max 2s), draw regardless, and self-heal once fonts land.
  try {
    await Promise.race([
      document.fonts.load('800 240px Outfit'),
      new Promise((res) => setTimeout(res, 2000))
    ]);
  } catch (e) { /* draw with fallback font */ }
  draw();

  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { draw(); tex.needsUpdate = true; }).catch(() => {});
  }
  return tex;
}

async function init() {
  const hero = document.getElementById('hero');
  const canvas = document.getElementById('orb-canvas');
  const wrap = canvas && canvas.parentElement;
  if (!hero || !canvas || !wrap || !webglAvailable()) return;

  const name =
    (window.CONFIG && window.CONFIG.profile && window.CONFIG.profile.name) ||
    (document.getElementById('hero-title') || {}).textContent || 'Sanju Antony';

  // ------------------------------------------------------------- renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  if ('transmissionResolutionScale' in renderer) {
    renderer.transmissionResolutionScale = COARSE ? 0.6 : 0.85;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(0, 0, 8);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // ------------------------------------------------- name plane (refracted)
  const textTexture = await buildTextTexture(renderer, name);
  const textPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: textTexture, transparent: true })
  );
  textPlane.position.set(0, 0.3, -2.2);
  scene.add(textPlane);

  function fitTextPlane() {
    const dist = camera.position.z - textPlane.position.z;
    const visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visW = visH * camera.aspect;
    let width = visW * 0.86;
    let height = width / 4; // canvas aspect is 4:1
    const maxH = visH * 0.42;
    if (height > maxH) {
      width *= maxH / height;
      height = maxH;
    }
    textPlane.scale.set(width, height, 1);
  }

  // ------------------------------------------------------------------ orb
  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uAmp: { value: 0.12 }
  };

  const material = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    thickness: 1.6,
    roughness: 0.08,
    metalness: 0,
    ior: 1.45,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.2,
    attenuationColor: new THREE.Color('#8ab4ff'),
    attenuationDistance: 4
  });
  if ('dispersion' in material) material.dispersion = 0.2;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uMouse = uniforms.uMouse;
    shader.uniforms.uAmp = uniforms.uAmp;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + NOISE_GLSL)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float n = snoise(normal * 1.6
          + vec3(uTime * 0.22, uTime * 0.17, uTime * 0.19)
          + vec3(uMouse * 0.6, 0.0));
        transformed += normal * n * uAmp;`);
  };
  material.customProgramCacheKey = () => 'liquid-orb-v1';

  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, COARSE ? 4 : 5), material);
  const orbGroup = new THREE.Group();
  orbGroup.add(orb);
  scene.add(orbGroup);

  // ----------------------------------------------------------- interaction
  const targetMouse = new THREE.Vector2();
  const mouse = new THREE.Vector2();
  let pulse = 0;
  if (!COARSE) {
    window.addEventListener('pointermove', (e) => {
      targetMouse.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1
      );
    }, { passive: true });
  }

  // Clicking the orb sends a liquid pulse through the glass.
  hero.addEventListener('click', (e) => {
    if (REDUCED_MQ.matches) return;
    if (e.target.closest('a, button, input, textarea')) return;
    const rect = wrap.getBoundingClientRect();
    const ndc = new THREE.Vector3().copy(orbGroup.position).project(camera);
    const sx = rect.left + (ndc.x * 0.5 + 0.5) * rect.width;
    const sy = rect.top + (-ndc.y * 0.5 + 0.5) * rect.height;
    const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const rPx = (1.4 * orbGroup.scale.x / visH) * rect.height * 1.5; // generous hit area
    if (Math.hypot(e.clientX - sx, e.clientY - sy) <= rPx) pulse = 1;
  });

  // -------------------------------------------------------------- sizing
  let heroH = 1;
  function resize() {
    const w = wrap.clientWidth || 1;
    const h = wrap.clientHeight || 1;
    heroH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitTextPlane();
  }
  resize();
  if ('ResizeObserver' in window) {
    new ResizeObserver(resize).observe(wrap);
  } else {
    window.addEventListener('resize', resize);
  }

  // ---------------------------------------------------------------- loop
  let activated = false;
  function activate() {
    if (activated) return;
    activated = true;
    hero.dataset.orb = 'on';
  }

  function tick(t) {
    const time = t * 0.001;
    uniforms.uTime.value = time;

    // Click ripple decays each frame; scrolling out of the hero shrinks
    // and lifts the orb instead of letting it get clipped.
    pulse *= 0.94;
    uniforms.uAmp.value = 0.12 + pulse * 0.4;
    const exit = Math.min(Math.max(window.scrollY / (heroH * 0.9), 0), 1);
    orbGroup.scale.setScalar((1 - 0.45 * exit) * (1 + pulse * 0.05));
    const drift = exit * 1.6;

    if (COARSE) {
      orbGroup.rotation.y += 0.0015;
      orbGroup.position.y = Math.sin(time * 0.5) * 0.12 + drift;
    } else {
      mouse.lerp(targetMouse, 0.05);
      uniforms.uMouse.value.copy(mouse);
      orbGroup.rotation.x += (mouse.y * 0.22 - orbGroup.rotation.x) * 0.06;
      orbGroup.rotation.y += (mouse.x * 0.3 - orbGroup.rotation.y) * 0.06;
      orbGroup.position.x += (mouse.x * 0.18 - orbGroup.position.x) * 0.05;
      orbGroup.position.y += ((-mouse.y * 0.14 + drift) - orbGroup.position.y) * 0.05;
    }
    renderer.render(scene, camera);
    activate();
  }

  let running = false;
  let heroVisible = true;

  function start() {
    if (running || REDUCED_MQ.matches) return;
    running = true;
    renderer.setAnimationLoop(tick);
  }
  function stop() {
    running = false;
    renderer.setAnimationLoop(null);
  }
  function renderStatic() {
    uniforms.uTime.value = 12; // frozen but organic pose
    renderer.render(scene, camera);
    activate();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible && !document.hidden) start();
      else stop();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (heroVisible) start();
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    hero.dataset.orb = 'off';
    stop();
  });

  const onMotionChange = () => {
    if (REDUCED_MQ.matches) {
      stop();
      renderStatic();
    } else if (heroVisible && !document.hidden) {
      start();
    }
  };
  if (REDUCED_MQ.addEventListener) REDUCED_MQ.addEventListener('change', onMotionChange);

  if (REDUCED_MQ.matches) {
    renderStatic();
  } else {
    start();
  }
}

init().catch((err) => {
  // Any failure keeps the CSS fallback orb + visible DOM title.
  console.warn('Hero orb disabled:', err);
});
