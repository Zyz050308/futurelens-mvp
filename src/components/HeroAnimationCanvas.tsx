'use client';

import { useEffect, useRef } from 'react';

// 节点：数字生命的基本单元
type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseOpacity: number;
  colorBias: number; // 0..1  偏暖 = 更高
  phase: number;      // 独立相位（决定呼吸/闪烁
  clusterId: number;  // 所属群落 -1 表示自由
  age: number;
  maxLife: number;
  dying: boolean;
};

// 群落：一个小型神经网络/局部结构，若干节点被吸引到一起并互相连接
type Cluster = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifeProgress: number;
  maxLife: number;
  strength: number;     // 吸引力强度
  maxNodes: number;     // 期望容纳多少节点
  seed: number;
  pulse: number;        // 当前"活跃度"，影响连接数量与亮度
};

const TAU = Math.PI * 2;

// 颜色常量（橙金系，但偏暗，不发光灯泡
const CORE = [255, 149, 0];
const WARM = [255, 180, 75];
const GOLD = [255, 205, 130];
const DIM = [150, 110, 55];  // 更暗、不亮的暖色（外围节点
const WHIT = [255, 235, 200];

const mixColor = (t: number, alpha: number) => {
  let r: number, g: number, b: number;
  if (t < 0.3) {
    const k = t / 0.3;
    r = DIM[0] + (WARM[0] - DIM[0]) * k;
    g = DIM[1] + (WARM[1] - DIM[1]) * k;
    b = DIM[2] + (WARM[2] - DIM[2]) * k;
  } else if (t < 0.75) {
    const k = (t - 0.3) / 0.45;
    r = WARM[0] + (CORE[0] - WARM[0]) * k;
    g = WARM[1] + (CORE[1] - WARM[1]) * k;
    b = WARM[2] + (CORE[2] - WARM[2]) * k;
  } else {
    const k = (t - 0.75) / 0.25;
    r = CORE[0] + (WHIT[0] - CORE[0]) * k;
    g = CORE[1] + (WHIT[1] - CORE[1]) * k;
    b = CORE[2] + (WHIT[2] - CORE[2]) * k;
  }
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
};

export default function HeroAnimationCanvas() {
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
    let minSide = 0;
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
      cx = width / 2;
      cy = height / 2;
      minSide = Math.min(width, height);
      isMobile = width < 520;
    };
    setupSize();

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    // 节点系统
    const nodes: Node[] = [];
    const MAX_NODES = isMobile ? 280 : 460;
    const seedCount = isMobile ? 180 : 300;

    // 群落系统（多个小型局部网络
    const clusters: Cluster[] = [];
    const MAX_CLUSTERS = isMobile ? 3 : 5;

    const makeNode = (sx: number, sy: number, clusterId: number): Node => ({
      x: sx,
      y: sy,
      vx: rand(-0.15, 0.15),
      vy: rand(-0.15, 0.15),
      size: rand(0.8, 3.2),
      baseOpacity: rand(0.2, 0.55),
      colorBias: rand(0.1, 0.7),
      phase: Math.random() * TAU,
      clusterId,
      age: 0,
      maxLife: Math.floor(rand(180, 420)),
      dying: false,
    });

    // 初始撒一批节点——在容器内均匀+中心略密（不是环绕，是分布
    for (let i = 0; i < seedCount; i++) {
      // 近似高斯分布，中心略密，但没有轨道感
      const r = Math.pow(Math.random(), 0.7) * minSide * 0.48;
      const a = Math.random() * TAU;
      nodes.push(makeNode(cx + Math.cos(a) * r, cy + Math.sin(a) * r * rand(0.75, 1.1), -1));
    }

    const spawnCluster = (near: { x: number; y: number } | null = null) => {
      let sx = cx + rand(-minSide * 0.3, minSide * 0.3);
      let sy = cy + rand(-minSide * 0.3, minSide * 0.3);
      if (near) {
        sx = near.x + rand(-minSide * 0.08, minSide * 0.08);
        sy = near.y + rand(-minSide * 0.08, minSide * 0.08);
      }
      clusters.push({
        x: sx,
        y: sy,
        vx: rand(-0.06, 0.06),
        vy: rand(-0.06, 0.06),
        lifeProgress: 0,
        maxLife: Math.floor(rand(240, 520)),
        strength: rand(0.5, 1.2),
        maxNodes: Math.floor(rand(20, 55)),
        seed: Math.random() * 1000,
        pulse: 0,
      });
    };

    // 启动 3 个初始群落
    for (let i = 0; i < 3; i++) spawnCluster();

    // ResizeObserver
    let resizeTimer: number | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const oldMin = minSide || 1;
        setupSize();
        const k = minSide / oldMin;
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.x = cx + (n.x - cx) * k;
          n.y = cy + (n.y - cy) * k;
        }
        for (let i = 0; i < clusters.length; i++) {
          const c = clusters[i];
          c.x = cx + (c.x - cx) * k;
          c.y = cy + (c.y - cy) * k;
        }
      }, 180);
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // 事件：每隔 2-4 秒触发一次"变化"——聚集、断开、连接、亮起
    let nextEventAt = performance.now() + rand(1800, 3200);

    const triggerEvent = (now: number) => {
      // 随机事件：新增集群 / 让一个集群活跃 / 让一个集群消散 / 随机一些节点换群
      const r = Math.random();
      if (r < 0.45 && clusters.length < MAX_CLUSTERS) {
        spawnCluster();
      } else if (r < 0.75 && clusters.length > 0) {
        // 让某个随机集群短暂"兴奋"：脉冲一次
        const idx = Math.floor(Math.random() * clusters.length);
        clusters[idx].pulse = 1.0;
      } else if (clusters.length > 2) {
        // 让最老的一个集群开始消散
        clusters[0].lifeProgress = clusters[0].maxLife - 60;
      }

      // 给一小部分自由节点重新分配到一个随机集群（模拟连接变化
      if (clusters.length > 0) {
        let reassigned = 0;
        for (let i = 0; i < nodes.length && reassigned < 20; i++) {
          if (nodes[i].clusterId === -1 && Math.random() < 0.04) {
            nodes[i].clusterId = Math.floor(Math.random() * clusters.length);
            reassigned++;
          }
        }
      }
      nextEventAt = now + rand(1800, 3200);
    };

    // 主循环
    let lastTime = performance.now();
    let frame = 0;

    const draw = (now: number) => {
      const dt = Math.min(64, now - lastTime);
      lastTime = now;
      const speedScale = dt / 16.67;
      frame++;

      // 背景：深色，但不是纯黑——有非常非常淡的暖色调散景
      ctx.fillStyle = 'rgba(10,12,16,0.55';
      ctx.fillRect(0, 0, width, height);

      // 轻微的底色暖点（极淡，不抢戏——在中心附近
      const baseAmbient = ctx.createRadialGradient(cx, cy, 0, cx, cy, minSide * 0.45);
      baseAmbient.addColorStop(0, `rgba(${WARM[0]},${WARM[1]},${WARM[2]},0.045)`);
      baseAmbient.addColorStop(1, 'rgba(255,149,0,0)');
      ctx.fillStyle = baseAmbient;
      ctx.fillRect(0, 0, width, height);

      // 事件触发
      if (now > nextEventAt) triggerEvent(now);

      // === 群落更新 ===
      for (let i = clusters.length - 1; i >= 0; i--) {
        const c = clusters[i];
        c.lifeProgress += 1;
        // 群落缓慢漂移（非常慢
        const driftAng = now * 0.0002 + c.seed;
        c.vx += (Math.cos(driftAng) * 0.004 + (cx - c.x) * 0.00002);
        c.vy += (Math.sin(driftAng) * 0.004 + (cy - c.y) * 0.00002);
        c.vx *= 0.985;
        c.vy *= 0.985;
        c.x += c.vx * speedScale;
        c.y += c.vy * speedScale;
        // 脉冲衰减
        c.pulse *= 0.98;

        // 吸引此集群的节点到它附近——短距离聚集
        // 找附近节点，并逐步把 clusterId 分配给它
        if (c.lifeProgress < c.maxLife * 0.9) {
          // 把部分属于它的节点保持吸引；同时让附近的一些自由节点加入
          let joined = 0;
          for (let i2 = 0; i2 < nodes.length && joined < 2; i2++) {
            const n = nodes[i2];
            if (n.clusterId === -1) {
              const dx = c.x - n.x;
              const dy = c.y - n.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < (minSide * 0.12) * (minSide * 0.12) && Math.random() < 0.02) {
                n.clusterId = i;
                joined++;
              }
            }
          }
        }

        // 生命末期：让部分节点脱离
        if (c.lifeProgress > c.maxLife * 0.75) {
          for (let i2 = 0; i2 < nodes.length; i2++) {
            const n = nodes[i2];
            if (n.clusterId === i && Math.random() < 0.01) {
              n.clusterId = -1;
            }
          }
        }

        if (c.lifeProgress >= c.maxLife) {
          // 释放所有节点到自由
          for (let i2 = 0; i2 < nodes.length; i2++) {
            if (nodes[i2].clusterId === i) nodes[i2].clusterId = -1;
          }
          clusters.splice(i, 1);
          // 索引重分配：删除后后面的索引会变
          for (let i2 = 0; i2 < nodes.length; i2++) {
            if (nodes[i2].clusterId > i) nodes[i2].clusterId--;
          }
        }
      }

      // === 节点更新 ===
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        n.age++;

        // 1) 若属于群落，被群落中心吸引——局部聚集
        if (n.clusterId >= 0 && n.clusterId < clusters.length) {
          const c = clusters[n.clusterId];
          if (c) {
            const dx = c.x - n.x;
            const dy = c.y - n.y;
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            // 期望距离：群落内允许一定半径，不全部挤在一点
            const desired = minSide * 0.05;
            const force = (d - desired) * 0.0008 * c.strength;
            n.vx += (dx / d) * force * speedScale;
            n.vy += (dy / d) * force * speedScale;
            // 轻微的旋转扰动——但不是公转，是类似流动：
            const swirl = 0.0004 * (0.5 + c.pulse);
            n.vx += -dy / d * swirl * speedScale;
            n.vy += dx / d * swirl * speedScale;
          }
        } else {
          // 自由节点：小范围随机游走，略微被中心吸引但不强
          const dx = cx - n.x;
          const dy = cy - n.y;
          const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
          const desired = minSide * 0.25;
          const force = (d - desired) * 0.00012;
          n.vx += (dx / d) * force * speedScale;
          n.vy += (dy / d) * force * speedScale;
        }

        // 2) 个体噪声漂移
        n.vx += Math.sin(now * 0.0006 + n.phase) * 0.01;
        n.vy += Math.cos(now * 0.0007 + n.phase * 1.3) * 0.01;

        // 3) 阻尼
        n.vx *= 0.975;
        n.vy *= 0.975;

        // 4) 位移
        n.x += n.vx * speedScale;
        n.y += n.vy * speedScale;

        // 边界软约束（不让跑出画面
        const margin = minSide * 0.48;
        if (n.x < cx - margin) { n.vx += 0.05; }
        if (n.x > cx + margin) { n.vx -= 0.05; }
        if (n.y < cy - margin) { n.vy += 0.05; }
        if (n.y > cy + margin) { n.vy -= 0.05; }

        // 5) 生命周期管理（节点的生与死
        if (n.age > n.maxLife - 80) n.dying = true;
        if (n.age > n.maxLife || n.baseOpacity < 0.01) {
          nodes.splice(i, 1);
          continue;
        }
      }

      // === 持续补充新节点（自由节点为主，在画面各处
      if (nodes.length < MAX_NODES) {
        const toAdd = Math.min(4, MAX_NODES - nodes.length);
        for (let i = 0; i < toAdd; i++) {
          // 在画面某个随机位置出生：以中心为基础 + 大范围随机
          const r = Math.pow(Math.random(), 0.7) * minSide * 0.48;
          const a = Math.random() * TAU;
          nodes.push(makeNode(cx + Math.cos(a) * r, cy + Math.sin(a) * r * rand(0.75, 1.1), -1));
        }
      }

      // === 连接绘制（局部连接、只在同一群落内部
      for (let ci = 0; ci < clusters.length; ci++) {
        const c = clusters[ci];
        // 收集属于此群落的节点索引
        const idx: number[] = [];
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].clusterId === ci) idx.push(i);
        }
        if (idx.length < 2) continue;

        // 计算"成熟度"——决定连接是否可见
        const lifeT = c.lifeProgress / c.maxLife;
        // 用一条钟形曲线：0..1..0  中间最高
        const bell = Math.sin(lifeT * Math.PI);
        const connectRadius = minSide * (0.06 + 0.05 * c.pulse) * (0.5 + bell);
        const connectAlpha = 0.18 * (0.4 + bell + c.pulse * 0.8);

        // 只检查"附近"配对——滑动窗口避免 O(n^2)
        // 按 x 简单排序后滑动窗口
        idx.sort((ia, ib) => nodes[ia].x - nodes[ib].x);
        const win = Math.min(idx.length, 14);
        for (let a = 0; a < idx.length; a++) {
          const na = nodes[idx[a]];
          const end = Math.min(idx.length, a + win);
          for (let b = a + 1; b < end; b++) {
            const nb = nodes[idx[b]];
            const dx = na.x - nb.x;
            const dy = na.y - nb.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < connectRadius * connectRadius) {
              const d = Math.sqrt(d2);
              const alpha = (1 - d / connectRadius) * connectAlpha;
              // 线颜色：偏暖橙，不发光
              ctx.strokeStyle = `rgba(${WARM[0]},${WARM[1]},${WARM[2]},${alpha})`;
              ctx.lineWidth = 0.55;
              ctx.beginPath();
              ctx.moveTo(na.x, na.y);
              ctx.lineTo(nb.x, nb.y);
              ctx.stroke();
            }
          }
        }
      }

      // === 绘制节点 ===
      const breathNow = Math.sin(now * 0.0012);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const flick = 0.7 + Math.sin(now * 0.0025 + n.phase) * 0.3;
        let life = 1;
        if (n.age < 30) life = n.age / 30;
        else if (n.age > n.maxLife - 80) life = Math.max(0, (n.maxLife - n.age) / 80);
        // 群落中心的节点稍亮
        let boost = 1.0;
        if (n.clusterId >= 0 && n.clusterId < clusters.length) {
          const c = clusters[n.clusterId];
          const bell = Math.sin((c.lifeProgress / c.maxLife) * Math.PI);
          boost = 1 + bell * 0.35 + c.pulse * 0.4;
        }
        const alpha = Math.min(1, n.baseOpacity * flick * boost * life);
        const colorT = Math.min(1, n.colorBias + (boost - 1) * 0.3);
        const col = mixColor(colorT, alpha);
        const sz = n.size * (1 + 0.1 * breathNow * 0.3 + (boost - 1) * 0.5);

        ctx.beginPath();
        ctx.arc(n.x, n.y, sz, 0, TAU);
        ctx.fillStyle = col;
        ctx.fill();
      }

      // === 中心"核心"（不是太阳/能量球——只是一个小而柔和的呼吸点
      const coreSize = rand(40, 60); // 这里只用一次启动值——但用户要"40-60px"
      // 实际用 minSide 的 0.06-0.1 区间
      const coreR = minSide * 0.08 * (1 + breathNow * 0.08);
      // 非常柔和的径向渐变——低亮度、不刺眼
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, `rgba(${WARM[0]},${WARM[1]},${WARM[2]},0.18)`);
      coreGrad.addColorStop(0.5, `rgba(${WARM[0]},${WARM[1]},${WARM[2]},0.06)`);
      coreGrad.addColorStop(1, 'rgba(255,149,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(cx - coreR, cy - coreR, coreR * 2, coreR * 2);

      // 中心最小的实体点（非常小，不显眼
      const hotR = minSide * 0.02 * (1 + breathNow * 0.15);
      const hotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hotR * 2);
      hotGrad.addColorStop(0, `rgba(${GOLD[0]},${GOLD[1]},${GOLD[2]},0.55)`);
      hotGrad.addColorStop(1, 'rgba(255,205,130,0)');
      ctx.fillStyle = hotGrad;
      ctx.fillRect(cx - hotR * 2, cy - hotR * 2, hotR * 4, hotR * 4);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      ro.disconnect();
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      nodes.length = 0;
      clusters.length = 0;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block"
    />
  );
}
