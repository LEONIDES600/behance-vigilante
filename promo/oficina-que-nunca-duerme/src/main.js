// Motor: monta escenas, posproducción y expone renderAt(t) para el render fotograma a fotograma.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildStorm, buildPortal, buildAlone, buildTower, buildRoom } from './scenes.js';
import { buildOverlay } from './overlay.js';

const params = new URLSearchParams(location.search);
const portrait = (params.get('ar') || '916') === '916';
const scale = Number(params.get('s') || 1);
const W = (portrait ? 1080 : 1920) * scale, H = (portrait ? 1920 : 1080) * scale;
const app = document.getElementById('app');
app.style.width = `${portrait ? 1080 : 1920}px`;
app.style.height = `${portrait ? 1920 : 1080}px`;
app.classList.add(portrait ? 'p' : 'l');

await Promise.all(['900 100px Unbounded', '800 100px Unbounded', '700 100px Unbounded', '600 20px "JetBrains Mono"', '400 20px Manrope', '600 20px Manrope'].map(f => document.fonts.load(f)));

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
canvas.style.width = '100%';
canvas.style.height = '100%';
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const pm = new THREE.PMREMGenerator(renderer);
const envRoom = pm.fromScene(new RoomEnvironment(), 0.04).texture;
pm.dispose();

const ctx = { portrait, F: 1, envRoom, towerEnv: null };
const camera = new THREE.PerspectiveCamera(40, W / H, 0.02, 500);
camera.layers.enable(1);

const storm = buildStorm(ctx), portal = buildPortal(ctx), alone = buildAlone(ctx), tower = buildTower(ctx), room = buildRoom(ctx);
ctx.towerEnv = tower.captureEnv(renderer);

const target = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, target);
composer.setPixelRatio(1);
composer.setSize(W, H);
const renderPass = new RenderPass(storm.scene, camera);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 1.0, 0.55, 0.8);
const grade = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: 0.06 }, uVig: { value: 0.55 }, uCA: { value: 0.0 },
    uFade: { value: 0 }, uFlash: { value: 0 }, uFlashColor: { value: new THREE.Vector3(1, 0.85, 0.6) }, uRes: { value: new THREE.Vector2(W, H) },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVig, uCA, uFade, uFlash; uniform vec3 uFlashColor; uniform vec2 uRes;
    varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 0.618) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5; float r = dot(d, d);
      float ca = (0.004 + uCA * 0.01) * r * 4.0;
      vec3 col = vec3(texture2D(tDiffuse, vUv - d * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + d * ca).b);
      col *= 1.0 - uVig * smoothstep(0.05, 0.75, r * 1.7);
      col += (h(vUv * uRes) - 0.5) * uGrain;
      col = mix(col, uFlashColor, uFlash);
      col *= 1.0 - uFade;
      gl_FragColor = vec4(col, 1.0);
    }`,
});
composer.addPass(renderPass);
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.addPass(grade);

const overlay = buildOverlay(document.getElementById('ov'));
const FOV_K = portrait ? 1 : 0.78;

function pick(t) {
  if (t < 8) return storm;
  if (t < 15) return portal;
  if (t < 22) return alone;
  if (t < 38) return tower;
  return room;
}

window.renderAt = (t, frame = Math.round(t * 30)) => {
  const shot = pick(t);
  const fx = shot.update(t, camera) || {};
  camera.fov = (camera.userData.fov || 40) * FOV_K;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderPass.scene = shot.scene;
  bloom.strength = fx.bloom ?? 1;
  bloom.threshold = fx.threshold ?? 0.8;
  const u = grade.uniforms;
  u.uTime.value = frame;
  u.uGrain.value = fx.grain ?? 0.06;
  u.uCA.value = fx.ca ?? 0;
  u.uFade.value = fx.fade ?? 0;
  u.uFlash.value = fx.flash ?? 0;
  if (fx.flashColor) u.uFlashColor.value.set(...fx.flashColor);
  composer.render();
  overlay.update(t);
};

window.renderAt(0.01);
window.READY = true;
