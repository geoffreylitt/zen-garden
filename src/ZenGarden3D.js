import * as THREE from 'three';
import { CameraController } from './CameraController.js';

const GARDEN_SIZE = 10;
const SAND_RESOLUTION = 256;

const SAND_BASE = new THREE.Color(0xd2c4a0);
const GROOVE_COLOR = new THREE.Color(0xb0a078);
const RIDGE_COLOR = new THREE.Color(0xe8dcbc);

const CONTEMPLATION_PRESETS = [
  { name: 'Garden Edge', position: [6, 1.2, 6], lookAt: [0, 0, 0] },
  { name: 'Peaceful Corner', position: [-5, 0.8, 5], lookAt: [2, 0, -2] },
  { name: 'Stone Path View', position: [0, 0.6, 7], lookAt: [0, 0.2, 0] },
  { name: 'Shrub Perspective', position: [4, 0.4, 0], lookAt: [-2, 0.5, 0] },
  { name: 'Low Angle', position: [0, 0.25, 5], lookAt: [0, 0.5, -2] },
  { name: 'Free Camera', position: [4, 2, 4], lookAt: [0, 0, 0], freeCamera: true },
];

export class ZenGarden3D {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    
    this.activeTool = 'RAKE';
    this.cameraMode = 'isometric';
    this.currentPreset = -1;
    this.soundEnabled = true;
    this.audioStarted = false;
    
    this.placedItems = [];
    this.sandPixels = null;
    this.sandDirty = false;
    this.gardenMask = null;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDragging = false;
    this.lastIntersect = null;
    this.draggedItem = null;
    
    this.clock = new THREE.Clock();
    
    this.init();
    this.createGarden();
    this.setupInteraction();
    this.animate();
  }
  
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF5D0A0);
    this.scene.fog = new THREE.FogExp2(0xF5D0A0, 0.018);
    
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      500
    );
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);
    
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    
    this.setIsometricView();
    
    this.setupLighting();
    this.createSkyDome();
    this.createTempleBackground();
    this.createCherryBlossoms();
    
    window.addEventListener('resize', () => this.onResize());
  }
  
  setupLighting() {
    const ambient = new THREE.AmbientLight(0xFFE4C8, 0.5);
    this.scene.add(ambient);
    
    const sunLight = new THREE.DirectionalLight(0xFFF0D0, 1.2);
    sunLight.position.set(8, 15, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.bias = -0.001;
    this.scene.add(sunLight);
    
    const fillLight = new THREE.DirectionalLight(0xC0D0E0, 0.25);
    fillLight.position.set(-5, 8, -5);
    this.scene.add(fillLight);
    
    const hemi = new THREE.HemisphereLight(0xE8CC99, 0x443830, 0.4);
    this.scene.add(hemi);
  }
  
  setIsometricView() {
    const distance = 14;
    const angle = Math.PI / 4;
    const elevation = Math.atan(1 / Math.sqrt(2));
    
    this.camera.position.set(
      distance * Math.cos(elevation) * Math.sin(angle),
      distance * Math.sin(elevation) + 2,
      distance * Math.cos(elevation) * Math.cos(angle)
    );
    this.camera.lookAt(0, 0, 0);
    
    this.cameraController.disable();
  }
  
  setContemplationView(presetIndex = 0) {
    const preset = CONTEMPLATION_PRESETS[presetIndex];
    this.currentPreset = presetIndex;
    
    this.camera.position.set(...preset.position);
    this.cameraController.setPosition(...preset.position);
    this.cameraController.lookAt(...preset.lookAt);
    
    if (preset.freeCamera) {
      this.cameraController.enable();
    } else {
      this.cameraController.disable();
      this.camera.lookAt(...preset.lookAt);
    }
  }
  
  setCameraMode(mode) {
    this.cameraMode = mode;
    
    if (mode === 'isometric') {
      this.setIsometricView();
      this.currentPreset = -1;
    } else if (mode === 'contemplation') {
      this.setContemplationView(0);
    }
  }
  
  createGarden() {
    this.createGround();
    this.createSandPlane();
    this.createBorderStones();
  }
  
  createGround() {
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4A4236,
      roughness: 0.9,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.ground = ground;
  }
  
  createSandPlane() {
    this.buildGardenMask();
    
    const sandCanvas = document.createElement('canvas');
    sandCanvas.width = SAND_RESOLUTION;
    sandCanvas.height = SAND_RESOLUTION;
    this.sandCanvas = sandCanvas;
    this.sandCtx = sandCanvas.getContext('2d');
    
    this.sandPixels = new Uint8ClampedArray(SAND_RESOLUTION * SAND_RESOLUTION * 4);
    this.fillSand();
    this.syncSandTexture();
    
    this.sandTexture = new THREE.CanvasTexture(sandCanvas);
    this.sandTexture.minFilter = THREE.LinearFilter;
    this.sandTexture.magFilter = THREE.LinearFilter;
    
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = SAND_RESOLUTION;
    normalCanvas.height = SAND_RESOLUTION;
    this.normalCanvas = normalCanvas;
    this.normalCtx = normalCanvas.getContext('2d');
    this.updateNormalMap();
    
    this.normalTexture = new THREE.CanvasTexture(normalCanvas);
    
    const sandGeo = new THREE.PlaneGeometry(GARDEN_SIZE, GARDEN_SIZE * 0.9, 64, 64);
    const sandMat = new THREE.MeshStandardMaterial({
      map: this.sandTexture,
      normalMap: this.normalTexture,
      normalScale: new THREE.Vector2(0.3, 0.3),
      roughness: 0.85,
      metalness: 0,
    });
    
    const positions = sandGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      const u = (x / GARDEN_SIZE + 0.5);
      const v = (z / (GARDEN_SIZE * 0.9) + 0.5);
      
      const px = Math.floor(u * SAND_RESOLUTION);
      const py = Math.floor((1 - v) * SAND_RESOLUTION);
      
      if (px >= 0 && px < SAND_RESOLUTION && py >= 0 && py < SAND_RESOLUTION) {
        if (!this.isInGarden(px, py)) {
          positions.setZ(i, -0.1);
        }
      }
    }
    positions.needsUpdate = true;
    sandGeo.computeVertexNormals();
    
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = 0.01;
    sand.receiveShadow = true;
    this.scene.add(sand);
    this.sandMesh = sand;
  }
  
  buildGardenMask() {
    this.gardenMask = new Uint8Array(SAND_RESOLUTION * SAND_RESOLUTION);
    const cx = SAND_RESOLUTION / 2;
    const cy = SAND_RESOLUTION / 2;
    const rx = SAND_RESOLUTION * 0.42;
    const ry = SAND_RESOLUTION * 0.38;
    
    for (let y = 0; y < SAND_RESOLUTION; y++) {
      for (let x = 0; x < SAND_RESOLUTION; x++) {
        const angle = Math.atan2(y - cy, x - cx);
        const noise =
          Math.sin(angle * 3) * 0.06 +
          Math.sin(angle * 5 + 1) * 0.04 +
          Math.sin(angle * 7 + 2) * 0.03 +
          Math.sin(angle * 11 + 3) * 0.02;
        const dx = (x - cx) / (rx * (1 + noise));
        const dy = (y - cy) / (ry * (1 + noise));
        const dist = dx * dx + dy * dy;
        this.gardenMask[y * SAND_RESOLUTION + x] = dist <= 1.0 ? 1 : 0;
      }
    }
  }
  
  isInGarden(x, y) {
    if (x < 0 || x >= SAND_RESOLUTION || y < 0 || y >= SAND_RESOLUTION) return false;
    return this.gardenMask[y * SAND_RESOLUTION + x] === 1;
  }
  
  fillSand() {
    const baseR = SAND_BASE.r * 255;
    const baseG = SAND_BASE.g * 255;
    const baseB = SAND_BASE.b * 255;
    
    for (let y = 0; y < SAND_RESOLUTION; y++) {
      for (let x = 0; x < SAND_RESOLUTION; x++) {
        const i = (y * SAND_RESOLUTION + x) * 4;
        if (this.gardenMask[y * SAND_RESOLUTION + x]) {
          const noise = (Math.random() - 0.5) * 16;
          this.sandPixels[i] = Math.max(0, Math.min(255, baseR + noise));
          this.sandPixels[i + 1] = Math.max(0, Math.min(255, baseG + noise));
          this.sandPixels[i + 2] = Math.max(0, Math.min(255, baseB + noise));
          this.sandPixels[i + 3] = 255;
        } else {
          this.sandPixels[i] = 0x4a;
          this.sandPixels[i + 1] = 0x42;
          this.sandPixels[i + 2] = 0x36;
          this.sandPixels[i + 3] = 255;
        }
      }
    }
    this.sandDirty = true;
  }
  
  syncSandTexture() {
    const imageData = this.sandCtx.createImageData(SAND_RESOLUTION, SAND_RESOLUTION);
    imageData.data.set(this.sandPixels);
    this.sandCtx.putImageData(imageData, 0, 0);
    if (this.sandTexture) {
      this.sandTexture.needsUpdate = true;
    }
    this.sandDirty = false;
  }
  
  updateNormalMap() {
    const normalData = this.normalCtx.createImageData(SAND_RESOLUTION, SAND_RESOLUTION);
    const data = normalData.data;
    
    for (let y = 0; y < SAND_RESOLUTION; y++) {
      for (let x = 0; x < SAND_RESOLUTION; x++) {
        const i = (y * SAND_RESOLUTION + x) * 4;
        
        const getHeight = (px, py) => {
          px = Math.max(0, Math.min(SAND_RESOLUTION - 1, px));
          py = Math.max(0, Math.min(SAND_RESOLUTION - 1, py));
          const idx = (py * SAND_RESOLUTION + px) * 4;
          return (this.sandPixels[idx] + this.sandPixels[idx + 1] + this.sandPixels[idx + 2]) / 3;
        };
        
        const left = getHeight(x - 1, y);
        const right = getHeight(x + 1, y);
        const top = getHeight(x, y - 1);
        const bottom = getHeight(x, y + 1);
        
        const dx = (right - left) / 2;
        const dy = (bottom - top) / 2;
        
        const strength = 1.5;
        let nx = -dx * strength;
        let ny = -dy * strength;
        let nz = 1;
        
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len;
        ny /= len;
        nz /= len;
        
        data[i] = Math.floor((nx + 1) * 0.5 * 255);
        data[i + 1] = Math.floor((ny + 1) * 0.5 * 255);
        data[i + 2] = Math.floor((nz + 1) * 0.5 * 255);
        data[i + 3] = 255;
      }
    }
    
    this.normalCtx.putImageData(normalData, 0, 0);
    if (this.normalTexture) {
      this.normalTexture.needsUpdate = true;
    }
  }
  
  createBorderStones() {
    const cx = SAND_RESOLUTION / 2;
    const cy = SAND_RESOLUTION / 2;
    const rx = SAND_RESOLUTION * 0.42;
    const ry = SAND_RESOLUTION * 0.38;
    const steps = 80;
    
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x888880,
      roughness: 0.75,
      metalness: 0.1,
    });
    
    const mossMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a5a30,
      roughness: 0.9,
      metalness: 0,
    });
    
    this.borderGroup = new THREE.Group();
    
    for (let s = 0; s < steps; s++) {
      const angle = (s / steps) * Math.PI * 2;
      const noise =
        Math.sin(angle * 3) * 0.06 +
        Math.sin(angle * 5 + 1) * 0.04 +
        Math.sin(angle * 7 + 2) * 0.03 +
        Math.sin(angle * 11 + 3) * 0.02;
      const r = 1 + noise;
      
      const px = cx + rx * r * Math.cos(angle);
      const py = cy + ry * r * Math.sin(angle);
      
      const worldX = ((px / SAND_RESOLUTION) - 0.5) * GARDEN_SIZE;
      const worldZ = ((py / SAND_RESOLUTION) - 0.5) * GARDEN_SIZE * 0.9;
      
      const stoneSize = 0.15 + Math.random() * 0.1;
      const stoneGeo = new THREE.DodecahedronGeometry(stoneSize, 0);
      const stone = new THREE.Mesh(stoneGeo, stoneMaterial);
      
      stone.position.set(worldX, stoneSize * 0.3, worldZ);
      stone.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      stone.scale.y = 0.5 + Math.random() * 0.3;
      stone.castShadow = true;
      stone.receiveShadow = true;
      
      this.borderGroup.add(stone);
      
      if (Math.random() < 0.4) {
        const mossSize = 0.05 + Math.random() * 0.05;
        const mossGeo = new THREE.SphereGeometry(mossSize, 6, 4);
        const moss = new THREE.Mesh(mossGeo, mossMaterial);
        moss.position.set(
          worldX + (Math.random() - 0.5) * 0.15,
          mossSize * 0.5,
          worldZ + (Math.random() - 0.5) * 0.15
        );
        moss.scale.y = 0.5;
        this.borderGroup.add(moss);
      }
    }
    
    this.scene.add(this.borderGroup);
  }
  
  createSkyDome() {
    const skyGeo = new THREE.SphereGeometry(200, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x7799BB) },
        horizonColor: { value: new THREE.Color(0xF5D0A0) },
        offset: { value: 20 },
        exponent: { value: 0.4 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          float t = max(pow(max(h, 0.0), exponent), 0.0);
          gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }
  
  createTempleBackground() {
    this.backgroundGroup = new THREE.Group();
    
    this.backgroundGroup.add(this.createToriiGate(12, -18, Math.PI * 0.15, 1.0));
    this.backgroundGroup.add(this.createToriiGate(-20, -12, -Math.PI * 0.3, 0.8));
    this.backgroundGroup.add(this.createToriiGate(22, 8, Math.PI * 0.7, 1.2));
    
    this.backgroundGroup.add(this.createPagoda(-28, -25, Math.PI * 0.2, 1.0));
    this.backgroundGroup.add(this.createPagoda(30, -20, -Math.PI * 0.15, 0.7));
    
    const treePositions = [
      [15, -15], [-18, -8], [18, 12], [-12, 18],
      [-25, -15], [25, 5], [-20, 20], [8, -22],
      [28, -10], [-30, 5], [10, 22], [-8, -25],
      [-22, -20], [20, 18], [-15, 25], [30, 15],
    ];
    for (const [x, z] of treePositions) {
      const scale = 0.5 + Math.random() * 0.7;
      const isCherryBlossom = Math.random() < 0.35;
      this.backgroundGroup.add(this.createBackgroundTree(x, z, scale, isCherryBlossom));
    }
    
    this.backgroundGroup.add(this.createStoneLantern(6.5, -5.5, 0.7));
    this.backgroundGroup.add(this.createStoneLantern(-6, 5, 0.6));
    
    this.scene.add(this.backgroundGroup);
  }
  
  createToriiGate(x, z, rotY, scale) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xCC3333,
      roughness: 0.6,
      metalness: 0.05,
    });

    const h = 3.5 * scale;
    const r = 0.08 * scale;
    const spacing = 2.2 * scale;

    const pillarGeo = new THREE.CylinderGeometry(r, r * 1.15, h, 8);
    const left = new THREE.Mesh(pillarGeo, mat);
    left.position.set(-spacing / 2, h / 2, 0);
    left.castShadow = true;
    group.add(left);

    const right = new THREE.Mesh(pillarGeo, mat);
    right.position.set(spacing / 2, h / 2, 0);
    right.castShadow = true;
    group.add(right);

    const kasagiW = spacing + 0.8 * scale;
    const kasagiGeo = new THREE.BoxGeometry(kasagiW, r * 2.5, r * 4);
    const kasagi = new THREE.Mesh(kasagiGeo, mat);
    kasagi.position.set(0, h + r, 0);
    kasagi.castShadow = true;
    group.add(kasagi);

    const shimakiGeo = new THREE.BoxGeometry(kasagiW * 0.95, r * 1.2, r * 2.5);
    const shimaki = new THREE.Mesh(shimakiGeo, mat);
    shimaki.position.set(0, h - r * 0.5, 0);
    group.add(shimaki);

    const nukiGeo = new THREE.BoxGeometry(spacing * 1.1, r * 1.8, r * 2);
    const nuki = new THREE.Mesh(nukiGeo, mat);
    nuki.position.set(0, h * 0.7, 0);
    group.add(nuki);

    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    return group;
  }
  
  createPagoda(x, z, rotY, scale) {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4A3828,
      roughness: 0.85,
      metalness: 0,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x2A2520,
      roughness: 0.8,
      metalness: 0.05,
    });

    const tiers = 3;
    let y = 0;

    const baseGeo = new THREE.BoxGeometry(4 * scale, 0.3 * scale, 4 * scale);
    const base = new THREE.Mesh(baseGeo, woodMat);
    base.position.y = 0.15 * scale;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    y = 0.3 * scale;

    for (let t = 0; t < tiers; t++) {
      const tierScale = 1 - t * 0.22;
      const wallH = 1.5 * scale * tierScale;
      const wallW = 3 * scale * tierScale;

      const wallGeo = new THREE.BoxGeometry(wallW, wallH, wallW);
      const wall = new THREE.Mesh(wallGeo, woodMat);
      wall.position.y = y + wallH / 2;
      wall.castShadow = true;
      group.add(wall);
      y += wallH;

      const roofW = wallW * 1.45;
      const roofGeo = new THREE.BoxGeometry(roofW, 0.12 * scale, roofW);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = y + 0.06 * scale;
      roof.castShadow = true;
      group.add(roof);

      const eaveGeo = new THREE.BoxGeometry(roofW * 1.05, 0.05 * scale, roofW * 1.05);
      const eave = new THREE.Mesh(eaveGeo, roofMat);
      eave.position.y = y - 0.02 * scale;
      group.add(eave);

      y += 0.12 * scale;
    }

    const spireH = 1.5 * scale;
    const spireGeo = new THREE.ConeGeometry(0.15 * scale, spireH, 4);
    const spire = new THREE.Mesh(spireGeo, roofMat);
    spire.position.y = y + spireH / 2;
    spire.rotation.y = Math.PI / 4;
    spire.castShadow = true;
    group.add(spire);

    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    return group;
  }
  
  createBackgroundTree(x, z, scale, cherryBlossom = false) {
    const group = new THREE.Group();

    const trunkMat = new THREE.MeshStandardMaterial({
      color: cherryBlossom ? 0x5A3A2A : 0x4A3A2A,
      roughness: 0.9,
    });
    const trunkH = (1.5 + Math.random() * 1.5) * scale;
    const trunkR = 0.06 * scale;
    const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.7, trunkR, trunkH, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkH / 2;
    group.add(trunk);

    let foliageColor;
    if (cherryBlossom) {
      foliageColor = new THREE.Color().setHSL(
        0.95 + Math.random() * 0.03,
        0.35 + Math.random() * 0.15,
        0.65 + Math.random() * 0.15
      );
    } else {
      foliageColor = new THREE.Color().setHSL(
        0.28 + Math.random() * 0.08,
        0.3 + Math.random() * 0.1,
        0.18 + Math.random() * 0.1
      );
    }

    const foliageMat = new THREE.MeshStandardMaterial({
      color: foliageColor,
      roughness: 0.9,
    });

    const layers = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < layers; i++) {
      const fSize = (0.4 + Math.random() * 0.35) * scale;
      const fGeo = new THREE.SphereGeometry(fSize, 6, 5);
      const foliage = new THREE.Mesh(fGeo, foliageMat);
      foliage.position.set(
        (Math.random() - 0.5) * 0.3 * scale,
        trunkH + i * 0.35 * scale - 0.1 * scale,
        (Math.random() - 0.5) * 0.3 * scale
      );
      foliage.scale.y = 0.6 + Math.random() * 0.3;
      foliage.castShadow = true;
      group.add(foliage);
    }

    group.position.set(x, 0, z);
    return group;
  }
  
  createStoneLantern(x, z, scale) {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x888878,
      roughness: 0.85,
      metalness: 0.05,
    });

    let y = 0;

    const baseGeo = new THREE.CylinderGeometry(0.2 * scale, 0.25 * scale, 0.15 * scale, 6);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.075 * scale;
    group.add(base);
    y = 0.15 * scale;

    const shaftH = 0.8 * scale;
    const shaftGeo = new THREE.CylinderGeometry(0.07 * scale, 0.08 * scale, shaftH, 6);
    const shaft = new THREE.Mesh(shaftGeo, stoneMat);
    shaft.position.y = y + shaftH / 2;
    group.add(shaft);
    y += shaftH;

    const lampH = 0.3 * scale;
    const lampGeo = new THREE.BoxGeometry(0.25 * scale, lampH, 0.25 * scale);
    const lamp = new THREE.Mesh(lampGeo, stoneMat);
    lamp.position.y = y + lampH / 2;
    group.add(lamp);
    y += lampH;

    const light = new THREE.PointLight(0xFFAA44, 0.5, 3 * scale);
    light.position.y = y - lampH * 0.3;
    group.add(light);

    const roofGeo = new THREE.ConeGeometry(0.22 * scale, 0.2 * scale, 4);
    const roof = new THREE.Mesh(roofGeo, stoneMat);
    roof.position.y = y + 0.1 * scale;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    group.position.set(x, 0, z);
    return group;
  }
  
  createCherryBlossoms() {
    const count = 250;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    this.petalData = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 15 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      const pink = Math.random();
      if (pink < 0.5) {
        colors[i * 3] = 0.95 + Math.random() * 0.05;
        colors[i * 3 + 1] = 0.72 + Math.random() * 0.15;
        colors[i * 3 + 2] = 0.78 + Math.random() * 0.15;
      } else if (pink < 0.8) {
        colors[i * 3] = 0.98;
        colors[i * 3 + 1] = 0.90 + Math.random() * 0.08;
        colors[i * 3 + 2] = 0.92 + Math.random() * 0.08;
      } else {
        colors[i * 3] = 0.92;
        colors[i * 3 + 1] = 0.55 + Math.random() * 0.15;
        colors[i * 3 + 2] = 0.65 + Math.random() * 0.15;
      }

      this.petalData.push({
        drift: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          -(0.15 + Math.random() * 0.35),
          (Math.random() - 0.5) * 0.4
        ),
        phase: Math.random() * Math.PI * 2,
        wobbleSpeed: 1 + Math.random() * 2,
        wobbleAmp: 0.3 + Math.random() * 0.5,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const petalTexture = this.createPetalTexture();

    const material = new THREE.PointsMaterial({
      size: 0.15,
      map: petalTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this.cherryBlossoms = new THREE.Points(geometry, material);
    this.scene.add(this.cherryBlossoms);
  }
  
  createPetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
  }
  
  updateCherryBlossoms(delta) {
    if (!this.cherryBlossoms) return;

    const positions = this.cherryBlossoms.geometry.attributes.position.array;
    const count = positions.length / 3;
    const elapsed = this.clock.elapsedTime;

    const windX = Math.sin(elapsed * 0.3) * 0.15;
    const windZ = Math.cos(elapsed * 0.2) * 0.1;

    for (let i = 0; i < count; i++) {
      const petal = this.petalData[i];
      const wobble = Math.sin(elapsed * petal.wobbleSpeed + petal.phase);

      positions[i * 3] += (petal.drift.x + windX + wobble * petal.wobbleAmp * 0.05) * delta;
      positions[i * 3 + 1] += petal.drift.y * delta;
      positions[i * 3 + 2] += (petal.drift.z + windZ + Math.cos(elapsed * petal.wobbleSpeed * 0.7 + petal.phase) * petal.wobbleAmp * 0.04) * delta;

      if (positions[i * 3 + 1] < -0.5) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = 12 + Math.random() * 5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
    }

    this.cherryBlossoms.geometry.attributes.position.needsUpdate = true;
  }
  
  createRock(worldX, worldZ) {
    const rockGroup = new THREE.Group();
    
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.4 + Math.random() * 0.15, 0.38 + Math.random() * 0.1, 0.35),
      roughness: 0.7 + Math.random() * 0.2,
      metalness: 0.05,
    });
    
    const baseSize = 0.25 + Math.random() * 0.2;
    const rockGeo = new THREE.DodecahedronGeometry(baseSize, 1);
    
    const positions = rockGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const noise = (Math.random() - 0.5) * 0.1 * baseSize;
      positions.setXYZ(i, x + noise, y * 0.6 + noise, z + noise);
    }
    rockGeo.computeVertexNormals();
    
    const rock = new THREE.Mesh(rockGeo, rockMaterial);
    rock.position.y = baseSize * 0.35;
    rock.castShadow = true;
    rock.receiveShadow = true;
    rockGroup.add(rock);
    
    rockGroup.position.set(worldX, 0, worldZ);
    rockGroup.userData.type = 'rock';
    rockGroup.userData.draggable = true;
    
    return rockGroup;
  }
  
  createShrub(worldX, worldZ) {
    const shrubGroup = new THREE.Group();
    
    const foliageCount = 3 + Math.floor(Math.random() * 3);
    const baseColor = new THREE.Color(0.15, 0.35 + Math.random() * 0.15, 0.12);
    
    for (let i = 0; i < foliageCount; i++) {
      const size = 0.12 + Math.random() * 0.1;
      const foliageGeo = new THREE.IcosahedronGeometry(size, 1);
      
      const positions = foliageGeo.attributes.position;
      for (let j = 0; j < positions.count; j++) {
        const x = positions.getX(j);
        const y = positions.getY(j);
        const z = positions.getZ(j);
        const noise = (Math.random() - 0.5) * 0.08 * size;
        positions.setXYZ(j, x + noise, y + noise, z + noise);
      }
      foliageGeo.computeVertexNormals();
      
      const foliageMat = new THREE.MeshStandardMaterial({
        color: baseColor.clone().offsetHSL(0, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05),
        roughness: 0.85,
        metalness: 0,
      });
      
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(
        (Math.random() - 0.5) * 0.15,
        size * 0.8 + i * 0.08,
        (Math.random() - 0.5) * 0.15
      );
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      shrubGroup.add(foliage);
    }
    
    shrubGroup.position.set(worldX, 0, worldZ);
    shrubGroup.userData.type = 'shrub';
    shrubGroup.userData.draggable = true;
    
    return shrubGroup;
  }
  
  placeItem(type, worldX, worldZ) {
    const item = type === 'ROCK' 
      ? this.createRock(worldX, worldZ)
      : this.createShrub(worldX, worldZ);
    
    this.scene.add(item);
    this.placedItems.push(item);
    this.playPlaceSound();
  }
  
  rakeStroke(from, to) {
    const tineCount = 5;
    const tineSpacing = 3;
    
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;
    
    const steps = Math.ceil(dist);
    const nx = dx / dist;
    const ny = dy / dist;
    const px = -ny;
    const py = nx;
    
    const halfWidth = ((tineCount - 1) * tineSpacing) / 2;
    
    const grooveR = Math.floor(GROOVE_COLOR.r * 255);
    const grooveG = Math.floor(GROOVE_COLOR.g * 255);
    const grooveB = Math.floor(GROOVE_COLOR.b * 255);
    const ridgeR = Math.floor(RIDGE_COLOR.r * 255);
    const ridgeG = Math.floor(RIDGE_COLOR.g * 255);
    const ridgeB = Math.floor(RIDGE_COLOR.b * 255);
    
    for (let s = 0; s <= steps; s++) {
      const cx = from.x + nx * s;
      const cy = from.y + ny * s;
      
      for (let t = 0; t < tineCount; t++) {
        const offset = -halfWidth + t * tineSpacing;
        const tx = Math.floor(cx + px * offset);
        const ty = Math.floor(cy + py * offset);
        
        if (!this.isInGarden(tx, ty)) continue;
        
        this.setSandPixel(tx, ty, grooveR, grooveG, grooveB);
        
        const rx1 = Math.floor(tx + px);
        const ry1 = Math.floor(ty + py);
        const rx2 = Math.floor(tx - px);
        const ry2 = Math.floor(ty - py);
        
        if (this.isInGarden(rx1, ry1)) {
          this.setSandPixel(rx1, ry1, ridgeR, ridgeG, ridgeB);
        }
        if (this.isInGarden(rx2, ry2)) {
          this.setSandPixel(rx2, ry2, ridgeR, ridgeG, ridgeB);
        }
      }
    }
    this.sandDirty = true;
  }
  
  setSandPixel(x, y, r, g, b) {
    const i = (y * SAND_RESOLUTION + x) * 4;
    this.sandPixels[i] = r;
    this.sandPixels[i + 1] = g;
    this.sandPixels[i + 2] = b;
    this.sandPixels[i + 3] = 255;
  }
  
  clearSand() {
    this.fillSand();
    this.syncSandTexture();
    this.updateNormalMap();
    
    for (const item of this.placedItems) {
      this.scene.remove(item);
    }
    this.placedItems = [];
  }
  
  worldToTexture(worldX, worldZ) {
    const u = (worldX / GARDEN_SIZE + 0.5);
    const v = (worldZ / (GARDEN_SIZE * 0.9) + 0.5);
    return {
      x: Math.floor(u * SAND_RESOLUTION),
      y: Math.floor(v * SAND_RESOLUTION),
    };
  }
  
  textureToWorld(texX, texY) {
    const u = texX / SAND_RESOLUTION;
    const v = texY / SAND_RESOLUTION;
    return {
      x: (u - 0.5) * GARDEN_SIZE,
      z: (v - 0.5) * GARDEN_SIZE * 0.9,
    };
  }
  
  setupInteraction() {
    const canvas = this.renderer.domElement;
    
    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    canvas.addEventListener('pointerleave', (e) => this.onPointerUp(e));
  }
  
  updateMouse(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  raycastGarden() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.sandMesh);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const texCoords = this.worldToTexture(point.x, point.z);
      if (this.isInGarden(texCoords.x, texCoords.y)) {
        return { world: point, texture: texCoords };
      }
    }
    return null;
  }
  
  raycastItems() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    for (const item of this.placedItems) {
      const intersects = this.raycaster.intersectObject(item, true);
      if (intersects.length > 0) {
        return item;
      }
    }
    return null;
  }
  
  onPointerDown(event) {
    this.ensureAudio();
    this.updateMouse(event);
    
    if (this.cameraMode === 'contemplation' && this.cameraController.enabled) {
      return;
    }
    
    const item = this.raycastItems();
    if (item) {
      this.isDragging = true;
      this.draggedItem = item;
      return;
    }
    
    const hit = this.raycastGarden();
    if (!hit) return;
    
    if (this.activeTool === 'RAKE') {
      this.isDragging = true;
      this.lastIntersect = hit.texture;
      if (this.rakeGain) {
        this.rakeGain.gain.linearRampToValueAtTime(0.06, this.audioCtx.currentTime + 0.1);
      }
    } else if (this.activeTool === 'ROCK' || this.activeTool === 'SHRUB') {
      this.placeItem(this.activeTool, hit.world.x, hit.world.z);
    }
  }
  
  onPointerMove(event) {
    this.updateMouse(event);
    
    if (!this.isDragging) return;
    
    if (this.draggedItem) {
      const hit = this.raycastGarden();
      if (hit) {
        this.draggedItem.position.x = hit.world.x;
        this.draggedItem.position.z = hit.world.z;
      }
      return;
    }
    
    if (this.activeTool === 'RAKE' && this.lastIntersect) {
      const hit = this.raycastGarden();
      if (hit) {
        this.rakeStroke(this.lastIntersect, hit.texture);
        this.lastIntersect = hit.texture;
      }
    }
  }
  
  onPointerUp() {
    this.isDragging = false;
    this.lastIntersect = null;
    this.draggedItem = null;
    
    if (this.rakeGain) {
      this.rakeGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.2);
    }
  }
  
  ensureAudio() {
    if (this.audioStarted) return;
    this.audioStarted = true;
    
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.setupWind();
      this.setupRakeSound();
    } catch (e) {
      console.warn('Web Audio not available');
    }
  }
  
  setupWind() {
    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;
    
    this.windGain = ctx.createGain();
    this.windGain.gain.value = this.soundEnabled ? 0.03 : 0;
    
    source.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(ctx.destination);
    source.start();
  }
  
  setupRakeSound() {
    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 1.5;
    
    this.rakeGain = ctx.createGain();
    this.rakeGain.gain.value = 0;
    
    source.connect(filter);
    filter.connect(this.rakeGain);
    this.rakeGain.connect(ctx.destination);
    source.start();
  }
  
  playPlaceSound() {
    if (!this.audioCtx || !this.soundEnabled) return;
    
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    osc.frequency.value = 90;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }
  
  playShutterSound() {
    if (!this.audioCtx || !this.soundEnabled) return;
    
    const ctx = this.audioCtx;
    
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30);
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    const gain = ctx.createGain();
    gain.gain.value = 0.3;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }
  
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    if (this.windGain) {
      this.windGain.gain.value = this.soundEnabled ? 0.03 : 0;
    }
    return this.soundEnabled;
  }
  
  capturePhoto() {
    this.playShutterSound();
    
    this.renderer.render(this.scene, this.camera);
    
    return this.renderer.domElement.toDataURL('image/png');
  }
  
  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(this.width, this.height);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const delta = Math.min(this.clock.getDelta(), 0.1);
    
    if (this.cameraController.enabled) {
      this.cameraController.update(delta);
    }
    
    if (this.sandDirty) {
      this.syncSandTexture();
      this.updateNormalMap();
    }
    
    this.updateCherryBlossoms(delta);
    
    this.renderer.render(this.scene, this.camera);
  }
}
