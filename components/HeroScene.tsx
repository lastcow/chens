"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Node {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  label: string;
  pulse: number;
  pulseSpeed: number;
}

interface Connection {
  line: THREE.Line;
  a: number;
  b: number;
  active: boolean;
  activeTime: number;
}

const NODE_LABELS = [
  "AI", "Canvas LMS", "Analytics", "Cloud", "Security",
  "Grading", "Students", "Courses", "Data", "Insights",
  "API", "Reports",
];

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Nodes
    const nodes: Node[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.18, 16, 16);

    NODE_LABELS.forEach((label, i) => {
      const isCore = i < 3; // AI, Canvas LMS, Analytics are "core" — bigger, brighter
      const geo = isCore ? new THREE.SphereGeometry(0.28, 24, 24) : nodeGeo;
      const mat = new THREE.MeshBasicMaterial({
        color: isCore ? new THREE.Color("#f59e0b") : new THREE.Color(i % 3 === 0 ? "#6366f1" : i % 3 === 1 ? "#22d3ee" : "#a3e635"),
        transparent: true,
        opacity: isCore ? 0.9 : 0.7,
      });
      const mesh = new THREE.Mesh(geo, mat);

      // Spread nodes in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = isCore ? 2 + Math.random() * 2 : 4 + Math.random() * 5;
      mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.6,
        r * Math.cos(phi) * 0.5
      );

      scene.add(mesh);
      nodes.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.004
        ),
        label,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      });
    });

    // Connections
    const connections: Connection[] = [];
    const lineMat = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.15 });
    const activeLineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.6 });

    // Connect each node to its 2–3 nearest neighbors
    nodes.forEach((n, i) => {
      const dists = nodes
        .map((m, j) => ({ j, d: n.mesh.position.distanceTo(m.mesh.position) }))
        .filter(x => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2 + Math.floor(Math.random() * 2));

      dists.forEach(({ j }) => {
        if (!connections.find(c => (c.a === i && c.b === j) || (c.a === j && c.b === i))) {
          const geo = new THREE.BufferGeometry().setFromPoints([
            n.mesh.position.clone(),
            nodes[j].mesh.position.clone(),
          ]);
          const line = new THREE.Line(geo, lineMat.clone());
          scene.add(line);
          connections.push({ line, a: i, b: j, active: false, activeTime: 0 });
        }
      });
    });

    // Ambient particles
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x6366f1, size: 0.06, transparent: true, opacity: 0.4 });
    scene.add(new THREE.Points(particleGeo, particleMat));

    // Mouse parallax
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Periodically activate random connections
    let nextActivation = 0;
    let frame = 0;

    const animate = () => {
      const id = requestAnimationFrame(animate);
      frame++;

      // Slow rotation of whole scene
      scene.rotation.y += 0.0015;
      scene.rotation.x += 0.0003;

      // Camera parallax
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.04;
      camera.position.y += (mouseY * 1.0 - camera.position.y) * 0.04;

      // Node pulses + drift
      nodes.forEach(n => {
        n.pulse += n.pulseSpeed;
        const scale = 1 + Math.sin(n.pulse) * 0.12;
        n.mesh.scale.setScalar(scale);

        // Drift
        n.mesh.position.add(n.vel);

        // Soft bounds
        (["x", "y", "z"] as const).forEach(ax => {
          const limit = ax === "z" ? 3 : ax === "y" ? 5 : 8;
          if (Math.abs(n.mesh.position[ax]) > limit) n.vel[ax] *= -1;
        });
      });

      // Activate a random connection periodically
      if (frame > nextActivation) {
        const idx = Math.floor(Math.random() * connections.length);
        connections[idx].active = true;
        connections[idx].activeTime = 0;
        nextActivation = frame + 30 + Math.floor(Math.random() * 60);
      }

      // Update connection geometry + activity
      connections.forEach(c => {
        const posAttr = c.line.geometry.attributes.position as THREE.BufferAttribute;
        const pa = nodes[c.a].mesh.position;
        const pb = nodes[c.b].mesh.position;
        posAttr.setXYZ(0, pa.x, pa.y, pa.z);
        posAttr.setXYZ(1, pb.x, pb.y, pb.z);
        posAttr.needsUpdate = true;

        if (c.active) {
          c.activeTime++;
          (c.line.material as THREE.LineBasicMaterial).color.set(0xf59e0b);
          (c.line.material as THREE.LineBasicMaterial).opacity = Math.max(0, 0.7 - c.activeTime * 0.015);
          if (c.activeTime > 45) { c.active = false; (c.line.material as THREE.LineBasicMaterial).opacity = 0.15; (c.line.material as THREE.LineBasicMaterial).color.set(0x6366f1); }
        }
      });

      renderer.render(scene, camera);
      return id;
    };
    const animId = animate();

    // Resize
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
