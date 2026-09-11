import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Enable global Three.js caching so Hero3DCanvas retrieves the model instantly from memory
THREE.Cache.enabled = true;

export const LoadingScreen = ({ onComplete }) => {
  const mountRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Artisan Suite...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = 240;
    const height = 240;

    // 1. Dedicated Scene & Camera for Preloader
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 4.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // 2. Luxury Golden Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 2.0);
    scene.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(0xffdf88, 3.8);
    goldKeyLight.position.set(3, 4, 3);
    scene.add(goldKeyLight);

    const rimLight = new THREE.DirectionalLight(0xa5f3fc, 2.5);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    // 3. Model Wrapper & Rotation Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // 4. Subtle Champagne Gold Halo Ring
    const ringGeo = new THREE.RingGeometry(1.5, 1.52, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.2;
    ringMesh.position.y = -0.7;
    scene.add(ringMesh);

    // 5. Load the 3D Model
    const loader = new GLTFLoader();
    const modelPath = '/3d model/my_face__quiff_hairstyle.glb';
    let loadedModelScene = null;

    loader.load(
      modelPath,
      (gltf) => {
        loadedModelScene = gltf.scene;

        // Auto-center bounding box
        const box = new THREE.Box3().setFromObject(loadedModelScene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        loadedModelScene.position.set(-center.x, -center.y, -center.z);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.4 / (maxDim || 1);
        modelGroup.scale.setScalar(scale);

        loadedModelScene.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.envMapIntensity = 1.6;
          }
        });

        modelGroup.add(loadedModelScene);
        setStatusText('3D Quiff Model Ready');
      },
      undefined,
      (err) => {
        console.warn('Preloader model load warning:', err);
      }
    );

    // 6. Animation Loop: Rotate on Y-AXIS continuously as requested
    let animationFrameId = null;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Y-axis continuous rotation
      modelGroup.rotation.y += 0.022;

      // Subtle pulse on the halo ring
      ringMesh.rotation.z += 0.005;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Asset preloading manager with progress tracking
  useEffect(() => {
    let currentProgress = 0;
    const updateProgress = (target, text) => {
      setStatusText(text);
      currentProgress = Math.max(currentProgress, target);
      setProgress(currentProgress);
    };

    const assetsToPreload = [
      { type: 'image', url: '/logo/logo.jpg', weight: 15, name: 'Salon Seal' },
      { type: 'image', url: '/hair-cut/imgi_214_1000_F_327372387_nDiUJ8UxnzYVwUsT3fHmUImZOL7jDZ9r.jpg', weight: 15, name: 'Signature Haircuts' },
      { type: 'image', url: '/backgrounds/imgi_394_1000_F_675403262_HTWy014WRCcGlggsScfGJP0fYNZHbOYr.jpg', weight: 15, name: 'Salon Wallpapers' },
    ];

    let completedWeight = 0;
    const totalWeight = assetsToPreload.reduce((sum, a) => sum + a.weight, 40); // 40 reserved for 3D model

    updateProgress(20, 'Preparing Gentleman Grooming Suite...');

    let isCompleted = false;
    const triggerFadeOut = () => {
      if (isCompleted) return;
      isCompleted = true;
      setProgress(100);
      setStatusText('Artisan Suite Ready');

      setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
      }, 200);
    };

    let pendingAssets = assetsToPreload.length;
    assetsToPreload.forEach((item) => {
      const img = new Image();
      img.src = item.url;
      const done = () => {
        completedWeight += item.weight;
        const p = Math.min(95, Math.round((completedWeight / totalWeight) * 100));
        updateProgress(p, `Caching ${item.name}...`);
        pendingAssets -= 1;
        if (pendingAssets <= 0) {
          triggerFadeOut();
        }
      };
      img.onload = done;
      img.onerror = done;
    });

    // Safety fallback timeout in case of network stall (max 2s, never blocks fast devices)
    const safetyTimer = setTimeout(() => {
      triggerFadeOut();
    }, 2000);

    return () => clearTimeout(safetyTimer);
  }, [onComplete]);

  return (
    <div
      className="loading-screen-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#07090e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isFadingOut ? 0 : 1,
        visibility: isFadingOut ? 'hidden' : 'visible',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.6s ease',
        overflow: 'hidden',
        touchAction: 'none',
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
    >
      {/* Luxury Golden Ambient Backing */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, rgba(7, 9, 14, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Luxury Branding */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '0.85rem',
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--gold-primary, #d4af37)',
            display: 'block',
            marginBottom: '0.4rem',
          }}
        >
          ✦ Artisan Gentleman Barbershop ✦
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-serif, "Cinzel", serif)',
            fontSize: 'clamp(1.4rem, 4vw, 2.1rem)',
            color: '#ffffff',
            margin: 0,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textShadow: '0 2px 16px rgba(0, 0, 0, 0.8)',
          }}
        >
          THE CLASSIC CUT SALON
        </h2>
      </div>

      {/* Center 3D Model Viewport (Rotating along Y-Axis) */}
      <div
        ref={mountRef}
        style={{
          width: '240px',
          height: '240px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      />

      {/* Luxury Gold Loading Progress Bar */}
      <div
        style={{
          width: 'clamp(240px, 60vw, 340px)',
          marginTop: '0.5rem',
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
            fontSize: '0.78rem',
          }}
        >
          <span style={{ color: '#94a3b8', letterSpacing: '0.05em', fontWeight: 500 }}>
            {statusText}
          </span>
          <span
            style={{
              color: 'var(--gold-primary, #d4af37)',
              fontWeight: 800,
              fontFamily: 'monospace',
              fontSize: '0.88rem',
            }}
          >
            {progress}%
          </span>
        </div>

        {/* Progress Track */}
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            boxShadow: '0 0 12px rgba(212, 175, 55, 0.15)',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #b8860b 0%, #ffd700 50%, #ffffff 100%)',
              borderRadius: '10px',
              transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
            }}
          />
        </div>
      </div>

      {/* Bottom Subtle Note */}
      <div
        style={{
          marginTop: '1.25rem',
          fontSize: '0.68rem',
          color: '#64748b',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          zIndex: 2,
        }}
      >
        Where Vintage Craftsmanship Meets Modern Luxury
      </div>
    </div>
  );
};
