import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getDeviceCapabilities } from '../../utils/deviceCapability';

gsap.registerPlugin(ScrollTrigger);

// Global caching for 0ms Three.js asset instantiation
THREE.Cache.enabled = true;

export const Hero3DCanvas = ({ isReady = true }) => {
  const mountRef = useRef(null);
  const maxDimRef = useRef(null);

  const getResponsiveScale = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (w < 480) return 2.3;  // Compact on mobile phones
    if (w < 768) return 2.6;  // Tablets / Large phones
    if (w < 1024) return 2.9; // Small laptops
    return 3.2;               // Desktops
  };

  useEffect(() => {
    // Avoid running concurrent WebGL context during LoadingScreen
    if (!isReady) return;

    const container = mountRef.current;
    if (!container) return;

    const capabilities = getDeviceCapabilities();
    const isMobile = window.innerWidth < 768;
    const width = container.clientWidth || (window.innerWidth < 480 ? 210 : isMobile ? 260 : 460);
    const height = container.clientHeight || (window.innerWidth < 480 ? 190 : isMobile ? 240 : 400);

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(isMobile ? 45 : 42, width / height, 0.1, 100);
    camera.position.set(0, isMobile ? 0.2 : 0.4, isMobile ? 4.5 : 4.2);

    // 2. WebGL Renderer with High-Efficiency Settings
    // Adaptive quality: low-end constrained devices use antialias: false, standard/high-end keep antialias: true
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: capabilities.isConstrained ? false : true,
      powerPreference: 'high-performance',
    });

    renderer.setSize(width, height);
    // Safe DPR defaults: preserved exact quality for standard devices, capped at 1.0 only for verified constrained devices
    const targetDpr = capabilities.isConstrained
      ? 1.0
      : Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.5);
    renderer.setPixelRatio(targetDpr);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting System
    const ambientLight = new THREE.AmbientLight(0xfff6ea, 1.8);
    scene.add(ambientLight);

    const frontSpot = new THREE.DirectionalLight(0xfff1bf, 3.6);
    frontSpot.position.set(3, 4, 3.5);
    scene.add(frontSpot);

    const rimLight = new THREE.DirectionalLight(0xa5f3fc, 2.2);
    rimLight.position.set(-3.5, 2.5, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xd4af37, 1.2);
    fillLight.position.set(0, -3, 2);
    scene.add(fillLight);

    // Master Group for Mouse Tilt & Scroll Sync
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 4. Load Downloaded 3D GLB Model
    const modelWrapper = new THREE.Group();
    masterGroup.add(modelWrapper);

    const loader = new GLTFLoader();
    const modelPath = '/3d model/my_face__quiff_hairstyle.glb';

    loader.load(
      modelPath,
      (gltf) => {
        const loadedModel = gltf.scene;

        // Auto-center the model using its Bounding Box
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        loadedModel.position.set(-center.x, -center.y, -center.z);

        // Normalize scale to fit viewport responsively
        const maxDim = Math.max(size.x, size.y, size.z);
        maxDimRef.current = maxDim;
        const targetScale = getResponsiveScale() / (maxDim || 1);
        modelWrapper.scale.setScalar(targetScale);

        // Enhance materials
        loadedModel.traverse((node) => {
          if (node.isMesh && node.material) {
            node.material.envMapIntensity = 1.5;
          }
        });

        modelWrapper.add(loadedModel);
      },
      undefined,
      (err) => {
        console.warn('Could not load 3D model in hero canvas:', err);
      }
    );

    // 5. Ambient Champagne Gold Floating Particles
    const particleCount = window.innerWidth < 640 ? 30 : 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 1.1 + Math.random() * 2.0;
      const theta = Math.random() * Math.PI * 2;
      particlePos[i] = Math.cos(theta) * radius;
      particlePos[i + 1] = (Math.random() - 0.5) * 3.4;
      particlePos[i + 2] = Math.sin(theta) * radius;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xffdf88,
      size: window.innerWidth < 640 ? 0.04 : 0.05,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Smooth Mouse Hover Parallax Tilt (Disabled if user prefers reduced motion)
    const isReducedMotion = capabilities.prefersReducedMotion;
    const hoverTilt = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const onPointerMove = (e) => {
      if (isReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      hoverTilt.targetX = x * 0.35;
      hoverTilt.targetY = y * 0.25;
    };

    if (!isReducedMotion) {
      window.addEventListener('pointermove', onPointerMove);
    }

    // 7. GSAP ScrollTrigger Integration (Parallax during hero scroll)
    const scrollTrigger = ScrollTrigger.create({
      trigger: '#hero-section',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2,
      onUpdate: (self) => {
        if (isReducedMotion) return;
        const p = self.progress;
        masterGroup.position.y = -p * 1.5;
        masterGroup.position.z = -p * 1.8;
        masterGroup.scale.setScalar(1 - p * 0.35);
      },
    });

    // 8. Render Loop with Offscreen Pause for 0% CPU overhead while browsing
    let isVisible = true;
    let animationFrameId = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animationFrameId) {
          animate();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const animate = () => {
      if (!isVisible) {
        animationFrameId = null;
        return;
      }

      animationFrameId = requestAnimationFrame(animate);

      if (!isReducedMotion) {
        // Rotate model smoothly along Y-AXIS continuously as requested
        if (modelWrapper) {
          modelWrapper.rotation.y += 0.008;
        }

        // Swirling particles
        particles.rotation.y = performance.now() * 0.0003;

        // Gentle spring lerp for hover tilt
        hoverTilt.x += (hoverTilt.targetX - hoverTilt.x) * 0.05;
        hoverTilt.y += (hoverTilt.targetY - hoverTilt.y) * 0.05;

        masterGroup.rotation.y = hoverTilt.x * 0.6;
        masterGroup.rotation.x = -hoverTilt.y * 0.45;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      } else {
        isVisible = true;
        if (!animationFrameId) {
          animate();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 210;
      const newHeight = container.clientHeight || 190;
      const isMob = window.innerWidth < 768;
      camera.aspect = newWidth / newHeight;
      camera.fov = isMob ? 45 : 42;
      camera.position.z = isMob ? 4.5 : 4.2;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(targetDpr);

      if (modelWrapper && maxDimRef.current) {
        modelWrapper.scale.setScalar(getResponsiveScale() / maxDimRef.current);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
      scrollTrigger.kill();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isReady]);

  return (
    <div
      ref={mountRef}
      className="canvas-3d-container hero-3d-responsive-canvas"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 'clamp(200px, 45vw, 460px)',
        height: 'clamp(185px, 40vw, 400px)',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Ambient luxury halo backing behind 3D quiff avatar */}
      <div
        style={{
          position: 'absolute',
          width: '78%',
          height: '78%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(11, 12, 16, 0) 72%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </div>
  );
};
