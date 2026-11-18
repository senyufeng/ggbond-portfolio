import * as THREE from "three";
import { RoomEnvironment } from "three/addons/RoomEnvironment.js";

const $ = (selector, root = document) => root.querySelector(selector);
const screen = document.body.dataset.screen || "lobby";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const boot = $("#tacBoot");

/* --------------------------------------------------------------------------
   Display-only pages. Navigation is ordinary links; no matchmaking logic.
   -------------------------------------------------------------------------- */

const initUI = () => {
  window.setTimeout(() => boot?.classList.add("is-hidden"), 9000);
};

initUI();

/* --------------------------------------------------------------------------
   3D scene
   -------------------------------------------------------------------------- */

const initScene = () => {
  const canvas = $("#tac-canvas");
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    document.body.classList.add("no-webgl");
    boot?.classList.add("is-hidden");
    console.error(error);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x19140f, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xc8a97c, 0.018);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.32;
  pmrem.dispose();

  /* ------------------------------------------------------------------------
     Procedural textures
     ------------------------------------------------------------------------ */

  const makeCanvas = (width, height) => {
    const element = document.createElement("canvas");
    element.width = width;
    element.height = height;
    return { element, ctx: element.getContext("2d") };
  };

  const makeGroundTexture = () => {
    const { element, ctx } = makeCanvas(1024, 1024);
    ctx.fillStyle = "#ad8e62";
    ctx.fillRect(0, 0, 1024, 1024);

    const tones = ["#b99a6b", "#ad8d5f", "#c3a273", "#a88a5f", "#b39366"];
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
        ctx.globalAlpha = 0.55 + Math.random() * 0.25;
        ctx.fillRect(col * 128 + 1, row * 128 + 1, 126, 126);
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(55, 43, 30, 0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 128, 0);
      ctx.lineTo(i * 128, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * 128);
      ctx.lineTo(1024, i * 128);
      ctx.stroke();
    }
    for (let i = 0; i < 1800; i += 1) {
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(70, 53, 35, 0.18)" : "rgba(230, 210, 175, 0.16)";
      const size = Math.random() * 3 + 1;
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, size, size);
    }
    for (let i = 0; i < 14; i += 1) {
      ctx.strokeStyle = "rgba(60, 46, 31, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      let x = Math.random() * 1024;
      let y = Math.random() * 1024;
      ctx.moveTo(x, y);
      for (let j = 0; j < 4; j += 1) {
        x += Math.random() * 80 - 40;
        y += Math.random() * 80 - 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(element);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(9, 9);
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return texture;
  };

  const makeWoodTexture = () => {
    const { element, ctx } = makeCanvas(512, 512);
    ctx.fillStyle = "#745232";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = i % 2 ? "#835f3a" : "#6b4b2d";
      ctx.fillRect(0, i * 102, 512, 98);
      ctx.strokeStyle = "rgba(40, 27, 16, 0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, i * 102 + 100);
      ctx.lineTo(512, i * 102 + 100);
      ctx.stroke();
    }
    for (let i = 0; i < 600; i += 1) {
      ctx.strokeStyle = "rgba(45, 29, 16, 0.22)";
      ctx.lineWidth = 1;
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.random() * 70, y + Math.random() * 3);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(element);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const makeStoneTexture = () => {
    const { element, ctx } = makeCanvas(512, 512);
    ctx.fillStyle = "#b69264";
    ctx.fillRect(0, 0, 512, 512);
    const tones = ["#b99668", "#ae8a5d", "#c2a072", "#a7855b"];
    for (let row = 0; row < 8; row += 1) {
      const offset = row % 2 ? 32 : 0;
      for (let col = -1; col < 5; col += 1) {
        ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
        ctx.globalAlpha = 0.7;
        ctx.fillRect(col * 128 + offset + 2, row * 64 + 2, 124, 60);
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(70, 52, 33, 0.36)";
    ctx.lineWidth = 2;
    for (let row = 0; row <= 8; row += 1) {
      ctx.beginPath();
      ctx.moveTo(0, row * 64);
      ctx.lineTo(512, row * 64);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(element);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.5, 1.8);
    return texture;
  };

  const makeSignTexture = () => {
    const { element, ctx } = makeCanvas(1024, 512);
    ctx.clearRect(0, 0, 1024, 512);
    ctx.strokeStyle = "rgba(240, 162, 74, 0.8)";
    ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, 976, 464);
    ctx.fillStyle = "rgba(8, 10, 10, 0.68)";
    ctx.fillRect(26, 26, 972, 460);
    ctx.fillStyle = "#f0a24a";
    ctx.font = '700 220px "Bahnschrift Condensed", "Arial Narrow", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A SITE", 512, 210);
    ctx.fillStyle = "#e9e4da";
    ctx.font = '400 54px "Bahnschrift Condensed", "Arial Narrow", sans-serif';
    ctx.fillText("SUGAR FACTORY / 5V5", 512, 370);
    ctx.font = '400 27px monospace';
    ctx.fillStyle = "rgba(233, 228, 218, 0.55)";
    ctx.fillText("TACTICAL OPERATIONS // SECTOR 08", 512, 430);
    const texture = new THREE.CanvasTexture(element);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const makeBombsiteTexture = () => {
    const { element, ctx } = makeCanvas(1024, 1024);
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.strokeStyle = "rgba(240, 162, 74, 0.55)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(512, 512, 340, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(240, 162, 74, 0.2)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(512, 512, 390, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(240, 162, 74, 0.78)";
    ctx.font = '700 620px "Bahnschrift Condensed", "Arial Narrow", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A", 512, 540);
    ctx.fillStyle = "rgba(240, 162, 74, 0.74)";
    ctx.font = '400 45px monospace';
    ctx.fillText("BOMBSITE / SUGAR", 512, 880);
    const texture = new THREE.CanvasTexture(element);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const makeSkyTexture = () => {
    const { element, ctx } = makeCanvas(1024, 512);
    const sky = ctx.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, "#71828c");
    sky.addColorStop(0.42, "#c6a67b");
    sky.addColorStop(0.68, "#e3c197");
    sky.addColorStop(1, "#b58b5b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 512);
    const sun = ctx.createRadialGradient(760, 250, 5, 760, 250, 170);
    sun.addColorStop(0, "rgba(255, 236, 190, 0.95)");
    sun.addColorStop(0.16, "rgba(255, 214, 150, 0.5)");
    sun.addColorStop(1, "rgba(255, 214, 150, 0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, 1024, 512);
    const texture = new THREE.CanvasTexture(element);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  /* ------------------------------------------------------------------------
     Lights
     ------------------------------------------------------------------------ */

  scene.add(new THREE.HemisphereLight(0xd7e2e8, 0x6b5034, 1.05));

  const sun = new THREE.DirectionalLight(0xffd4a0, 3.3);
  sun.position.set(-9, 14, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 45;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0xe2603f, 1.4);
  rim.position.set(9, 5, -7);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0x8fb9c0, 0.55);
  fill.position.set(2, 5, 10);
  scene.add(fill);

  /* ------------------------------------------------------------------------
     Sky, ground and map shell
     ------------------------------------------------------------------------ */

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(60, 32, 16),
    new THREE.MeshBasicMaterial({
      map: makeSkyTexture(),
      side: THREE.BackSide,
      fog: false
    })
  );
  sky.position.y = 3;
  scene.add(sky);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.MeshStandardMaterial({
      map: makeGroundTexture(),
      roughness: 0.94,
      metalness: 0.02
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  const stoneMaterial = new THREE.MeshStandardMaterial({
    map: makeStoneTexture(),
    roughness: 0.9,
    metalness: 0
  });
  const stoneDark = new THREE.MeshStandardMaterial({ color: 0x7c6042, roughness: 0.94 });
  const stoneTrim = new THREE.MeshStandardMaterial({ color: 0x8f714d, roughness: 0.86 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e2322, roughness: 0.55, metalness: 0.4 });
  const woodMaterial = new THREE.MeshStandardMaterial({ map: makeWoodTexture(), roughness: 0.85 });
  const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x326f78, roughness: 0.46, metalness: 0.4 });
  const barrelRimMaterial = new THREE.MeshStandardMaterial({ color: 0x183a3f, roughness: 0.4, metalness: 0.55 });

  const addBox = (width, height, depth, x, y, z, material, options = {}) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = options.rotation || 0;
    mesh.castShadow = options.cast !== false;
    mesh.receiveShadow = options.receive !== false;
    scene.add(mesh);
    if (options.edges) {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry),
        new THREE.LineBasicMaterial({ color: options.edges, transparent: true, opacity: options.edgeOpacity || 0.35 })
      );
      edges.position.copy(mesh.position);
      edges.rotation.copy(mesh.rotation);
      scene.add(edges);
    }
    return mesh;
  };

  const archShape = new THREE.Shape();
  const archWidth = 22;
  const archHeight = 7.2;
  const archOpening = 3.4;
  const archTop = 4.7;
  archShape.moveTo(-archWidth / 2, 0);
  archShape.lineTo(archWidth / 2, 0);
  archShape.lineTo(archWidth / 2, archHeight);
  archShape.lineTo(-archWidth / 2, archHeight);
  archShape.closePath();

  const archHole = new THREE.Path();
  const archRadius = archOpening / 2;
  archHole.moveTo(-archRadius, 0);
  archHole.lineTo(-archRadius, archTop - archRadius);
  archHole.absarc(0, archTop - archRadius, archRadius, Math.PI, 0, true);
  archHole.lineTo(archRadius, 0);
  archHole.closePath();
  archShape.holes.push(archHole);

  const archGeometry = new THREE.ExtrudeGeometry(archShape, {
    depth: 0.65,
    bevelEnabled: false,
    steps: 1
  });
  archGeometry.translate(0, 0, -0.325);

  const backWall = new THREE.Mesh(archGeometry, stoneMaterial);
  backWall.position.set(0, 0, -9);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  scene.add(backWall);

  addBox(archWidth + 0.8, 0.28, 1.1, 0, archHeight, -9, stoneTrim);
  addBox(archWidth + 0.8, 0.18, 1.1, 0, 4.9, -9, stoneDark);
  addBox(1.3, 7.3, 1.15, -11.2, 3.65, -9, stoneTrim);
  addBox(1.3, 7.3, 1.15, 11.2, 3.65, -9, stoneTrim);

  for (let x = -10; x <= 10; x += 2.5) {
    addBox(0.7, 0.55, 1.1, x, 7.45, -9, stoneDark);
  }

  addBox(0.7, 6, 16, -11, 3, -2.5, stoneMaterial);
  addBox(0.7, 6, 16, 11, 3, -2.5, stoneMaterial);
  addBox(22, 0.7, 0.8, 0, 6.1, 5.4, stoneMaterial, { rotation: 0 });

  const darkInterior = new THREE.Mesh(
    new THREE.PlaneGeometry(3.3, 4.7),
    new THREE.MeshBasicMaterial({ color: 0x120f0c })
  );
  darkInterior.position.set(0, 2.35, -9.38);
  scene.add(darkInterior);

  const interiorLight = new THREE.PointLight(0xffae65, 38, 12, 2);
  interiorLight.position.set(0, 2.8, -10.2);
  scene.add(interiorLight);

  addBox(1.5, 9, 1.5, -8.3, 4.5, -11.2, stoneMaterial);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    stoneTrim
  );
  dome.position.set(-8.3, 9, -11.2);
  dome.castShadow = true;
  scene.add(dome);
  addBox(2.1, 0.18, 2.1, -8.3, 7.2, -11.2, stoneDark);
  addBox(0.12, 3.4, 0.12, -8.3, 8.9, -10.42, darkMetal);

  const wallSign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 2.8),
    new THREE.MeshBasicMaterial({ map: makeSignTexture(), transparent: true, opacity: 0.94 })
  );
  wallSign.position.set(5.2, 4.9, -8.62);
  scene.add(wallSign);

  const bombsite = new THREE.Mesh(
    new THREE.PlaneGeometry(6.3, 6.3),
    new THREE.MeshBasicMaterial({
      map: makeBombsiteTexture(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2
    })
  );
  bombsite.rotation.x = -Math.PI / 2;
  bombsite.position.set(1.2, 0.018, 2.3);
  scene.add(bombsite);

  /* ------------------------------------------------------------------------
     Props: crates, barrels, sandbags, sign lollipop
     ------------------------------------------------------------------------ */

  const addCrate = (x, y, z, width, height, depth, rotation = 0) => {
    const crate = addBox(width, height, depth, x, y + height / 2, z, woodMaterial, {
      rotation,
      edges: 0x2c1d10,
      edgeOpacity: 0.45
    });
    const bandY = y + height * 0.5;
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.03, 0.1, depth + 0.03),
      darkMetal
    );
    band.position.set(x, bandY, z);
    band.rotation.y = rotation;
    band.castShadow = true;
    scene.add(band);
    return crate;
  };

  addCrate(1.45, 0, -1.8, 2.6, 1.2, 2.3);
  addCrate(-3.9, 0, -3.1, 1.7, 1.35, 1.7, -0.15);
  addCrate(5.4, 0, -3.7, 1.8, 1.3, 1.8, 0.22);
  addCrate(-6.2, 0, 0.7, 1.4, 1.05, 1.4, -0.08);
  addCrate(4.4, 0, 1.2, 1.3, 0.9, 1.3, 0.14);
  addCrate(-2.9, 0, 2.1, 1.2, 0.8, 1.2, 0.28);

  const addBarrel = (x, z, rotation = 0) => {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.46, 1.15, 18), barrelMaterial);
    barrel.position.set(x, 0.575, z);
    barrel.rotation.y = rotation;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    scene.add(barrel);

    for (const y of [0.24, 0.9]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 6, 24), barrelRimMaterial);
      rim.position.set(x, y, z);
      rim.rotation.x = Math.PI / 2;
      scene.add(rim);
    }
  };

  addBarrel(-5.3, 1.8, 0.4);
  addBarrel(4.9, -0.7, 0.1);
  addBarrel(6.2, 1.9, 0.7);
  addBarrel(-6.7, -2.3, 0.2);

  const sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0x9d835d, roughness: 0.98 });
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 4, 8), sandbagMaterial);
      bag.rotation.z = Math.PI / 2;
      bag.rotation.y = (i % 2) * 0.3;
      bag.position.set(4.9 + i * 0.5, 0.28 + j * 0.38, 2.6);
      bag.castShadow = true;
      scene.add(bag);
    }
  }

  const signLollipop = new THREE.Group();
  signLollipop.position.set(-7.1, 0, -6.9);
  const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 6.6, 12), darkMetal);
  signPole.position.y = 3.3;
  signPole.castShadow = true;
  signLollipop.add(signPole);
  const signCandy = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.15, 0.2, 48),
    new THREE.MeshStandardMaterial({ color: 0xc64b32, roughness: 0.36, metalness: 0.08 })
  );
  signCandy.rotation.x = Math.PI / 2;
  signCandy.position.set(0, 6.1, 0);
  signCandy.castShadow = true;
  signLollipop.add(signCandy);
  const signSpiralPoints = [];
  for (let i = 0; i <= 180; i += 1) {
    const progress = i / 180;
    const angle = progress * Math.PI * 2 * 3;
    const radius = 0.06 + progress * 0.95;
    signSpiralPoints.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.12));
  }
  const signSpiral = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(signSpiralPoints), 180, 0.035, 6, false),
    new THREE.MeshStandardMaterial({ color: 0xf5e8d0, roughness: 0.4 })
  );
  signSpiral.position.set(0, 6.1, 0);
  signLollipop.add(signSpiral);
  scene.add(signLollipop);

  /* ------------------------------------------------------------------------
     GGBond figures
     ------------------------------------------------------------------------ */

  const earShape = new THREE.Shape();
  earShape.moveTo(-0.3, -0.18);
  earShape.quadraticCurveTo(-0.54, 0.42, 0.02, 0.68);
  earShape.quadraticCurveTo(0.52, 0.44, 0.33, -0.12);
  earShape.quadraticCurveTo(0.12, -0.34, -0.3, -0.18);
  earShape.closePath();

  const innerEarShape = new THREE.Shape();
  innerEarShape.moveTo(-0.16, -0.06);
  innerEarShape.quadraticCurveTo(-0.3, 0.33, 0.02, 0.47);
  innerEarShape.quadraticCurveTo(0.29, 0.31, 0.18, -0.04);
  innerEarShape.quadraticCurveTo(0.06, -0.2, -0.16, -0.06);
  innerEarShape.closePath();

  const shirtShape = new THREE.Shape();
  shirtShape.moveTo(-0.33, 0.45);
  shirtShape.lineTo(0.33, 0.45);
  shirtShape.lineTo(0.12, -0.12);
  shirtShape.lineTo(0, -0.26);
  shirtShape.lineTo(-0.12, -0.12);
  shirtShape.closePath();

  const capeShape = new THREE.Shape();
  capeShape.moveTo(-0.9, 1.2);
  capeShape.lineTo(0.9, 1.2);
  capeShape.quadraticCurveTo(1.3, 0.2, 1.38, -1);
  capeShape.quadraticCurveTo(0.7, -1.28, 0, -1.34);
  capeShape.quadraticCurveTo(-0.7, -1.28, -1.38, -1);
  capeShape.quadraticCurveTo(-1.3, 0.2, -0.9, 1.2);
  capeShape.closePath();

  const geometry = {
    sphere: new THREE.SphereGeometry(1, 32, 24),
    small: new THREE.SphereGeometry(1, 18, 14),
    ear: new THREE.ExtrudeGeometry(earShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelSize: 0.05,
      bevelThickness: 0.05,
      bevelSegments: 3,
      steps: 1
    }),
    innerEar: new THREE.ExtrudeGeometry(innerEarShape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 2,
      steps: 1
    }),
    body: new THREE.CapsuleGeometry(0.7, 0.5, 6, 24),
    shoulder: new THREE.SphereGeometry(1, 22, 16),
    shirt: new THREE.ExtrudeGeometry(shirtShape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      steps: 1
    }),
    bow: new THREE.ConeGeometry(0.12, 0.24, 4),
    brow: new THREE.CapsuleGeometry(0.025, 0.18, 4, 10),
    cape: new THREE.ShapeGeometry(capeShape, 36),
    lollipop: new THREE.CylinderGeometry(0.55, 0.55, 0.12, 48),
    lollipopRim: new THREE.TorusGeometry(0.55, 0.018, 6, 64),
    lollipopStick: new THREE.CylinderGeometry(0.035, 0.035, 1.12, 12)
  };

  const capePosition = geometry.cape.attributes.position;
  for (let i = 0; i < capePosition.count; i += 1) {
    const x = capePosition.getX(i);
    const y = capePosition.getY(i);
    capePosition.setZ(i, -0.18 * x * x - 0.1 * (1 - y) + 0.045 * Math.sin(x * 3.2 + y * 2.4));
  }
  geometry.cape.computeVertexNormals();

  const spiralPoints = [];
  for (let i = 0; i <= 220; i += 1) {
    const progress = i / 220;
    const angle = progress * Math.PI * 2 * 3.4;
    const radius = 0.05 + progress * 0.45;
    spiralPoints.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.075));
  }
  geometry.lollipopSpiral = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(spiralPoints),
    220,
    0.022,
    8,
    false
  );

  const createFigure = (palette, options = {}) => {
    const group = new THREE.Group();
    const materials = {
      skin: new THREE.MeshPhysicalMaterial({
        color: palette.skin,
        roughness: 0.58,
        clearcoat: 0.18,
        clearcoatRoughness: 0.6
      }),
      snout: new THREE.MeshPhysicalMaterial({
        color: palette.snout,
        roughness: 0.6,
        clearcoat: 0.12
      }),
      innerEar: new THREE.MeshStandardMaterial({ color: palette.innerEar, roughness: 0.7 }),
      suit: new THREE.MeshPhysicalMaterial({
        color: palette.suit,
        roughness: 0.48,
        metalness: 0.08,
        clearcoat: 0.26
      }),
      shirt: new THREE.MeshPhysicalMaterial({
        color: palette.shirt,
        roughness: 0.7,
        clearcoat: 0.05
      }),
      cape: new THREE.MeshPhysicalMaterial({
        color: palette.cape,
        roughness: 0.74,
        side: THREE.DoubleSide,
        sheen: 0.35,
        sheenColor: new THREE.Color(0xffb09a)
      }),
      candy: new THREE.MeshPhysicalMaterial({
        color: palette.candy,
        roughness: 0.26,
        clearcoat: 0.9,
        clearcoatRoughness: 0.12
      }),
      gold: new THREE.MeshPhysicalMaterial({
        color: palette.gold,
        roughness: 0.3,
        metalness: 0.7
      }),
      eye: new THREE.MeshPhysicalMaterial({
        color: 0x0b0a09,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.03
      }),
      eyeWhite: new THREE.MeshPhysicalMaterial({ color: 0xf4eddf, roughness: 0.45 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x151210, roughness: 0.7 })
    };

    const add = (geometryItem, material, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(geometryItem, material);
      mesh.position.set(position[0], position[1], position[2]);
      mesh.scale.set(scale[0], scale[1], scale[2]);
      mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    add(geometry.sphere, materials.skin, [0, 2.55, 0], [1.18, 1.06, 1]);
    add(geometry.ear, materials.skin, [-0.72, 3.32, -0.08], [1, 1, 1], [0, -0.12, -0.42]);
    add(geometry.ear, materials.skin, [0.72, 3.32, -0.08], [1, 1, 1], [0, 0.12, 0.42]);
    add(geometry.innerEar, materials.innerEar, [-0.72, 3.35, 0.09], [1, 1, 1], [0, -0.12, -0.42]);
    add(geometry.innerEar, materials.innerEar, [0.72, 3.35, 0.09], [1, 1, 1], [0, 0.12, 0.42]);
    add(geometry.sphere, materials.snout, [0, 2.3, 0.84], [0.56, 0.36, 0.34]);
    add(geometry.small, materials.dark, [-0.23, 2.29, 1.14], [0.075, 0.11, 0.055]);
    add(geometry.small, materials.dark, [0.23, 2.29, 1.14], [0.075, 0.11, 0.055]);

    for (const side of [-1, 1]) {
      add(geometry.sphere, materials.eyeWhite, [side * 0.4, 2.72, 0.92], [0.17, 0.19, 0.07]);
      add(geometry.small, materials.eye, [side * 0.4, 2.72, 0.98], [0.105, 0.13, 0.045]);
      add(geometry.small, materials.eyeWhite, [side * 0.43, 2.77, 1.025], [0.028, 0.034, 0.02]);
      add(geometry.brow, materials.dark, [side * 0.4, 2.96, 0.86], [1, 1, 1], [0, 0, side * 0.28]);
      add(geometry.small, materials.innerEar, [side * 0.68, 2.36, 0.79], [0.15, 0.08, 0.035]);
    }

    const smileCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.28, 1.9, 0.92),
      new THREE.Vector3(0, 1.82, 0.96),
      new THREE.Vector3(0.28, 1.9, 0.92)
    ]);
    add(new THREE.TubeGeometry(smileCurve, 24, 0.022, 6, false), materials.dark);

    add(new THREE.CylinderGeometry(0.36, 0.43, 0.42, 24), materials.skin, [0, 1.56, 0]);
    add(geometry.body, materials.suit, [0, 0.88, 0], [1.25, 0.85, 0.72]);
    add(geometry.shoulder, materials.suit, [-0.86, 1.34, 0], [0.42, 0.4, 0.38]);
    add(geometry.shoulder, materials.suit, [0.86, 1.34, 0], [0.42, 0.4, 0.38]);
    add(geometry.shirt, materials.shirt, [0, 1.3, 0.51]);
    add(geometry.bow, materials.candy, [0.13, 1.52, 0.59], [1, 1, 1], [0, 0, Math.PI / 2]);
    add(geometry.bow, materials.candy, [-0.13, 1.52, 0.59], [1, 1, 1], [0, 0, -Math.PI / 2]);
    add(geometry.small, materials.gold, [0, 1.52, 0.64], [0.055, 0.055, 0.04]);
    add(geometry.small, materials.gold, [0, 0.98, 0.54], [0.022, 0.022, 0.018]);
    add(geometry.small, materials.gold, [0, 0.78, 0.54], [0.022, 0.022, 0.018]);
    add(geometry.cape, materials.cape, [0, 1.18, -0.46]);

    let lollipop = null;
    if (options.lollipop !== false) {
      lollipop = new THREE.Group();
      lollipop.position.set(1.95, 2.3, 0.3);
      lollipop.rotation.z = -0.08;
      group.add(lollipop);

      const candy = new THREE.Mesh(geometry.lollipop, materials.candy);
      candy.rotation.x = Math.PI / 2;
      candy.castShadow = true;
      lollipop.add(candy);

      const rim = new THREE.Mesh(geometry.lollipopRim, materials.gold);
      rim.position.z = 0.065;
      lollipop.add(rim);

      const spiral = new THREE.Mesh(geometry.lollipopSpiral, materials.shirt);
      lollipop.add(spiral);

      const stick = new THREE.Mesh(geometry.lollipopStick, materials.gold);
      stick.position.y = -0.88;
      stick.castShadow = true;
      lollipop.add(stick);

      const band = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), materials.gold);
      band.position.y = -0.36;
      lollipop.add(band);
    }

    group.scale.setScalar(options.scale || 1);
    group.rotation.y = options.rotation || 0;
    group.position.set(options.x || 0, options.y || 0, options.z || 0);
    scene.add(group);
    return { group, materials, lollipop };
  };

  const mainFigure = createFigure(
    {
      skin: 0xe6b1a4,
      snout: 0xd38c80,
      innerEar: 0xc27b70,
      suit: 0x1b1d1f,
      shirt: 0xece4d6,
      cape: 0xb5452e,
      candy: 0xe2603f,
      gold: 0xd8b77c
    },
    { x: 1.4, y: 1.2, z: -1.8, scale: 0.95, rotation: 0.06 }
  );

  const sideFigureA = createFigure(
    {
      skin: 0xd2a093,
      snout: 0xbe7d72,
      innerEar: 0x9f675e,
      suit: 0x34312b,
      shirt: 0xcfc5b4,
      cape: 0x6d3e2f,
      candy: 0xb46c55,
      gold: 0xa58d66
    },
    { x: -3.9, y: 1.35, z: -3.1, scale: 0.58, rotation: 0.18, lollipop: false }
  );

  const sideFigureB = createFigure(
    {
      skin: 0xc79b90,
      snout: 0xb4776d,
      innerEar: 0x976159,
      suit: 0x2d3331,
      shirt: 0xc2b8a7,
      cape: 0x3f5a54,
      candy: 0xa66a55,
      gold: 0x95805d
    },
    { x: 5.4, y: 1.3, z: -3.7, scale: 0.55, rotation: -0.2, lollipop: false }
  );

  /* ------------------------------------------------------------------------
     Dust and ambience
     ------------------------------------------------------------------------ */

  const dustCount = 220;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 30;
    dustPositions[i * 3 + 1] = Math.random() * 9;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 22;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      color: 0xf2d6a7,
      size: 0.035,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      sizeAttenuation: true
    })
  );
  scene.add(dust);

  /* ------------------------------------------------------------------------
     Camera and animation
     ------------------------------------------------------------------------ */

  const presets = {
    lobby: {
      position: new THREE.Vector3(3.4, 2.8, 11.2),
      target: new THREE.Vector3(0.8, 2.2, -1.5),
      driftX: 0.9,
      driftY: 0.1,
      driftZ: 0.45,
      speed: 0.055
    },
    loading: {
      position: new THREE.Vector3(1.8, 2.45, 9.0),
      target: new THREE.Vector3(0.9, 2.3, -1.2),
      driftX: 0.5,
      driftY: 0.08,
      driftZ: 0.25,
      speed: 0.04
    },
    briefing: {
      position: new THREE.Vector3(6.2, 3.5, 10.2),
      target: new THREE.Vector3(-0.3, 1.8, -1.4),
      driftX: 0.7,
      driftY: 0.1,
      driftZ: 0.3,
      speed: 0.045
    }
  };

  const preset = presets[screen] || presets.lobby;
  const pointer = new THREE.Vector2();
  const smoothPointer = new THREE.Vector2();
  const basePosition = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  let distanceScale = 1;
  const clock = new THREE.Clock();
  let firstFrame = true;

  const measure = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    distanceScale = Math.max(1, 1.32 / camera.aspect);
  };

  const animate = () => {
    const elapsed = clock.getElapsedTime();
    const motion = reducedMotion ? 0 : 1;

    cameraTarget.copy(preset.target);
    basePosition
      .copy(preset.position)
      .sub(preset.target)
      .multiplyScalar(distanceScale)
      .add(preset.target);

    smoothPointer.lerp(pointer, 0.045);
    camera.position.set(
      basePosition.x + Math.sin(elapsed * preset.speed) * preset.driftX * motion + smoothPointer.x * 0.45,
      basePosition.y + Math.sin(elapsed * preset.speed * 0.7) * preset.driftY * motion - smoothPointer.y * 0.25,
      basePosition.z + Math.cos(elapsed * preset.speed * 0.8) * preset.driftZ * motion
    );
    camera.lookAt(cameraTarget);

    if (!reducedMotion) {
      mainFigure.group.position.y = 1.2 + Math.sin(elapsed * 0.7) * 0.012;
      sideFigureA.group.position.y = 1.35 + Math.sin(elapsed * 0.55 + 1) * 0.01;
      sideFigureB.group.position.y = 1.3 + Math.sin(elapsed * 0.6 + 2) * 0.01;
      if (mainFigure.lollipop) {
        mainFigure.lollipop.rotation.z = -0.08 + Math.sin(elapsed * 0.42) * 0.035;
      }
      dust.rotation.y = elapsed * 0.008;
    }

    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      window.requestAnimationFrame(() => boot?.classList.add("is-hidden"));
    }
  };

  window.addEventListener("resize", measure);
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  measure();
  renderer.shadowMap.needsUpdate = true;
  renderer.setAnimationLoop(animate);
};

try {
  initScene();
} catch (error) {
  document.body.classList.add("no-webgl");
  boot?.classList.add("is-hidden");
  console.error(error);
}
