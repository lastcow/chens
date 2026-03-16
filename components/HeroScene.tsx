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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
    camera.position.z = 22;

    // ── Deep star field ───────────────────────────────────────────
    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 500;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 500;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 500 - 30;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.1, transparent: true, opacity: 0.75, sizeAttenuation: true,
    })));

    // Bright foreground stars (closer, bigger)
    const fgCount = 200;
    const fgPos = new Float32Array(fgCount * 3);
    for (let i = 0; i < fgCount; i++) {
      fgPos[i * 3]     = (Math.random() - 0.5) * 80;
      fgPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      fgPos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
    }
    const fgGeo = new THREE.BufferGeometry();
    fgGeo.setAttribute("position", new THREE.BufferAttribute(fgPos, 3));
    scene.add(new THREE.Points(fgGeo, new THREE.PointsMaterial({
      color: 0xdde8ff, size: 0.22, transparent: true, opacity: 0.6, sizeAttenuation: true,
    })));

    // ── Nebula clouds ─────────────────────────────────────────────
    const nebulaData = [
      { color: 0x4f46e5, x: -18, y: 6,  z: -30, sx: 3.0, sy: 1.2, sz: 1.8, op: 0.07 },
      { color: 0x7c3aed, x:  15, y: -5, z: -35, sx: 2.5, sy: 0.8, sz: 2.0, op: 0.06 },
      { color: 0x0e7490, x:  -8, y: -8, z: -25, sx: 2.0, sy: 1.4, sz: 1.5, op: 0.05 },
      { color: 0x1e40af, x:  10, y: 10, z: -40, sx: 3.5, sy: 0.7, sz: 2.2, op: 0.05 },
      { color: 0x6d28d9, x: -12, y: 2,  z: -20, sx: 1.5, sy: 1.0, sz: 1.2, op: 0.06 },
      { color: 0x0f766e, x:   6, y: -4, z: -18, sx: 2.2, sy: 0.9, sz: 1.6, op: 0.04 },
    ];
    nebulaData.forEach(d => {
      const geo = new THREE.SphereGeometry(6, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: d.op });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, d.y, d.z);
      mesh.scale.set(d.sx, d.sy, d.sz);
      scene.add(mesh);
    });

    // ── Distant spiral galaxy ─────────────────────────────────────
    const galCount = 4000;
    const galPos = new Float32Array(galCount * 3);
    const galCol = new Float32Array(galCount * 3);
    for (let i = 0; i < galCount; i++) {
      const angle = (i / galCount) * Math.PI * 12;
      const r = (i / galCount) * 10 + Math.random() * 1.2;
      const spread = 0.15 + (i / galCount) * 0.4;
      galPos[i * 3]     = Math.cos(angle) * r + (Math.random() - 0.5) * spread;
      galPos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.25;
      galPos[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * spread;
      const t = i / galCount;
      galCol[i * 3] = 0.4 + t * 0.5; galCol[i * 3 + 1] = 0.3 + t * 0.3; galCol[i * 3 + 2] = 0.8 + t * 0.2;
    }
    const galGeo = new THREE.BufferGeometry();
    galGeo.setAttribute("position", new THREE.BufferAttribute(galPos, 3));
    galGeo.setAttribute("color", new THREE.BufferAttribute(galCol, 3));
    const galaxy = new THREE.Points(galGeo, new THREE.PointsMaterial({
      size: 0.07, vertexColors: true, transparent: true, opacity: 0.55,
    }));
    galaxy.position.set(18, -6, -30);
    galaxy.rotation.x = 0.25;
    scene.add(galaxy);

    // Second smaller galaxy
    const galCount2 = 1500;
    const galPos2 = new Float32Array(galCount2 * 3);
    for (let i = 0; i < galCount2; i++) {
      const angle = (i / galCount2) * Math.PI * 8;
      const r = (i / galCount2) * 6 + Math.random() * 0.8;
      galPos2[i * 3]     = Math.cos(angle) * r + (Math.random() - 0.5) * 0.3;
      galPos2[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
      galPos2[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 0.3;
    }
    const galGeo2 = new THREE.BufferGeometry();
    galGeo2.setAttribute("position", new THREE.BufferAttribute(galPos2, 3));
    const galaxy2 = new THREE.Points(galGeo2, new THREE.PointsMaterial({
      color: 0xc4b5fd, size: 0.09, transparent: true, opacity: 0.45,
    }));
    galaxy2.position.set(-20, 8, -40);
    galaxy2.rotation.z = 0.6;
    scene.add(galaxy2);

    // ── Black hole — center ───────────────────────────────────────
    const bh = new THREE.Group();
    bh.position.set(0, 0, 0);

    // Event horizon
    const horizonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    bh.add(horizonMesh);

    // Gravitational lensing halo (faint glow around horizon)
    const haloMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x2d1b69, transparent: true, opacity: 0.25 })
    );
    bh.add(haloMesh);

    // Outer glow
    const outerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x1e1b4b, transparent: true, opacity: 0.1 })
    );
    bh.add(outerGlow);

    // Accretion disk layers
    const diskConfigs = [
      { r: 4.8, tube: 0.55, color: 0xf59e0b, opacity: 0.9, tiltX: Math.PI / 2.5, tiltZ: 0.25 },
      { r: 3.4, tube: 0.22, color: 0xfde68a, opacity: 0.95, tiltX: Math.PI / 2.5, tiltZ: 0.25 },
      { r: 2.6, tube: 0.1,  color: 0xffffff, opacity: 0.7, tiltX: Math.PI / 2.5, tiltZ: 0.25 },
    ];
    const disks: THREE.Mesh[] = [];
    diskConfigs.forEach(d => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(d.r, d.tube, 6, 100),
        new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: d.opacity })
      );
      mesh.rotation.x = d.tiltX;
      mesh.rotation.z = d.tiltZ;
      bh.add(mesh);
      disks.push(mesh);
    });

    // Photon sphere — thin bright ring
    const photon = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.04, 4, 80),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })
    );
    photon.rotation.x = Math.PI / 2.5;
    photon.rotation.z = 0.25;
    bh.add(photon);

    // Relativistic jets
    const jetMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.28 });
    [1, -1].forEach(dir => {
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.22, 16, 8), jetMat.clone());
      jet.position.y = dir * 8;
      if (dir === -1) jet.rotation.z = Math.PI;
      bh.add(jet);
    });

    scene.add(bh);

    // Gravitational dust — particles swirling around BH
    const dustCount = 600;
    const dustPos = new Float32Array(dustCount * 3);
    const dustAngles = new Float32Array(dustCount);
    const dustRadii = new Float32Array(dustCount);
    const dustSpeeds = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      const r = 3.5 + Math.random() * 7;
      const angle = Math.random() * Math.PI * 2;
      dustAngles[i] = angle;
      dustRadii[i] = r;
      dustSpeeds[i] = 0.003 + (1 / r) * 0.06; // faster when closer
      dustPos[i * 3]     = Math.cos(angle) * r;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      dustPos[i * 3 + 2] = Math.sin(angle) * r * 0.35;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xfbbf24, size: 0.07, transparent: true, opacity: 0.5 });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // ── Mouse parallax ────────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Animation ─────────────────────────────────────────────────
    let frame = 0;
    const animate = () => {
      const id = requestAnimationFrame(animate);
      frame++;

      // Camera parallax
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.03;
      camera.position.y += (mouseY * 1.0 - camera.position.y) * 0.03;

      // Disk spin at different rates
      disks[0].rotation.z += 0.006;
      disks[1].rotation.z += 0.012;
      disks[2].rotation.z += 0.02;
      photon.rotation.z -= 0.025;

      // BH slow wobble
      bh.rotation.y += 0.001;

      // Dust orbit
      const dustPosAttr = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        dustAngles[i] += dustSpeeds[i];
        const r = dustRadii[i];
        dustPosAttr.setX(i, Math.cos(dustAngles[i]) * r);
        dustPosAttr.setZ(i, Math.sin(dustAngles[i]) * r * 0.35);
      }
      dustPosAttr.needsUpdate = true;

      // Galaxies rotate
      galaxy.rotation.y += 0.0008;
      galaxy2.rotation.y -= 0.0005;

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
