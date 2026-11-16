(() => {
  'use strict';

  // --- 1. Mode Switcher (Friendly vs Engineering) & Mobile Nav ---
  const modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.setMode;
      document.body.setAttribute('data-mode', mode);
      modeBtns.forEach((b) => b.classList.toggle('active', b === btn));
    });
  });

  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const mainNav = document.querySelector('.main-nav');
  if (mobileBtn && mainNav) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- 2. Exact Cheonbu-81 9x9 Matrix Data (from SSOT & Master Synthesis) ---
  const CHEONBU_ROWS = [
    [ ['一',1], ['始',1], ['無',0], ['始',1], ['一',1], ['析',-1], ['三',1], ['極',0], ['無',0] ],
    [ ['盡',0], ['本',0], ['天',1], ['一',1], ['一',1], ['地',-1], ['一',-1], ['二',-1], ['人',0] ],
    [ ['一',1], ['三',1], ['一',1], ['積',1], ['十',0], ['鉅',-1], ['無',0], ['匱',-1], ['化',0] ],
    [ ['三',1], ['天',1], ['二',-1], ['三',1], ['地',-1], ['二',-1], ['三',1], ['人',0], ['二',-1] ],
    [ ['三',1], ['大',1], ['三',1], ['合',0], ['六',0], ['生',1], ['七',1], ['八',-1], ['九',1] ],
    [ ['運',0], ['三',1], ['四',-1], ['成',0], ['環',0], ['五',1], ['七',1], ['一',1], ['妙',0] ],
    [ ['衍',0], ['萬',-1], ['往',-1], ['萬',-1], ['來',1], ['用',0], ['變',-1], ['不',0], ['動',0] ],
    [ ['本',0], ['本',0], ['心',0], ['本',0], ['太',1], ['陽',1], ['昂',1], ['明',1], ['人',0] ],
    [ ['中',0], ['天',1], ['地',-1], ['一',1], ['一',1], ['終',0], ['無',0], ['終',0], ['一',1] ]
  ];

  // --- 3. Hero Interactive Canvas, Showcase & Ambient Mesh ---
  const scrollProgress = document.getElementById('scrollProgress');
  window.addEventListener('scroll', () => {
    if (!scrollProgress) return;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? (window.scrollY / docH) * 100 : 0;
    scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }, { passive: true });

  const bgCanvas = document.getElementById('bgQuantumCanvas');
  const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
  const bgNodes = [];
  if (bgCanvas && bgCtx) {
    const resizeBg = () => {
      bgCanvas.width = bgCanvas.offsetWidth;
      bgCanvas.height = bgCanvas.offsetHeight;
    };
    resizeBg();
    window.addEventListener('resize', resizeBg);
    const colors = ['#38BDF8', '#E3B341', '#34D399'];
    for (let i = 0; i < 28; i++) {
      bgNodes.push({
        x: Math.random() * (bgCanvas.width || 1200),
        y: Math.random() * (bgCanvas.height || 700),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.5 + Math.random() * 1.8,
        c: colors[i % 3]
      });
    }
  }

  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const heroShowcase = document.getElementById('heroShowcase');
  const showcaseSlides = heroShowcase ? heroShowcase.querySelectorAll('.showcase-slide') : [];
  const showcaseCaption = document.getElementById('showcaseCaption');
  const readout = document.getElementById('heroReadout');
  const cavityTabs = document.querySelectorAll('.cavity-tab');
  let activeViz = 'ring';
  let animPhase = 0;
  let slideIdx = 0;
  const heroPulses = [];

  if (canvas) {
    canvas.addEventListener('click', (e) => {
      if (activeViz !== 'ring') return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      heroPulses.push({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        r: 6,
        alpha: 0.9
      });
    });
  }

  if (showcaseSlides.length > 0) {
    setInterval(() => {
      if (activeViz !== 'showcase') return;
      showcaseSlides[slideIdx].classList.remove('active');
      slideIdx = (slideIdx + 1) % showcaseSlides.length;
      showcaseSlides[slideIdx].classList.add('active');
      if (showcaseCaption) showcaseCaption.textContent = showcaseSlides[slideIdx].alt;
    }, 4500);
  }

  cavityTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activeViz = tab.dataset.viz;
      cavityTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      if (canvas && heroShowcase) {
        const isShowcase = activeViz === 'showcase';
        canvas.hidden = isShowcase;
        heroShowcase.hidden = !isShowcase;
      }
      if (readout) {
        if (activeViz === 'ring') {
          readout.innerHTML =
            '<span><strong>광로:</strong> 140.99 mm/lap (77K)</span>' +
            '<span><strong>비행시간:</strong> 0.4703 ns</span>' +
            '<span><strong>상태:</strong> [IDEALIZED_SIMULATION]</span>';
        } else if (activeViz === 'grid') {
          readout.innerHTML =
            '<span><strong>격자:</strong> 9×9 = 81 Qutrits</span>' +
            '<span><strong>코어:</strong> (4,4) 六 · 成環 루프</span>' +
            '<span><strong>상태:</strong> [CODE-VERIFIED]</span>';
        } else {
          readout.innerHTML =
            '<span><strong>아카이브:</strong> AXON 실물 비전</span>' +
            '<span><strong>모션:</strong> Ken Burns 자동 전환</span>' +
            '<span><strong>상태:</strong> [ENGINEERING]</span>';
        }
      }
    });
  });

  function drawRingCavity(t) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Subtle grid background
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 28) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 20; y < h; y += 28) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 58x58mm Cavity Lid outer frame
    const lidSize = 310;
    const halfLid = lidSize / 2;
    ctx.strokeStyle = 'rgba(227, 179, 65, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - halfLid, cy - halfLid, lidSize, lidSize);

    // Label
    ctx.fillStyle = '#9CB3C5';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('58.00 × 58.00 mm Cavity Lid (Rev C)', cx - halfLid, cy - halfLid - 10);

    // Ø50mm circular pocket
    const pocketR = 132;
    ctx.beginPath();
    ctx.arc(cx, cy, pocketR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(11, 29, 44, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4 planar 45-deg 6N Gold mirror facets
    const rDiamond = 116;
    const pts = [
      { x: cx, y: cy - rDiamond, label: 'M1 (45°)' },
      { x: cx + rDiamond, y: cy, label: 'M2 (45°)' },
      { x: cx, y: cy + rDiamond, label: 'M3 (45°)' },
      { x: cx - rDiamond, y: cy, label: 'M4 (45°)' }
    ];

    // Draw optical ring path
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw 6N Gold mirror facets
    pts.forEach((p, idx) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      const angle = idx % 2 === 0 ? 0 : Math.PI / 2;
      ctx.rotate(angle);
      ctx.fillStyle = '#E3B341';
      ctx.fillRect(-20, -3, 40, 6);
      ctx.restore();
    });

    // Animated photon packet + trailing tail along 4-bounce path
    const seg = Math.floor(t * 4) % 4;
    const frac = (t * 4) % 1;
    const pA = pts[seg];
    const pB = pts[(seg + 1) % 4];
    const px = pA.x + (pB.x - pA.x) * frac;
    const py = pA.y + (pB.y - pA.y) * frac;

    // Mirror reflection flash when photon hits facet
    if (frac < 0.18) {
      const flashAlpha = (1 - frac / 0.18) * 0.75;
      ctx.beginPath();
      ctx.arc(pA.x, pA.y, 12 + frac * 40, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(227, 179, 65, ${flashAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Optical beam trail
    const trailFrac = Math.max(0, frac - 0.25);
    const tx = pA.x + (pB.x - pA.x) * trailFrac;
    const ty = pA.y + (pB.y - pA.y) * trailFrac;
    const trailGrad = ctx.createLinearGradient(tx, ty, px, py);
    trailGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    trailGrad.addColorStop(1, 'rgba(56, 189, 248, 0.95)');
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(px, py);
    ctx.stroke();

    const grad = ctx.createRadialGradient(px, py, 2, px, py, 18);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.35, '#38BDF8');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, 18, 0, Math.PI * 2);
    ctx.fill();

    // Interactive click-to-inject optical wave pulses
    for (let i = heroPulses.length - 1; i >= 0; i--) {
      const hp = heroPulses[i];
      hp.r += 2.6;
      hp.alpha *= 0.94;
      if (hp.alpha < 0.03) {
        heroPulses.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, hp.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${hp.alpha})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // Center info
    ctx.fillStyle = '#E8F1F8';
    ctx.font = '600 13px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('6N Au + DBR 자유공간 4-반사 링', cx, cy - 8);
    ctx.fillStyle = '#38BDF8';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('77K · 10⁻⁵ Torr Dry Cavity', cx, cy + 14);
    ctx.textAlign = 'left';
  }

  function drawCheonbuViz(t) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    const cell = 34;
    const gap = 5;
    const total = 9 * cell + 8 * gap;
    const startX = cx - total / 2;
    const startY = cy - total / 2;

    // Concentric ring pulse
    const activeRing = Math.floor(t * 5) % 5; // 0..3 rings + 4 center

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const [ch, pole] = CHEONBU_ROWS[r][c];
        const ring = Math.max(Math.abs(r - 4), Math.abs(c - 4)); // 0=center, 4=outer
        const x = startX + c * (cell + gap);
        const y = startY + r * (cell + gap);

        const isCenter = r === 4 && c === 4;
        const isRingHighlight = (4 - ring) === activeRing;

        ctx.fillStyle = isCenter
          ? 'rgba(52, 211, 153, 0.25)'
          : pole === 1
          ? 'rgba(56, 189, 248, 0.14)'
          : pole === -1
          ? 'rgba(227, 179, 65, 0.14)'
          : 'rgba(148, 163, 184, 0.08)';

        ctx.fillRect(x, y, cell, cell);

        ctx.strokeStyle = isCenter
          ? '#34D399'
          : isRingHighlight
          ? '#38BDF8'
          : 'rgba(148, 197, 232, 0.18)';
        ctx.lineWidth = isCenter || isRingHighlight ? 1.6 : 1;
        ctx.strokeRect(x, y, cell, cell);

        ctx.fillStyle = isCenter ? '#34D399' : pole === 1 ? '#E8F1F8' : pole === -1 ? '#E3B341' : '#94A3B8';
        ctx.font = isCenter ? '700 15px "Noto Sans KR", sans-serif' : '500 13px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch, x + cell / 2, y + cell / 2);
      }
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  // Shared fluid pointer state
  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.4,
    smoothX: window.innerWidth * 0.5,
    smoothY: window.innerHeight * 0.4,
    vx: 0,
    vy: 0,
    active: false
  };

  if (!prefersReducedMotion && !isCoarsePointer) {
    window.addEventListener('mousemove', (e) => {
      pointer.vx = e.clientX - pointer.x;
      pointer.vy = e.clientY - pointer.y;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }, { passive: true });
    document.addEventListener('mouseleave', () => {
      pointer.active = false;
    });
  }

  function drawBgMesh() {
    if (!bgCtx || !bgCanvas) return;
    const bw = bgCanvas.width;
    const bh = bgCanvas.height;
    bgCtx.clearRect(0, 0, bw, bh);

    // Subtle flowing optical ambient light streams behind Hero
    const beamSpecs = [
      { yFrac: 0.22, amp: 26, speed: 1.0, c1: 'rgba(56, 189, 248, 0.0)', c2: 'rgba(56, 189, 248, 0.22)', c3: 'rgba(227, 179, 65, 0.24)' },
      { yFrac: 0.50, amp: -34, speed: 1.4, c1: 'rgba(227, 179, 65, 0.0)', c2: 'rgba(227, 179, 65, 0.20)', c3: 'rgba(52, 211, 153, 0.22)' },
      { yFrac: 0.78, amp: 22, speed: 0.85, c1: 'rgba(52, 211, 153, 0.0)', c2: 'rgba(56, 189, 248, 0.18)', c3: 'rgba(52, 211, 153, 0.22)' }
    ];
    const phaseRad = animPhase * Math.PI * 2;
    beamSpecs.forEach((b, idx) => {
      const yBase = bh * b.yFrac;
      const shift = prefersReducedMotion ? 0 : Math.sin(phaseRad * b.speed + idx * 1.7) * b.amp;
      const grad = bgCtx.createLinearGradient(0, yBase, bw, yBase + shift);
      grad.addColorStop(0, b.c1);
      grad.addColorStop(0.28, b.c2);
      grad.addColorStop(0.62, b.c3);
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
      bgCtx.strokeStyle = grad;
      bgCtx.lineWidth = 1.4;
      bgCtx.beginPath();
      bgCtx.moveTo(0, yBase - shift * 0.45);
      bgCtx.bezierCurveTo(
        bw * 0.32, yBase + shift * 1.15,
        bw * 0.68, yBase - shift * 1.05,
        bw, yBase + shift * 0.45
      );
      bgCtx.stroke();

      // Traveling optical glint along each ambient stream
      if (!prefersReducedMotion) {
        const t = (animPhase * b.speed + idx * 0.33) % 1;
        const omt = 1 - t;
        const gx = bw * t;
        const p0 = yBase - shift * 0.45;
        const p1 = yBase + shift * 1.15;
        const p2 = yBase - shift * 1.05;
        const p3 = yBase + shift * 0.45;
        const gy = omt * omt * omt * p0 + 3 * omt * omt * t * p1 + 3 * omt * t * t * p2 + t * t * t * p3;
        const gGlow = bgCtx.createRadialGradient(gx, gy, 0, gx, gy, 18);
        gGlow.addColorStop(0, idx === 1 ? 'rgba(227, 179, 65, 0.72)' : 'rgba(56, 189, 248, 0.72)');
        gGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        bgCtx.fillStyle = gGlow;
        bgCtx.beginPath();
        bgCtx.arc(gx, gy, 18, 0, Math.PI * 2);
        bgCtx.fill();
      }
    });

    const rect = bgCanvas.getBoundingClientRect();
    const localMx = pointer.smoothX - rect.left;
    const localMy = pointer.smoothY - rect.top;
    const pointerInHero = pointer.active && localMy >= -60 && localMy <= bh + 60;

    for (let i = 0; i < bgNodes.length; i++) {
      const n = bgNodes[i];
      if (!prefersReducedMotion) {
        // Fluid swirl & gentle repulsion around cursor
        if (pointerInHero) {
          const dx = n.x - localMx;
          const dy = n.y - localMy;
          const dist = Math.hypot(dx, dy);
          if (dist > 1 && dist < 210) {
            const force = (1 - dist / 210) * 0.42;
            // Tangential swirl + radial push
            n.vx += (dx / dist) * force * 0.45 + (-dy / dist) * force * 0.55;
            n.vy += (dy / dist) * force * 0.45 + (dx / dist) * force * 0.55;
          }
        }
        // Viscous damping back to calm drift
        n.vx *= 0.965;
        n.vy *= 0.965;
        if (Math.hypot(n.vx, n.vy) < 0.15) {
          n.vx += (Math.random() - 0.5) * 0.04;
          n.vy += (Math.random() - 0.5) * 0.04;
        }
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > bw) { n.vx *= -1; n.x = Math.max(0, Math.min(bw, n.x)); }
        if (n.y < 0 || n.y > bh) { n.vy *= -1; n.y = Math.max(0, Math.min(bh, n.y)); }
      }
      for (let j = i + 1; j < bgNodes.length; j++) {
        const m = bgNodes[j];
        const dist = Math.hypot(n.x - m.x, n.y - m.y);
        if (dist < 155) {
          bgCtx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 155) * 0.25})`;
          bgCtx.lineWidth = 1;
          bgCtx.beginPath();
          bgCtx.moveTo(n.x, n.y);
          bgCtx.lineTo(m.x, m.y);
          bgCtx.stroke();
        }
      }
      bgCtx.fillStyle = n.c;
      bgCtx.beginPath();
      bgCtx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      bgCtx.fill();
    }
  }

  function animate() {
    if (!prefersReducedMotion) {
      animPhase = (animPhase + 0.004) % 1;
    }
    drawBgMesh();
    if (ctx && activeViz !== 'showcase') {
      if (activeViz === 'ring') {
        drawRingCavity(animPhase);
      } else if (activeViz === 'grid') {
        drawCheonbuViz(animPhase);
      }
    }
    requestAnimationFrame(animate);
  }
  if (ctx || bgCtx) requestAnimationFrame(animate);

  // --- 4. Interactive Lab Tabs ---
  const labTabs = document.querySelectorAll('.lab-tab');
  const labPanels = document.querySelectorAll('.lab-panel');
  labTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.lab;
      labTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      labPanels.forEach((p) => {
        const match = p.id === `lab-${target}`;
        p.classList.toggle('active', match);
        p.hidden = !match;
      });
    });
  });

  // --- 5. Lab 1: Cheonbu 9x9 Inspector ---
  const cheonbuGrid = document.getElementById('cheonbuGrid');
  const inspChar = document.getElementById('inspChar');
  const inspTitle = document.getElementById('inspTitle');
  const inspCoord = document.getElementById('inspCoord');
  const inspPole = document.getElementById('inspPole');
  const inspRing = document.getElementById('inspRing');
  const inspAngle = document.getElementById('inspAngle');
  const inspTof = document.getElementById('inspTof');
  const inspDesc = document.getElementById('inspDesc');

  const RING_NAMES = [
    'Center Core (0-Hop 수렴점)',
    'Ring 3 (코어 포위 · 8노드)',
    'Ring 2 (내림 얽힘 · 16노드)',
    'Ring 1 (외림 간섭 · 24노드)',
    'Ring 0 (외곽 경계 · 32노드)'
  ];

  function selectCheonbuNode(r, c, cellEl) {
    document.querySelectorAll('.cb-cell.selected').forEach((el) => el.classList.remove('selected'));
    if (cellEl) cellEl.classList.add('selected');

    const [ch, pole] = CHEONBU_ROWS[r][c];
    const idx0 = r * 9 + c;
    const textIdx = idx0 + 1;
    const distFromCenter = Math.max(Math.abs(r - 4), Math.abs(c - 4));

    // 77K V-bounce physics (p_77k = 3.4916 mm, H_77k = 3.4894 mm, c = 299.792458 mm/ns)
    const dr = Math.abs(r - 4);
    const dc = Math.abs(c - 4);
    const horizDist = Math.hypot(dr, dc) * 3.4916;
    const halfHoriz = horizDist / 2;
    const H = 3.4894;
    const thetaRad = Math.atan2(halfHoriz, H);
    const thetaDeg = (thetaRad * 180) / Math.PI;
    const totalPath = 2 * Math.hypot(halfHoriz, H);
    const tofPs = (totalPath / 299.792458) * 1000;

    inspChar.textContent = ch;
    inspTitle.textContent =
      r === 4 && c === 4
        ? `원문 ${textIdx}번 · 중심 코어 ${ch}`
        : idx0 === 48 || idx0 === 49
        ? `원문 ${textIdx}번 · 성환(成環) 루프 ${ch}`
        : `원문 ${textIdx}번 · 천부경 노드 ${ch}`;
    inspCoord.textContent = `좌표 (Row ${r}, Col ${c}) · Index ${idx0}`;
    inspPole.textContent =
      pole === 1
        ? '天 (+1) — ADD / 보강 간섭'
        : pole === -1
        ? '地 (-1) — SUB / 상쇄 간섭'
        : '人 (0) — 0-SKIP 게이팅 / 진공 평형';
    inspRing.textContent = RING_NAMES[distFromCenter];
    inspAngle.textContent = `${thetaDeg.toFixed(4)}° (Δr=${dr}, Δc=${dc})`;
    inspTof.textContent = `${totalPath.toFixed(4)} mm / ${tofPs.toFixed(3)} ps`;

    if (r === 4 && c === 4) {
      inspDesc.textContent =
        '천부경 81자의 정중앙(4,4)으로, 8방위에서 반사되어 들어오는 광신호가 모이는 L1 공유 메모리 중심 수렴 노드입니다.';
    } else if (idx0 === 48 || idx0 === 49) {
      inspDesc.textContent =
        '77K 열수축 및 위상 드리프트를 실시간으로 보상하는 성환(成環) 능동 위상 잠금 피드백 루프 노드입니다.';
    } else if (pole === 0) {
      inspDesc.textContent =
        '값이 0인 人 노드입니다. 0-MUL 하드웨어에서 불필요한 연산을 즉시 건너뛰어(0-SKIP) 극저온 발열을 줄입니다.';
    } else {
      inspDesc.textContent =
        '77K 자유공간 수직 V-바운스 광경로를 통해 중심 코어 六와 직접 결합되는 81-Qutrit 격자 노드입니다.';
    }
  }

  if (cheonbuGrid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const [ch, pole] = CHEONBU_ROWS[r][c];
        const idx0 = r * 9 + c;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cb-cell';
        if ((r === 4 && c === 4) || idx0 === 48 || idx0 === 49) {
          btn.classList.add('is-core');
        }
        btn.dataset.pole = String(pole);
        btn.setAttribute('aria-label', `${ch}, Row ${r} Col ${c}`);
        btn.innerHTML = `<span class="cb-char">${ch}</span><span class="cb-idx">${idx0}</span>`;
        btn.addEventListener('click', () => selectCheonbuNode(r, c, btn));
        if (r === 4 && c === 4) btn.classList.add('selected');
        cheonbuGrid.appendChild(btn);
      }
    }
  }

  // --- 6. Lab 2: Lossless 16B (i128) <-> 81-Trit Codec ---
  const codecInput = document.getElementById('codecInput');
  const codecSampleBtn = document.getElementById('codecSampleBtn');
  const statBytes = document.getElementById('statBytes');
  const statSkip = document.getElementById('statSkip');
  const statRoundtrip = document.getElementById('statRoundtrip');
  const codecHex = document.getElementById('codecHex');
  const tritMatrix = document.getElementById('tritMatrix');
  const codecDecoded = document.getElementById('codecDecoded');

  const SAMPLES = ['AXON Quantum!', 'Sovereign AI', '77K 0-MUL', 'Cheonbu-81'];
  let sampleIdx = 0;

  function encode16BTo81Trits(bytes16) {
    // Interpret 16 bytes (big-endian) as signed i128
    let val = 0n;
    for (let i = 0; i < 16; i++) {
      val = (val << 8n) | BigInt(bytes16[i]);
    }
    const TWO_127 = 1n << 127n;
    const TWO_128 = 1n << 128n;
    if (val >= TWO_127) val -= TWO_128;

    const trits = new Array(81).fill(0);
    let n = val;
    for (let i = 0; i < 81; i++) {
      let rem = ((n % 3n) + 3n) % 3n;
      if (rem === 2n) {
        trits[i] = -1;
        n = (n + 1n) / 3n;
      } else if (rem === 1n) {
        trits[i] = 1;
        n = (n - 1n) / 3n;
      } else {
        trits[i] = 0;
        n = n / 3n;
      }
    }
    return trits;
  }

  function decode81TritsTo16B(trits) {
    let val = 0n;
    let pow3 = 1n;
    for (let i = 0; i < 81; i++) {
      val += BigInt(trits[i]) * pow3;
      pow3 *= 3n;
    }
    const TWO_128 = 1n << 128n;
    if (val < 0n) val += TWO_128;

    const out = new Uint8Array(16);
    for (let i = 15; i >= 0; i--) {
      out[i] = Number(val & 0xffn);
      val >>= 8n;
    }
    return out;
  }

  function updateCodec() {
    if (!codecInput || !tritMatrix) return;
    const encoder = new TextEncoder();
    const raw = encoder.encode(codecInput.value);
    const len = Math.min(raw.length, 16);
    const buf = new Uint8Array(16);
    buf.set(raw.subarray(0, len), 0);

    const trits = encode16BTo81Trits(buf);
    const decodedBuf = decode81TritsTo16B(trits);
    const roundtripOk = buf.every((b, idx) => b === decodedBuf[idx]);

    const zeros = trits.filter((t) => t === 0).length;
    const skipPct = ((zeros / 81) * 100).toFixed(1);

    statBytes.textContent = `${len} / 16 B`;
    statSkip.textContent = `${skipPct}% (${zeros}/81)`;
    statRoundtrip.textContent = roundtripOk ? '100% 일치' : '불일치';

    const hexStr = Array.from(buf.subarray(0, Math.max(len, 1)))
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
    codecHex.textContent = `HEX: ${hexStr}`;

    tritMatrix.innerHTML = '';
    for (let i = 80; i >= 0; i--) {
      const t = trits[i];
      const cell = document.createElement('div');
      cell.className = 'trit-cell ' + (t === 1 ? 'pos' : t === -1 ? 'neg' : 'zero');
      cell.textContent = t === 1 ? '+1' : t === -1 ? '-1' : '0';
      tritMatrix.appendChild(cell);
    }

    const decoder = new TextDecoder('utf-8', { fatal: false });
    const trimmed = decodedBuf.subarray(0, len);
    codecDecoded.textContent = decoder.decode(trimmed) || '(empty)';
  }

  if (codecInput) {
    codecInput.addEventListener('input', updateCodec);
    updateCodec();
  }
  if (codecSampleBtn) {
    codecSampleBtn.addEventListener('click', () => {
      sampleIdx = (sampleIdx + 1) % SAMPLES.length;
      codecInput.value = SAMPLES[sampleIdx];
      updateCodec();
    });
  }

  // --- 7. Lab 3: [[5,1,3]] QEC 0-MUL Single-Cycle Decoder ---
  // Stabilizers: S0=XZZXI, S1=IXZZX, S2=XIXZZ, S3=ZXIXZ
  const STABILIZERS = [
    ['X', 'Z', 'Z', 'X', 'I'],
    ['I', 'X', 'Z', 'Z', 'X'],
    ['X', 'I', 'X', 'Z', 'Z'],
    ['Z', 'X', 'I', 'X', 'Z']
  ];
  const qubitErrors = ['I', 'I', 'I', 'I', 'I'];
  const qubitCardsEl = document.getElementById('qubitCards');
  const qecSyndromeEl = document.getElementById('qecSyndrome');
  const qecDiagnosisEl = document.getElementById('qecDiagnosis');
  const qecCorrectionEl = document.getElementById('qecCorrection');
  const qecResetBtn = document.getElementById('qecResetBtn');

  function commutes(pauliA, pauliB) {
    if (pauliA === 'I' || pauliB === 'I' || pauliA === pauliB) return true;
    return false;
  }

  function computeSyndrome(errs) {
    return STABILIZERS.map((stab) => {
      let anti = 0;
      for (let q = 0; q < 5; q++) {
        if (!commutes(stab[q], errs[q])) anti ^= 1;
      }
      return anti;
    });
  }

  // Build lookup table for all 15 single-qubit Pauli errors (distance 3)
  const SYNDROME_LUT = new Map();
  SYNDROME_LUT.set('0000', { label: '오류 없음 (Clean State)', corr: 'I (No-Op)' });
  for (let q = 0; q < 5; q++) {
    for (const p of ['X', 'Z', 'Y']) {
      const test = ['I', 'I', 'I', 'I', 'I'];
      test[q] = p;
      const syn = computeSyndrome(test);
      const key = `${syn[3]}${syn[2]}${syn[1]}${syn[0]}`;
      SYNDROME_LUT.set(key, {
        label: `Q${q}에서 ${p} 오류 검출`,
        corr: `${p} on Q${q} (Pauli Frame 갱신)`
      });
    }
  }

  function renderQec() {
    if (!qubitCardsEl) return;
    qubitCardsEl.innerHTML = '';
    for (let q = 0; q < 5; q++) {
      const card = document.createElement('div');
      card.className = 'qubit-card';
      card.innerHTML = `
        <div class="qubit-card-head">
          <span>Q${q}</span>
          <span>${qubitErrors[q]}</span>
        </div>
        <div class="qubit-err-btns">
          ${['I', 'X', 'Z', 'Y']
            .map(
              (err) =>
                `<button type="button" class="err-btn ${qubitErrors[q] === err ? 'active' : ''}" data-q="${q}" data-err="${err}">${err}</button>`
            )
            .join('')}
        </div>
      `;
      qubitCardsEl.appendChild(card);
    }

    qubitCardsEl.querySelectorAll('.err-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = Number(btn.dataset.q);
        const err = btn.dataset.err;
        // Single-qubit error demo: clear other qubits when injecting non-I so distance-3 decoding is clear
        if (err !== 'I') {
          for (let i = 0; i < 5; i++) qubitErrors[i] = 'I';
        }
        qubitErrors[q] = err;
        renderQec();
      });
    });

    const syn = computeSyndrome(qubitErrors);
    const key = `${syn[3]}${syn[2]}${syn[1]}${syn[0]}`;
    const entry = SYNDROME_LUT.get(key) || { label: '다중 오류', corr: '재시도 필요' };

    qecSyndromeEl.textContent = key;
    qecDiagnosisEl.textContent = entry.label;
    qecCorrectionEl.textContent = entry.corr;
  }

  if (qecResetBtn) {
    qecResetBtn.addEventListener('click', () => {
      for (let i = 0; i < 5; i++) qubitErrors[i] = 'I';
      renderQec();
    });
  }
  renderQec();

  // --- 8. Gallery Filter, Kinetic Marquee & Lightbox ---
  const kineticMarquee = document.getElementById('kineticMarquee');
  const marqueeToggleBtn = document.getElementById('marqueeToggleBtn');
  if (kineticMarquee && marqueeToggleBtn) {
    marqueeToggleBtn.addEventListener('click', () => {
      const paused = kineticMarquee.classList.toggle('paused');
      marqueeToggleBtn.textContent = paused ? '재생' : '일시정지';
    });
  }

  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
      galleryItems.forEach((item) => {
        const cats = (item.dataset.cat || '').trim().split(/\s+/);
        const match = filter === 'all' || cats.includes(filter);
        item.hidden = !match;
      });
    });
  });

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  const zoomableImgs = Array.from(document.querySelectorAll('.zoomable-img')).filter(
    (img) => !img.closest('[aria-hidden="true"]')
  );
  let currentZoomIdx = 0;
  let lastFocusedEl = null;

  function openLightboxAt(idx) {
    if (!lightbox || zoomableImgs.length === 0) return;
    currentZoomIdx = (idx + zoomableImgs.length) % zoomableImgs.length;
    const img = zoomableImgs[currentZoomIdx];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = `${img.alt} (${currentZoomIdx + 1} / ${zoomableImgs.length})`;
    lightbox.hidden = false;
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightboxImg.src = '';
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
    lastFocusedEl = null;
  }

  document.querySelectorAll('.zoomable-img').forEach((img) => {
    img.addEventListener('click', () => {
      lastFocusedEl = document.activeElement && document.activeElement !== document.body
        ? document.activeElement
        : img;
      const idx = zoomableImgs.findIndex((z) => z === img);
      openLightboxAt(idx >= 0 ? idx : 0);
      if (lightboxClose) lightboxClose.focus();
    });
  });

  if (lightboxPrev) lightboxPrev.addEventListener('click', () => openLightboxAt(currentZoomIdx - 1));
  if (lightboxNext) lightboxNext.addEventListener('click', () => openLightboxAt(currentZoomIdx + 1));
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightboxAt(currentZoomIdx - 1);
      if (e.key === 'ArrowRight') openLightboxAt(currentZoomIdx + 1);
    });
  }

  // --- 9. Cryogenic Fluid Cursor & Card Magnetic Tilt ---
  const fluidCanvas = document.getElementById('fluidCursorCanvas');
  const fCtx = fluidCanvas ? fluidCanvas.getContext('2d') : null;

  if (fluidCanvas && fCtx && !prefersReducedMotion && !isCoarsePointer) {
    const resizeFluid = () => {
      fluidCanvas.width = window.innerWidth;
      fluidCanvas.height = window.innerHeight;
    };
    resizeFluid();
    window.addEventListener('resize', resizeFluid);

    const TRAIL_LEN = 18;
    const trail = Array.from({ length: TRAIL_LEN }, () => ({ x: pointer.x, y: pointer.y }));
    const droplets = [];
    const ripples = [];

    window.addEventListener('mousemove', (e) => {
      const speed = Math.hypot(pointer.vx, pointer.vy);
      if (speed > 3.5 && droplets.length < 65) {
        const count = Math.min(3, Math.floor(speed / 12) + 1);
        for (let i = 0; i < count; i++) {
          const angle = Math.atan2(pointer.vy, pointer.vx) + (Math.random() - 0.5) * 1.4;
          const spd = 0.6 + Math.random() * 1.6;
          droplets.push({
            x: e.clientX + (Math.random() - 0.5) * 6,
            y: e.clientY + (Math.random() - 0.5) * 6,
            vx: -Math.cos(angle) * spd + (Math.random() - 0.5) * 0.5,
            vy: -Math.sin(angle) * spd + (Math.random() - 0.5) * 0.5,
            r: 1.4 + Math.random() * 2.4,
            life: 1,
            gold: Math.random() > 0.72
          });
        }
      }
    }, { passive: true });

    window.addEventListener('mousedown', (e) => {
      ripples.push({ x: e.clientX, y: e.clientY, r: 4, alpha: 0.75 });
    }, { passive: true });

    function renderFluid() {
      fCtx.clearRect(0, 0, fluidCanvas.width, fluidCanvas.height);

      // Viscous spring interpolation for smooth fluid head
      pointer.smoothX += (pointer.x - pointer.smoothX) * 0.24;
      pointer.smoothY += (pointer.y - pointer.smoothY) * 0.24;

      if (pointer.active) {
        trail[0].x += (pointer.smoothX - trail[0].x) * 0.55;
        trail[0].y += (pointer.smoothY - trail[0].y) * 0.55;
        for (let i = 1; i < TRAIL_LEN; i++) {
          const ease = 0.36 - i * 0.01;
          trail[i].x += (trail[i - 1].x - trail[i].x) * ease;
          trail[i].y += (trail[i - 1].y - trail[i].y) * ease;
        }

        // Draw 2-layer silky fluid ribbon (outer cryo-mist + inner laminar core)
        for (let i = 0; i < TRAIL_LEN - 2; i++) {
          const t0 = trail[i];
          const t1 = trail[i + 1];
          const midX = (t0.x + t1.x) * 0.5;
          const midY = (t0.y + t1.y) * 0.5;
          const ratio = 1 - i / TRAIL_LEN;

          // Outer viscous mist
          fCtx.beginPath();
          fCtx.moveTo(t0.x, t0.y);
          fCtx.quadraticCurveTo(t0.x, t0.y, midX, midY);
          fCtx.strokeStyle = i < 7
            ? `rgba(56, 189, 248, ${ratio * 0.22})`
            : `rgba(227, 179, 65, ${ratio * 0.16})`;
          fCtx.lineWidth = Math.max(2, ratio * 22);
          fCtx.lineCap = 'round';
          fCtx.stroke();

          // Inner laminar stream
          fCtx.beginPath();
          fCtx.moveTo(t0.x, t0.y);
          fCtx.quadraticCurveTo(t0.x, t0.y, midX, midY);
          fCtx.strokeStyle = i < 6
            ? `rgba(56, 189, 248, ${ratio * 0.65})`
            : `rgba(227, 179, 65, ${ratio * 0.45})`;
          fCtx.lineWidth = Math.max(1, ratio * 6);
          fCtx.lineCap = 'round';
          fCtx.stroke();
        }

        // Soft glowing fluid orb at pointer head
        const headGrad = fCtx.createRadialGradient(
          pointer.smoothX, pointer.smoothY, 1,
          pointer.smoothX, pointer.smoothY, 26
        );
        headGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
        headGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.25)');
        headGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        fCtx.fillStyle = headGrad;
        fCtx.beginPath();
        fCtx.arc(pointer.smoothX, pointer.smoothY, 26, 0, Math.PI * 2);
        fCtx.fill();
      }

      // Update & draw swirling cryogenic droplets
      for (let i = droplets.length - 1; i >= 0; i--) {
        const d = droplets[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.94;
        d.vy *= 0.94;
        d.life -= 0.028;
        if (d.life <= 0) {
          droplets.splice(i, 1);
          continue;
        }
        fCtx.fillStyle = d.gold
          ? `rgba(227, 179, 65, ${d.life * 0.55})`
          : `rgba(56, 189, 248, ${d.life * 0.6})`;
        fCtx.beginPath();
        fCtx.arc(d.x, d.y, d.r * d.life, 0, Math.PI * 2);
        fCtx.fill();
      }

      // Update & draw click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 3.2;
        rp.alpha *= 0.92;
        if (rp.alpha < 0.02) {
          ripples.splice(i, 1);
          continue;
        }
        fCtx.strokeStyle = `rgba(56, 189, 248, ${rp.alpha})`;
        fCtx.lineWidth = 1.6;
        fCtx.beginPath();
        fCtx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        fCtx.stroke();
      }

      requestAnimationFrame(renderFluid);
    }
    requestAnimationFrame(renderFluid);

    // Fluid magnetic tilt & specular highlight on cards
    document.querySelectorAll('.arch-card, .vision-card, .gallery-item').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = (x / rect.width) * 100;
        const py = (y / rect.height) * 100;
        const rx = ((y / rect.height) - 0.5) * -5;
        const ry = ((x / rect.width) - 0.5) * 5;
        card.style.setProperty('--mx', `${px.toFixed(1)}%`);
        card.style.setProperty('--my', `${py.toFixed(1)}%`);
        card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // --- 10. Coded Photonic Video & Supertone Voice Briefing ---
  const heroVoiceBtn = document.getElementById('heroVoiceBtn');
  const axonIntroAudio = document.getElementById('axonIntroAudio');
  if (heroVoiceBtn && axonIntroAudio) {
    heroVoiceBtn.addEventListener('click', () => {
      if (axonIntroAudio.paused) {
        axonIntroAudio.play().catch(() => {});
        heroVoiceBtn.classList.add('playing');
        heroVoiceBtn.setAttribute('aria-pressed', 'true');
      } else {
        axonIntroAudio.pause();
        heroVoiceBtn.classList.remove('playing');
        heroVoiceBtn.setAttribute('aria-pressed', 'false');
      }
    });
    axonIntroAudio.addEventListener('ended', () => {
      heroVoiceBtn.classList.remove('playing');
      heroVoiceBtn.setAttribute('aria-pressed', 'false');
    });
  }

  const videoEl = document.getElementById('axonQuantumVideo');
  const chapterBtns = document.querySelectorAll('.chapter-btn');
  const playWithVoiceBtn = document.getElementById('playWithVoiceBtn');
  if (videoEl && chapterBtns.length > 0) {
    if (playWithVoiceBtn) {
      playWithVoiceBtn.addEventListener('click', () => {
        videoEl.muted = false;
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
      });
    }

    chapterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = Number(btn.dataset.seek || 0);
        videoEl.muted = false;
        videoEl.currentTime = t;
        videoEl.play().catch(() => {});
      });
    });

    videoEl.addEventListener('timeupdate', () => {
      const ct = videoEl.currentTime;
      const activeIdx = ct < 13.0 ? 0 : ct < 26.0 ? 1 : ct < 37.0 ? 2 : 3;
      chapterBtns.forEach((b, idx) => b.classList.toggle('active', idx === activeIdx));
    });
  }

  // --- 11. Three.js <-> Unity 6 WebGL Engine Bridge ---
  const engineTabs = document.querySelectorAll('.engine-tab');
  const threeContainer = document.getElementById('axon3dContainer');
  const unityContainer = document.getElementById('unity3dContainer');
  const blenderContainer = document.getElementById('blender3dContainer');
  const unityFrame = document.getElementById('unityWebglFrame');
  const unityFallback = document.getElementById('unityBridgeFallback');
  const unitySyncReadout = document.getElementById('unitySyncReadout');
  const explodeSlider = document.getElementById('explodeRange');
  const autoRotateChk = document.getElementById('toggleAutoRotate');
  const beamsChk = document.getElementById('toggleVBounce');
  const laserChk = document.getElementById('toggleRingBeam');
  const tempSlider = document.getElementById('tempRange');
  const tempVal = document.getElementById('tempVal');
  const tiltSlider = document.getElementById('tiltRange');
  const tiltVal = document.getElementById('tiltVal');
  const presetBtns = document.querySelectorAll('.preset-btn');

  function calcQec513Fidelity(tempK) {
    const p = Math.min(0.45, Math.max(0, 0.002 * Math.pow(tempK / 77.0, 2.2)));
    const p0 = Math.pow(1 - p, 5);
    const p1 = 5 * p * Math.pow(1 - p, 4);
    return (p0 + p1) * 100;
  }

  let unityBuildReady = false;
  function syncUnityState(extra = {}) {
    const exp = explodeSlider ? (Number(explodeSlider.value) / 100).toFixed(2) : '0.25';
    const rot = autoRotateChk ? autoRotateChk.checked : true;
    const beams = beamsChk ? beamsChk.checked : true;
    const laser = laserChk ? laserChk.checked : true;
    const tempK = tempSlider ? Number(tempSlider.value) : 77;
    const tiltMrad = tiltSlider ? Number(tiltSlider.value) / 10.0 : 0.0;
    if (tempVal) tempVal.textContent = `${tempK} K · QEC ${calcQec513Fidelity(tempK).toFixed(2)}%`;
    if (tiltVal) tiltVal.textContent = `${tiltMrad.toFixed(1)} mrad`;
    if (unitySyncReadout) {
      unitySyncReadout.textContent = `explode=${exp} · ${tempK}K · tilt=${tiltMrad.toFixed(1)}mrad`;
    }
    if (unityBuildReady && unityFrame && unityFrame.contentWindow) {
      unityFrame.contentWindow.postMessage({
        type: 'AXON_SYNC',
        explode: Number(exp),
        autoRotate: rot,
        hasAutoRotate: true,
        showBeams: beams,
        hasBeams: true,
        showLaser: laser,
        hasLaser: true,
        tempK,
        tiltMrad,
        ...extra,
      }, '*');
    }
  }

  if (explodeSlider) explodeSlider.addEventListener('input', () => syncUnityState());
  if (tempSlider) tempSlider.addEventListener('input', () => syncUnityState());
  if (tiltSlider) tiltSlider.addEventListener('input', () => syncUnityState());
  if (autoRotateChk) autoRotateChk.addEventListener('change', () => syncUnityState());
  if (beamsChk) beamsChk.addEventListener('change', () => syncUnityState());
  if (laserChk) laserChk.addEventListener('change', () => syncUnityState());
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      syncUnityState({ preset: btn.dataset.preset || '' });
    });
  });

  if (engineTabs.length > 0 && threeContainer && unityContainer) {
    engineTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.engine;
        engineTabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('active', active);
          t.setAttribute('aria-selected', String(active));
        });
        const isUnity = target === 'unity';
        const isBlender = target === 'blender';
        threeContainer.hidden = isUnity || isBlender;
        unityContainer.hidden = !isUnity;
        if (blenderContainer) blenderContainer.hidden = !isBlender;

        if (isBlender && typeof window.initBlenderGlbViewer === 'function') {
          window.initBlenderGlbViewer();
        }

        if (isUnity && !unityBuildReady && unityFrame) {
          fetch('unity_build/index.html', { method: 'HEAD' })
            .then((res) => {
              if (res.ok) {
                unityBuildReady = true;
                unityFrame.src = 'unity_build/index.html';
                unityFrame.hidden = false;
                if (unityFallback) unityFallback.hidden = true;
                syncUnityState();
              }
            })
            .catch(() => {});
        }
      });
    });
  }

  // =========================================================================
  // 11. EVIDENCE FILTER & COMPANION INTERACTIVE WORKFLOW LAUNCHER
  // =========================================================================
  const evFilterBtns = document.querySelectorAll('[data-ev-filter]');
  const evRows = document.querySelectorAll('#evidenceTable tbody tr');
  if (evFilterBtns.length && evRows.length) {
    const counts = { all: evRows.length, verified: 0, sim: 0, blocked: 0 };
    evRows.forEach((row) => {
      const cat = row.getAttribute('data-ev-cat');
      if (cat && Object.prototype.hasOwnProperty.call(counts, cat)) {
        counts[cat] += 1;
      }
    });
    evFilterBtns.forEach((btn) => {
      const key = btn.getAttribute('data-ev-filter');
      const baseLabel = btn.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
      if (key && Object.prototype.hasOwnProperty.call(counts, key)) {
        btn.textContent = `${baseLabel} (${counts[key]})`;
      }
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-ev-filter');
        evFilterBtns.forEach((b) => {
          const isMatch = b === btn;
          b.classList.toggle('active', isMatch);
          b.setAttribute('aria-selected', String(isMatch));
        });
        evRows.forEach((row) => {
          const cat = row.getAttribute('data-ev-cat');
          row.classList.toggle('ev-hidden', target !== 'all' && cat !== target);
        });
      });
    });
  }

  const wfTabs = document.querySelectorAll('[data-wf]');
  const wfLabel = document.getElementById('wfLabel');
  const wfCodeBlock = document.getElementById('wfCodeBlock');
  const wfOutputBlock = document.getElementById('wfOutputBlock');
  const wfCopyBtn = document.getElementById('wfCopyBtn');
  const wfPreviewToggle = document.getElementById('wfPreviewToggle');

  const WF_DATA = {
    rust: {
      label: '0-MUL & Cheonbu-81 Rust 검증 스위트',
      code: `# 1. 0-MUL & Cheonbu-81 전체 Rust 테스트 (29 lib + 14 QEC + 12 top + 31 v0.4)\ncargo test\n\n# 2. 100-1000 큐비트 극저온 스케일링 시뮬레이터\ncargo run --release --bin scale_sim`,
      output: `test result: ok. 86 passed; 0 failed; 0 ignored\n[AXON-SCALE] 100Q (20 tiles): 77K inner loop 0.91ns < 2-lap 0.9406ns -> PASS`
    },
    rtl: {
      label: '0-MUL 5Q & cheonbu81_qec_top_0mul Sky130 / BMC 검증',
      code: `# 1. Cheonbu-81 9-Tile 18B Fail-Closed 코시뮬레이션\niverilog -g2012 -o sim_cb81 rtl/cheonbu81_qec_top_0mul.v rtl/cheonbu81_qec_tile_0mul.v rtl/cheonbu81_pkt18_codec_0mul.v rtl/cheonbu81_pivot_hub_0mul.v rtl/tb_cheonbu81_qec_top.v && vvp sim_cb81\n\n# 2. SymbiYosys 형식 검증 (Fail-Closed & 0-SKIP 불변식)\nsby -f eda/cheonbu81_qec_v1/formal_cheonbu81.sby`,
      output: `[TB_CB81] 9/9 PASS (0 errors) | [SBY BMC] PASS (rc=0, depth=20)\n[SKY130] 38,957.36 um2 | 4,749 cells (631 FF) | 7.710 ns (129.70 MHz) | 111 pins | t:$mul=0`
    },
    physics: {
      label: 'NVIDIA Warp · PhysicsNeMo · DeepQuantum + Rust Kernel 브리지',
      code: `# 1. Rust 0-MUL 커널 (axon-toolkit-core v0.2.0 연동) 검증\ncd D:\\axon-physics-world\\axon_quantum_kernel && cargo test\n\n# 2. 77K 광양자 3D 물리 시뮬레이션 & 웹 브리지 실행\nD:\\axon-physics-world\\.venv\\Scripts\\python.exe D:\\axon-physics-world\\axon_world_bridge.py`,
      output: `running 3 tests ... test result: ok. 3 passed; 0 failed\n[WARP+DEEPQUANTUM] 77K V-bounce + 4-lap ring cavity (140.994mm) exported -> JSON`
    }
  };

  if (wfTabs.length && wfCodeBlock && wfOutputBlock) {
    wfTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-wf');
        const entry = WF_DATA[key];
        if (!entry) return;
        wfTabs.forEach((t) => t.classList.toggle('active', t === tab));
        if (wfLabel) wfLabel.textContent = entry.label;
        wfCodeBlock.querySelector('code').textContent = entry.code;
        wfOutputBlock.querySelector('code').textContent = entry.output;
      });
    });

    if (wfPreviewToggle) {
      wfPreviewToggle.addEventListener('click', () => {
        const isHidden = wfOutputBlock.hasAttribute('hidden');
        if (isHidden) {
          wfOutputBlock.removeAttribute('hidden');
          wfPreviewToggle.textContent = '예상 출력 숨기기';
        } else {
          wfOutputBlock.setAttribute('hidden', '');
          wfPreviewToggle.textContent = '예상 출력 보기';
        }
      });
    }

    if (wfCopyBtn) {
      wfCopyBtn.addEventListener('click', async () => {
        const txt = wfCodeBlock.querySelector('code').textContent || '';
        try {
          await navigator.clipboard.writeText(txt);
          wfCopyBtn.textContent = '복사됨 ✓';
          setTimeout(() => {
            wfCopyBtn.textContent = '명령어 복사';
          }, 1500);
        } catch {
          wfCopyBtn.textContent = '복사 실패';
          setTimeout(() => {
            wfCopyBtn.textContent = '명령어 복사';
          }, 1500);
        }
      });
    }
  }
})();
