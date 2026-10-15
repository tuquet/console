<script lang="ts">
export type ActiveBannerScene = 'ghost' | 'phone' | 'robot';

export interface GhostPointerState {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  waveBoost: number;
}

export function createGhostPointerState(): GhostPointerState {
  return {
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
    waveBoost: 0,
  };
}

export function stepGhostPointer(state: GhostPointerState, dt: number): void {
  const clampedDt = Math.min(Math.max(dt, 0.001), 0.1);
  const k = 1 - Math.exp(-8.5 * clampedDt);
  state.currentX += (state.targetX - state.currentX) * k;
  state.currentY += (state.targetY - state.currentY) * k;
  state.waveBoost = Math.max(0, state.waveBoost - clampedDt * 1.6);
}

export function computeSkirtWaveDisplacement(
  bx: number,
  by: number,
  bz: number,
  t: number,
): { dx: number; dy: number; dz: number } {
  if (by >= -0.02) {
    return { dx: 0, dy: 0, dz: 0 };
  }
  const skirtFactor = Math.min(1, (Math.abs(by) / 1.45) ** 1.35);
  const angle = Math.atan2(bz, bx);
  const wave1 = Math.sin(angle * 5 + t * 2.8) * 0.11;
  const wave2 = Math.cos(angle * 3 - t * 2.1) * 0.055;
  const radialFlare = 0.16 * skirtFactor + (wave1 + wave2) * skirtFactor;
  const r = Math.hypot(bx, bz) || 1;
  const nx = bx / r;
  const nz = bz / r;
  const hemRipple =
    Math.sin(angle * 5 + t * 2.8 + 0.6) * 0.075 * skirtFactor ** 1.6;

  return {
    dx: nx * radialFlare,
    dy: hemRipple,
    dz: nz * radialFlare,
  };
}

export function nextBannerScene(current: ActiveBannerScene): ActiveBannerScene {
  if (current === 'phone') return 'robot';
  if (current === 'robot') return 'ghost';
  return 'phone';
}
</script>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';
import { usePreferences } from '@vben/preferences';

defineOptions({ name: 'SpecterGhostBanner' });

const { isDark } = usePreferences();
const stageRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isLoading = ref(true);
const hasError = ref(false);

const pointerState = createGhostPointerState();

let rafId = 0;
let disposed = false;
let cleanupThree: (() => void) | null = null;
let syncThemeLighting: ((dark: boolean) => void) | null = null;

const THREE_CDNS = [
  'https://esm.sh/three@0.174.0',
  'https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js',
];

async function loadThreeModule(): Promise<any> {
  let lastErr: unknown;
  for (const url of THREE_CDNS) {
    try {
      const mod = await import(/* @vite-ignore */ url);
      if (mod?.WebGLRenderer && mod?.Scene) {
        return mod;
      }
    } catch (error) {
      lastErr = error;
    }
  }
  throw lastErr ?? new Error('Failed to load Three.js module');
}

function createFourPointStarShape(THREE: any, outerR: number, innerR: number) {
  const shape = new THREE.Shape();
  const pts = 8;
  for (let i = 0; i < pts; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / 4;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function handlePointerMove(e: PointerEvent) {
  const el = stageRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  pointerState.targetX = Math.max(-1, Math.min(1, nx));
  pointerState.targetY = Math.max(-1, Math.min(1, ny));
  if (Math.hypot(nx, ny) < 0.45 && pointerState.waveBoost < 0.35) {
    pointerState.waveBoost = 0.45;
  }
}

function handlePointerLeave() {
  pointerState.targetX = 0;
  pointerState.targetY = 0;
}

function triggerWaveBoost() {
  pointerState.waveBoost = 1;
}

onMounted(async () => {
  if (typeof window === 'undefined' || !canvasRef.value || !stageRef.value) {
    return;
  }
  try {
    isLoading.value = true;
    hasError.value = false;
    const THREE = await loadThreeModule();
    if (disposed || !canvasRef.value || !stageRef.value) return;

    const canvas = canvasRef.value;
    const container = stageRef.value;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(0, 0.15, 6.6);

    const ambientLight = new THREE.AmbientLight('#ffffff', 0.85);
    const keyLight = new THREE.DirectionalLight('#ffffff', 1.9);
    keyLight.position.set(3.2, 4.8, 4.5);

    const rimLight = new THREE.DirectionalLight('#dbeafe', 1.35);
    rimLight.position.set(-4.2, 2.5, -3.4);

    const bottomFillLight = new THREE.DirectionalLight('#e4e4e7', 0.65);
    bottomFillLight.position.set(0, -3.5, 2.2);

    scene.add(ambientLight, keyLight, rimLight, bottomFillLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const ghostGroup = new THREE.Group();
    rootGroup.add(ghostGroup);

    // 1. Sculpted 3D Ghost Body with harmonic cloth-wave skirt
    const bodyGeo = new THREE.SphereGeometry(1.14, 72, 56);
    const posAttr = bodyGeo.attributes.position;
    const basePositions = new Float32Array(posAttr.count * 3);

    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      if (y > 0) {
        y *= 1.12;
      } else {
        const t = Math.abs(y) / 1.14;
        y *= 1.32;
        const bell = 1 + 0.14 * t ** 1.25;
        x *= bell;
        z *= bell;
        if (t > 0.82) {
          const inward = (t - 0.82) / 0.18;
          y += inward * 0.12;
        }
      }

      posAttr.setXYZ(i, x, y, z);
      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;
    }
    bodyGeo.computeVertexNormals();

    const bodyMat = new THREE.MeshPhysicalMaterial({
      clearcoat: 0.35,
      clearcoatRoughness: 0.24,
      color: '#f8fafc',
      metalness: 0.03,
      roughness: 0.28,
      sheen: 0.45,
      sheenColor: new THREE.Color('#cbd5e1'),
      sheenRoughness: 0.5,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    ghostGroup.add(bodyMesh);

    // 2. Sculpted 3D Arms (Left resting, Right waving)
    const armGeo = new THREE.CapsuleGeometry(0.17, 0.38, 16, 24);
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-1.02, 0.08, 0.12);
    const leftArmMesh = new THREE.Mesh(armGeo, bodyMat);
    leftArmMesh.position.set(-0.22, -0.1, 0);
    leftArmMesh.rotation.z = 0.55;
    leftArmPivot.add(leftArmMesh);
    ghostGroup.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(1.02, 0.16, 0.15);
    const rightArmMesh = new THREE.Mesh(armGeo, bodyMat);
    rightArmMesh.position.set(0.26, 0.2, 0);
    rightArmMesh.rotation.z = -0.78;
    rightArmPivot.add(rightArmMesh);
    ghostGroup.add(rightArmPivot);

    // 3. Facial Features (Eyes + 4-Point Star Catchlights + Blush + Smile)
    const faceGroup = new THREE.Group();
    faceGroup.position.set(0, 0.24, 1.07);
    ghostGroup.add(faceGroup);

    const eyeGeo = new THREE.SphereGeometry(0.155, 32, 24);
    eyeGeo.scale(0.92, 1.32, 0.45);
    const eyeMat = new THREE.MeshPhysicalMaterial({
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      color: '#09090b',
      roughness: 0.1,
    });

    const starShape = createFourPointStarShape(THREE, 0.058, 0.017);
    const starGeo = new THREE.ShapeGeometry(starShape);
    const catchlightMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      side: THREE.DoubleSide,
    });
    const subDotGeo = new THREE.CircleGeometry(0.022, 20);

    function createEyeUnit(offsetX: number) {
      const unit = new THREE.Group();
      unit.position.set(offsetX, 0.08, 0);
      const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
      unit.add(eyeMesh);

      const starMesh = new THREE.Mesh(starGeo, catchlightMat);
      starMesh.position.set(0.032, 0.052, 0.074);
      unit.add(starMesh);

      const subDotMesh = new THREE.Mesh(subDotGeo, catchlightMat);
      subDotMesh.position.set(-0.042, -0.058, 0.073);
      unit.add(subDotMesh);

      return { starMesh, unit };
    }

    const leftEye = createEyeUnit(-0.33);
    leftEye.unit.rotation.y = -0.16;
    const rightEye = createEyeUnit(0.33);
    rightEye.unit.rotation.y = 0.16;
    faceGroup.add(leftEye.unit, rightEye.unit);

    // Blush cheeks
    const cheekGeo = new THREE.SphereGeometry(0.14, 24, 16);
    cheekGeo.scale(1.25, 0.68, 0.25);
    const cheekMat = new THREE.MeshBasicMaterial({
      color: '#f472b6',
      opacity: 0.28,
      transparent: true,
    });
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.52, -0.14, -0.06);
    leftCheek.rotation.y = -0.28;
    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(0.52, -0.14, -0.06);
    rightCheek.rotation.y = 0.28;
    faceGroup.add(leftCheek, rightCheek);

    // Happy mouth arc
    const mouthGeo = new THREE.TorusGeometry(0.115, 0.026, 16, 32, Math.PI);
    const mouthMesh = new THREE.Mesh(mouthGeo, eyeMat);
    mouthMesh.position.set(0, -0.11, 0.01);
    mouthMesh.rotation.z = Math.PI;
    faceGroup.add(mouthMesh);

    // 4. Floor Shadow Disc
    const shadowGeo = new THREE.CircleGeometry(1.05, 48);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#09090b',
      opacity: 0.14,
      transparent: true,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, -1.92, 0);
    rootGroup.add(shadowMesh);

    syncThemeLighting = (dark: boolean) => {
      if (dark) {
        bodyMat.color.set('#f4f4f6');
        bodyMat.emissive.set('#18181b');
        bodyMat.emissiveIntensity = 0.18;
        ambientLight.intensity = 0.78;
        keyLight.intensity = 2.05;
        rimLight.color.set('#e2e8f0');
        rimLight.intensity = 1.55;
        shadowMat.color.set('#000000');
        shadowMat.opacity = 0.35;
      } else {
        bodyMat.color.set('#ffffff');
        bodyMat.emissive.set('#f1f5f9');
        bodyMat.emissiveIntensity = 0.08;
        ambientLight.intensity = 0.92;
        keyLight.intensity = 1.65;
        rimLight.color.set('#94a3b8');
        rimLight.intensity = 1.1;
        shadowMat.color.set('#18181b');
        shadowMat.opacity = 0.09;
      }
    };
    syncThemeLighting(isDark.value);

    function resizeRenderer() {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    resizeRenderer();
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => resizeRenderer());
    resizeObserver?.observe(container);

    let lastTime = performance.now();

    function animate(now: number) {
      if (disposed) return;
      rafId = window.requestAnimationFrame(animate);

      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const t = now * 0.001;

      stepGhostPointer(pointerState, dt);

      // Levitation & joyful hop on waveBoost
      const hoverY =
        Math.sin(t * 2.1) * 0.14 +
        Math.sin(t * 9.5) * pointerState.waveBoost * 0.08;
      ghostGroup.position.y = hoverY;

      // Body tilt following pointer
      ghostGroup.rotation.y =
        pointerState.currentX * 0.42 + Math.sin(t * 0.9) * 0.06;
      ghostGroup.rotation.x = -pointerState.currentY * 0.24 + 0.04;
      ghostGroup.rotation.z = -pointerState.currentX * 0.08;

      // Eye-tracking parallax + 4-point star twinkle
      faceGroup.position.x = pointerState.currentX * 0.13;
      faceGroup.position.y = 0.24 + pointerState.currentY * 0.09;
      const starPulse =
        1 + Math.sin(t * 4.2) * 0.12 + pointerState.waveBoost * 0.22;
      leftEye.starMesh.scale.setScalar(starPulse);
      rightEye.starMesh.scale.setScalar(starPulse);

      // Waving right arm + breathing left arm
      const waveSpeed = 4.6 + pointerState.waveBoost * 5.5;
      rightArmPivot.rotation.z =
        0.18 + Math.sin(t * waveSpeed) * (0.26 + pointerState.waveBoost * 0.28);
      rightArmPivot.rotation.x = Math.cos(t * 2.3) * 0.1;
      leftArmPivot.rotation.z = -0.08 + Math.sin(t * 2.1 + 1.2) * 0.09;

      // Harmonic cloth-wave vertex displacement along skirt hem
      for (let i = 0; i < posAttr.count; i++) {
        const bx = basePositions[i * 3] ?? 0;
        const by = basePositions[i * 3 + 1] ?? 0;
        const bz = basePositions[i * 3 + 2] ?? 0;
        if (by < -0.02) {
          const { dx, dy, dz } = computeSkirtWaveDisplacement(bx, by, bz, t);
          posAttr.setXYZ(i, bx + dx, by + dy, bz + dz);
        }
      }
      posAttr.needsUpdate = true;
      bodyGeo.computeVertexNormals();

      // Floor shadow scale reacts to levitation height
      const shadowScale = 1 - hoverY * 0.35;
      shadowMesh.scale.set(shadowScale, 1, shadowScale * 0.85);

      renderer.render(scene, camera);
    }

    isLoading.value = false;
    rafId = window.requestAnimationFrame(animate);

    cleanupThree = () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      bodyGeo.dispose();
      armGeo.dispose();
      eyeGeo.dispose();
      starGeo.dispose();
      subDotGeo.dispose();
      cheekGeo.dispose();
      mouthGeo.dispose();
      shadowGeo.dispose();
      bodyMat.dispose();
      eyeMat.dispose();
      catchlightMat.dispose();
      cheekMat.dispose();
      shadowMat.dispose();
      renderer.dispose();
    };
  } catch {
    if (!disposed) {
      isLoading.value = false;
      hasError.value = true;
    }
  }
});

watch(
  () => isDark.value,
  (dark) => {
    syncThemeLighting?.(dark);
  },
);

onBeforeUnmount(() => {
  disposed = true;
  window.cancelAnimationFrame(rafId);
  try {
    cleanupThree?.();
  } catch {
    // Ignore WebGL cleanup errors on unmount
  }
  cleanupThree = null;
  syncThemeLighting = null;
});
</script>

<template>
  <div
    ref="stageRef"
    class="specter-ghost-banner relative flex size-full min-h-[520px] items-center justify-center overflow-hidden select-none"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
    @click="triggerWaveBoost"
  >
    <!-- 21st.dev / Aceternity Spotlight SVG effect synchronized with SplineRobotBanner -->
    <svg
      class="animate-spotlight pointer-events-none absolute -top-40 left-0 z-[1] h-[169%] w-[138%] opacity-0 lg:w-[84%]"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
      aria-hidden="true"
    >
      <g filter="url(#specter-ghost-spotlight)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          :fill="isDark ? 'white' : '#141413'"
          :fill-opacity="isDark ? '0.18' : '0.07'"
        />
      </g>
      <defs>
        <filter
          id="specter-ghost-spotlight"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="151"
            result="effect1_foregroundBlur_1065_8"
          />
        </filter>
      </defs>
    </svg>

    <!-- Minimal Hairline-style loader while Three.js initializes -->
    <Transition name="fade">
      <div
        v-if="isLoading"
        class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 font-mono text-xs tracking-wider text-muted-foreground"
      >
        <div
          class="size-7 animate-spin rounded-full border border-foreground/20 border-t-foreground/80"
        ></div>
        <span>{{ $t('authentication.bannerLoadingGhost') }}</span>
      </div>
    </Transition>

    <!-- Fallback message if offline -->
    <div
      v-if="hasError"
      class="z-20 flex flex-col items-center gap-2 px-6 text-center font-mono text-xs text-muted-foreground"
    >
      <span>{{ $t('authentication.bannerOfflineGhost') }}</span>
    </div>

    <!-- Interactive Three.js WebGL Canvas -->
    <canvas
      ref="canvasRef"
      aria-label="Interactive 3D Specter Ghost mascot waving and following the pointer."
      class="relative z-10 block size-full cursor-pointer transition-opacity duration-500"
      :class="isLoading ? 'opacity-0' : 'opacity-100'"
    ></canvas>
  </div>
</template>

<style scoped>
@keyframes spotlight {
  0% {
    opacity: 0;
    transform: translate(-72%, -62%) scale(0.5);
  }

  100% {
    opacity: 1;
    transform: translate(-50%, -40%) scale(1);
  }
}

.animate-spotlight {
  animation: spotlight 1.8s ease 0.25s 1 forwards;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
