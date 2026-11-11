/* Orbit Garden — original Three.js starter. Scene graph is meant to be remixed. */
(function () {
  const canvas = document.getElementById("game");
  const hud = document.getElementById("hud");
  const W = 960, H = 540;
  const SPEED = 0.12;
  const ISLAND_R = 8;
  const keys = Object.create(null);
  let scene, camera, renderer, player, orbs, state, clock;

  function addIsland() {
    const group = new THREE.Group();
    const dirt = new THREE.Mesh(
      new THREE.CylinderGeometry(ISLAND_R, ISLAND_R + 1.1, 1.4, 20),
      new THREE.MeshStandardMaterial({ color: 0x1d4a3a, roughness: 0.85 })
    );
    dirt.position.y = -0.7;
    dirt.receiveShadow = true;
    group.add(dirt);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.6 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c4a1e, roughness: 0.9 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + (i % 3) * 0.2;
      const r = 2.5 + (i % 5) * 0.9;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 6), trunkMat);
      trunk.position.set(Math.cos(a) * r, 0.4, Math.sin(a) * r);
      trunk.castShadow = true;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 7), leafMat);
      leaf.position.set(trunk.position.x, 1.15, trunk.position.z);
      leaf.castShadow = true;
      group.add(trunk, leaf);
    }
    for (let i = 0; i < 8; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + (i % 3) * 0.1, 0), rockMat);
      const a = i * 0.9;
      rock.position.set(Math.cos(a) * (3 + i * 0.4), 0.1, Math.sin(a) * (3 + i * 0.4));
      rock.rotation.set(i, i * 0.3, 0);
      rock.castShadow = true;
      group.add(rock);
    }
    scene.add(group);
  }

  function makePlayer() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 1.05, 6),
      new THREE.MeshStandardMaterial({ color: 0x7c5cff, emissive: 0x2a1466, emissiveIntensity: 0.4, roughness: 0.4 })
    );
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    const cabin = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e4a55, roughness: 0.3 })
    );
    cabin.position.y = 0.15;
    const glow = new THREE.PointLight(0x7c5cff, 1.2, 6);
    glow.position.y = 0.3;
    g.add(body, cabin, glow);
    g.position.set(0, 0.45, 4);
    scene.add(g);
    return g;
  }

  function placeOrbs() {
    orbs = [];
    const mat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.9, roughness: 0.3 });
    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), mat);
      const a = (i / 10) * Math.PI * 2;
      const r = 2.2 + (i % 3) * 1.6;
      mesh.position.set(Math.cos(a) * r, 0.55, Math.sin(a) * r);
      mesh.userData.baseY = mesh.position.y;
      mesh.userData.phase = i;
      const light = new THREE.PointLight(0xfbbf24, 0.7, 4);
      mesh.add(light);
      scene.add(mesh);
      orbs.push(mesh);
    }
  }

  function resetRun() {
    player.position.set(0, 0.45, 4);
    player.rotation.y = 0;
    orbs.forEach(function (o) { o.visible = true; });
    state.collected = 0;
    state.over = false;
  }

  function init() {
    if (typeof THREE === "undefined") throw new Error("Three.js failed to load (vendor/three.min.js).");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    scene.fog = new THREE.Fog(0x0b1020, 18, 50);
    camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 80);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    const hemi = new THREE.HemisphereLight(0xb8c4ff, 0x1d4a3a, 0.85);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe6c2, 1.1);
    sun.position.set(8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const stars = new THREE.Points(
      (function () {
        const g = new THREE.BufferGeometry();
        const n = 400, arr = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          arr[i * 3] = (Math.random() - 0.5) * 80;
          arr[i * 3 + 1] = Math.random() * 30 + 4;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
        g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
        return g;
      })(),
      new THREE.PointsMaterial({ color: 0xeef2ff, size: 0.08 })
    );
    scene.add(stars);
    addIsland();
    player = makePlayer();
    placeOrbs();
    state = { collected: 0, total: orbs.length, over: false, t: 0 };
    clock = new THREE.Clock();
  }

  function step(dt) {
    let ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    let iz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
    const mag = Math.hypot(ix, iz);
    if (mag > 0 && !state.over) {
      ix /= mag; iz /= mag;
      player.position.x += ix * SPEED * 60 * dt;
      player.position.z += iz * SPEED * 60 * dt;
      player.rotation.y = Math.atan2(ix, iz);
    }
    const dist = Math.hypot(player.position.x, player.position.z);
    if (dist > ISLAND_R - 0.4) {
      const a = Math.atan2(player.position.z, player.position.x);
      player.position.x = Math.cos(a) * (ISLAND_R - 0.4);
      player.position.z = Math.sin(a) * (ISLAND_R - 0.4);
    }
    orbs.forEach(function (o) {
      if (!o.visible) return;
      o.position.y = o.userData.baseY + Math.sin(state.t * 2 + o.userData.phase) * 0.12;
      if (o.position.distanceTo(player.position) < 0.85) {
        o.visible = false;
        state.collected++;
        if (window.AudioFX) AudioFX.coin();
        if (state.collected >= state.total) {
          state.over = true;
          if (window.AudioFX) AudioFX.win();
        }
      }
    });
    const behind = new THREE.Vector3(0, 4.2, 8);
    behind.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
    const target = player.position.clone().add(behind);
    camera.position.lerp(target, 0.08);
    camera.lookAt(player.position.x, player.position.y + 0.6, player.position.z);
  }

  function loop() {
    const dt = Math.min(0.05, clock.getDelta());
    state.t += dt;
    step(dt);
    renderer.render(scene, camera);
    hud.textContent = state.over
      ? "Garden complete  ·  Enter to gather again"
      : "Orbs " + state.collected + " / " + state.total;
    if (window.tickKit) tickKit();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].indexOf(e.code) >= 0) e.preventDefault();
    if (e.code === "Enter" && state && state.over) resetRun();
  });
  window.addEventListener("keyup", function (e) { keys[e.code] = false; });

  bootKit("orbit-garden", function () {
    init();
    loop();
  });
})();
