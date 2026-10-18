'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Product } from '@/lib/types';

interface Cookie3DModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function Cookie3DModal({ product, isOpen, onClose }: Cookie3DModalProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isWireframe, setIsWireframe] = useState(false);
  const [isAutoSpin, setIsAutoSpin] = useState(true);


  const materialsRef = useRef<THREE.Material[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!isOpen || !product || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 380;
    const height = container.clientHeight || 380;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1, 3.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd48b38, 1.6);
    rimLight.position.set(-3, -2, -2);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xffe29a, 1.5, 8);
    fillLight.position.set(0, -1, 2);
    scene.add(fillLight);

    // Cookie Object Group
    const cookieGroup = new THREE.Group();
    scene.add(cookieGroup);

    materialsRef.current = [];

    // Helper material registrar
    const reg = <T extends THREE.Material>(m: T): T => {
      materialsRef.current.push(m);
      return m;
    };

    const slug = product.slug.toLowerCase();

    // Procedural 3D model according to cookie type
    if (slug.includes('nastar')) {
      // NASTAR WISMAN: Golden dome with clove pin
      const nastarMat = reg(
        new THREE.MeshStandardMaterial({
          color: 0xefa735,
          roughness: 0.28,
          metalness: 0.08,
        })
      );
      const domeGeom = new THREE.SphereGeometry(0.85, 32, 32);
      domeGeom.scale(1, 0.78, 1);
      const dome = new THREE.Mesh(domeGeom, nastarMat);
      cookieGroup.add(dome);

      // Clove on top
      const cloveMat = reg(new THREE.MeshStandardMaterial({ color: 0x331707, roughness: 0.8 }));
      const cloveGeom = new THREE.CylinderGeometry(0.06, 0.12, 0.35, 12);
      const clove = new THREE.Mesh(cloveGeom, cloveMat);
      clove.position.y = 0.68;
      cookieGroup.add(clove);

      const cloveHeadGeom = new THREE.SphereGeometry(0.14, 12, 12);
      const cloveHead = new THREE.Mesh(cloveHeadGeom, cloveMat);
      cloveHead.position.y = 0.84;
      cookieGroup.add(cloveHead);
    } else if (slug.includes('kastengel')) {
      // KASTENGEL EDAM: Crispy rectangular cheese bar
      const biscuitMat = reg(
        new THREE.MeshStandardMaterial({
          color: 0xdf9238,
          roughness: 0.55,
          metalness: 0.0,
        })
      );
      const barGeom = new THREE.BoxGeometry(1.6, 0.5, 0.8, 8, 8, 8);
      const bar = new THREE.Mesh(barGeom, biscuitMat);
      cookieGroup.add(bar);

      // Grated cheddar shreds on top
      const cheeseMat = reg(
        new THREE.MeshStandardMaterial({
          color: 0xffce54,
          roughness: 0.3,
          metalness: 0.1,
        })
      );
      for (let i = 0; i < 16; i++) {
        const shred = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.08), cheeseMat);
        shred.position.set((Math.random() - 0.5) * 1.3, 0.28, (Math.random() - 0.5) * 0.6);
        shred.rotation.y = Math.random() * Math.PI;
        shred.rotation.z = (Math.random() - 0.5) * 0.3;
        cookieGroup.add(shred);
      }
    } else if (slug.includes('putri-salju') || slug.includes('salju')) {
      // PUTRI SALJU: Crescent moon with powdery white dusting
      const saljuMat = reg(
        new THREE.MeshStandardMaterial({
          color: 0xfffcf7,
          roughness: 0.85,
          metalness: 0.0,
        })
      );
      const crescentGeom = new THREE.TorusGeometry(0.68, 0.34, 24, 48, Math.PI * 1.25);
      crescentGeom.rotateX(Math.PI / 2);
      const crescent = new THREE.Mesh(crescentGeom, saljuMat);
      cookieGroup.add(crescent);

      // White powder sugar sparkling particles
      const powderCount = 50;
      const powderGeom = new THREE.BufferGeometry();
      const powderPos = new Float32Array(powderCount * 3);
      for (let i = 0; i < powderCount * 3; i += 3) {
        powderPos[i] = (Math.random() - 0.5) * 1.6;
        powderPos[i + 1] = (Math.random() - 0.5) * 0.6;
        powderPos[i + 2] = (Math.random() - 0.5) * 1.6;
      }
      powderGeom.setAttribute('position', new THREE.BufferAttribute(powderPos, 3));
      const powderMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.9 });
      cookieGroup.add(new THREE.Points(powderGeom, powderMat));
    } else if (slug.includes('sagu-keju') || slug.includes('sagu')) {
      // SAGU KEJU: Star-piped floral swirl
      const saguMat = reg(
        new THREE.MeshStandardMaterial({
          color: 0xf5dfb3,
          roughness: 0.6,
        })
      );
      const coneGeom = new THREE.ConeGeometry(0.85, 0.65, 12, 1, false, 0, Math.PI * 2);
      const cone = new THREE.Mesh(coneGeom, saguMat);
      cone.rotation.x = Math.PI;
      cookieGroup.add(cone);

      const centerSphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), saguMat);
      centerSphere.position.y = 0.15;
      cookieGroup.add(centerSphere);
    } else if (slug.includes('cokelat')) {
      // COKELAT MEDE: Dark chocolate cookie disc with roasted cashew
      const chocoMat = reg(
        new THREE.MeshStandardMaterial({
          color: 0x4a2617,
          roughness: 0.45,
          metalness: 0.05,
        })
      );
      const discGeom = new THREE.CylinderGeometry(0.85, 0.9, 0.35, 32);
      const disc = new THREE.Mesh(discGeom, chocoMat);
      cookieGroup.add(disc);

      // Cashew nut on top
      const cashewMat = reg(new THREE.MeshStandardMaterial({ color: 0xd9b378, roughness: 0.35 }));
      const cashewGeom = new THREE.TorusGeometry(0.28, 0.12, 16, 24, Math.PI * 1.1);
      cashewGeom.rotateX(Math.PI / 2);
      const cashew = new THREE.Mesh(cashewGeom, cashewMat);
      cashew.position.y = 0.22;
      cookieGroup.add(cashew);
    } else {
      // LIDAH KUCING: Long curved crispy wafer
      const waferMat = reg(
        new THREE.MeshStandardMaterial({
          color: 0xebaf4f,
          roughness: 0.4,
        })
      );
      const waferGeom = new THREE.BoxGeometry(1.8, 0.14, 0.65, 6, 2, 6);
      const wafer = new THREE.Mesh(waferGeom, waferMat);
      wafer.rotation.z = 0.1;
      cookieGroup.add(wafer);
    }

    // Sparkles
    const sparkleGeom = new THREE.BufferGeometry();
    const sparklePos = new Float32Array(40 * 3);
    for (let i = 0; i < 40 * 3; i += 3) {
      sparklePos[i] = (Math.random() - 0.5) * 3;
      sparklePos[i + 1] = (Math.random() - 0.5) * 3;
      sparklePos[i + 2] = (Math.random() - 0.5) * 3;
    }
    sparkleGeom.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
    const sparkleMat = new THREE.PointsMaterial({ color: 0xf5cb6c, size: 0.06, transparent: true, opacity: 0.7 });
    scene.add(new THREE.Points(sparkleGeom, sparkleMat));

    // Drag to rotate
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotX = 0.3;
    let rotY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      rotY += deltaX * 0.015;
      rotX += deltaY * 0.015;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
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

      if (isAutoSpin && !isDragging) {
        rotY += 0.008;
      }

      cookieGroup.rotation.y += (rotY - cookieGroup.rotation.y) * 0.1;
      cookieGroup.rotation.x += (rotX - cookieGroup.rotation.x) * 0.1;
      cookieGroup.position.y = Math.sin(elapsed * 2) * 0.05;

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
  }, [isOpen, product, isAutoSpin]);

  // Wireframe toggle
  useEffect(() => {
    materialsRef.current.forEach((m) => {
      if ('wireframe' in m) {
        (m as THREE.MeshStandardMaterial).wireframe = isWireframe;
      }
    });
  }, [isWireframe]);

  // Zoom control
  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const newZ = Math.max(2.2, Math.min(5.5, cameraRef.current.position.z + delta));
    cameraRef.current.position.z = newZ;
  };

  if (!isOpen || !product) return null;


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-cocoa/50 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          className="relative w-full max-w-lg bg-white rounded-modal shadow-2xl overflow-hidden z-10 border border-honey/20"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-cocoa/10 flex items-center justify-between bg-cream/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-honey/15 text-honey font-bold text-[10px] uppercase tracking-wider">
                  Model 3D Interaktif
                </span>
                {product.texture_badge && (
                  <span className="text-xs text-cocoa/60 font-medium">✨ {product.texture_badge}</span>
                )}
              </div>
              <h2 className="font-playfair text-xl font-bold text-cocoa mt-0.5">{product.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-button text-cocoa/60 hover:text-cocoa hover:bg-cocoa/5"
            >
              ✕
            </button>
          </div>

          {/* 3D Viewport */}
          <div className="relative w-full h-[320px] bg-gradient-to-b from-cream/90 via-white to-cream/50 overflow-hidden select-none">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Instruction tooltip */}
            <div className="absolute top-3 left-3 bg-white/85 backdrop-blur-sm px-3 py-1 rounded-full border border-cocoa/10 text-[11px] text-cocoa/70 font-medium shadow-sm">
              🖐️ Sentuh & geser untuk putar kue 360°
            </div>

            {/* Floating 3D Controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-full border border-cocoa/15 shadow-md">
              <button
                type="button"
                onClick={() => handleZoom(-0.4)}
                className="w-7 h-7 rounded-full bg-cream hover:bg-honey/20 text-cocoa font-bold text-xs flex items-center justify-center"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleZoom(0.4)}
                className="w-7 h-7 rounded-full bg-cream hover:bg-honey/20 text-cocoa font-bold text-xs flex items-center justify-center"
                title="Zoom Out"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setIsWireframe(!isWireframe)}
                className={`px-2.5 h-7 rounded-full text-[11px] font-semibold transition-colors ${
                  isWireframe ? 'bg-honey text-cream' : 'bg-cream text-cocoa hover:bg-honey/20'
                }`}
                title="Toggle Wireframe"
              >
                Mesh
              </button>
              <button
                type="button"
                onClick={() => setIsAutoSpin(!isAutoSpin)}
                className="w-7 h-7 rounded-full bg-cream hover:bg-honey/20 text-cocoa text-xs flex items-center justify-center"
                title={isAutoSpin ? 'Jeda' : 'Putar'}
              >
                {isAutoSpin ? '⏸️' : '▶️'}
              </button>
            </div>
          </div>

          {/* Details & Description */}
          <div className="p-6 space-y-4 bg-white">
            <p className="text-sm text-cocoa/75 leading-relaxed">{product.description}</p>

            <div className="pt-2 flex items-center justify-between border-t border-cocoa/10">
              <div className="text-xs text-cocoa/60">
                Pilihan toples: <strong className="text-cocoa">250g, 350g, 500g</strong>
              </div>
              <button
                onClick={onClose}
                className="h-10 px-5 bg-honey hover:bg-honey/90 text-cream font-semibold rounded-button text-xs transition-colors shadow-sm"
              >
                Pilih Ukuran Toples
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
