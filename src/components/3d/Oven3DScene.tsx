'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Oven3DScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffecd2, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e4, 2.0);
    dirLight.position.set(3, 4, 3);
    scene.add(dirLight);

    // Oven Interior Amber Glow Light
    const ovenHeatLight = new THREE.PointLight(0xff7a18, 3.5, 6);
    ovenHeatLight.position.set(0, 0.1, 0.2);
    scene.add(ovenHeatLight);

    const ovenGroup = new THREE.Group();
    ovenGroup.rotation.y = -0.3;
    ovenGroup.rotation.x = 0.1;
    scene.add(ovenGroup);

    // 1. Oven Body Outer Shell
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3a2318, // Roasted Cocoa / Dark Oven
      roughness: 0.35,
      metalness: 0.2,
    });
    const bodyGeom = new THREE.BoxGeometry(2.0, 1.4, 1.6);
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    ovenGroup.add(bodyMesh);

    // Chrome Trim Bezel
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xd48b38, // Golden Honey Trim
      metalness: 0.85,
      roughness: 0.2,
    });
    const bezelGeom = new THREE.BoxGeometry(1.7, 1.1, 0.08);
    const bezelMesh = new THREE.Mesh(bezelGeom, chromeMat);
    bezelMesh.position.set(0, 0, 0.82);
    ovenGroup.add(bezelMesh);

    // Oven Window Glass (Glowing with amber interior)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      transmission: 0.7,
      ior: 1.4,
      emissive: 0xff6600,
      emissiveIntensity: 0.45,
    });
    const glassGeom = new THREE.BoxGeometry(1.4, 0.8, 0.05);
    const glassMesh = new THREE.Mesh(glassGeom, glassMat);
    glassMesh.position.set(0, 0, 0.85);
    ovenGroup.add(glassMesh);

    // Oven Handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
    const handleGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 16);
    handleGeom.rotateZ(Math.PI / 2);
    const handleMesh = new THREE.Mesh(handleGeom, handleMat);
    handleMesh.position.set(0, 0.52, 0.94);
    ovenGroup.add(handleMesh);

    // Knobs on Top Panel
    for (let i = -1; i <= 1; i++) {
      const knobGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
      knobGeom.rotateX(Math.PI / 2);
      const knobMesh = new THREE.Mesh(knobGeom, handleMat);
      knobMesh.position.set(i * 0.4, 0.54, 0.82);
      ovenGroup.add(knobMesh);
    }

    // Baking Tray with Glowing Cookies visible inside
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
    const trayGeom = new THREE.BoxGeometry(1.3, 0.04, 1.1);
    const trayMesh = new THREE.Mesh(trayGeom, trayMat);
    trayMesh.position.set(0, -0.15, 0.2);
    ovenGroup.add(trayMesh);

    // Mini Cookies on tray
    const cookieMat = new THREE.MeshStandardMaterial({
      color: 0xefa735,
      roughness: 0.3,
      emissive: 0x884400,
      emissiveIntensity: 0.2,
    });
    for (let row = -1; row <= 1; row++) {
      for (let col = -2; col <= 2; col++) {
        const miniCookie = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), cookieMat);
        miniCookie.scale.set(1, 0.6, 1);
        miniCookie.position.set(col * 0.22, -0.1, row * 0.25 + 0.2);
        ovenGroup.add(miniCookie);
      }
    }

    // 2. Rising Warm Steam Particles
    const steamCount = 35;
    const steamGeom = new THREE.BufferGeometry();
    const steamPositions = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount * 3; i += 3) {
      steamPositions[i] = (Math.random() - 0.5) * 1.2;
      steamPositions[i + 1] = 0.8 + Math.random() * 1.2;
      steamPositions[i + 2] = (Math.random() - 0.5) * 0.8;
    }
    steamGeom.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
    const steamMat = new THREE.PointsMaterial({
      color: 0xffe2b8,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const steamParticles = new THREE.Points(steamGeom, steamMat);
    ovenGroup.add(steamParticles);

    // Drag to inspect oven
    let isDragging = false;
    let prevMouseX = 0;
    let rotY = -0.3;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      rotY += deltaX * 0.015;
      prevMouseX = e.clientX;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let animationFrameId: number;
    const clock = new THREE.Clock();


    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Pulsing heat light
      ovenHeatLight.intensity = 2.8 + Math.sin(elapsed * 4) * 0.9;
      glassMat.emissiveIntensity = 0.35 + Math.sin(elapsed * 4) * 0.15;

      // Steam rising
      const pos = steamGeom.attributes.position.array as Float32Array;
      for (let i = 1; i < steamCount * 3; i += 3) {
        pos[i] += 0.008;
        if (pos[i] > 2.0) {
          pos[i] = 0.8;
        }
      }
      steamGeom.attributes.position.needsUpdate = true;

      // Gentle oven breathing wobble
      ovenGroup.rotation.y += (rotY - ovenGroup.rotation.y) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[220px] rounded-2xl overflow-hidden bg-gradient-to-b from-cocoa/90 via-cocoa/95 to-cocoa flex items-center justify-center border border-honey/30 shadow-inner select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-honey/20 border border-honey/30 text-[10px] font-bold text-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
        <span>OVEN 3D AKTIF: 175°C</span>
      </div>
      <div className="absolute bottom-2 inset-x-0 text-center text-[10px] text-cream/60">
        👆 Geser oven untuk melihat panggangan dari sudut lain
      </div>
    </div>
  );
}
