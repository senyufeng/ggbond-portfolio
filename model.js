import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls.js";
import { RoomEnvironment } from "three/addons/RoomEnvironment.js";
import { STLExporter } from "three/addons/STLExporter.js";

const canvas = document.querySelector("#ggb-canvas");
const stage = document.querySelector("#viewerFrame");
const loading = document.querySelector("#viewerLoading");
const fallback = document.querySelector("#viewerFallback");
const themeButtons = Array.from(document.querySelectorAll("[data-theme]"));
const rotateButtons = Array.from(document.querySelectorAll('[data-action="rotate"]'));
const resetButtons = Array.from(document.querySelectorAll('[data-action="reset"]'));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const showFallback = (message) => {
  if (loading) loading.classList.add("is-hidden");
  if (fallback) {
    fallback.hidden = false;
    if (message) {
      const copy = fallback.querySelector("span");
      if (copy) copy.textContent = message;
    }
  }
  if (stage) stage.classList.add("has-fallback");
};

if (canvas && stage) {
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    showFallback("浏览器没有启用 WebGL，3D 模型无法渲染。你可以回首页查看 2D 肖像。");
    throw error;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const clock = new THREE.Clock();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = 1.72;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.65;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.55;

  controls.addEventListener("start", () => {
    if (!controls.autoRotate) return;
    controls.autoRotate = false;
    updateRotateButtons();
  });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  /* ------------------------------------------------------------------------
     Lights
     ------------------------------------------------------------------------ */

  scene.add(new THREE.HemisphereLight(0xffe5d3, 0x16110e, 1.1));

  const keyLight = new THREE.DirectionalLight(0xffd9c0, 3.6);
  keyLight.position.set(4.5, 7, 5.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -4.5;
  keyLight.shadow.camera.right = 4.5;
  keyLight.shadow.camera.top = 5.5;
  keyLight.shadow.camera.bottom = -2.5;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 22;
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xe2603f, 2.1);
  rimLight.position.set(-5, 3.2, -4);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0xb3a5c4, 0.9);
  fillLight.position.set(-3, 2.4, 5);
  scene.add(fillLight);

  /* ------------------------------------------------------------------------
     Materials
     ------------------------------------------------------------------------ */

  const physical = (options) => new THREE.MeshPhysicalMaterial(options);

  const materials = {
    skin: physical({
      color: 0xe9a99b,
      roughness: 0.52,
      metalness: 0,
      clearcoat: 0.25,
      clearcoatRoughness: 0.55,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xffd8cf),
      envMapIntensity: 1.05
    }),
    snout: physical({
      color: 0xd98c80,
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.2,
      clearcoatRoughness: 0.6,
      envMapIntensity: 1
    }),
    innerEar: physical({
      color: 0xc9857b,
      roughness: 0.62,
      metalness: 0,
      envMapIntensity: 0.9
    }),
    suit: physical({
      color: 0x171310,
      roughness: 0.42,
      metalness: 0.07,
      clearcoat: 0.35,
      clearcoatRoughness: 0.48,
      envMapIntensity: 1.15
    }),
    shirt: physical({
      color: 0xf4ede1,
      roughness: 0.64,
      metalness: 0,
      clearcoat: 0.1,
      envMapIntensity: 0.8
    }),
    cape: physical({
      color: 0xb6402a,
      roughness: 0.72,
      metalness: 0,
      side: THREE.DoubleSide,
      sheen: 0.5,
      sheenColor: new THREE.Color(0xffb09a),
      envMapIntensity: 0.9
    }),
    candy: physical({
      color: 0xe2603f,
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.3
    }),
    gold: physical({
      color: 0xe8c57d,
      roughness: 0.24,
      metalness: 0.82,
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.4
    }),
    eye: physical({
      color: 0x0d0b0a,
      roughness: 0.12,
      metalness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.2
    }),
    eyeWhite: physical({
      color: 0xf7f0e4,
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.15,
      envMapIntensity: 0.8
    }),
    dark: new THREE.MeshStandardMaterial({
      color: 0x14110f,
      roughness: 0.72
    }),
    plinth: physical({
      color: 0x1b1714,
      roughness: 0.34,
      metalness: 0.38,
      clearcoat: 0.45,
      clearcoatRoughness: 0.3,
      envMapIntensity: 1.2
    })
  };

  const baseMaterial = {
    skin: { roughness: 0.52, metalness: 0, clearcoat: 0.25 },
    snout: { roughness: 0.55, metalness: 0, clearcoat: 0.2 },
    suit: { roughness: 0.42, metalness: 0.07, clearcoat: 0.35 },
    shirt: { roughness: 0.64, metalness: 0, clearcoat: 0.1 },
    cape: { roughness: 0.72, metalness: 0, clearcoat: 0 },
    candy: { roughness: 0.2, metalness: 0.05, clearcoat: 1 },
    gold: { roughness: 0.24, metalness: 0.82, clearcoat: 0.55 }
  };

  /* ------------------------------------------------------------------------
     Geometry helpers
     ------------------------------------------------------------------------ */

  const bust = new THREE.Group();
  bust.position.y = 0.02;
  scene.add(bust);

  const add = (geometry, material, options = {}) => {
    const mesh = new THREE.Mesh(geometry, material);
    const {
      parent = bust,
      position = [0, 0, 0],
      scale = [1, 1, 1],
      rotation = [0, 0, 0],
      cast = true,
      receive = false
    } = options;

    mesh.position.set(position[0], position[1], position[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    parent.add(mesh);
    return mesh;
  };

  const sphere = new THREE.SphereGeometry(1, 48, 36);
  const smallSphere = new THREE.SphereGeometry(1, 24, 18);

  /* ------------------------------------------------------------------------
     Head
     ------------------------------------------------------------------------ */

  add(sphere, materials.skin, {
    position: [0, 2.55, 0],
    scale: [1.18, 1.06, 1]
  });

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

  const earGeometry = new THREE.ExtrudeGeometry(earShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 4,
    steps: 1
  });
  const innerEarGeometry = new THREE.ExtrudeGeometry(innerEarShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 3,
    steps: 1
  });

  for (const side of [-1, 1]) {
    add(earGeometry, materials.skin, {
      position: [side * 0.72, 3.32, -0.08],
      rotation: [0, side * 0.12, side * 0.42]
    });
    add(innerEarGeometry, materials.innerEar, {
      position: [side * 0.72, 3.35, 0.09],
      rotation: [0, side * 0.12, side * 0.42],
      cast: false
    });
  }

  add(sphere, materials.snout, {
    position: [0, 2.3, 0.84],
    scale: [0.56, 0.36, 0.34]
  });

  for (const side of [-1, 1]) {
    add(smallSphere, materials.dark, {
      position: [side * 0.23, 2.29, 1.14],
      scale: [0.075, 0.11, 0.055],
      cast: false
    });
  }

  for (const side of [-1, 1]) {
    add(sphere, materials.eyeWhite, {
      position: [side * 0.4, 2.72, 0.92],
      scale: [0.17, 0.19, 0.07],
      cast: false
    });
    add(smallSphere, materials.eye, {
      position: [side * 0.4, 2.72, 0.98],
      scale: [0.105, 0.13, 0.045],
      cast: false
    });
    add(smallSphere, materials.eyeWhite, {
      position: [side * 0.43, 2.77, 1.025],
      scale: [0.028, 0.034, 0.02],
      cast: false
    });
  }

  const browGeometry = new THREE.CapsuleGeometry(0.025, 0.18, 4, 12);
  add(browGeometry, materials.dark, {
    position: [-0.4, 2.96, 0.86],
    rotation: [0, 0, -0.28],
    cast: false
  });
  add(browGeometry, materials.dark, {
    position: [0.4, 2.96, 0.86],
    rotation: [0, 0, 0.28],
    cast: false
  });

  const smileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.28, 1.9, 0.92),
    new THREE.Vector3(0, 1.82, 0.96),
    new THREE.Vector3(0.28, 1.9, 0.92)
  ]);
  add(new THREE.TubeGeometry(smileCurve, 28, 0.022, 8, false), materials.dark, {
    cast: false
  });

  for (const side of [-1, 1]) {
    add(smallSphere, materials.innerEar, {
      position: [side * 0.68, 2.36, 0.79],
      scale: [0.15, 0.08, 0.035],
      cast: false
    });
  }

  /* ------------------------------------------------------------------------
     Body
     ------------------------------------------------------------------------ */

  add(new THREE.CylinderGeometry(0.36, 0.43, 0.42, 32), materials.skin, {
    position: [0, 1.56, 0]
  });

  add(new THREE.CapsuleGeometry(0.7, 0.5, 8, 32), materials.suit, {
    position: [0, 0.88, 0],
    scale: [1.25, 0.85, 0.72]
  });

  for (const side of [-1, 1]) {
    add(sphere, materials.suit, {
      position: [side * 0.86, 1.34, 0],
      scale: [0.42, 0.4, 0.38]
    });
  }

  const shirtShape = new THREE.Shape();
  shirtShape.moveTo(-0.33, 0.45);
  shirtShape.lineTo(0.33, 0.45);
  shirtShape.lineTo(0.12, -0.12);
  shirtShape.lineTo(0, -0.26);
  shirtShape.lineTo(-0.12, -0.12);
  shirtShape.closePath();

  const shirtGeometry = new THREE.ExtrudeGeometry(shirtShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    bevelSegments: 2,
    steps: 1
  });

  add(shirtGeometry, materials.shirt, {
    position: [0, 1.3, 0.51],
    cast: false
  });

  const bowGeometry = new THREE.ConeGeometry(0.12, 0.24, 4);
  add(bowGeometry, materials.candy, {
    position: [0.13, 1.52, 0.59],
    rotation: [0, 0, Math.PI / 2],
    cast: false
  });
  add(bowGeometry, materials.candy, {
    position: [-0.13, 1.52, 0.59],
    rotation: [0, 0, -Math.PI / 2],
    cast: false
  });
  add(smallSphere, materials.gold, {
    position: [0, 1.52, 0.64],
    scale: [0.055, 0.055, 0.04],
    cast: false
  });

  for (const y of [0.98, 0.78]) {
    add(smallSphere, materials.gold, {
      position: [0, y, 0.54],
      scale: [0.022, 0.022, 0.018],
      cast: false
    });
  }

  // A tiny lollipop pin on the lapel, like the 2D portrait.
  const pin = new THREE.Group();
  pin.position.set(-0.55, 1.17, 0.56);
  pin.rotation.z = -0.22;
  bust.add(pin);
  add(new THREE.CylinderGeometry(0.085, 0.085, 0.025, 24), materials.candy, {
    parent: pin,
    rotation: [Math.PI / 2, 0, 0],
    cast: false
  });
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), materials.gold, {
    parent: pin,
    position: [0, -0.12, 0],
    rotation: [0, 0, 0],
    cast: false
  });
  add(smallSphere, materials.shirt, {
    parent: pin,
    position: [0, 0, 0.02],
    scale: [0.032, 0.032, 0.012],
    cast: false
  });

  /* ------------------------------------------------------------------------
     Cape
     ------------------------------------------------------------------------ */

  const capeShape = new THREE.Shape();
  capeShape.moveTo(-0.9, 1.2);
  capeShape.lineTo(0.9, 1.2);
  capeShape.quadraticCurveTo(1.3, 0.2, 1.38, -1);
  capeShape.quadraticCurveTo(0.7, -1.28, 0, -1.34);
  capeShape.quadraticCurveTo(-0.7, -1.28, -1.38, -1);
  capeShape.quadraticCurveTo(-1.3, 0.2, -0.9, 1.2);
  capeShape.closePath();

  const capeGeometry = new THREE.ShapeGeometry(capeShape, 48);
  const capePosition = capeGeometry.attributes.position;
  for (let i = 0; i < capePosition.count; i += 1) {
    const x = capePosition.getX(i);
    const y = capePosition.getY(i);
    capePosition.setZ(i, -0.18 * x * x - 0.1 * (1 - y) + 0.045 * Math.sin(x * 3.2 + y * 2.4));
  }
  capeGeometry.computeVertexNormals();

  const capeMesh = add(capeGeometry, materials.cape, {
    position: [0, 1.18, -0.46]
  });
  capeMesh.userData.printable = false;

  /* ------------------------------------------------------------------------
     Plinth and floor shadow
     ------------------------------------------------------------------------ */

  const plinthGroup = new THREE.Group();
  plinthGroup.position.y = 0;
  scene.add(plinthGroup);

  add(new THREE.CylinderGeometry(1.75, 1.92, 0.18, 64), materials.plinth, {
    parent: plinthGroup,
    position: [0, -0.09, 0],
    receive: true
  });
  add(new THREE.TorusGeometry(1.58, 0.018, 8, 128), materials.gold, {
    parent: plinthGroup,
    position: [0, 0.015, 0],
    rotation: [Math.PI / 2, 0, 0],
    cast: false
  });

  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const shadowContext = shadowCanvas.getContext("2d");
  const shadowGradient = shadowContext.createRadialGradient(128, 128, 12, 128, 128, 120);
  shadowGradient.addColorStop(0, "rgba(0, 0, 0, 0.56)");
  shadowGradient.addColorStop(0.58, "rgba(0, 0, 0, 0.22)");
  shadowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  shadowContext.fillStyle = shadowGradient;
  shadowContext.fillRect(0, 0, 256, 256);

  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  shadowTexture.colorSpace = THREE.SRGBColorSpace;

  const contactShadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.9, 64),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.012;
  plinthGroup.add(contactShadow);

  /* ------------------------------------------------------------------------
     Lollipop prop
     ------------------------------------------------------------------------ */

  const lollipop = new THREE.Group();
  lollipop.position.set(1.95, 2.3, 0.3);
  lollipop.rotation.z = -0.08;
  bust.add(lollipop);

  add(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 64), materials.candy, {
    parent: lollipop,
    rotation: [Math.PI / 2, 0, 0]
  });
  add(new THREE.TorusGeometry(0.55, 0.018, 8, 96), materials.gold, {
    parent: lollipop,
    position: [0, 0, 0.065],
    cast: false
  });

  const spiralPoints = [];
  const turns = 3.4;
  const steps = 220;
  for (let i = 0; i <= steps; i += 1) {
    const progress = i / steps;
    const angle = progress * Math.PI * 2 * turns;
    const radius = 0.05 + progress * 0.45;
    spiralPoints.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.075));
  }
  const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
  add(new THREE.TubeGeometry(spiralCurve, 220, 0.022, 8, false), materials.shirt, {
    parent: lollipop,
    cast: false
  });

  add(new THREE.CylinderGeometry(0.035, 0.035, 1.12, 16), materials.gold, {
    parent: lollipop,
    position: [0, -0.88, 0]
  });

  add(new THREE.SphereGeometry(0.09, 24, 18), materials.gold, {
    parent: lollipop,
    position: [0, -0.36, 0],
    cast: false
  });

  /* ------------------------------------------------------------------------
     Background: rings and dust
     ------------------------------------------------------------------------ */

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xe8c57d,
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });
  const ringMaterialFaint = ringMaterial.clone();
  ringMaterialFaint.opacity = 0.1;

  const backRing = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.012, 6, 180), ringMaterial);
  backRing.position.set(0, 1.85, -1.5);
  scene.add(backRing);

  const backRingTwo = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.009, 6, 180), ringMaterialFaint);
  backRingTwo.position.set(0, 1.85, -2);
  scene.add(backRingTwo);

  const particleCount = 90;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 8;
    particlePositions[i * 3 + 1] = Math.random() * 5;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 5;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0xe8c57d,
      size: 0.026,
      transparent: true,
      opacity: 0.66,
      depthWrite: false,
      sizeAttenuation: true
    })
  );
  scene.add(particles);

  /* ------------------------------------------------------------------------
     Theme
     ------------------------------------------------------------------------ */

  const themes = {
    night: {
      colors: {
        skin: 0xe9a99b,
        snout: 0xd98c80,
        suit: 0x171310,
        shirt: 0xf4ede1,
        cape: 0xb6402a,
        candy: 0xe2603f,
        gold: 0xe8c57d
      },
      transmission: 0,
      glass: false
    },
    hero: {
      colors: {
        skin: 0xf0b2a3,
        snout: 0xdb8b7e,
        suit: 0xb6402a,
        shirt: 0xf8f0e5,
        cape: 0x7d2418,
        candy: 0xe8c57d,
        gold: 0xf0d49a
      },
      transmission: 0,
      glass: false
    },
    glass: {
      colors: {
        skin: 0xf3e8dc,
        snout: 0xe6d3c1,
        suit: 0xd8c9b8,
        shirt: 0xfffaf2,
        cape: 0xe8a18e,
        candy: 0xeba28e,
        gold: 0xf4e4bd
      },
      transmission: {
        skin: 0.5,
        snout: 0.46,
        suit: 0.16,
        shirt: 0,
        cape: 0.26,
        candy: 0.4,
        gold: 0
      },
      glass: true
    },
    print: {
      colors: {
        skin: 0xe8d8c6,
        snout: 0xdccab7,
        suit: 0x382f28,
        shirt: 0xf7edde,
        cape: 0xc98e7c,
        candy: 0xd7a38d,
        gold: 0xcfb889
      },
      transmission: 0,
      glass: false,
      print: true
    }
  };

  const applyTheme = (name) => {
    const theme = themes[name] || themes.print;
    const isGlass = theme.glass;
    const isPrint = theme.print;

    for (const [key, color] of Object.entries(theme.colors)) {
      const material = materials[key];
      if (!material) continue;
      const base = baseMaterial[key] || { roughness: 0.5, metalness: 0, clearcoat: 0 };
      material.color.setHex(color);
      material.roughness = isGlass ? 0.14 : isPrint ? (key === "gold" ? 0.48 : 0.66) : base.roughness;
      material.metalness = isPrint
        ? key === "gold"
          ? 0.18
          : 0
        : key === "gold"
          ? isGlass
            ? 0.55
            : 0.82
          : base.metalness;
      material.clearcoat = isPrint ? 0 : isGlass ? 0.9 : base.clearcoat;
      material.clearcoatRoughness = isPrint ? 0.72 : isGlass ? 0.1 : 0.3;
      material.transmission = isGlass ? theme.transmission[key] || 0 : 0;
      material.thickness = isGlass ? 0.75 : 0;
      material.ior = 1.36;
      material.transparent = isGlass && (theme.transmission[key] || 0) > 0;
      material.opacity = 1;
      material.envMapIntensity = isGlass ? 1.5 : isPrint ? 0.85 : 1.05;
      if (isGlass) {
        material.attenuationColor = new THREE.Color(0xf1cdb9);
        material.attenuationDistance = 1.5;
      }
      material.needsUpdate = true;
    }

    materials.skin.sheen = isGlass ? 0.9 : isPrint ? 0.1 : 0.35;
    materials.cape.sheen = isGlass ? 0.8 : isPrint ? 0.15 : 0.5;

    themeButtons.forEach((button) => {
      const active = button.dataset.theme === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  applyTheme("print");

  /* ------------------------------------------------------------------------
     Camera, resize and interaction
     ------------------------------------------------------------------------ */

  const target = new THREE.Vector3(0, 1.75, 0);
  let fitDistance = 9.2;

  const measure = () => {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);

    fitDistance = 9.2 * Math.max(1, 0.9 / camera.aspect);
    controls.minDistance = fitDistance * 0.55;
    controls.maxDistance = fitDistance * 1.55;

    const distance = camera.position.distanceTo(controls.target);
    if (distance < fitDistance) {
      const direction = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).addScaledVector(direction, fitDistance);
    }
  };

  const updateRotateButtons = () => {
    rotateButtons.forEach((button) => {
      button.textContent = controls.autoRotate ? "暂停旋转" : "自动旋转";
      button.setAttribute("aria-pressed", String(controls.autoRotate));
    });
  };

  const resetView = () => {
    measure();
    controls.target.copy(target);
    camera.position.set(1, 2.8, fitDistance);
    camera.lookAt(target);
    controls.autoRotate = !reducedMotion;
    controls.update();
    updateRotateButtons();
  };

  rotateButtons.forEach((button) => {
    button.addEventListener("click", () => {
      controls.autoRotate = !controls.autoRotate;
      updateRotateButtons();
    });
  });

  resetButtons.forEach((button) => {
    button.addEventListener("click", resetView);
  });

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.theme));
  });

  const downloadButtons = Array.from(document.querySelectorAll('[data-download="stl"]'));

  const downloadSTL = () => {
    const clone = bust.clone(true);
    clone.position.set(0, 0, 0);
    clone.scale.setScalar(28);

    // The cape is a zero-thickness display surface; keep the print file solid.
    const removable = [];
    clone.traverse((child) => {
      if (child.isMesh && child.userData.printable === false) removable.push(child);
    });
    removable.forEach((child) => child.parent?.remove(child));

    const result = new STLExporter().parse(clone, { binary: true });
    const blob = new Blob([result], { type: "model/stl" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ggbond-3d-print.stl";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  downloadButtons.forEach((button) => {
    button.addEventListener("click", downloadSTL);
  });

  const resizeObserver = new ResizeObserver(() => measure());
  resizeObserver.observe(stage);

  resetView();
  renderer.shadowMap.needsUpdate = true;

  /* ------------------------------------------------------------------------
     Animation
     ------------------------------------------------------------------------ */

  let firstFrame = true;

  const animate = () => {
    const elapsed = clock.getElapsedTime();

    if (!reducedMotion) {
      bust.position.y = 0.02 + Math.sin(elapsed * 0.8) * 0.012;
      lollipop.rotation.z = -0.08 + Math.sin(elapsed * 0.6) * 0.04;
      lollipop.rotation.y = Math.sin(elapsed * 0.35) * 0.08;
      particles.rotation.y = elapsed * 0.018;
      backRing.rotation.z = elapsed * 0.02;
      backRingTwo.rotation.z = -elapsed * 0.015;
    }

    controls.update();
    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      window.requestAnimationFrame(() => {
        loading?.classList.add("is-hidden");
        if (fallback) fallback.hidden = true;
      });
    }
  };

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    showFallback("WebGL 上下文丢失了。刷新页面通常可以恢复 3D 视图。");
  });

  renderer.setAnimationLoop(animate);

  // Keep the page usable if a browser cannot load the module at all.
  window.setTimeout(() => {
    if (loading && !loading.classList.contains("is-hidden") && fallback && fallback.hidden) {
      showFallback("3D 模块加载超时。请刷新页面，或换一个支持 WebGL 的浏览器。");
    }
  }, 12000);
}
