'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface ThreeSceneProps {
  riskScore: number;
  onSelectAsset?: (assetName: string | null) => void;
}

export default function ThreeScene({ riskScore = 10, onSelectAsset }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const interactableObjectsRef = useRef<THREE.Object3D[]>([]);
  const ghostRef = useRef<THREE.Group | null>(null);
  
  // Ghost Particles for Gas Cloud
  const particlesRef = useRef<THREE.Points | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SETUP SCENE ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913); // Deep industrial navy
    scene.fog = new THREE.FogExp2(0x060913, 0.02);
    sceneRef.current = scene;

    // --- CAMERA ---
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.set(20, 15, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // --- RENDERER ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- CONTROLS ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 10;
    controls.maxDistance = 40;

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0x223344, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xaaccff, 2.0);
    dirLight.position.set(15, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    scene.add(dirLight);

    const redAlertLight = new THREE.PointLight(0xff0000, 0, 20);
    redAlertLight.position.set(-5, 5, 0);
    scene.add(redAlertLight);

    // --- GROUND & BLUEPRINT ---
    const gridHelper = new THREE.GridHelper(40, 40, 0x112233, 0x0a1526);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x060913,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // --- BUILD PLANT ASSETS ---
    const buildMaterial = (colorHex: number) => new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.5,
      metalness: 0.4,
      emissive: new THREE.Color(colorHex).multiplyScalar(0.1),
    });

    // 1. Boiler-01 (Complex Cylinder with pipes)
    const boilerGroup = new THREE.Group();
    boilerGroup.position.set(-6, 0, -2);
    
    const boilerMainGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
    const boilerMain = new THREE.Mesh(boilerMainGeo, buildMaterial(0x3a4a5a));
    boilerMain.position.y = 2;
    boilerMain.castShadow = true;
    boilerGroup.add(boilerMain);
    
    const pipeGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    const pipe1 = new THREE.Mesh(pipeGeo, buildMaterial(0x556677));
    pipe1.position.set(1.5, 2, 0);
    pipe1.rotation.z = Math.PI / 2;
    boilerGroup.add(pipe1);
    
    boilerGroup.userData = { isAsset: true, assetName: 'Boiler-01' };
    scene.add(boilerGroup);
    interactableObjectsRef.current.push(boilerMain, pipe1);

    // 2. Tank Farm (Multiple large cylinders)
    const tankGroup = new THREE.Group();
    tankGroup.position.set(4, 0, -6);
    const tankMat = buildMaterial(0x8899aa);
    for (let i = 0; i < 4; i++) {
      const tankGeo = new THREE.CylinderGeometry(1.8, 1.8, 3.5, 16);
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set((i % 2) * 4, 1.75, Math.floor(i / 2) * 4);
      tank.castShadow = true;
      tankGroup.add(tank);
      interactableObjectsRef.current.push(tank);
    }
    tankGroup.userData = { isAsset: true, assetName: 'Tank Farm' };
    scene.add(tankGroup);

    // 3. Cooling Tower (Hyperboloid approximation using cylinder with top scale)
    const towerGroup = new THREE.Group();
    towerGroup.position.set(8, 0, 6);
    const towerGeo = new THREE.CylinderGeometry(1.5, 2.5, 5, 16);
    const towerMat = buildMaterial(0x445566);
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 2.5;
    tower.castShadow = true;
    towerGroup.add(tower);
    towerGroup.userData = { isAsset: true, assetName: 'Cooling Tower' };
    scene.add(towerGroup);
    interactableObjectsRef.current.push(tower);

    // 4. Control Room (Box building)
    const controlRoomGroup = new THREE.Group();
    controlRoomGroup.position.set(-8, 0, 8);
    const crGeo = new THREE.BoxGeometry(4, 2, 4);
    const crMat = buildMaterial(0x1a2a3a);
    const controlRoom = new THREE.Mesh(crGeo, crMat);
    controlRoom.position.y = 1;
    controlRoom.castShadow = true;
    controlRoomGroup.add(controlRoom);
    controlRoomGroup.userData = { isAsset: true, assetName: 'Control Room' };
    scene.add(controlRoomGroup);
    interactableObjectsRef.current.push(controlRoom);
    
    // 5. Compressor-A (Small complex)
    const compGroup = new THREE.Group();
    compGroup.position.set(-2, 0, 5);
    const compGeo = new THREE.BoxGeometry(2, 1.5, 3);
    const compMesh = new THREE.Mesh(compGeo, buildMaterial(0x2a3a4a));
    compMesh.position.y = 0.75;
    compMesh.castShadow = true;
    compGroup.add(compMesh);
    compGroup.userData = { isAsset: true, assetName: 'Compressor-A' };
    scene.add(compGroup);
    interactableObjectsRef.current.push(compMesh);

    // --- LABELS (SCADA Style) ---
    const createLabel = (text: string, position: THREE.Vector3) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, 128, 64);
        context.strokeStyle = '#4488ff';
        context.lineWidth = 4;
        context.strokeRect(0, 0, 128, 64);
        context.font = 'Bold 30px Courier New';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 64, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(position);
      sprite.scale.set(1.5, 0.75, 1);
      return sprite;
    };
    
    scene.add(createLabel("S1", new THREE.Vector3(-6, 4.5, -2)));
    scene.add(createLabel("S2", new THREE.Vector3(4, 4, -6)));
    scene.add(createLabel("S14", new THREE.Vector3(-2, 2, 5)));

    // --- WORKERS (Moving Nodes) ---
    const workers = new THREE.Group();
    const workerGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const workerMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x888800 }); // Yellow hardhats
    
    const worker1 = new THREE.Mesh(workerGeo, workerMat);
    worker1.position.set(-2, 0.3, 0);
    workers.add(worker1);
    
    const worker2 = new THREE.Mesh(workerGeo, workerMat);
    worker2.position.set(6, 0.3, -2);
    workers.add(worker2);
    
    scene.add(workers);
    ghostRef.current = workers;

    // --- GAS CLOUD (Particles) ---
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 2;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.2,
      transparent: true,
      opacity: 0, // Hidden initially
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const particleSystem = new THREE.Points(geometry, particleMaterial);
    particleSystem.position.set(-6, 2, -2); // Around boiler
    scene.add(particleSystem);
    particlesRef.current = particleSystem;

    // --- INTERACTION ---
    const onMouseClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(interactableObjectsRef.current, false);
      
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData.isAsset) {
          obj = obj.parent;
        }
        if (obj && obj.userData.isAsset && onSelectAsset) {
          onSelectAsset(obj.userData.assetName);
        }
      } else {
        if (onSelectAsset) onSelectAsset(null);
      }
    };
    renderer.domElement.addEventListener('click', onMouseClick);

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    
    const animate = () => {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const currentRisk = riskRef.current;

      // Workers moving slowly
      worker1.position.x = -2 + Math.sin(time * 0.5) * 2;
      worker1.position.z = Math.cos(time * 0.5) * 2;
      worker2.position.x = 6 + Math.cos(time * 0.3) * 3;
      
      // Update environment based on risk
      if (currentRisk > 70) {
        // Red alert lighting
        const pulse = (Math.sin(time * 5) + 1) / 2;
        redAlertLight.intensity = pulse * 100;
        if (sceneRef.current?.fog) {
          (sceneRef.current.fog as THREE.FogExp2).color.setRGB(0.2, 0.0, 0.0);
        }
        // Expand gas cloud
        if (particlesRef.current) {
          (particlesRef.current.material as THREE.PointsMaterial).opacity = Math.min(0.6, (currentRisk - 70) * 0.02);
          const positions = particlesRef.current.geometry.attributes.position.array;
          for (let i = 0; i < particleCount; i++) {
             // Slowly expand outward
             positions[i*3] += positions[i*3] * 0.01;
             positions[i*3+1] += (Math.random() - 0.2) * 0.02; // rise up
             positions[i*3+2] += positions[i*3+2] * 0.01;
          }
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
          // Slowly rotate cloud
          particlesRef.current.rotation.y += 0.01;
        }
      } else {
        redAlertLight.intensity = 0;
        if (sceneRef.current?.fog) {
          (sceneRef.current.fog as THREE.FogExp2).color.setHex(0x060913);
        }
        // Reset gas cloud
        if (particlesRef.current) {
          (particlesRef.current.material as THREE.PointsMaterial).opacity = 0;
          const positions = particlesRef.current.geometry.attributes.position.array;
          for (let i = 0; i < particleCount * 3; i++) {
             positions[i] = (Math.random() - 0.5) * 2;
          }
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- RESIZE ---
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

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onMouseClick);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  // Sync risk score without full re-render is handled inside the animation loop via closure over riskScore? 
  // Actually, to make it truly reactive, we need to inject the riskScore into a ref.
  const riskRef = useRef(riskScore);
  useEffect(() => {
    riskRef.current = riskScore;
  }, [riskScore]);

  // Modifying the animate loop to use riskRef.current instead of the closure's riskScore.
  // Wait, I used `riskScore` in the closure. Let's fix that by using a ref in the actual code above.
  // For simplicity, I will just let React re-render when riskScore crosses thresholds, but it's better to use refs inside animate.
  
  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] cursor-crosshair" />
  );
}
