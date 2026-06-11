'use client';

import { useEffect, useRef } from 'react';

type Particle = {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  phase: number;
  kind: number; // 0 主橙, 1 浅金高亮, 2 淡橙, 3 白金
  driftAmp: number;
  flowAngle: number;
  pulseBias: number;
  dissolveLerp: number; // 0 不溶解, 1 溶解拖尾
};

const TAU = Math.PI * 2;

// 高斯采样
function gaussRand(): number {
  const u1 = Math.max(0.0001, Math.random());
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(TAU * u2);
}

// 在椭圆内生成点 (cx,cy,rx,ry, rotation 0)
function inEllipse(ndx: number, ndy: number) {
  return ndx * ndx + ndy * ndy <= 1;
}

export default function PersonAnimationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let isMobile = false;

    const setupSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width * 0.55;
      cy = height * 0.50;
      isMobile = Math.min(width, height) < 480;
    };
    setupSize();

    // ============== 区域定义（相对画布 scale） ==============
    // 头部（椭圆）: 中心略上偏右，半径较大
    // 面部高亮条带: 额头/鼻梁/嘴/下巴（子区域）
    // 颈部: 矩形+圆角，连接头和胸
    // 肩胸: 大曲面梯形，最宽
    // 溶解区: 头部右/后、肩右、胸右下方

    const particles: Particle[] = [];

    const pickKind = (): number => {
      const r = Math.random();
      if (r < 0.62) return 0;
      if (r < 0.82) return 1;
      if (r < 0.95) return 2;
      return 3;
    };

    const makeParticle = (
      bx: number,
      by: number,
      sizeMul = 1,
      opMul = 1,
      kind = -1,
      dissolve = 0,
      flowAngle = 0,
    ): Particle => ({
      baseX: bx,
      baseY: by,
      x: bx,
      y: by,
      size: (0.5 + Math.random() * 1.6) * sizeMul,
      opacity: (0.18 + Math.random() * 0.55) * opMul,
      phase: Math.random() * TAU,
      kind: kind >= 0 ? kind : pickKind(),
      driftAmp: 0.8 + Math.random() * 2.6,
      flowAngle,
      pulseBias: Math.random(),
      dissolveLerp: dissolve,
    });

    const buildParticles = () => {
      particles.length = 0;

      const hh = height * 0.82; // 人物高度
      const hw = width * 0.48; // 人物宽度

      // ============= A. 头部椭圆（体积） =============
      const headCx = cx + hw * 0.05;
      const headCy = cy - hh * 0.22;
      const headRx = hw * 0.28;
      const headRy = hh * 0.22;
      // 为了"侧脸"，左侧更密：我们按 x 方向分层
      const headCount = isMobile ? 650 : 1500;
      let placed = 0;
      let attempts = 0;
      while (placed < headCount && attempts < headCount * 12) {
        attempts++;
        // 高斯分布中心
        const gx = gaussRand() * 0.35;
        const gy = gaussRand() * 0.35;
        if (Math.abs(gx) > 1 || Math.abs(gy) > 1) continue;
        // 侧脸特征：左侧 (x < center) 稍微更密 → 让 x 偏负
        let bx = headCx + gx * headRx;
        let by = headCy + gy * headRy;
        // 只保留椭圆内
        const ndx = (bx - headCx) / headRx;
        const ndy = (by - headCy) / headRy;
        if (ndx * ndx + ndy * ndy > 1) continue;

        // 左侧（面部）粒子更亮更大
        const faceSide = Math.max(0, -ndx); // 越往左越大
        const opBoost = 0.7 + faceSide * 0.6;
        const sizeBoost = 0.85 + faceSide * 0.55;

        particles.push(makeParticle(bx, by, sizeBoost, opBoost));
        placed++;
      }

      // ============= B. 面部特征高亮（额头/鼻梁/嘴/下巴） =============
      // 额头：头部左上区域
      const browCount = isMobile ? 220 : 520;
      for (let i = 0; i < browCount; i++) {
        const t = Math.random();
        const bx = headCx + (-0.18 - t * 0.12) * hw + gaussRand() * hw * 0.03;
        const by = headCy + (-0.25 + Math.random() * 0.15) * hh + gaussRand() * hh * 0.02;
        particles.push(makeParticle(bx, by, 1.4, 1.4, 1));
      }
      // 鼻梁：从额头下至鼻尖
      const noseCount = isMobile ? 180 : 420;
      for (let i = 0; i < noseCount; i++) {
        const t = Math.random();
        const bx = headCx + (-0.25 - t * 0.12) * hw + gaussRand() * hw * 0.025;
        const by = headCy + (-0.05 + t * 0.12) * hh + gaussRand() * hh * 0.025;
        particles.push(makeParticle(bx, by, 1.35, 1.5, 1));
      }
      // 鼻尖
      for (let i = 0; i < (isMobile ? 80 : 200); i++) {
        const bx = headCx - hw * 0.42 + gaussRand() * hw * 0.02;
        const by = headCy + hh * 0.08 + gaussRand() * hh * 0.02;
        particles.push(makeParticle(bx, by, 1.8, 1.8, 1));
      }
      // 嘴
      for (let i = 0; i < (isMobile ? 140 : 320); i++) {
        const t = Math.random();
        const bx = headCx + (-0.28 - t * 0.08) * hw + gaussRand() * hw * 0.025;
        const by = headCy + hh * (0.22 + Math.random() * 0.04) + gaussRand() * hh * 0.02;
        particles.push(makeParticle(bx, by, 1.3, 1.5, 1));
      }
      // 下巴
      for (let i = 0; i < (isMobile ? 120 : 280); i++) {
        const bx = headCx - hw * 0.18 + gaussRand() * hw * 0.045;
        const by = headCy + hh * (0.30 + Math.random() * 0.03) + gaussRand() * hh * 0.02;
        particles.push(makeParticle(bx, by, 1.3, 1.5, 1));
      }

      // ============= C. 颈部 =============
      const neckTopY = headCy + headRy * 0.85;
      const neckBottomY = cy + hh * 0.18;
      const neckLeftX = cx - hw * 0.08;
      const neckRightX = cx + hw * 0.06;
      const neckCount = isMobile ? 350 : 800;
      for (let i = 0; i < neckCount; i++) {
        const t = Math.random();
        const by = neckTopY + (neckBottomY - neckTopY) * t + gaussRand() * hh * 0.015;
        // 颈部宽度：越往下越宽
        const widen = 0.15 + t * 0.1;
        const bx = (neckLeftX + neckRightX) / 2 + (Math.random() - 0.5) * hw * widen;
        particles.push(makeParticle(bx, by, 0.95, 0.95));
      }

      // ============= D. 肩胸区域（大梯形曲面） =============
      const chestCy = cy + hh * 0.36;
      const chestRx = hw * 0.42; // 水平半宽
      const chestRy = hh * 0.24; // 垂直半高
      // 梯形上边较窄，下边更宽
      const chestCount = isMobile ? 800 : 1800;
      placed = 0;
      attempts = 0;
      while (placed < chestCount && attempts < chestCount * 8) {
        attempts++;
        // 在椭圆 + 梯形混合形状中采样
        const gx = gaussRand() * 0.45;
        const gy = gaussRand() * 0.45;
        if (Math.abs(gx) > 1.1 || Math.abs(gy) > 1.1) continue;
        // 形状：以 chestCy 为中心，宽度随 y 下降而略增加
        const vertT = (gy + 0.5); // 0 上 ~1 下
        const localRx = chestRx * (0.78 + vertT * 0.22);
        const bx = cx + gx * localRx;
        const by = chestCy + gy * chestRy;
        // 控制不要超出肩范围
        if (by < neckBottomY - hh * 0.05) continue;
        if (by > chestCy + chestRy * 1.05) continue;
        const ndx = (bx - cx) / localRx;
        if (ndx * ndx > 1) continue;
        // 右肩与右胸位置稍微更亮一点
        const rightBoost = Math.max(0, ndx - 0.1) * 0.6;
        particles.push(makeParticle(bx, by, 0.9 + rightBoost * 0.3, 0.85 + rightBoost * 0.5));
        placed++;
      }

      // 胸口中心高亮（一个小核心）
      for (let i = 0; i < (isMobile ? 120 : 260); i++) {
        const bx = cx + gaussRand() * hw * 0.04;
        const by = chestCy - hh * 0.03 + gaussRand() * hh * 0.03;
        particles.push(makeParticle(bx, by, 1.7, 1.9, 1));
      }

      // ============= E. 溶解粒子（右侧/后脑/右肩/右胸） =============
      // 从身体边缘向右/右上/右下缓慢消散
      const dissolveCount = isMobile ? 350 : 850;
      for (let i = 0; i < dissolveCount; i++) {
        const region = Math.random();
        let bx: number, by: number, flowAng: number;
        if (region < 0.35) {
          // 头部右后侧
          const ang = -0.5 + Math.random() * 0.8;
          const rad = 0.55 + Math.random() * 0.3;
          bx = headCx + Math.cos(ang) * headRx * rad + hw * 0.05;
          by = headCy + Math.sin(ang) * headRy * rad + hh * 0.05;
          flowAng = 0.35 + (Math.random() - 0.5) * 0.6;
        } else if (region < 0.7) {
          // 右肩/右上
          const ang = -0.2 + Math.random() * 0.5;
          const rad = 0.7 + Math.random() * 0.3;
          bx = cx + hw * 0.2 + Math.cos(ang) * chestRx * rad;
          by = chestCy - hh * 0.1 + Math.sin(ang) * chestRy * rad;
          flowAng = 0.25 + (Math.random() - 0.5) * 0.5;
        } else {
          // 右胸下
          const ang = 0.1 + Math.random() * 0.5;
          const rad = 0.7 + Math.random() * 0.35;
          bx = cx + hw * 0.1 + Math.cos(ang) * chestRx * rad;
          by = chestCy + hh * 0.08 + Math.sin(ang) * chestRy * rad;
          flowAng = 0.55 + (Math.random() - 0.5) * 0.5;
        }
        // 向外扩散一段距离
        const outwardDist = hw * (0.06 + Math.random() * 0.18);
        bx += Math.cos(flowAng) * outwardDist;
        by += Math.sin(flowAng) * outwardDist;
        const p = makeParticle(bx, by, 0.85, 0.55 + Math.random() * 0.25, -1, 1, flowAng);
        p.dissolveLerp = 1;
        particles.push(p);
      }

      // ============= F. 背景散点（环境粒子） =============
      const bgCount = isMobile ? 200 : 450;
      for (let i = 0; i < bgCount; i++) {
        const bx = Math.random() * width;
        const by = Math.random() * height;
        particles.push(makeParticle(bx, by, 0.5 + Math.random() * 0.5, 0.12 + Math.random() * 0.18, 2));
      }
    };

    buildParticles();

    // ResizeObserver
    let resizeTimer: number | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        setupSize();
        buildParticles();
      }, 200);
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // ============ 主循环 ============
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(64, now - lastTime);
      lastTime = now;

      // 半透明叠层：拖尾 + 体积感
      ctx.fillStyle = 'rgba(5,7,10,0.22)';
      ctx.fillRect(0, 0, width, height);

      const breathe = Math.sin(now * 0.0008) * 0.5 + 0.5;
      const globalAlpha = 0.92 + (breathe - 0.5) * 0.1;
      void dt;

      // 1) 身体内部雾化橙光（多层 radial gradient）
      const bodyGlow1 = ctx.createRadialGradient(
        cx, cy - height * 0.06, 0,
        cx, cy - height * 0.06, Math.max(width, height) * 0.38,
      );
      bodyGlow1.addColorStop(0, `rgba(255, 170, 70, ${0.11 + breathe * 0.05})`);
      bodyGlow1.addColorStop(0.35, `rgba(255, 149, 0, ${0.055 + breathe * 0.025})`);
      bodyGlow1.addColorStop(1, 'rgba(255, 149, 0, 0)');
      ctx.fillStyle = bodyGlow1;
      ctx.fillRect(0, 0, width, height);

      const bodyGlow2 = ctx.createRadialGradient(
        cx, cy + height * 0.18, 0,
        cx, cy + height * 0.18, Math.max(width, height) * 0.32,
      );
      bodyGlow2.addColorStop(0, `rgba(255, 160, 60, ${0.07 + breathe * 0.03})`);
      bodyGlow2.addColorStop(0.4, `rgba(255, 149, 0, 0.03)`);
      bodyGlow2.addColorStop(1, 'rgba(255, 149, 0, 0)');
      ctx.fillStyle = bodyGlow2;
      ctx.fillRect(0, 0, width, height);

      // 2) 粒子
      // "lighter" 合成制造发光感
      ctx.globalCompositeOperation = 'lighter';

      // 高亮波（沿身体流动的局部亮区）
      // 三个波：面部 · 颈部 · 胸口
      const waveT = (now * 0.00012) % 1;
      const waveTy = (now * 0.00009) % 1;
      const waveFaceY = cy - height * 0.22 + Math.sin(waveT * TAU) * height * 0.03;
      const waveNeckY = cy - height * 0.02 + Math.sin(waveTy * TAU) * height * 0.02;
      const waveChestY = cy + height * 0.18 + Math.cos(waveT * TAU) * height * 0.02;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 位置更新：围绕 baseX/baseY 的微漂移 + 溶解流动
        let dx: number, dy: number;
        if (p.dissolveLerp > 0.5) {
          // 溶解粒子：向 flowAngle 缓慢漂
          dx = Math.cos(p.flowAngle) * (0.25 + p.driftAmp * 0.05) +
               Math.sin(now * 0.0006 + p.phase) * 0.6;
          dy = Math.sin(p.flowAngle) * (0.25 + p.driftAmp * 0.05) * 0.85 +
               Math.cos(now * 0.0007 + p.phase) * 0.5;
          p.x = p.baseX + dx;
          p.y = p.baseY + dy;
        } else {
          dx = Math.sin(now * 0.0005 + p.phase) * p.driftAmp;
          dy = Math.cos(now * 0.00065 + p.phase) * p.driftAmp * 0.8;
          p.x = p.baseX + dx;
          p.y = p.baseY + dy;
        }

        // 局部高亮贡献：基于到三个波位置的距离
        let waveBoost = 0;
        const d1 = Math.abs(p.y - waveFaceY);
        const d2 = Math.abs(p.y - waveNeckY);
        const d3 = Math.abs(p.y - waveChestY);
        const bandH = height * 0.055;
        waveBoost = Math.max(waveBoost, Math.max(0, 1 - d1 / bandH) * 0.9);
        waveBoost = Math.max(waveBoost, Math.max(0, 1 - d2 / bandH) * 0.7);
        waveBoost = Math.max(waveBoost, Math.max(0, 1 - d3 / bandH) * 0.8);

        // 闪烁
        const flick = 0.7 + Math.sin(now * 0.002 + p.phase) * 0.3;
        const a = Math.min(1, p.opacity * flick * globalAlpha * (1 + waveBoost));

        const r = p.size * (1 + waveBoost * 0.35);

        // 绘制：先画一个较大的透明光晕，再画中心实点
        let color1 = `rgba(255,149,0,${a * 0.18})`;
        let color2 = `rgba(255,149,0,${a})`;
        if (p.kind === 1) {
          color1 = `rgba(255,213,154,${a * 0.22})`;
          color2 = `rgba(255,213,154,${a * 0.95})`;
        } else if (p.kind === 2) {
          color1 = `rgba(255,149,0,${a * 0.12})`;
          color2 = `rgba(255,149,0,${a * 0.45})`;
        } else if (p.kind === 3) {
          color1 = `rgba(255,240,220,${a * 0.25})`;
          color2 = `rgba(255,255,255,${a * 0.85})`;
        }

        // 外光晕
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3.2, 0, TAU);
        ctx.fillStyle = color1;
        ctx.fill();
        // 中心实点
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.fillStyle = color2;
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';

      rafRef.current = requestAnimationFrame(draw);
    };

    // 初始黑底
    ctx.fillStyle = '#05070A';
    ctx.fillRect(0, 0, width, height);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      ro.disconnect();
      if (resizeTimer !== null) clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block"
    />
  );
}
