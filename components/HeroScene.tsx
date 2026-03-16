"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
    camera.position.z = 22;

    // ── Star field ────────────────────────────────────────────────
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3]     = (Math.random() - 0.5) * 400;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 400 - 50;
      starSizes[i] = Math.random() * 1.5 + 0.3;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Nebula clouds (soft glowing geometry) ────────────────────
    const nebulaGroup = new THREE.Group();
    const nebulaColors = [0x4f46e5, 0x7c3aed, 0x0e7490, 0x1e40af];
    for (let n = 0; n < 5; n++) {
      const geo = new THREE.SphereGeometry(3 + Math.random() * 5, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: nebulaColors[n % nebulaColors.length],
        transparent: true,
        opacity: 0.04 + Math.random() * 0.04,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        -10 - Math.random() * 20
      );
      mesh.scale.set(1 + Math.random(), 0.4 + Math.random() * 0.6, 1 + Math.random() * 0.5);
      nebulaGroup.add(mesh);
    }
    scene.add(nebulaGroup);

    // ── Black hole ────────────────────────────────────────────────
    const bhGroup = new THREE.Group();
    bhGroup.position.set(-5, 1, -2);

    // Event horizon (dark sphere)
    const horizonGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    bhGroup.add(new THREE.Mesh(horizonGeo, horizonMat));

    // Accretion disk — flat torus, angled
    const diskGeo = new THREE.TorusGeometry(3.8, 0.45, 4, 80);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
      wireframe: false,
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = Math.PI / 2.8;
    disk.rotation.z = 0.3;
    bhGroup.add(disk);

    // Inner glow ring
    const innerGeo = new THREE.TorusGeometry(2.2, 0.18, 4, 60);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.9 });
    const innerRing = new THREE.Mesh(innerGeo, innerMat);
    innerRing.rotation.x = Math.PI / 2.8;
    innerRing.rotation.z = 0.3;
    bhGroup.add(innerRing);

    // Photon sphere glow (slightly larger transparent ring)
    const photonGeo = new THREE.TorusGeometry(2.0, 0.08, 4, 60);
    const photonMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    const photonRing = new THREE.Mesh(photonGeo, photonMat);
    photonRing.rotation.x = Math.PI / 2.8;
    photonRing.rotation.z = 0.3;
    bhGroup.add(photonRing);

    // Relativistic jet (vertical beam)
    const jetGeo = new THREE.CylinderGeometry(0.04, 0.18, 12, 8);
    const jetMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.3 });
    const jetTop = new THREE.Mesh(jetGeo, jetMat);
    jetTop.position.y = 6;
    bhGroup.add(jetTop);
    const jetBot = new THREE.Mesh(jetGeo, jetMat.clone());
    jetBot.position.y = -6;
    jetBot.rotation.z = Math.PI;
    bhGroup.add(jetBot);

    scene.add(bhGroup);

    // ── University knowledge nodes ────────────────────────────────
    interface KnowledgeNode { mesh: THREE.Mesh; orbit: number; orbitSpeed: number; orbitRadius: number; orbitTilt: number; pulse: number; pulseSpeed: number; }
    const knowledgeNodes: KnowledgeNode[] = [];

    const nodeLabels = ["AI", "Canvas LMS", "Analytics", "Research", "Grades", "Students", "Courses", "Insights", "API"];
    const nodeColors = [0xf59e0b, 0x818cf8, 0x34d399, 0xfb7185, 0x38bdf8, 0xa78bfa, 0xfbbf24, 0x6ee7b7, 0xf472b6];
    const isCore = [true, true, true, false, false, false, false, false, false];

    nodeLabels.forEach((_, i) => {
      const size = isCore[i] ? 0.22 + Math.random() * 0.1 : 0.12 + Math.random() * 0.08;
      const geo = new THREE.SphereGeometry(size, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ color: nodeColors[i], transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      knowledgeNodes.push({
        mesh,
        orbit: Math.random() * Math.PI * 2,
        orbitSpeed: 0.003 + Math.random() * 0.004,
        orbitRadius: 6 + i * 1.2 + Math.random() * 2,
        orbitTilt: (Math.random() - 0.5) * 1.2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.025 + Math.random() * 0.02,
      });
    });

    // ── Connection lines between nodes ────────────────────────────
    interface Connection { line: THREE.Line; a: number; b: number; active: boolean; activeTimer: number; }
    const connections: Connection[] = [];

    knowledgeNodes.forEach((_, i) => {
      const next1 = (i + 1) % knowledgeNodes.length;
      const next2 = (i + 3) % knowledgeNodes.length;
      [next1, next2].forEach(j => {
        if (connections.find(c => (c.a === i && c.b === j) || (c.a === j && c.b === i))) return;
        const lineMat = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.12 });
        const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
        connections.push({ line, a: i, b: j, active: false, activeTimer: 0 });
      });
    });

    // ── Distant galaxy spiral ─────────────────────────────────────
    const galaxyCount = 3000;
    const galaxyPositions = new Float32Array(galaxyCount * 3);
    const galaxyColors = new Float32Array(galaxyCount * 3);
    for (let i = 0; i < galaxyCount; i++) {
      const angle = (i / galaxyCount) * Math.PI * 10;
      const r = (i / galaxyCount) * 14 + Math.random() * 1.5;
      const spread = 0.3 + (i / galaxyCount) * 0.5;
      galaxyPositions[i * 3]     = Math.cos(angle) * r + (Math.random() - 0.5) * spread;
      galaxyPositions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.3;
      galaxyPositions[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * spread;
      const t = i / galaxyCount;
      galaxyColors[i * 3]     = 0.3 + t * 0.5;   // R
      galaxyColors[i * 3 + 1] = 0.2 + t * 0.3;   // G
      galaxyColors[i * 3 + 2] = 0.6 + t * 0.4;   // B
    }
    const galaxyGeo = new THREE.BufferGeometry();
    galaxyGeo.setAttribute("position", new THREE.BufferAttribute(galaxyPositions, 3));
    galaxyGeo.setAttribute("color", new THREE.BufferAttribute(galaxyColors, 3));
    const galaxyMat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.6 });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    galaxy.position.set(14, -4, -15);
    galaxy.rotation.x = 0.3;
    scene.add(galaxy);

    // ── Mouse parallax ────────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Animation ─────────────────────────────────────────────────
    let frame = 0;
    let nextActivation = 40;

    const animate = () => {
      const id = requestAnimationFrame(animate);
      frame++;

      // Camera parallax
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.03;
      camera.position.y += (mouseY * 1.2 - camera.position.y) * 0.03;

      // Black hole disk spin
      disk.rotation.z += 0.008;
      innerRing.rotation.z += 0.015;
      photonRing.rotation.z -= 0.02;

      // Nebula slow drift
      nebulaGroup.rotation.y += 0.0002;
      nebulaGroup.rotation.z += 0.0001;

      // Galaxy spin
      galaxy.rotation.y += 0.0015;

      // Orbit knowledge nodes
      knowledgeNodes.forEach(n => {
        n.orbit += n.orbitSpeed;
        n.pulse += n.pulseSpeed;
        n.mesh.position.set(
          Math.cos(n.orbit) * n.orbitRadius,
          Math.sin(n.orbit * 0.7) * 2 + Math.sin(n.orbitTilt + frame * 0.005) * 1.5,
          Math.sin(n.orbit) * n.orbitRadius * 0.4 - 2
        );
        const s = 1 + Math.sin(n.pulse) * 0.15;
        n.mesh.scale.setScalar(s);
      });

      // Activate random connection
      if (frame > nextActivation) {
        const idx = Math.floor(Math.random() * connections.length);
        connections[idx].active = true;
        connections[idx].activeTimer = 0;
        nextActivation = frame + 25 + Math.floor(Math.random() * 50);
      }

      // Update connections
      connections.forEach(c => {
        const pa = knowledgeNodes[c.a].mesh.position;
        const pb = knowledgeNodes[c.b].mesh.position;
        const posAttr = c.line.geometry.attributes.position as THREE.BufferAttribute;
        posAttr.setXYZ(0, pa.x, pa.y, pa.z);
        posAttr.setXYZ(1, pb.x, pb.y, pb.z);
        posAttr.needsUpdate = true;
        const mat = c.line.material as THREE.LineBasicMaterial;
        if (c.active) {
          c.activeTimer++;
          mat.color.set(0xf59e0b);
          mat.opacity = Math.max(0.1, 0.65 - c.activeTimer * 0.014);
          if (c.activeTimer > 45) { c.active = false; mat.color.set(0x6366f1); mat.opacity = 0.12; }
        }
      });

      renderer.render(scene, camera);
      return id;
    };
    const animId = animate();

    // ── Resize ────────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" />;
}
