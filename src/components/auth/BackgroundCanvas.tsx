"use client";

import { useEffect, useRef } from "react";

export function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let rafId: number;
    let startTime: number | null = null;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = W + "px";
      canvas!.style.height = H + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // Blobs
    const blobs = [
      { x: 0.15, y: 0.2,  r: 0.38, c: [59, 130, 246] as [number,number,number], phase: 0 },
      { x: 0.82, y: 0.75, r: 0.32, c: [29, 78, 216]  as [number,number,number], phase: 1.8 },
      { x: 0.55, y: 0.5,  r: 0.25, c: [16, 185, 129] as [number,number,number], phase: 3.2 },
    ];

    // Candlesticks
    function genCandles(n: number) {
      const out = [];
      let price = 100;
      for (let i = 0; i < n; i++) {
        const open = price;
        price = Math.max(60, Math.min(160, price + (Math.random() - 0.48) * 6));
        const close = price;
        out.push({ open, close, high: Math.max(open, close) + Math.random() * 4, low: Math.min(open, close) - Math.random() * 4 });
      }
      return out;
    }
    const CHART_CANDLES = genCandles(80);
    const CHART_H = 90, CHART_CW = 14;

    // Curves
    function genCurve(n: number, vol = 1) {
      const pts: number[] = [];
      let v = 0.5;
      for (let i = 0; i < n; i++) {
        v = Math.max(0.05, Math.min(0.95, v + (Math.random() - 0.48) * 0.06 * vol));
        pts.push(v);
      }
      return pts;
    }
    const CURVES = [
      { pts: genCurve(120, 1.4), color: [59, 130, 246]  as [number,number,number], yBase: 0.72, h: 0.18, speed: 22 },
      { pts: genCurve(120, 0.9), color: [16, 185, 129]  as [number,number,number], yBase: 0.85, h: 0.10, speed: 16 },
      { pts: genCurve(120, 2.0), color: [245, 158, 11]  as [number,number,number], yBase: 0.60, h: 0.12, speed: 28 },
    ];

    // Coins
    const COIN_SYMBOLS = ["$", "€", "£", "¥", "₿", "◎"];
    const COINS = Array.from({ length: 18 }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: -0.12 - Math.random() * 0.2,
      r: 12 + Math.random() * 16, sym: COIN_SYMBOLS[i % COIN_SYMBOLS.length],
      alpha: 0.06 + Math.random() * 0.1, spin: (Math.random() - 0.5) * 0.02,
      angle: Math.random() * Math.PI * 2, phase: Math.random() * Math.PI * 2,
    }));

    // Tags
    const TAGS = [
      { label: "+2.4%",    color: [16, 185, 129]  as [number,number,number] },
      { label: "R$ 1.240", color: [59, 130, 246]  as [number,number,number] },
      { label: "-0.8%",    color: [239, 68, 68]   as [number,number,number] },
      { label: "+18.3%",   color: [16, 185, 129]  as [number,number,number] },
      { label: "BTC ↑",    color: [245, 158, 11]  as [number,number,number] },
      { label: "R$ 580",   color: [59, 130, 246]  as [number,number,number] },
      { label: "+5.1%",    color: [16, 185, 129]  as [number,number,number] },
      { label: "$ 4.2k",   color: [245, 158, 11]  as [number,number,number] },
    ].map((tag, i) => ({
      ...tag,
      x: (i / 8) * W * 1.1 + Math.random() * 100,
      y: 0.1 * H + Math.random() * 0.8 * H,
      vy: -0.15 - Math.random() * 0.1,
      vx: (Math.random() - 0.5) * 0.15,
      alpha: 0.08 + Math.random() * 0.1,
      phase: Math.random() * Math.PI * 2,
    }));

    // Particles
    const PARTICLES = Array.from({ length: 38 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: 1.5 + Math.random() * 2,
    }));
    const CONNECT_DIST = 130;

    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + r, y);
      ctx!.lineTo(x + w - r, y);
      ctx!.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx!.lineTo(x + w, y + h - r);
      ctx!.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx!.lineTo(x + r, y + h);
      ctx!.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx!.lineTo(x, y + r);
      ctx!.quadraticCurveTo(x, y, x + r, y);
      ctx!.closePath();
    }

    function drawGrid() {
      const step = 48;
      ctx!.fillStyle = "rgba(59,130,246,0.12)";
      for (let x = step / 2; x < W; x += step)
        for (let y = step / 2; y < H; y += step) {
          ctx!.beginPath(); ctx!.arc(x, y, 1, 0, Math.PI * 2); ctx!.fill();
        }
    }

    function drawBlobs(t: number) {
      blobs.forEach(b => {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.4 + b.phase);
        const cx = b.x * W + Math.sin(t * 0.25 + b.phase) * W * 0.04;
        const cy = b.y * H + Math.cos(t * 0.2 + b.phase) * H * 0.04;
        const r = b.r * Math.min(W, H) * (0.9 + 0.1 * pulse);
        const [R, G, B] = b.c;
        const g = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0,   `rgba(${R},${G},${B},0.13)`);
        g.addColorStop(0.5, `rgba(${R},${G},${B},0.05)`);
        g.addColorStop(1,   `rgba(${R},${G},${B},0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.ellipse(cx, cy, r, r * 0.7, t * 0.05 + b.phase, 0, Math.PI * 2);
        ctx!.fill();
      });
    }

    function drawChart(t: number, baseX: number, baseY: number, alpha: number) {
      const scroll = (t * 18) % (CHART_CW * CHART_CANDLES.length);
      const prices = CHART_CANDLES.flatMap(c => [c.open, c.close, c.high, c.low]);
      const minP = Math.min(...prices), maxP = Math.max(...prices);
      const scaleP = (v: number) => CHART_H - ((v - minP) / (maxP - minP)) * CHART_H;
      ctx!.save();
      ctx!.globalAlpha = alpha;
      const startIdx = Math.floor(scroll / CHART_CW);
      const offsetX = -(scroll % CHART_CW);
      for (let i = 0; i <= Math.ceil(W / CHART_CW) + 2; i++) {
        const c = CHART_CANDLES[(startIdx + i) % CHART_CANDLES.length];
        const x = baseX + offsetX + i * CHART_CW;
        const bull = c.close >= c.open;
        const col = bull ? "rgba(16,185,129,0.7)" : "rgba(239,68,68,0.7)";
        ctx!.strokeStyle = col; ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(x + CHART_CW / 2, baseY + scaleP(c.high));
        ctx!.lineTo(x + CHART_CW / 2, baseY + scaleP(c.low));
        ctx!.stroke();
        ctx!.fillStyle = col;
        const bodyTop = Math.min(baseY + scaleP(c.open), baseY + scaleP(c.close));
        ctx!.fillRect(x + 2, bodyTop, CHART_CW - 5, Math.max(1, Math.abs(scaleP(c.open) - scaleP(c.close))));
      }
      ctx!.restore();
    }

    function drawCurve(t: number, curve: typeof CURVES[0]) {
      const { pts, color: [R, G, B], yBase, h, speed } = curve;
      const n = pts.length;
      const segW = W / (n - 1) * 1.3;
      const scroll = (t * speed) % (segW * n);
      const yMid = yBase * H, yH = h * H;
      ctx!.save();
      ctx!.globalAlpha = 0.35;
      ctx!.beginPath();
      for (let i = 0; i < n + 2; i++) {
        const x = -scroll + i * segW;
        const y = yMid + yH / 2 - pts[i % n] * yH;
        i === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      }
      ctx!.lineTo(-scroll + (n + 1) * segW, yMid + yH);
      ctx!.lineTo(-scroll, yMid + yH);
      ctx!.closePath();
      const grad = ctx!.createLinearGradient(0, yMid - yH, 0, yMid + yH);
      grad.addColorStop(0, `rgba(${R},${G},${B},0.25)`);
      grad.addColorStop(1, `rgba(${R},${G},${B},0)`);
      ctx!.fillStyle = grad; ctx!.fill();
      ctx!.globalAlpha = 0.55;
      ctx!.strokeStyle = `rgba(${R},${G},${B},0.8)`;
      ctx!.lineWidth = 1.5; ctx!.lineJoin = "round";
      ctx!.beginPath();
      for (let i = 0; i < n + 2; i++) {
        const x = -scroll + i * segW;
        const y = yMid + yH / 2 - pts[i % n] * yH;
        i === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      }
      ctx!.stroke(); ctx!.restore();
    }

    function drawCoins(t: number) {
      COINS.forEach(c => {
        c.x = ((c.x + c.vx) % (W + 60)) - 30;
        c.y = ((c.y + c.vy + H * 2) % (H + 60)) - 30;
        c.angle += c.spin;
        const pulse = 0.7 + 0.3 * Math.sin(t * 0.8 + c.phase);
        ctx!.save();
        ctx!.globalAlpha = c.alpha * pulse;
        ctx!.translate(c.x, c.y);
        ctx!.rotate(c.angle);
        const g = ctx!.createRadialGradient(-c.r * 0.3, -c.r * 0.3, 0, 0, 0, c.r);
        g.addColorStop(0, "rgba(245,158,11,0.5)");
        g.addColorStop(0.6, "rgba(180,120,0,0.3)");
        g.addColorStop(1, "rgba(100,70,0,0.1)");
        ctx!.fillStyle = g;
        ctx!.strokeStyle = "rgba(245,158,11,0.3)";
        ctx!.lineWidth = 1;
        ctx!.beginPath(); ctx!.arc(0, 0, c.r, 0, Math.PI * 2);
        ctx!.fill(); ctx!.stroke();
        ctx!.fillStyle = "rgba(245,190,50,0.9)";
        ctx!.font = `bold ${c.r * 0.95}px system-ui, sans-serif`;
        ctx!.textAlign = "center"; ctx!.textBaseline = "middle";
        ctx!.fillText(c.sym, 0, 1);
        ctx!.restore();
      });
    }

    function drawTags(t: number) {
      TAGS.forEach(tag => {
        tag.x = ((tag.x + tag.vx) % (W + 200)) - 100;
        tag.y = ((tag.y + tag.vy + H * 2) % (H + 80)) - 40;
        const pulse = 0.65 + 0.35 * Math.sin(t * 0.6 + tag.phase);
        const [R, G, B] = tag.color;
        ctx!.save();
        ctx!.globalAlpha = tag.alpha * pulse;
        const fsize = 12;
        ctx!.font = `600 ${fsize}px system-ui, sans-serif`;
        const tw = ctx!.measureText(tag.label).width;
        const pad = 8, bw = tw + pad * 2, bh = fsize + pad * 1.4;
        roundRect(tag.x - bw / 2, tag.y - bh / 2, bw, bh, 6);
        ctx!.fillStyle = `rgba(${R},${G},${B},0.08)`;
        ctx!.strokeStyle = `rgba(${R},${G},${B},0.3)`;
        ctx!.lineWidth = 1; ctx!.fill(); ctx!.stroke();
        ctx!.fillStyle = `rgba(${R},${G},${B},0.95)`;
        ctx!.textAlign = "center"; ctx!.textBaseline = "middle";
        ctx!.fillText(tag.label, tag.x, tag.y + 1);
        ctx!.restore();
      });
    }

    function drawParticles() {
      PARTICLES.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });
      for (let i = 0; i < PARTICLES.length; i++) {
        for (let j = i + 1; j < PARTICLES.length; j++) {
          const dx = PARTICLES[i].x - PARTICLES[j].x;
          const dy = PARTICLES[i].y - PARTICLES[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            ctx!.strokeStyle = `rgba(59,130,246,${(1 - d / CONNECT_DIST) * 0.08})`;
            ctx!.lineWidth = 0.8;
            ctx!.beginPath();
            ctx!.moveTo(PARTICLES[i].x, PARTICLES[i].y);
            ctx!.lineTo(PARTICLES[j].x, PARTICLES[j].y);
            ctx!.stroke();
          }
        }
      }
      PARTICLES.forEach(p => {
        ctx!.fillStyle = "rgba(59,130,246,0.2)";
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx!.fill();
      });
    }

    function loop(ts: number) {
      if (!startTime) startTime = ts;
      const t = (ts - startTime) / 1000;
      const bg = ctx!.createLinearGradient(0, 0, W * 0.6, H);
      bg.addColorStop(0, "#0b1120");
      bg.addColorStop(0.5, "#0d1729");
      bg.addColorStop(1, "#080d18");
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, W, H);
      drawGrid();
      drawBlobs(t);
      drawParticles();
      drawChart(t, 0, H * 0.06, 0.18);
      drawChart(t * 0.7, 0, H * 0.40, 0.10);
      CURVES.forEach(c => drawCurve(t, c));
      drawCoins(t);
      drawTags(t);
      const vig = ctx!.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx!.fillStyle = vig;
      ctx!.fillRect(0, 0, W, H);
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
    />
  );
}
