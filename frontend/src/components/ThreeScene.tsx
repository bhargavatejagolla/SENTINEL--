'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface ThreeSceneProps {
  riskScore: number;
  zoneData?: { id: string; name: string; x: number; y: number; risk_multiplier: number }[];
}

export default function ThreeScene({ riskScore = 10, zoneData = [] }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const fogColorRef = useRef<THREE.Color>(new THREE.Color(0x1a2332));
  const zoneMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const ghostRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Default zones if not provided (matches your topology.json)
  const defaultZones = [
    { id: 'Z1', name: 'Coke Oven', x: -4, y: 2, risk_multiplier: 1.8 },
    { id: 'Z2', name: 'Gas Unit', x: 0, y: 3, risk_multiplier: 1.5 },
    { id: 'Z3', name: 'Storage', x: 4, y: 2, risk_multiplier: 1.4 },
    { id: 'Z4', name: 'Maintenance', x: -2, y: -2, risk_multiplier: 1.2 },
    { id: 'Z5', name: 'Dispatch', x: 3, y: -2, risk_multiplier: 1.1 },
  ];
  const zones = zoneData.length > 0 ? zoneData : defaultZones;

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Setup Scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1a);
    scene.fog = new THREE.FogExp2(0x1a2332, 0.015);
    sceneRef.current = scene;

    // --- Setup Camera (Isometric View) ---
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.set(12, 10, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // --- Setup Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI / 2.4;
    controls.minDistance = 5;
    controls.maxDistance = 25;
    controlsRef.current = controls;

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);

    // --- GROUND GRID ---
    const gridHelper = new THREE.GridHelper(20, 20, 0x4466aa, 0x223366);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // --- FLOOR ---
    const floorGeo = new THREE.PlaneGeometry(18, 18);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1a,
      roughness: 0.8,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // --- CREATE ZONES (3D Buildings) ---
    const colors = [0x3a6ea5, 0x4a7ab5, 0x5a8ac5, 0x2a5e95, 0x6a9ad5];
    zones.forEach((zone, index) => {
      const color = colors[index % colors.length];
      const height = 0.8 + zone.risk_multiplier * 0.5;
      const geo = new THREE.BoxGeometry(2.2, height, 2.2);
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.4,
        metalness: 0.6,
        emissive: new THREE.Color(color).multiplyScalar(0.15),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(zone.x, height / 2 - 0.5, zone.y);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { zoneId: zone.id, baseColor: color };
      scene.add(mesh);
      zoneMeshesRef.current.set(zone.id, mesh);

      // Zone Label (using Sprites or just simple text - we'll do a small box on top)
      const labelMat = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        emissive: 0x4488ff,
        emissiveIntensity: 0.2,
      });
      const labelGeo = new THREE.BoxGeometry(0.6, 0.1, 0.6);
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(zone.x, height + 0.2, zone.y);
      scene.add(label);
    });

    // --- CREATE THE "GHOST" (Semi-transparent figure) ---
    const ghostGroup = new THREE.Group();
    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    ghostGroup.add(body);
    // Head
    const headGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.7,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.3;
    ghostGroup.add(head);
    // Glow ring
    const ringGeo = new THREE.TorusGeometry(0.5, 0.03, 8, 16);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.3;
    ring.rotation.x = Math.PI / 2;
    ghostGroup.add(ring);

    ghostGroup.position.set(-5, -0.5, -5);
    scene.add(ghostGroup);
    ghostRef.current = ghostGroup as any;

    // --- ANIMATION LOOP ---
    const animate = () => {
      requestAnimationFrame(animate);

      // Update fog color based on risk
      if (sceneRef.current?.fog) {
        const fog = sceneRef.current.fog as THREE.FogExp2;
        const r = 0.1 + (riskScore / 100) * 0.5;
        const g = 0.1 + (1 - riskScore / 100) * 0.3;
        const b = 0.1 + (1 - riskScore / 100) * 0.2;
        fog.color.setRGB(r, g, b);
      }

      // Animate Ghost
      if (ghostRef.current) {
        const ghost = ghostRef.current;
        // Move ghost towards high risk zone (Z1 at -4, 2)
        const targetX = -4 + (riskScore / 100) * 2;
        const targetZ = 2 + (riskScore / 100) * 2;
        ghost.position.x += (targetX - ghost.position.x) * 0.01;
        ghost.position.z += (targetZ - ghost.position.z) * 0.01;
        // Rotate ghost
        ghost.rotation.y += 0.02;
        // Scale ghost based on risk (bigger = more danger)
        const scale = 0.8 + (riskScore / 100) * 0.8;
        ghost.scale.set(scale, scale, scale);
        // Change ghost color based on risk
        if (riskScore > 70) {
          ((ghost.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).color.setHex(0xff4444);
          ((ghost.children[1] as THREE.Mesh).material as THREE.MeshStandardMaterial).color.setHex(0xff4444);
        } else {
          ((ghost.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).color.setHex(0x00ff88);
          ((ghost.children[1] as THREE.Mesh).material as THREE.MeshStandardMaterial).color.setHex(0x00ff88);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };
    window.addEventListener('resize', handleResize);

    // --- CLEANUP ---
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [zones]);

  // Update zone colors when risk changes
  useEffect(() => {
    let animationFrame: number;
    let time = 0;

    const animateColors = () => {
      time += 0.05;
      zoneMeshesRef.current.forEach((mesh, zoneId) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const baseColor = new THREE.Color(mesh.userData.baseColor);

        if (riskScore > 70) {
          // FLASHING RED (Critical)
          const pulse = (Math.sin(time * 5) + 1) / 2; // 0 to 1
          mat.color.setRGB(1, pulse * 0.2, pulse * 0.2);
          mat.emissive.setRGB(1, 0, 0);
          mat.emissiveIntensity = 0.8 + pulse * 0.5;
        } else if (riskScore > 40) {
          // SOLID YELLOW (Warning)
          mat.color.setRGB(1, 0.8, 0.2);
          mat.emissive.setRGB(0.8, 0.6, 0.1);
          mat.emissiveIntensity = 0.6;
        } else {
          // NORMAL
          mat.color.copy(baseColor);
          mat.emissive.copy(baseColor).multiplyScalar(0.15);
          mat.emissiveIntensity = 0.3;
        }
      });
      animationFrame = requestAnimationFrame(animateColors);
    };

    animationFrame = requestAnimationFrame(animateColors);

    return () => cancelAnimationFrame(animationFrame);
  }, [riskScore]);

  return <div ref={containerRef} className="w-full h-full min-h-[500px] rounded-xl overflow-hidden" />;
}
