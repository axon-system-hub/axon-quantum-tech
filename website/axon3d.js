import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('axon3dContainer');
const statusEl = document.getElementById('axon3dStatus');

if (container) {
  initAxon3D().catch((err) => {
    if (statusEl) {
      statusEl.textContent = '3D 엔진 로드 실패 (네트워크 또는 WebGL 확인 필요)';
    }
    console.error('AXON 3D init error:', err);
  });
}

async function initAxon3D() {
  const width = container.clientWidth || 720;
  const height = container.clientHeight || 520;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040b12);
  scene.fog = new THREE.FogExp2(0x040b12, 0.025);

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
  camera.position.set(8.2, 7.0, 9.4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  if (statusEl) statusEl.style.display = 'none';

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 4.5;
  controls.maxDistance = 24;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.9;
  controls.target.set(0, 0.9, 0);

  // Lighting: Cryogenic Cyan + 6N Gold Warm Rim + Soft Ambient
  const ambient = new THREE.AmbientLight(0xbcd8f0, 0.85);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(8, 14, 10);
  scene.add(keyLight);

  const goldRim = new THREE.DirectionalLight(0xe3b341, 1.5);
  goldRim.position.set(-9, 6, -8);
  scene.add(goldRim);

  const cryoFill = new THREE.PointLight(0x38bdf8, 1.8, 22);
  cryoFill.position.set(0, 4.5, 0);
  scene.add(cryoFill);

  // Subtle Grid Floor
  const gridHelper = new THREE.GridHelper(22, 22, 0x1b3a54, 0x0c1e2e);
  gridHelper.position.y = -0.35;
  scene.add(gridHelper);

  // Materials
  const pcbMat = new THREE.MeshStandardMaterial({ color: 0x0a2926, roughness: 0.55, metalness: 0.2 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe3b341, roughness: 0.14, metalness: 0.95 });
  const lidMat = new THREE.MeshStandardMaterial({ color: 0x263849, roughness: 0.3, metalness: 0.85 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.28, metalness: 0.88 });
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.4, metalness: 0.5 });

  // --- Layer 1: 75x75x1.6mm Carrier PCB (Rev A2) ---
  const pcbGroup = new THREE.Group();
  const pcbGeo = new THREE.BoxGeometry(7.5, 0.16, 7.5);
  const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
  pcbGroup.add(pcbMesh);

  // Gold O-ring Seal Land (Ø54 / Ø51.5 mm)
  const sealRingGeo = new THREE.RingGeometry(2.575, 2.7, 64);
  const sealRing = new THREE.Mesh(sealRingGeo, goldMat);
  sealRing.rotation.x = -Math.PI / 2;
  sealRing.position.y = 0.085;
  pcbGroup.add(sealRing);

  // 4 Corner Mounting Bosses (Ø2.7 mm at 50mm pitch)
  const bossGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.18, 20);
  [[-2.5, -2.5], [2.5, -2.5], [2.5, 2.5], [-2.5, 2.5]].forEach(([bx, bz]) => {
    const boss = new THREE.Mesh(bossGeo, goldMat);
    boss.position.set(bx, 0.02, bz);
    pcbGroup.add(boss);
  });

  // Samtec J1 Connector & OPA855 TIA ICs along PCB edge
  const j1Mesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.24, 0.45), goldMat);
  j1Mesh.position.set(0, 0.18, 3.35);
  pcbGroup.add(j1Mesh);

  [-2.9, 2.9].forEach((tx) => {
    const tia = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.42), chipMat);
    tia.position.set(tx, 0.14, 0);
    pcbGroup.add(tia);
  });

  scene.add(pcbGroup);

  // --- Layer 2: 9x9 Cheonbu-81 Optical Wafer Plane ---
  const waferGroup = new THREE.Group();
  const waferBase = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.35, 0.08, 48),
    new THREE.MeshStandardMaterial({ color: 0x0b1d2c, roughness: 0.35, metalness: 0.6 })
  );
  waferGroup.add(waferBase);

  const CHEONBU_POLES = [
    [1,1,0,1,1,-1,1,0,0],
    [0,0,1,1,1,-1,-1,-1,0],
    [1,1,1,1,0,-1,0,-1,0],
    [1,1,-1,1,-1,-1,1,0,-1],
    [1,1,1,0,0,1,1,-1,1],
    [0,1,-1,0,0,1,1,1,0],
    [0,-1,-1,-1,1,0,-1,0,0],
    [0,0,0,0,1,1,1,1,0],
    [0,1,-1,1,1,0,0,0,1]
  ];

  const nodeGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.16, 12);
  const posMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.85 });
  const negMat = new THREE.MeshStandardMaterial({ color: 0xe3b341, emissive: 0xb45309, emissiveIntensity: 0.75 });
  const zeroMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.4 });
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 1.4 });

  const pitch = 0.35; // 3.5 mm in 1:10 scale
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const pole = CHEONBU_POLES[r][c];
      const isCore = (r === 4 && c === 4) || (r === 5 && (c === 3 || c === 4));
      const mat = isCore ? coreMat : pole === 1 ? posMat : pole === -1 ? negMat : zeroMat;
      const node = new THREE.Mesh(nodeGeo, mat);
      node.position.set((c - 4) * pitch, 0.1, (r - 4) * pitch);
      waferGroup.add(node);
    }
  }
  scene.add(waferGroup);

  // --- Layer 3: 58x58x5mm 6N Gold 4-Bounce Cavity Lid (Rev C) ---
  const cavityGroup = new THREE.Group();
  const lidShape = new THREE.Shape();
  const hs = 2.9; // 58mm / 2
  lidShape.moveTo(-hs, -hs);
  lidShape.lineTo(hs, -hs);
  lidShape.lineTo(hs, hs);
  lidShape.lineTo(-hs, hs);
  lidShape.closePath();

  const pocketHole = new THREE.Path();
  pocketHole.absarc(0, 0, 2.5, 0, Math.PI * 2, true); // Ø50mm pocket
  lidShape.holes.push(pocketHole);

  const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
    depth: 0.5,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2
  });
  lidGeo.rotateX(Math.PI / 2);
  const lidMesh = new THREE.Mesh(lidGeo, lidMat);
  lidMesh.position.y = 0.5;
  cavityGroup.add(lidMesh);

  // 4 Planar 45-deg 6N Gold Mirror Facets inside Ø50mm pocket
  const rMirror = 2.15;
  const mirrorGeo = new THREE.BoxGeometry(0.9, 0.38, 0.08);
  const mirrorPositions = [
    { x: 0, z: -rMirror, rotY: 0 },
    { x: rMirror, z: 0, rotY: Math.PI / 2 },
    { x: 0, z: rMirror, rotY: 0 },
    { x: -rMirror, z: 0, rotY: Math.PI / 2 }
  ];
  mirrorPositions.forEach((mp) => {
    const m = new THREE.Mesh(mirrorGeo, goldMat);
    m.position.set(mp.x, 0.25, mp.z);
    m.rotation.y = mp.rotY;
    cavityGroup.add(m);
  });

  // 4-Bounce Ring Laser Beam & Orbiting Photon
  const ringPts = [
    new THREE.Vector3(0, 0.25, -rMirror),
    new THREE.Vector3(rMirror, 0.25, 0),
    new THREE.Vector3(0, 0.25, rMirror),
    new THREE.Vector3(-rMirror, 0.25, 0),
    new THREE.Vector3(0, 0.25, -rMirror)
  ];
  const ringBeamGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
  const ringBeamMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
  const ringBeamLine = new THREE.Line(ringBeamGeo, ringBeamMat);
  cavityGroup.add(ringBeamLine);

  const photonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const photonGlow = new THREE.PointLight(0x38bdf8, 3.0, 5.0);
  photonMesh.add(photonGlow);
  cavityGroup.add(photonMesh);

  scene.add(cavityGroup);

  // --- Layer 4: Upper 6N Gold Ceiling Mirror & 9x9 V-Bounce Beams ---
  const ceilingGroup = new THREE.Group();
  const ceilingDisk = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, 0.14, 48), copperMat);
  ceilingGroup.add(ceilingDisk);
  const ceilingGold = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.04, 48), goldMat);
  ceilingGold.position.y = -0.08;
  ceilingGroup.add(ceilingGold);
  scene.add(ceilingGroup);

  // V-Bounce Beams connecting Wafer outer nodes -> Ceiling Mirror -> Center 六
  const vBounceGroup = new THREE.Group();
  const vBeamMat = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.72 });
  const vBounceLines = [];
  const sampleCorners = [
    [-4 * pitch, -4 * pitch],
    [4 * pitch, -4 * pitch],
    [4 * pitch, 4 * pitch],
    [-4 * pitch, 4 * pitch],
    [2 * pitch, 0],
    [-2 * pitch, 0],
    [0, 2 * pitch],
    [0, -2 * pitch]
  ];
  const vPhotonGeo = new THREE.SphereGeometry(0.055, 12, 12);
  const vPhotonMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
  const vPhotons = [];
  sampleCorners.forEach(([sx, sz], idx) => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(sx, 0, sz),
      new THREE.Vector3(sx * 0.5, 1.0, sz * 0.5),
      new THREE.Vector3(0, 0, 0)
    ]);
    const line = new THREE.Line(geo, vBeamMat);
    vBounceLines.push({ line, sx, sz });
    vBounceGroup.add(line);

    const vp = new THREE.Mesh(vPhotonGeo, vPhotonMat);
    vPhotons.push({ mesh: vp, sx, sz, phase: idx * 0.125 });
    vBounceGroup.add(vp);
  });
  scene.add(vBounceGroup);

  const wavefrontRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.016, 12, 32),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
  );
  cavityGroup.add(wavefrontRing);

  // --- Interactive Controls & Presets ---
  const explodeRange = document.getElementById('explodeRange');
  const explodeVal = document.getElementById('explodeVal');
  const toggleAutoRotate = document.getElementById('toggleAutoRotate');
  const toggleVBounce = document.getElementById('toggleVBounce');
  const toggleRingBeam = document.getElementById('toggleRingBeam');
  const presetBtns = document.querySelectorAll('.preset-btn');

  let targetExplode = explodeRange ? Number(explodeRange.value) / 100 : 0.25;
  let currentExplode = targetExplode;
  let camTargetPos = null;
  let camTargetLook = null;

  if (explodeRange) {
    explodeRange.addEventListener('input', () => {
      targetExplode = Number(explodeRange.value) / 100;
      if (explodeVal) explodeVal.textContent = `${explodeRange.value}%`;
    });
  }

  if (toggleAutoRotate) {
    toggleAutoRotate.addEventListener('change', () => {
      controls.autoRotate = toggleAutoRotate.checked;
    });
  }

  if (toggleVBounce) {
    toggleVBounce.addEventListener('change', () => {
      vBounceGroup.visible = toggleVBounce.checked;
    });
  }

  if (toggleRingBeam) {
    toggleRingBeam.addEventListener('change', () => {
      ringBeamLine.visible = toggleRingBeam.checked;
      photonMesh.visible = toggleRingBeam.checked;
    });
  }

  const PRESETS = {
    assembly: { pos: [8.2, 7.0, 9.4], look: [0, 0.9, 0], explode: 25 },
    ring: { pos: [0.0, 6.8, 3.8], look: [0, 0.6, 0], explode: 15 },
    cheonbu: { pos: [3.8, 3.4, 4.4], look: [0, 0.8, 0], explode: 55 },
    exploded: { pos: [9.8, 8.2, 10.2], look: [0, 1.8, 0], explode: 100 }
  };

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      presetBtns.forEach((b) => b.classList.toggle('active', b === btn));
      camTargetPos = new THREE.Vector3(...p.pos);
      camTargetLook = new THREE.Vector3(...p.look);
      targetExplode = p.explode / 100;
      if (explodeRange) explodeRange.value = String(p.explode);
      if (explodeVal) explodeVal.textContent = `${p.explode}%`;
    });
  });

  // Resize handler
  const ro = new ResizeObserver(() => {
    const nw = container.clientWidth;
    const nh = container.clientHeight;
    if (nw > 0 && nh > 0) {
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
  });
  ro.observe(container);

  // Animation Loop
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.012;

    // Smooth Exploded View Interpolation
    currentExplode += (targetExplode - currentExplode) * 0.08;
    pcbGroup.position.y = 0;
    waferGroup.position.y = 0.22 + currentExplode * 0.85;
    cavityGroup.position.y = 0.22 + currentExplode * 1.95;
    ceilingGroup.position.y = 0.92 + currentExplode * 3.1;

    // Update 3D V-Bounce Lines & 3D Converging Photon Packets
    const yWafer = waferGroup.position.y + 0.16;
    const yCeil = ceilingGroup.position.y - 0.1;
    vBounceLines.forEach(({ line, sx, sz }, idx) => {
      const posAttr = line.geometry.attributes.position;
      posAttr.setXYZ(0, sx, yWafer, sz);
      posAttr.setXYZ(1, sx * 0.5, yCeil, sz * 0.5);
      posAttr.setXYZ(2, 0, yWafer, 0);
      posAttr.needsUpdate = true;

      const vp = vPhotons[idx];
      if (vp) {
        const u = (t * 0.55 + vp.phase) % 1;
        if (u < 0.5) {
          const k = u * 2;
          vp.mesh.position.set(
            THREE.MathUtils.lerp(sx, sx * 0.5, k),
            THREE.MathUtils.lerp(yWafer, yCeil, k),
            THREE.MathUtils.lerp(sz, sz * 0.5, k)
          );
        } else {
          const k = (u - 0.5) * 2;
          vp.mesh.position.set(
            THREE.MathUtils.lerp(sx * 0.5, 0, k),
            THREE.MathUtils.lerp(yCeil, yWafer, k),
            THREE.MathUtils.lerp(sz * 0.5, 0, k)
          );
        }
      }
    });

    // Orbiting Photon around 4-Bounce 6N Gold Ring with 3D Wavefront Pulse
    const orb = (t * 0.7) % 1;
    const seg = Math.floor(orb * 4) % 4;
    const frac = (orb * 4) % 1;
    const pA = ringPts[seg];
    const pB = ringPts[seg + 1];
    photonMesh.position.lerpVectors(pA, pB, frac);
    photonMesh.position.y += Math.sin(t * 5.0 + orb * Math.PI * 4) * 0.08;
    const pulse = (t * 1.8) % 1;
    wavefrontRing.position.copy(photonMesh.position);
    wavefrontRing.rotation.x = Math.PI * 0.5 + Math.sin(t * 2.0) * 0.35;
    wavefrontRing.rotation.y = t * 1.6;
    wavefrontRing.scale.setScalar(0.5 + pulse * 1.4);
    wavefrontRing.material.opacity = (1 - pulse) * 0.8;

    // Smooth camera preset transition
    if (camTargetPos && camTargetLook) {
      camera.position.lerp(camTargetPos, 0.07);
      controls.target.lerp(camTargetLook, 0.07);
      if (camera.position.distanceTo(camTargetPos) < 0.08) {
        camTargetPos = null;
        camTargetLook = null;
      }
    }

    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

let blenderViewerStarted = false;
window.initBlenderGlbViewer = function initBlenderGlbViewer() {
  if (blenderViewerStarted) return;
  const bWrap = document.getElementById('blender3dContainer');
  const bStatus = document.getElementById('blender3dStatus');
  if (!bWrap) return;
  blenderViewerStarted = true;

  const w = bWrap.clientWidth || 720;
  const h = bWrap.clientHeight || 520;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040b12);

  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 120);
  camera.position.set(7.8, 6.4, 8.6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  bWrap.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.85;
  controls.target.set(0, 1.0, 0);

  scene.add(new THREE.AmbientLight(0xdbeafe, 0.75));
  const key = new THREE.DirectionalLight(0xfff4d6, 2.4);
  key.position.set(7, 11, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x38bdf8, 1.5);
  rim.position.set(-7, 5, -6);
  scene.add(rim);

  const layerBaseY = [];
  const loader = new GLTFLoader();
  loader.load(
    'assets/models/axon_quantum.glb',
    (gltf) => {
      const root = gltf.scene;
      root.traverse((obj) => {
        if (!obj.isMesh && !obj.name) return;
        let weight = 0;
        if (obj.name.startsWith('Layer2') || obj.name.startsWith('Qutrit_')) weight = 0.7;
        else if (obj.name.startsWith('Mirror_') || obj.name.startsWith('Ring_')) weight = 1.6;
        else if (obj.name.startsWith('Layer4')) weight = 2.6;
        if (weight > 0) layerBaseY.push({ obj, baseY: obj.position.y, weight });
      });
      scene.add(root);
      if (bStatus) bStatus.style.display = 'none';
    },
    undefined,
    (err) => {
      if (bStatus) bStatus.textContent = 'Blender GLB 로드 실패: ' + err.message;
    }
  );

  const explodeRange = document.getElementById('explodeRange');
  const autoRotateChk = document.getElementById('toggleAutoRotate');
  const toggleVBounce = document.getElementById('toggleVBounce');
  const toggleRingBeam = document.getElementById('toggleRingBeam');

  if (autoRotateChk) {
    controls.autoRotate = autoRotateChk.checked;
    autoRotateChk.addEventListener('change', () => {
      controls.autoRotate = autoRotateChk.checked;
    });
  }

  // Animated 4-Bounce Ring Photon + 3D Wavefront Ring for Blender GLB
  const bRingPts = [
    new THREE.Vector3(0, 1.35, 2.15),
    new THREE.Vector3(2.15, 1.35, 0),
    new THREE.Vector3(0, 1.35, -2.15),
    new THREE.Vector3(-2.15, 1.35, 0),
  ];
  const bPhoton = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  const bWavefront = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.016, 12, 32),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
  );
  scene.add(bPhoton);
  scene.add(bWavefront);

  // Animated 8-Way 3D V-Bounce Rays & Converging Photon Packets for Blender GLB
  const bPitch = 0.35;
  const bSampleCorners = [
    [-4 * bPitch, -4 * bPitch],
    [4 * bPitch, -4 * bPitch],
    [4 * bPitch, 4 * bPitch],
    [-4 * bPitch, 4 * bPitch],
    [2 * bPitch, 0],
    [-2 * bPitch, 0],
    [0, 2 * bPitch],
    [0, -2 * bPitch],
  ];
  const bVBounceGroup = new THREE.Group();
  const bVLineMat = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.72 });
  const bVPhotonGeo = new THREE.SphereGeometry(0.055, 12, 12);
  const bVPhotonMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
  const bVItems = bSampleCorners.map(([sx, sz], idx) => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(sx, 0.84, sz),
      new THREE.Vector3(sx * 0.5, 2.21, sz * 0.5),
      new THREE.Vector3(0, 0.84, 0),
    ]);
    const line = new THREE.Line(geo, bVLineMat);
    const vp = new THREE.Mesh(bVPhotonGeo, bVPhotonMat);
    bVBounceGroup.add(line);
    bVBounceGroup.add(vp);
    return { line, vp, sx, sz, phase: idx * 0.125 };
  });
  scene.add(bVBounceGroup);

  if (toggleVBounce) {
    bVBounceGroup.visible = toggleVBounce.checked;
    toggleVBounce.addEventListener('change', () => {
      bVBounceGroup.visible = toggleVBounce.checked;
    });
  }
  if (toggleRingBeam) {
    bPhoton.visible = toggleRingBeam.checked;
    bWavefront.visible = toggleRingBeam.checked;
    toggleRingBeam.addEventListener('change', () => {
      bPhoton.visible = toggleRingBeam.checked;
      bWavefront.visible = toggleRingBeam.checked;
    });
  }

  new ResizeObserver(() => {
    const nw = bWrap.clientWidth;
    const nh = bWrap.clientHeight;
    if (nw > 0 && nh > 0) {
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
  }).observe(bWrap);

  const bClock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const t = bClock.getElapsedTime();
    const exp = explodeRange ? (Number(explodeRange.value) / 100 - 0.25) : 0;
    for (let i = 0; i < layerBaseY.length; i++) {
      const item = layerBaseY[i];
      item.obj.position.y = item.baseY + exp * item.weight;
    }

    const yCav = 1.35 + exp * 1.6;
    const yWafer = 0.84 + exp * 0.7;
    const yCeil = 2.21 + exp * 2.6;

    // 4-Bounce Ring Photon + 3D Wavefront
    const orb = (t * 0.7) % 1;
    const seg = Math.floor(orb * 4) % 4;
    const frac = (orb * 4) % 1;
    bPhoton.position.lerpVectors(bRingPts[seg], bRingPts[(seg + 1) % 4], frac);
    bPhoton.position.y = yCav + Math.sin(t * 5.0 + orb * Math.PI * 4) * 0.08;
    const pulse = (t * 1.8) % 1;
    bWavefront.position.copy(bPhoton.position);
    bWavefront.rotation.x = Math.PI * 0.5 + Math.sin(t * 2.0) * 0.35;
    bWavefront.rotation.y = t * 1.6;
    bWavefront.scale.setScalar(0.5 + pulse * 1.4);
    bWavefront.material.opacity = (1 - pulse) * 0.8;

    // 8-Way 3D V-Bounce Photons
    for (let i = 0; i < bVItems.length; i++) {
      const it = bVItems[i];
      const posAttr = it.line.geometry.attributes.position;
      posAttr.setXYZ(0, it.sx, yWafer, it.sz);
      posAttr.setXYZ(1, it.sx * 0.5, yCeil, it.sz * 0.5);
      posAttr.setXYZ(2, 0, yWafer, 0);
      posAttr.needsUpdate = true;

      const u = (t * 0.55 + it.phase) % 1;
      if (u < 0.5) {
        const k = u * 2;
        it.vp.position.set(
          THREE.MathUtils.lerp(it.sx, it.sx * 0.5, k),
          THREE.MathUtils.lerp(yWafer, yCeil, k),
          THREE.MathUtils.lerp(it.sz, it.sz * 0.5, k)
        );
      } else {
        const k = (u - 0.5) * 2;
        it.vp.position.set(
          THREE.MathUtils.lerp(it.sx * 0.5, 0, k),
          THREE.MathUtils.lerp(yCeil, yWafer, k),
          THREE.MathUtils.lerp(it.sz * 0.5, 0, k)
        );
      }
    }

    controls.update();
    renderer.render(scene, camera);
  }
  tick();
};
