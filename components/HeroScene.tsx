"use client";
import { useEffect, useRef } from "react";

const CHARS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ∑∆∇∫≈≠≤≥λπ";
const FONT_SIZE = 14;

export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cols = () => Math.floor(canvas.width / FONT_SIZE);

    // Each column: y position (in chars), speed multiplier, brightness, color hue
    type Column = { y: number; speed: number; bright: boolean; hue: number };
    let drops: Column[] = [];

    const init = () => {
      drops = Array.from({ length: cols() }, () => ({
        y: Math.random() * -100,
        speed: 0.3 + Math.random() * 0.7,
        bright: Math.random() < 0.08,
        hue: Math.random() < 0.15 ? 50 : 140, // mostly green, some gold
      }));
    };
    init();

    const draw = () => {
      // Fade trail
      ctx.fillStyle = "rgba(3, 7, 18, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const numCols = cols();

      // Extend or trim drops on resize
      while (drops.length < numCols) drops.push({ y: Math.random() * -50, speed: 0.3 + Math.random() * 0.7, bright: Math.random() < 0.08, hue: Math.random() < 0.15 ? 50 : 140 });
      if (drops.length > numCols) drops.length = numCols;

      ctx.font = `${FONT_SIZE}px monospace`;

      drops.forEach((col, i) => {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * FONT_SIZE;
        const y = Math.floor(col.y) * FONT_SIZE;

        if (y > 0 && y < canvas.height) {
          // Head char — brightest
          if (col.bright) {
            ctx.fillStyle = `hsla(${col.hue}, 100%, 95%, 0.95)`;
          } else {
            ctx.fillStyle = `hsla(${col.hue}, 85%, 70%, 0.9)`;
          }
          ctx.fillText(char, x, y);

          // Second char slightly dimmer
          if (y - FONT_SIZE > 0) {
            ctx.fillStyle = `hsla(${col.hue}, 80%, 55%, 0.5)`;
            ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y - FONT_SIZE);
          }
        }

        col.y += col.speed;

        // Reset when off screen — randomize so not all sync
        if (col.y * FONT_SIZE > canvas.height && Math.random() > 0.975) {
          col.y = Math.random() * -30;
          col.bright = Math.random() < 0.08;
          col.hue = Math.random() < 0.15 ? 50 : 140;
          col.speed = 0.3 + Math.random() * 0.7;
        }
      });
    };

    const interval = setInterval(draw, 40); // ~25fps — intentionally slow/terminal-like

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-30"
    />
  );
}
