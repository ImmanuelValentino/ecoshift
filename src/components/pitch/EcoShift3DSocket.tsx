import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function createAmartalokaLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw House Outline Icon (Dark Navy #0F172A)
    const cx = 512;
    const roofTopY = 58;
    const eaveY = 148;
    const baseY = 278;
    const halfW = 92;

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // House walls & pitched roof
    ctx.beginPath();
    ctx.moveTo(cx - halfW - 18, eaveY + 8);
    ctx.lineTo(cx, roofTopY);
    ctx.lineTo(cx + halfW + 18, eaveY + 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - halfW, eaveY);
    ctx.lineTo(cx - halfW, baseY);
    ctx.lineTo(cx + 12, baseY);
    ctx.moveTo(cx + halfW, eaveY);
    ctx.lineTo(cx + halfW, baseY - 40);
    ctx.stroke();

    // Small roof chimney on right slope
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(cx + 46, roofTopY + 18, 20, 40);

    // Central Plug Silhouette inside the house (left navy, right bright green)
    // Left prong (navy)
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(cx - 28, 138, 18, 34);
    // Right prong (green)
    ctx.fillStyle = '#65A30D';
    ctx.fillRect(cx + 10, 138, 18, 34);
    // Plug body (navy with rounded bottom)
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(cx - 42, 168, 84, 58, [6, 6, 22, 22]);
    ctx.fill();
    // Bottom cord stem
    ctx.fillRect(cx - 8, 224, 16, 26);

    // Bright Green Leaf at bottom-right corner of the house
    ctx.save();
    ctx.translate(cx + 76, 232);
    ctx.rotate(-0.42);
    const leafGrad = ctx.createLinearGradient(-56, 20, 62, -26);
    leafGrad.addColorStop(0, '#65A30D');
    leafGrad.addColorStop(1, '#22C55E');

    ctx.fillStyle = leafGrad;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-58, 12);
    ctx.quadraticCurveTo(-8, -46, 64, -10);
    ctx.quadraticCurveTo(10, 44, -58, 12);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Leaf center vein
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-48, 10);
    ctx.quadraticCurveTo(6, -4, 44, -8);
    ctx.stroke();
    ctx.restore();

    // Bold Italic "Amartaloka" Wordmark below icon
    ctx.fillStyle = '#0F172A';
    ctx.font = 'italic 800 124px "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Amartaloka', cx, 396);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

export function EcoShift3DSocket() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(1.9, 0.9, 5.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.15;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.maxPolarAngle = Math.PI * 0.8;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.65);
    keyLight.position.set(4.5, 6.5, 6.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.65);
    fillLight.position.set(-4.5, 2.0, 3.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(0, 3.0, -5.5);
    scene.add(rimLight);

    // Soft Ground Shadow Plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(8, 8);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.11 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.92;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Amartaloka Smart Plug Root Group
    const plugGroup = new THREE.Group();
    scene.add(plugGroup);

    // Materials
    const matteWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.32,
      metalness: 0.04,
    });
    const innerCavityMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.45,
      metalness: 0.03,
    });
    const guideRidgeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.36,
      metalness: 0.04,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.2,
      metalness: 0.85,
    });
    const ledPillMat = new THREE.MeshStandardMaterial({
      color: 0x00c838,
      emissive: 0x00b830,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.05,
    });

    // 1. Vertical Rounded Squircle Housing (Smoother capsule-like corners)
    const bodyWidth = 2.08;
    const bodyHeight = 2.86;
    const cornerRadius = 0.62;
    const socketCenterY = -0.58;
    const socketRadius = 0.66;

    // Back solid half (z: -0.55 to +0.27)
    const backShape = createRoundedRectShape(bodyWidth, bodyHeight, cornerRadius);
    const backBodyGeo = new THREE.ExtrudeGeometry(backShape, {
      depth: 0.64,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.08,
      bevelSegments: 10,
      curveSegments: 36,
    });
    backBodyGeo.translate(0, 0, -0.46);
    const backBody = new THREE.Mesh(backBodyGeo, matteWhiteMat);
    backBody.castShadow = true;
    backBody.receiveShadow = true;
    plugGroup.add(backBody);

    // Front recessed shell with circular Type-F hole (z: +0.12 to +0.54)
    const frontShape = createRoundedRectShape(bodyWidth, bodyHeight, cornerRadius);
    const socketHole = new THREE.Path();
    socketHole.absarc(0, socketCenterY, socketRadius, 0, Math.PI * 2, true);
    frontShape.holes.push(socketHole);

    const frontShellGeo = new THREE.ExtrudeGeometry(frontShape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.06,
      bevelSegments: 9,
      curveSegments: 36,
    });
    frontShellGeo.translate(0, 0, 0.19);
    const frontShell = new THREE.Mesh(frontShellGeo, matteWhiteMat);
    frontShell.castShadow = true;
    frontShell.receiveShadow = true;
    plugGroup.add(frontShell);

    // 2. Top Front: High-Res "Amartaloka" Logo Texture
    const logoTexture = createAmartalokaLogoTexture();
    const logoPlaneGeo = new THREE.PlaneGeometry(1.66, 0.83);
    const logoPlaneMat = new THREE.MeshStandardMaterial({
      map: logoTexture,
      transparent: true,
      roughness: 0.4,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const logoMesh = new THREE.Mesh(logoPlaneGeo, logoPlaneMat);
    logoMesh.position.set(0, 0.78, 0.546);
    plugGroup.add(logoMesh);

    // 3. Center Front: Vivid Deep Green Capsule (Pill) LED + Soft PointLight
    const ledGeo = new THREE.CapsuleGeometry(0.052, 0.3, 12, 24);
    const ledMesh = new THREE.Mesh(ledGeo, ledPillMat);
    ledMesh.rotation.z = Math.PI / 2;
    ledMesh.scale.set(1, 1, 0.55);
    ledMesh.position.set(0, 0.24, 0.542);
    plugGroup.add(ledMesh);

    const ledGlowLight = new THREE.PointLight(0x00c838, 0.32, 1.25);
    ledGlowLight.position.set(0, 0.24, 0.68);
    plugGroup.add(ledGlowLight);

    // 4. Bottom Front: Recessed Circular Type-F Socket Details
    // Note: backBody front surface is at z = +0.27; socket floor sits at z = +0.29
    const socketFloorFrontZ = 0.29;

    const cavityFloorGeo = new THREE.CylinderGeometry(
      socketRadius + 0.02,
      socketRadius + 0.02,
      0.02,
      48
    );
    const cavityFloor = new THREE.Mesh(cavityFloorGeo, innerCavityMat);
    cavityFloor.rotation.x = Math.PI / 2;
    cavityFloor.position.set(0, socketCenterY, socketFloorFrontZ - 0.01);
    cavityFloor.receiveShadow = true;
    plugGroup.add(cavityFloor);

    // Inner circular wall liner for realistic depth contrast
    const cavityWallGeo = new THREE.CylinderGeometry(
      socketRadius + 0.004,
      socketRadius + 0.004,
      0.24,
      48,
      1,
      true
    );
    const cavityWallMat = new THREE.MeshStandardMaterial({
      color: 0xdbe3ed,
      roughness: 0.5,
      metalness: 0.02,
      side: THREE.BackSide,
    });
    const cavityWall = new THREE.Mesh(cavityWallGeo, cavityWallMat);
    cavityWall.rotation.x = Math.PI / 2;
    cavityWall.position.set(0, socketCenterY, socketFloorFrontZ + 0.11);
    plugGroup.add(cavityWall);

    // Flush Recessed Left & Right Pin Holes (NO protruding gray/orange rings)
    const subtleEdgeGeo = new THREE.RingGeometry(0.082, 0.104, 32);
    const subtleEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.7,
      metalness: 0.02,
    });
    const pinHoleDiskGeo = new THREE.CircleGeometry(0.084, 32);
    const flushHoleMat = new THREE.MeshStandardMaterial({
      color: 0x111114,
      roughness: 0.95,
      metalness: 0.0,
    });

    [-0.27, 0.27].forEach((xPos) => {
      const edge = new THREE.Mesh(subtleEdgeGeo, subtleEdgeMat);
      edge.position.set(xPos, socketCenterY, socketFloorFrontZ + 0.002);
      plugGroup.add(edge);

      const hole = new THREE.Mesh(pinHoleDiskGeo, flushHoleMat);
      hole.position.set(xPos, socketCenterY, socketFloorFrontZ + 0.004);
      plugGroup.add(hole);
    });

    // Top Center: Recessed Vertical Slot + Dark Bronze Grounding Contact Plate
    const slotRecessGeo = new THREE.CapsuleGeometry(0.06, 0.12, 8, 20);
    const topSlotMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.92,
      metalness: 0.0,
    });
    const topSlot = new THREE.Mesh(slotRecessGeo, topSlotMat);
    topSlot.scale.set(1, 1, 0.25);
    topSlot.position.set(0, socketCenterY + 0.49, socketFloorFrontZ + 0.004);
    plugGroup.add(topSlot);

    const bronzePlateGeo = new THREE.BoxGeometry(0.056, 0.17, 0.09);
    const bronzePlateMat = new THREE.MeshStandardMaterial({
      color: 0x4b463f,
      metalness: 0.7,
      roughness: 0.35,
    });
    const topBronzePlate = new THREE.Mesh(bronzePlateGeo, bronzePlateMat);
    topBronzePlate.position.set(0, socketCenterY + 0.51, socketFloorFrontZ + 0.048);
    plugGroup.add(topBronzePlate);

    // Bottom Center: Single Dark Vertical Slot (NO protruding block)
    const bottomSlotMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.92,
      metalness: 0.0,
    });
    const bottomSlot = new THREE.Mesh(slotRecessGeo, bottomSlotMat);
    bottomSlot.scale.set(0.95, 1.05, 0.25);
    bottomSlot.position.set(0, socketCenterY - 0.49, socketFloorFrontZ + 0.004);
    plugGroup.add(bottomSlot);

    // Side Guide Ridges (White plastic stepped ridges on left & right walls)
    const guideBaseGeo = new THREE.BoxGeometry(0.14, 0.34, 0.22);
    const guideStepGeo = new THREE.BoxGeometry(0.07, 0.18, 0.2);
    [-1, 1].forEach((dir) => {
      const baseRidge = new THREE.Mesh(guideBaseGeo, guideRidgeMat);
      baseRidge.position.set(dir * 0.57, socketCenterY, socketFloorFrontZ + 0.1);
      baseRidge.castShadow = true;
      baseRidge.receiveShadow = true;
      plugGroup.add(baseRidge);

      const innerStep = new THREE.Mesh(guideStepGeo, guideRidgeMat);
      innerStep.position.set(dir * 0.51, socketCenterY, socketFloorFrontZ + 0.095);
      innerStep.castShadow = true;
      innerStep.receiveShadow = true;
      plugGroup.add(innerStep);
    });

    // 5. Rear Face: Insulating Collar & 2 Chrome Prongs
    const rearCollarGeo = new THREE.CylinderGeometry(0.58, 0.62, 0.14, 48);
    const rearCollar = new THREE.Mesh(rearCollarGeo, innerCavityMat);
    rearCollar.rotation.x = Math.PI / 2;
    rearCollar.position.set(0, -0.08, -0.58);
    rearCollar.castShadow = true;
    plugGroup.add(rearCollar);

    const prongShaftGeo = new THREE.CylinderGeometry(0.072, 0.072, 0.54, 24);
    const prongTipGeo = new THREE.SphereGeometry(0.072, 20, 16);

    [-0.27, 0.27].forEach((xPos) => {
      const shaft = new THREE.Mesh(prongShaftGeo, steelMat);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.set(xPos, -0.08, -0.88);
      shaft.castShadow = true;
      plugGroup.add(shaft);

      const tip = new THREE.Mesh(prongTipGeo, steelMat);
      tip.position.set(xPos, -0.08, -1.15);
      tip.castShadow = true;
      plugGroup.add(tip);
    });

    plugGroup.rotation.y = -0.28;
    plugGroup.rotation.x = 0.06;

    let animFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId = window.requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      plugGroup.position.y = Math.sin(t * 1.5) * 0.05;
      const pulse = 0.78 + Math.sin(t * 2.5) * 0.1;
      ledPillMat.emissiveIntensity = pulse;
      ledGlowLight.intensity = 0.26 + Math.sin(t * 2.5) * 0.08;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      window.cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      logoTexture.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[340px] sm:h-[410px] lg:h-[460px] cursor-grab active:cursor-grabbing touch-pan-y select-none"
      aria-label="Interactive 3D Amartaloka Smart Plug model"
    />
  );
}
