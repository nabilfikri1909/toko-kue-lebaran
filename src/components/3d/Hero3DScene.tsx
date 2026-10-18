'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Hero3DScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLidOpen, setIsLidOpen] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);

  const lidRef = useRef<THREE.Group | null>(null);

  const cookiesGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffecd2, 2.2);
    dirLight.position.set(4, 6, 4);
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0xd48b38, 2.0, 10);
    fillLight.position.set(-3, -1, 2);
    scene.add(fillLight);

    const interiorLight = new THREE.PointLight(0xffe6a3, 1.8, 6);
    interiorLight.position.set(0, 0.2, 0);
    scene.add(interiorLight);

    // Jar Root Group
    const jarGroup = new THREE.Group();
    scene.add(jarGroup);

    // 1. Glass Jar Body (Artisanal cylindrical glass jar)
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.42,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.85,
      ior: 1.52,
      reflectivity: 0.7,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    const jarGeometry = new THREE.CylinderGeometry(1.25, 1.25, 2.2, 36, 1, true);
    const jarMesh = new THREE.Mesh(jarGeometry, glassMaterial);
    jarGroup.add(jarMesh);

    // Jar Bottom
    const bottomGeometry = new THREE.CylinderGeometry(1.25, 1.25, 0.08, 36);
    const bottomMesh = new THREE.Mesh(bottomGeometry, glassMaterial);
    bottomMesh.position.y = -1.1;
    jarGroup.add(bottomMesh);

    // Jar Neck Rim
    const rimGeometry = new THREE.TorusGeometry(1.25, 0.07, 16, 48);
    rimGeometry.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeometry, glassMaterial);
    rimMesh.position.y = 1.1;
    jarGroup.add(rimMesh);

    // 2. Wooden / Gold Lid Group
    const lidGroup = new THREE.Group();
    lidGroup.position.y = 1.18;
    jarGroup.add(lidGroup);
    lidRef.current = lidGroup;

    const lidWoodMat = new THREE.MeshStandardMaterial({
      color: 0xc88332,
      roughness: 0.35,
      metalness: 0.3,
    });
    const lidBaseGeom = new THREE.CylinderGeometry(1.32, 1.3, 0.22, 36);
    const lidBaseMesh = new THREE.Mesh(lidBaseGeom, lidWoodMat);
    lidGroup.add(lidBaseMesh);

    // Gold knob on top of lid
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf5c35b,
      metalness: 0.85,
      roughness: 0.2,
    });
    const knobGeom = new THREE.SphereGeometry(0.25, 24, 24);
    const knobMesh = new THREE.Mesh(knobGeom, goldMat);
    knobMesh.position.y = 0.22;
    lidGroup.add(knobMesh);

    // Festive Ribbon around lid
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x1e593e, // Palm Green
      roughness: 0.4,
    });
    const ribbonGeom = new THREE.CylinderGeometry(1.33, 1.33, 0.06, 36);
    ribbonGeom.translate(0, 0, 0);
    const ribbonMesh = new THREE.Mesh(ribbonGeom, ribbonMat);
    lidGroup.add(ribbonMesh);

    // 3. 3D Cookies inside the jar
    const cookiesGroup = new THREE.Group();
    jarGroup.add(cookiesGroup);
    cookiesGroupRef.current = cookiesGroup;

    // Nastar Material (Glossy golden yellow egg glaze)
    const nastarMat = new THREE.MeshStandardMaterial({
      color: 0xefa735,
      roughness: 0.25,
      metalness: 0.05,
    });
    // Kastengel Material (Golden crust with cheese shreds)
    const kastengelMat = new THREE.MeshStandardMaterial({
      color: 0xdf9437,
      roughness: 0.5,
      metalness: 0.0,
    });
    // Putri Salju Material (Powdery snow white)
    const saljuMat = new THREE.MeshStandardMaterial({
      color: 0xfffaf2,
      roughness: 0.8,
      metalness: 0.0,
    });
    // Clove stem material (dark spice)
    const cloveMat = new THREE.MeshStandardMaterial({
      color: 0x3d1d0c,
      roughness: 0.7,
    });

    // Populate cookies inside jar in pleasant stack
    const cookiePositions: { type: 'nastar' | 'kastengel' | 'salju'; pos: [number, number, number]; rot: [number, number, number] }[] = [
      // Base layer
      { type: 'nastar', pos: [-0.45, -0.85, -0.3], rot: [0.1, 0.4, 0] },
      { type: 'kastengel', pos: [0.45, -0.85, -0.2], rot: [0, 0.8, 0.2] },
      { type: 'salju', pos: [0.0, -0.85, 0.45], rot: [0.2, -0.5, 0] },
      { type: 'nastar', pos: [-0.45, -0.85, 0.3], rot: [0.1, 1.2, 0] },
      { type: 'kastengel', pos: [0.45, -0.85, 0.35], rot: [0.3, -0.4, 0] },

      // Middle layer
      { type: 'nastar', pos: [-0.2, -0.35, 0.1], rot: [0.3, 0.2, 0.1] },
      { type: 'kastengel', pos: [0.3, -0.35, -0.1], rot: [0.2, -0.7, 0.1] },
      { type: 'salju', pos: [-0.2, -0.35, -0.35], rot: [-0.2, 0.9, 0.2] },
      { type: 'nastar', pos: [0.35, -0.35, 0.3], rot: [0.1, -1.1, 0] },

      // Top layer
      { type: 'nastar', pos: [0.0, 0.18, 0.0], rot: [0.05, 0.3, 0] },
      { type: 'kastengel', pos: [-0.35, 0.12, -0.15], rot: [0.3, 1.1, -0.2] },
      { type: 'salju', pos: [0.3, 0.15, 0.1], rot: [-0.2, -0.4, 0.3] },
    ];

    cookiePositions.forEach(({ type, pos, rot }) => {
      const singleCookieGroup = new THREE.Group();
      singleCookieGroup.position.set(...pos);
      singleCookieGroup.rotation.set(...rot);

      if (type === 'nastar') {
        const domeGeom = new THREE.SphereGeometry(0.24, 20, 20);
        domeGeom.scale(1, 0.82, 1);
        const dome = new THREE.Mesh(domeGeom, nastarMat);
        singleCookieGroup.add(dome);

        // Clove pin on top
        const cloveGeom = new THREE.CylinderGeometry(0.018, 0.035, 0.1, 8);
        const clove = new THREE.Mesh(cloveGeom, cloveMat);
        clove.position.y = 0.2;
        singleCookieGroup.add(clove);
      } else if (type === 'kastengel') {
        const barGeom = new THREE.BoxGeometry(0.48, 0.16, 0.24);
        const bar = new THREE.Mesh(barGeom, kastengelMat);
        singleCookieGroup.add(bar);

        // Cheese shred speckles on top
        const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xffd269, roughness: 0.3 });
        for (let i = 0; i < 4; i++) {
          const shred = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.03), cheeseMat);
          shred.position.set((Math.random() - 0.5) * 0.35, 0.09, (Math.random() - 0.5) * 0.15);
          shred.rotation.y = Math.random() * Math.PI;
          singleCookieGroup.add(shred);
        }
      } else {
        // Putri Salju crescent
        const crescentGeom = new THREE.TorusGeometry(0.18, 0.09, 14, 28, Math.PI * 1.15);
        crescentGeom.rotateX(Math.PI / 2);
        const crescent = new THREE.Mesh(crescentGeom, saljuMat);
        singleCookieGroup.add(crescent);
      }

      cookiesGroup.add(singleCookieGroup);
    });

    // 4. Floating Golden Sparkle Dust Particles around jar
    const particleCount = 70;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 4.5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 4.0;
      particlePositions[i + 2] = (Math.random() - 0.5) * 4.5;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xf5cb6c,
      size: 0.07,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // 5. Interaction: Mouse dragging & Parallax
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationX = 0.1;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        targetRotationX = Math.max(-0.4, Math.min(0.6, targetRotationX));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Auto rotation when enabled and not dragging
      if (isAutoRotate && !isDragging) {
        targetRotationY += 0.006;
      }

      // Parallax easing
      jarGroup.rotation.y += (targetRotationY + mouseX * 0.05 - jarGroup.rotation.y) * 0.08;
      jarGroup.rotation.x += (targetRotationX + mouseY * 0.08 - jarGroup.rotation.x) * 0.08;


      // Gentle floating bob
      jarGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.06;

      // Rotate sparkles
      particles.rotation.y = elapsedTime * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      cancelAnimationFrame(animationFrameId);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isAutoRotate]);

  // Handle Open/Close Lid Spring Effect
  useEffect(() => {
    if (!lidRef.current || !cookiesGroupRef.current) return;
    const targetY = isLidOpen ? 2.1 : 1.18;
    const targetRotZ = isLidOpen ? -0.2 : 0;
    const cookiesTargetY = isLidOpen ? 0.25 : 0;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.1;
      if (lidRef.current) {
        lidRef.current.position.y += (targetY - lidRef.current.position.y) * 0.25;
        lidRef.current.rotation.z += (targetRotZ - lidRef.current.rotation.z) * 0.25;
      }
      if (cookiesGroupRef.current) {
        cookiesGroupRef.current.position.y += (cookiesTargetY - cookiesGroupRef.current.position.y) * 0.25;
      }
      if (progress >= 1) clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, [isLidOpen]);

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] rounded-3xl overflow-hidden bg-gradient-to-b from-cream/80 via-white to-cream/40 border border-honey/20 shadow-xl flex items-center justify-center select-none group">
      {/* 3D Canvas Mounting Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Interactive Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-honey/30 shadow-sm flex items-center gap-1.5 text-xs font-semibold text-cocoa">
          <span className="w-2 h-2 rounded-full bg-palm animate-pulse" />
          <span>Toples 3D Interaktif</span>
        </div>
      </div>

      <div className="absolute bottom-4 inset-x-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cocoa/10 shadow-sm text-[11px] text-cocoa/80 font-medium pointer-events-auto">
          👆 Geser toples untuk putar 360°
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsLidOpen(!isLidOpen)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm ${
              isLidOpen
                ? 'bg-honey text-cream border-honey'
                : 'bg-white/90 hover:bg-white text-cocoa border-cocoa/15'
            }`}
          >
            {isLidOpen ? 'Tutup Toples' : 'Buka Tutup Toples ✨'}
          </button>
          <button
            type="button"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-cocoa/15 text-cocoa flex items-center justify-center text-xs shadow-sm"
            title={isAutoRotate ? 'Jeda Putaran' : 'Mulai Putar Otomatis'}
          >
            {isAutoRotate ? '⏸️' : '▶️'}
          </button>
        </div>
      </div>
    </div>
  );
}
