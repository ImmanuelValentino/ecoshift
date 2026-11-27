import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function EcoShift3DSocket() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(2.4, 1.35, 5.1);

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
    renderer.toneMappingExposure = 1.06;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.35;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.78;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.75);
    keyLight.position.set(4.5, 6.5, 5.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.7);
    fillLight.position.set(-4.5, 2.5, 3.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.85);
    rimLight.position.set(0, 3.5, -5.5);
    scene.add(rimLight);

    // Subtle Shadow Plane beneath the floating smart socket
    const shadowPlaneGeo = new THREE.PlaneGeometry(8, 8);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.11 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.72;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // EcoShift Smart Socket Root Group
    const plugGroup = new THREE.Group();
    scene.add(plugGroup);

    // Materials
    const matteWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.34,
      metalness: 0.04,
    });
    const innerCavityMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.45,
      metalness: 0.05,
    });
    const darkHoleMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.1,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.88,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.22,
      metalness: 0.86,
    });
    const ledEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.1,
    });
    const buttonMat = new THREE.MeshStandardMaterial({
      color: 0x1d1d1f,
      roughness: 0.4,
      metalness: 0.15,
    });

    // 1. Main Matte White Rounded Body
    const mainBodyGeo = new RoundedBoxGeometry(2.1, 2.35, 1.08, 6, 0.26);
    const mainBody = new THREE.Mesh(mainBodyGeo, matteWhiteMat);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    plugGroup.add(mainBody);

    // 2. Front Type-F Round Socket Bezel & Recess
    const bezelRingGeo = new THREE.TorusGeometry(0.74, 0.055, 24, 64);
    const bezelRing = new THREE.Mesh(bezelRingGeo, matteWhiteMat);
    bezelRing.position.set(0, 0.04, 0.54);
    bezelRing.castShadow = true;
    plugGroup.add(bezelRing);

    // Glowing Emerald LED Ring around Socket Frame
    const ledRingGeo = new THREE.TorusGeometry(0.81, 0.022, 20, 72);
    const ledRing = new THREE.Mesh(ledRingGeo, ledEmeraldMat);
    ledRing.position.set(0, 0.04, 0.545);
    plugGroup.add(ledRing);

    // Recessed Socket Well Faceplate
    const wellPlateGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.08, 48);
    const wellPlate = new THREE.Mesh(wellPlateGeo, innerCavityMat);
    wellPlate.rotation.x = Math.PI / 2;
    wellPlate.position.set(0, 0.04, 0.515);
    wellPlate.receiveShadow = true;
    plugGroup.add(wellPlate);

    // Two Front Brass Contact Holes (Left & Right)
    const contactHoleGeo = new THREE.CylinderGeometry(0.088, 0.088, 0.09, 28);
    const brassCollarGeo = new THREE.TorusGeometry(0.092, 0.016, 14, 28);

    [-0.28, 0.28].forEach((xPos) => {
      const hole = new THREE.Mesh(contactHoleGeo, darkHoleMat);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(xPos, 0.04, 0.525);
      plugGroup.add(hole);

      const collar = new THREE.Mesh(brassCollarGeo, brassMat);
      collar.position.set(xPos, 0.04, 0.562);
      plugGroup.add(collar);
    });

    // Type-F Top & Bottom Grounding Clips
    const groundClipGeo = new THREE.BoxGeometry(0.07, 0.16, 0.13);
    [0.64, -0.56].forEach((yPos) => {
      const clip = new THREE.Mesh(groundClipGeo, steelMat);
      clip.position.set(0, yPos, 0.54);
      clip.castShadow = true;
      plugGroup.add(clip);
    });

    // Top & Bottom Alignment Notches
    const notchGeo = new THREE.BoxGeometry(0.14, 0.06, 0.06);
    [0.72, -0.64].forEach((yPos) => {
      const notch = new THREE.Mesh(notchGeo, innerCavityMat);
      notch.position.set(0, yPos, 0.54);
      plugGroup.add(notch);
    });

    // 3. Physical Side Power Button (Right Side)
    const buttonBaseGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.1, 32);
    const buttonMesh = new THREE.Mesh(buttonBaseGeo, buttonMat);
    buttonMesh.rotation.z = Math.PI / 2;
    buttonMesh.position.set(1.06, 0.15, 0.0);
    buttonMesh.castShadow = true;
    plugGroup.add(buttonMesh);

    const buttonLedGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.115, 20);
    const buttonLed = new THREE.Mesh(buttonLedGeo, ledEmeraldMat);
    buttonLed.rotation.z = Math.PI / 2;
    buttonLed.position.set(1.065, 0.15, 0.0);
    plugGroup.add(buttonLed);

    // 4. Rear Plug Base & Two Metal Prongs (360-degree realism)
    const rearCollarGeo = new THREE.CylinderGeometry(0.62, 0.66, 0.16, 48);
    const rearCollar = new THREE.Mesh(rearCollarGeo, innerCavityMat);
    rearCollar.rotation.x = Math.PI / 2;
    rearCollar.position.set(0, 0.0, -0.58);
    rearCollar.castShadow = true;
    plugGroup.add(rearCollar);

    const prongShaftGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.54, 24);
    const prongTipGeo = new THREE.SphereGeometry(0.075, 20, 16);

    [-0.28, 0.28].forEach((xPos) => {
      const shaft = new THREE.Mesh(prongShaftGeo, steelMat);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.set(xPos, 0.0, -0.88);
      shaft.castShadow = true;
      plugGroup.add(shaft);

      const tip = new THREE.Mesh(prongTipGeo, steelMat);
      tip.position.set(xPos, 0.0, -1.15);
      tip.castShadow = true;
      plugGroup.add(tip);
    });

    // Subtle initial tilt for studio product presentation
    plugGroup.rotation.y = -0.35;
    plugGroup.rotation.x = 0.08;

    let animFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId = window.requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Subtle floating levitation & gentle LED pulse
      plugGroup.position.y = Math.sin(t * 1.6) * 0.06;
      ledEmeraldMat.emissiveIntensity = 0.78 + Math.sin(t * 2.6) * 0.22;

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
      className="w-full h-[320px] sm:h-[400px] lg:h-[460px] cursor-grab active:cursor-grabbing touch-pan-y select-none"
      aria-label="Interactive 3D EcoShift Smart Socket model"
    />
  );
}
