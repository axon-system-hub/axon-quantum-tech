(() => {
  'use strict';

  const DATA = window.AXON_WORKSTATION_DATA;
  if (!DATA) return;

  // --- Shared Formatting & Safe DOM Helpers ---
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function formatKrwCompact(krw) {
    const abs = Math.abs(krw);
    const sign = krw < 0 ? '-' : '';
    if (abs >= 1e8) {
      const eok = abs / 1e8;
      return `${sign}₩${eok.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}억`;
    }
    const man = abs / 1e4;
    return `${sign}₩${Math.round(man).toLocaleString('ko-KR')}만`;
  }

  function formatUsd(usd) {
    if (Math.abs(usd) >= 1e6) {
      return `$${(usd / 1e6).toFixed(2)}M`;
    }
    return `$${Math.round(usd).toLocaleString('en-US')}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderSubsystemBars(containerId, tier, band, fx) {
    const container = document.getElementById(containerId);
    if (!container || !tier || !tier.subsystems) return;

    const totalKrw = tier.bom_capex.krw[band] || 1;
    const rows = DATA.subsystem_order.map((subId) => {
      const sub = tier.subsystems[subId];
      const meta = DATA.subsystem_meta[subId];
      const valKrw = sub.krw[band];
      const valUsd = valKrw / fx;
      const pct = ((valKrw / totalKrw) * 100).toFixed(1);
      const color = meta ? meta.color : '#38BDF8';
      const labelKo = sub.label_ko || sub.label;
      return `
        <div class="ws-sub-row">
          <div class="ws-sub-head">
            <span class="ws-sub-name">${escapeHtml(labelKo)}</span>
            <span class="ws-sub-val">${escapeHtml(formatKrwCompact(valKrw))} <small>(${escapeHtml(formatUsd(valUsd))} · ${pct}%)</small></span>
          </div>
          <div class="ws-sub-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="ws-sub-fill" style="width: ${Math.min(100, Number(pct))}%; background: ${color};"></div>
          </div>
        </div>
      `;
    });

    container.innerHTML = rows.join('');
  }

  // =========================================================================
  // A. WORKSTATION TIERS EXPLORER (#workstation-tiers)
  // =========================================================================
  const tierButtons = document.querySelectorAll('[data-ws-tier]');
  let activeExplorerTierId = 'tier_1_personal';

  function renderRackSlots(tier) {
    const visual = document.getElementById('wsRackVisual');
    if (!visual || !tier || !tier.rack_visual) return;

    const rv = tier.rack_visual;
    const slots = [];
    for (let i = 0; i < rv.slots_total; i++) {
      const occupied = i < rv.slots_occupied;
      slots.push(`
        <div class="ws-rack-slot ${occupied ? 'occupied' : 'empty'}" title="Slot ${i + 1}: 74mm 폭 / 85mm 피치">
          <span class="ws-slot-idx">S${i + 1}</span>
          <span class="ws-slot-bar"></span>
          <span class="ws-slot-spec">74mm</span>
        </div>
      `);
    }
    visual.innerHTML = slots.join('');
    setText('wsRackSummary', rv.slot_label_ko);
  }

  function selectExplorerTier(tierId) {
    const tier = DATA.tiers[tierId];
    if (!tier) return;
    activeExplorerTierId = tierId;

    tierButtons.forEach((btn) => {
      const isMatch = btn.getAttribute('data-ws-tier') === tierId;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', String(isMatch));
      btn.setAttribute('aria-pressed', String(isMatch));
    });

    setText('wsTierTitle', tier.name_ko);
    setText('wsTierSubtitle', `${tier.name} · ${tier.target_segment_ko}`);
    setText('wsTierGateBadge', `fabrication_release: ${tier.fabrication_release_status} · ${DATA.pricing_policy}`);

    const imgEl = document.getElementById('wsTierImg');
    if (imgEl) {
      imgEl.src = tier.image;
      imgEl.alt = tier.image_caption_ko;
    }
    setText('wsTierImgCaption', tier.image_caption_ko);

    const pqMin = tier.physical_qubits.min.toLocaleString('en-US');
    const pqMax = tier.physical_qubits.max.toLocaleString('en-US');
    const pqSuffix = tier.tier_rank === 4 ? '+' : '';
    setText('wsTierPhysQubits', `${pqMin} ~ ${pqMax}${pqSuffix} Qubit`);
    setText('wsTierLogicalQubits', `${tier.logical_qubits_range} (${tier.qec_code})`);
    setText('wsTierQecDetail', tier.qec_mapping_detail);
    setText('wsTierFormFactor', tier.form_factor_ko);
    setText('wsTierCryo', tier.cryo_architecture_ko);
    setText('wsTierMemory', tier.host_memory_spec);
    setText('wsTierStorage', tier.host_storage_spec);
    setText('wsTierBandwidth', tier.packet_throughput.label);

    const capBase = tier.bom_capex.krw.baseline;
    const capLow = tier.bom_capex.krw.low;
    const capHigh = tier.bom_capex.krw.high;
    setText('wsTierCapexBase', `${formatKrwCompact(capBase)} (${formatUsd(tier.bom_capex.usd.baseline)})`);
    setText('wsTierCapexRange', `범위: ${formatKrwCompact(capLow)} ~ ${formatKrwCompact(capHigh)} [DERIVED/ASSUMED]`);
    setText('wsTierPower', `${tier.wall_power_kw} kW (${tier.annual_kwh.toLocaleString('en-US')} kWh/yr)`);

    const tcoRef = tier.tco_5yr_ref;
    setText(
      'wsTierTcoSavings',
      `AXON ${formatKrwCompact(tcoRef.axon_tco_krw.baseline)} vs 15mK ${formatKrwCompact(tcoRef.sc15mk_tco_krw.baseline)} (${tcoRef.savings_pct.baseline.toFixed(2)}% 절감)`
    );

    setText('wsTierFriendlyDesc', tier.friendly_summary_ko);
    setText('wsTierDeepDesc', tier.deep_summary_ko);

    renderRackSlots(tier);
    renderSubsystemBars('wsTierSubsystems', tier, 'baseline', DATA.assumptions.fx_krw_per_usd);
  }

  if (tierButtons.length > 0) {
    tierButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-ws-tier');
        if (id) selectExplorerTier(id);
      });
    });
    selectExplorerTier(activeExplorerTierId);
  }

  const wsOpenLabBtn = document.getElementById('wsOpenLabBtn');
  if (wsOpenLabBtn) {
    wsOpenLabBtn.addEventListener('click', () => {
      if (DATA.tiers[activeExplorerTierId]) {
        bomState.tierId = activeExplorerTierId;
      }
      const labTierSelect = document.getElementById('labWsTier');
      if (labTierSelect) {
        labTierSelect.value = activeExplorerTierId;
      }
      const wsTab = document.querySelector('.lab-tab[data-lab="workstation"]');
      if (wsTab) wsTab.click();
      updateBomLab();
      const labSection = document.getElementById('interactive-lab');
      if (labSection) labSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // =========================================================================
  // B. LAB 4: LIVE BOM & N-YEAR TCO CONFIGURATOR (#lab-workstation)
  // =========================================================================
  const labWsTierEl = document.getElementById('labWsTier');
  const labWsTierBtns = document.querySelectorAll('[data-lab-ws-tier]');
  const bomBandBtns = document.querySelectorAll('[data-bom-band]');
  const labWsFxEl = document.getElementById('labWsFx');
  const labWsTariffEl = document.getElementById('labWsTariff');
  const labWsYearsEl = document.getElementById('labWsYears');
  const tcoCanvas = document.getElementById('tcoCompareCanvas');

  const bomState = {
    tierId: 'tier_1_personal',
    band: 'baseline',
    fx: DATA.assumptions.fx_krw_per_usd,
    tariff: DATA.assumptions.electricity_tariff_krw_per_kwh,
    years: DATA.assumptions.tco_horizon_years
  };

  function computeTcoMetrics() {
    const tier = DATA.tiers[bomState.tierId] || DATA.tiers.tier_1_personal;
    const band = bomState.band;
    const fx = bomState.fx;
    const tariff = bomState.tariff;
    const years = bomState.years;
    const hoursPerYear = DATA.assumptions.hours_per_year;

    const axonCapexKrw = tier.bom_capex.krw[band];
    const axonElecKrw = Math.round(tier.wall_power_kw * hoursPerYear * years * tariff);
    const axonMaintKrw = Math.round(tier.cryo_maint_annual_krw[band] * years);
    const axonTcoKrw = axonCapexKrw + axonElecKrw + axonMaintKrw;

    const sc = tier.baseline_15mk;
    const scCapexKrw = sc.capex_krw[band];
    const scElecKrw = Math.round(sc.wall_power_kw * hoursPerYear * years * tariff);
    const scMaintKrw = Math.round(sc.cryo_maint_annual_krw[band] * years);
    const scTcoKrw = scCapexKrw + scElecKrw + scMaintKrw;

    const savingsKrw = scTcoKrw - axonTcoKrw;
    const savingsPct = scTcoKrw > 0 ? (savingsKrw / scTcoKrw) * 100 : 0;

    return {
      tier,
      band,
      fx,
      tariff,
      years,
      axon: {
        capexKrw: axonCapexKrw,
        elecKrw: axonElecKrw,
        maintKrw: axonMaintKrw,
        tcoKrw: axonTcoKrw,
        tcoUsd: axonTcoKrw / fx,
        powerKw: tier.wall_power_kw
      },
      sc15mk: {
        capexKrw: scCapexKrw,
        elecKrw: scElecKrw,
        maintKrw: scMaintKrw,
        tcoKrw: scTcoKrw,
        tcoUsd: scTcoKrw / fx,
        powerKw: sc.wall_power_kw
      },
      savingsKrw,
      savingsUsd: savingsKrw / fx,
      savingsPct
    };
  }

  function drawTcoChart(metrics) {
    if (!tcoCanvas) return;
    const ctx = tcoCanvas.getContext('2d');
    if (!ctx) return;

    const rect = tcoCanvas.getBoundingClientRect();
    const cssWidth = rect.width || tcoCanvas.clientWidth || 560;
    const cssHeight = rect.height || tcoCanvas.clientHeight || 290;
    if (cssWidth <= 0 || cssHeight <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    tcoCanvas.width = Math.round(cssWidth * dpr);
    tcoCanvas.height = Math.round(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = cssWidth;
    const h = cssHeight;
    ctx.clearRect(0, 0, w, h);

    // Subtle technical grid
    ctx.strokeStyle = 'rgba(148, 197, 232, 0.08)';
    ctx.lineWidth = 1;
    for (let gx = 24; gx < w; gx += 32) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    }
    for (let gy = 24; gy < h; gy += 32) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }

    const isNarrow = w < 440;
    const padLeft = isNarrow ? 14 : 20;
    const padRight = isNarrow ? 14 : 22;
    const barMaxW = Math.max(120, w - padLeft - padRight);
    const maxTotal = Math.max(metrics.sc15mk.tcoKrw, metrics.axon.tcoKrw, 1);

    // Header inside canvas (stack savings badge cleanly when width is tight)
    const headerTitle = `${metrics.tier.short_name_ko} · ${metrics.years}년 TCO (${metrics.band.toUpperCase()})`;
    const savLabel = isNarrow
      ? `-${metrics.savingsPct.toFixed(1)}% 절감`
      : `-${metrics.savingsPct.toFixed(2)}% TCO 절감`;

    ctx.font = isNarrow ? '700 12px "Noto Sans KR", sans-serif' : '700 13px "Noto Sans KR", sans-serif';
    const headerW = ctx.measureText(headerTitle).width;
    ctx.font = isNarrow ? '700 11px "JetBrains Mono", monospace' : '700 12px "JetBrains Mono", monospace';
    const badgeW = ctx.measureText(savLabel).width + (isNarrow ? 16 : 20);

    const headerStack = headerW + badgeW + 10 > barMaxW;
    ctx.fillStyle = '#E8F1F8';
    ctx.font = isNarrow ? '700 12px "Noto Sans KR", sans-serif' : '700 13px "Noto Sans KR", sans-serif';
    ctx.fillText(headerTitle, padLeft, 22);

    const badgeX = headerStack ? padLeft : w - padRight - badgeW;
    const badgeY = headerStack ? 30 : 9;
    const badgeH = isNarrow ? 21 : 24;
    ctx.fillStyle = 'rgba(52, 211, 153, 0.16)';
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#34D399';
    ctx.font = isNarrow ? '700 11px "JetBrains Mono", monospace' : '700 12px "JetBrains Mono", monospace';
    ctx.fillText(savLabel, badgeX + (isNarrow ? 8 : 10), badgeY + (isNarrow ? 14 : 16));

    const bars = [
      {
        title: `AXON 77K (${metrics.axon.powerKw} kW)`,
        total: metrics.axon.tcoKrw,
        usd: metrics.axon.tcoUsd,
        segments: [
          { val: metrics.axon.capexKrw, color: '#38BDF8', name: 'Capex' },
          { val: metrics.axon.elecKrw, color: '#34D399', name: '전력비' },
          { val: metrics.axon.maintKrw, color: '#E3B341', name: '유지보수' }
        ],
        y: headerStack ? 86 : 66
      },
      {
        title: isNarrow
          ? `15mK 초전도 (${metrics.sc15mk.powerKw} kW)`
          : `15mK 초전도 희석냉동기 (${metrics.sc15mk.powerKw} kW)`,
        total: metrics.sc15mk.tcoKrw,
        usd: metrics.sc15mk.tcoUsd,
        segments: [
          { val: metrics.sc15mk.capexKrw, color: '#64748B', name: 'Capex' },
          { val: metrics.sc15mk.elecKrw, color: '#FB7185', name: '전력비' },
          { val: metrics.sc15mk.maintKrw, color: '#F59E0B', name: '유지보수' }
        ],
        y: headerStack ? 168 : 148
      }
    ];

    const barH = isNarrow ? 30 : 34;
    bars.forEach((bar, bIdx) => {
      const labelFont = isNarrow ? '600 11px "Noto Sans KR", sans-serif' : '600 12px "Noto Sans KR", sans-serif';
      const valFont = isNarrow ? '600 11px "JetBrains Mono", monospace' : '600 12px "JetBrains Mono", monospace';
      const totalStr = `${formatKrwCompact(bar.total)} (${formatUsd(bar.usd)})`;

      ctx.font = labelFont;
      const titleW = ctx.measureText(bar.title).width;
      ctx.font = valFont;
      const totalStrW = ctx.measureText(totalStr).width;
      const stackLabel = titleW + totalStrW + 8 > barMaxW;

      ctx.fillStyle = bIdx === 0 ? '#E8F1F8' : '#9CB3C5';
      ctx.font = labelFont;
      ctx.fillText(bar.title, padLeft, stackLabel ? bar.y - 21 : bar.y - 10);

      ctx.fillStyle = bIdx === 0 ? '#34D399' : '#FB7185';
      ctx.font = valFont;
      ctx.fillText(
        totalStr,
        stackLabel ? padLeft : Math.max(padLeft, w - padRight - totalStrW),
        stackLabel ? bar.y - 7 : bar.y - 10
      );

      // Track background
      ctx.fillStyle = 'rgba(15, 31, 48, 0.9)';
      ctx.fillRect(padLeft, bar.y, barMaxW, barH);
      ctx.strokeStyle = 'rgba(148, 197, 232, 0.18)';
      ctx.strokeRect(padLeft, bar.y, barMaxW, barH);

      let curX = padLeft;
      const minVisibleW = bIdx === 0 ? 10 : 0;
      const rawTotalW = Math.max(minVisibleW, (bar.total / maxTotal) * barMaxW);

      bar.segments.forEach((seg) => {
        if (seg.val <= 0 || bar.total <= 0) return;
        const segW = Math.max(2, (seg.val / bar.total) * rawTotalW);
        ctx.fillStyle = seg.color;
        ctx.fillRect(curX, bar.y + 1, segW, barH - 2);
        curX += segW;
      });
    });

    // Legend row
    const legendY = h - 42;
    const legendItems = [
      { label: 'AXON Capex', color: '#38BDF8' },
      { label: 'AXON 전력', color: '#34D399' },
      { label: 'AXON 유지비', color: '#E3B341' },
      { label: '15mK Capex', color: '#64748B' },
      { label: '15mK 전력', color: '#FB7185' },
      { label: '15mK 유지비', color: '#F59E0B' }
    ];
    let lx = padLeft;
    let ly = legendY;
    ctx.font = '500 11px "Noto Sans KR", sans-serif';
    legendItems.forEach((item) => {
      const tw = ctx.measureText(item.label).width + 24;
      if (lx + tw > w - padRight) {
        lx = padLeft;
        ly += 18;
      }
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, ly - 9, 10, 10);
      ctx.fillStyle = '#9CB3C5';
      ctx.fillText(item.label, lx + 14, ly);
      lx += tw;
    });
  }

  function updateBomLab() {
    const m = computeTcoMetrics();

    if (labWsTierEl && labWsTierEl.value !== bomState.tierId) {
      labWsTierEl.value = bomState.tierId;
    }
    labWsTierBtns.forEach((btn) => {
      const active = btn.getAttribute('data-lab-ws-tier') === bomState.tierId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    bomBandBtns.forEach((btn) => {
      const active = btn.getAttribute('data-bom-band') === bomState.band;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    setText('labWsFxVal', `₩${bomState.fx.toLocaleString('en-US')} / $1`);
    setText('labWsTariffVal', `₩${bomState.tariff.toLocaleString('en-US')} / kWh`);
    setText('labWsYearsVal', `${bomState.years}년`);
    setText('labWsHorizonLabel', `${bomState.years}년 TCO (${bomState.band.toUpperCase()})`);

    setText('labWsAxonCapex', `${formatKrwCompact(m.axon.capexKrw)} (${formatUsd(m.axon.capexKrw / m.fx)})`);
    setText('labWsAxonElec', `${formatKrwCompact(m.axon.elecKrw)} (${m.axon.powerKw} kW)`);
    setText('labWsAxonMaint', formatKrwCompact(m.axon.maintKrw));
    setText('labWsAxonTco', `${formatKrwCompact(m.axon.tcoKrw)} (${formatUsd(m.axon.tcoUsd)})`);

    setText('labWs15mkCapex', `${formatKrwCompact(m.sc15mk.capexKrw)} (${formatUsd(m.sc15mk.capexKrw / m.fx)})`);
    setText('labWs15mkElec', `${formatKrwCompact(m.sc15mk.elecKrw)} (${m.sc15mk.powerKw} kW)`);
    setText('labWs15mkMaint', formatKrwCompact(m.sc15mk.maintKrw));
    setText('labWs15mkTco', `${formatKrwCompact(m.sc15mk.tcoKrw)} (${formatUsd(m.sc15mk.tcoUsd)})`);

    setText('labWsSavingsKrw', `${formatKrwCompact(m.savingsKrw)} (${formatUsd(m.savingsUsd)})`);
    setText('labWsSavingsPct', `${m.savingsPct.toFixed(2)}%`);

    const powerRatio = m.axon.powerKw > 0 ? (m.sc15mk.powerKw / m.axon.powerKw).toFixed(1) : '0';
    setText('labWsPowerRatio', `${powerRatio}× 절전 (${m.axon.powerKw} kW vs ${m.sc15mk.powerKw} kW)`);
    setText(
      'labWsPolicyNote',
      `${DATA.pricing_policy} · fabrication_release: ${DATA.fabrication_release_status}`
    );

    renderSubsystemBars('labWsSubsystems', m.tier, m.band, m.fx);
    drawTcoChart(m);
  }

  if (labWsTierEl) {
    labWsTierEl.addEventListener('change', () => {
      if (DATA.tiers[labWsTierEl.value]) {
        bomState.tierId = labWsTierEl.value;
        updateBomLab();
      }
    });
  }
  labWsTierBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-lab-ws-tier');
      if (id && DATA.tiers[id]) {
        bomState.tierId = id;
        updateBomLab();
      }
    });
  });
  bomBandBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const band = btn.getAttribute('data-bom-band');
      if (band === 'low' || band === 'baseline' || band === 'high') {
        bomState.band = band;
        updateBomLab();
      }
    });
  });
  if (labWsFxEl) {
    labWsFxEl.addEventListener('input', () => {
      bomState.fx = Number(labWsFxEl.value) || 1350;
      updateBomLab();
    });
  }
  if (labWsTariffEl) {
    labWsTariffEl.addEventListener('input', () => {
      bomState.tariff = Number(labWsTariffEl.value) || 150;
      updateBomLab();
    });
  }
  if (labWsYearsEl) {
    labWsYearsEl.addEventListener('input', () => {
      bomState.years = Number(labWsYearsEl.value) || 5;
      updateBomLab();
    });
  }

  // Redraw canvas when Lab 4 tab becomes visible or window resizes
  document.querySelectorAll('.lab-tab[data-lab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.getAttribute('data-lab') === 'workstation') {
        requestAnimationFrame(() => updateBomLab());
      }
    });
  });
  window.addEventListener('resize', () => {
    const labWsPanel = document.getElementById('lab-workstation');
    if (labWsPanel && !labWsPanel.hidden) {
      drawTcoChart(computeTcoMetrics());
    }
  });

  updateBomLab();

  // =========================================================================
  // C. LAB 5: 18B (243+13) FAIL-CLOSED PACKET & 0-SKIP RTL INSPECTOR (#lab-pkt18)
  // =========================================================================
  const pktCtrlSelect = document.getElementById('pktCtrlSelect');
  const pktCorruptByteCheck = document.getElementById('pktCorruptByteCheck');
  const pktPadCheck = document.getElementById('pktPadCheck');
  const pktRxLastCheck = document.getElementById('pktRxLastCheck');
  const pktZeroSkipCheck = document.getElementById('pktZeroSkipCheck');
  const pktSoftModeCheck = document.getElementById('pktSoftModeCheck');
  const pktResetBtn = document.getElementById('pktResetBtn');
  const pktTileGrid = document.getElementById('pktTileGrid');

  const TILE_META = [
    { idx: 0, tag: 'Corner', label: 'T0 · 북서 모서리' },
    { idx: 1, tag: 'Axial', label: 'T1 · 북축' },
    { idx: 2, tag: 'Corner', label: 'T2 · 북동 모서리' },
    { idx: 3, tag: 'Axial', label: 'T3 · 서축' },
    { idx: 4, tag: 'Core 六', label: 'T4 · 중심 六(4,4)' },
    { idx: 5, tag: 'Axial 成環', label: 'T5 · 동축 成環' },
    { idx: 6, tag: 'Corner', label: 'T6 · 남서 모서리' },
    { idx: 7, tag: 'Axial', label: 'T7 · 남축' },
    { idx: 8, tag: 'Corner', label: 'T8 · 남동 모서리' }
  ];

  // true = syndrome != 0 (needs QEC update), false = syndrome == 0 (eligible for 0-SKIP)
  const tileSyndromes = [false, true, false, false, true, false, false, false, false];

  function ensureTileButtons() {
    const existing = document.querySelectorAll('[data-tile-idx]');
    if (existing.length === 9) return existing;
    if (!pktTileGrid) return [];

    pktTileGrid.innerHTML = TILE_META.map((t) => `
      <button type="button" class="pkt-tile-btn ${t.idx === 4 ? 'is-center' : ''}" data-tile-idx="${t.idx}">
        <span class="pkt-tile-id">T${t.idx}</span>
        <span class="pkt-tile-role">${escapeHtml(t.tag)}</span>
        <span class="pkt-tile-state">--</span>
      </button>
    `).join('');
    return pktTileGrid.querySelectorAll('[data-tile-idx]');
  }

  function findCtrlCommand(code) {
    return DATA.packet_18b.commands.find((c) => c.code === code) || null;
  }

  function updatePkt18Lab() {
    const ctrlVal = pktCtrlSelect ? Number(pktCtrlSelect.value) : 248;
    const corruptData = pktCorruptByteCheck ? pktCorruptByteCheck.checked : false;
    const padNonZero = pktPadCheck ? pktPadCheck.checked : false;
    const rxLastOk = pktRxLastCheck ? pktRxLastCheck.checked : true;
    const zeroSkipEn = pktZeroSkipCheck ? pktZeroSkipCheck.checked : true;
    const softMode = pktSoftModeCheck ? pktSoftModeCheck.checked : false;

    const errCtrlRange = !(ctrlVal >= 243 && ctrlVal <= 255);
    const errDataDomain = corruptData;
    const errPadNonZero = padNonZero;
    const errFrameLen = !rxLastOk;
    const hasError = errCtrlRange || errDataDomain || errPadNonZero || errFrameLen;
    const isEmergencySkip = !hasError && ctrlVal === 255;

    const cmdInfo = findCtrlCommand(ctrlVal);
    const verdictBadge = document.getElementById('pktVerdictBadge');
    if (verdictBadge) {
      verdictBadge.textContent = hasError ? 'FAIL_CLOSED_REJECT' : 'COMMIT_81_GRID';
      verdictBadge.classList.toggle('is-reject', hasError);
      verdictBadge.classList.toggle('is-commit', !hasError);
    }

    if (hasError) {
      setText('pktVerdictTitle', '원자적 폐기 (FAIL_CLOSED_REJECT) — 81-셀 격자 보호됨');
      setText(
        'pktVerdictDesc',
        '스테이징 버퍼 검증에서 무결성 위반이 검출되어 bytes[0..16]을 커밋하지 않고 폐기했습니다. 기존 Pauli Frame과 QEC 상태는 100% 보존됩니다.'
      );
    } else if (isEmergencySkip) {
      setText('pktVerdictTitle', `비상 0-SKIP 차단 (255 · ${cmdInfo.symbol})`);
      setText(
        'pktVerdictDesc',
        '패킷 무결성을 통과한 비상 정지 명령(255)입니다. 전 타일(T0..T8) 오퍼랜드를 즉시 0으로 클램프하고 Pauli-Frame FF 클럭 인에이블을 차단합니다.'
      );
    } else {
      setText('pktVerdictTitle', `원자적 커밋 완료 (${ctrlVal} · ${cmdInfo ? cmdInfo.symbol : 'VALID'})`);
      setText('pktVerdictDesc', cmdInfo ? cmdInfo.desc_ko : '81-셀 천부경 격자에 1사이클 원자적 커밋을 완료했습니다.');
    }

    // Error flags readout
    const flags = [];
    if (errCtrlRange) flags.push(`ERR_CTRL_RANGE (byte[17]=${ctrlVal} < 243)`);
    if (errDataDomain) flags.push('ERR_DATA_GE_243 (byte[5]=248)');
    if (errPadNonZero) flags.push('ERR_PAD_TRITS_NZ (trits[81..84]!=0)');
    if (errFrameLen) flags.push('ERR_FRAME_LEN (rx_last != 17)');
    const errFlagsEl = document.getElementById('pktErrorFlags');
    if (errFlagsEl) {
      errFlagsEl.textContent = flags.length ? flags.join(' · ') : '0x0 (ALL CHECKS PASS)';
      errFlagsEl.classList.toggle('has-error', flags.length > 0);
    }

    // 18-Byte Dump
    const dumpEl = document.getElementById('pktByteDump');
    if (dumpEl) {
      const sampleBytes = [
        42, 108, 17, 205, 89,
        corruptData ? 248 : 144,
        0, 63, 121, 199, 34, 77, 15, 210, 5, 92,
        padNonZero ? 240 : 12,
        ctrlVal
      ];
      dumpEl.innerHTML = sampleBytes
        .map((b, idx) => {
          const isCtrl = idx === 17;
          const isBad =
            (isCtrl && errCtrlRange) ||
            (!isCtrl && idx === 5 && errDataDomain) ||
            (!isCtrl && idx === 16 && errPadNonZero);
          const hex = b.toString(16).padStart(2, '0').toUpperCase();
          return `<span class="pkt-byte ${isCtrl ? 'is-ctrl' : ''} ${isBad ? 'is-bad' : ''}" title="byte[${idx}] = ${b} (0x${hex})"><small>${idx}</small>${b}</span>`;
        })
        .join('');
    }

    // 0-SKIP tile evaluation
    let activeTiles = 0;
    let skippedTiles = 0;
    const tileBtns = ensureTileButtons();
    tileBtns.forEach((btn) => {
      const idx = Number(btn.getAttribute('data-tile-idx'));
      const synActive = Boolean(tileSyndromes[idx]);
      // RTL invariant: !tile_enable || quarantine || (zero_skip_en && !mode_soft && syn==0)
      const isSkipped = isEmergencySkip || (!hasError && zeroSkipEn && !softMode && !synActive);
      const isExecuting = !hasError && !isSkipped;

      if (isSkipped) skippedTiles += 1;
      else if (isExecuting) activeTiles += 1;

      btn.classList.toggle('is-skipped', isSkipped);
      btn.classList.toggle('is-active-tile', isExecuting);
      btn.classList.toggle('is-rejected', hasError);
      const stateEl = btn.querySelector('.pkt-tile-state');
      if (stateEl) {
        stateEl.textContent = hasError
          ? 'HOLD'
          : isSkipped
          ? '0-SKIP'
          : 'EXEC';
      }
    });

    if (hasError) {
      setText('pktSkipCount', 'FAIL-CLOSED HOLD (0 커밋 · 9/9 기존 상태 유지)');
    } else {
      setText('pktSkipCount', `${activeTiles} / 9 활성 실행 · ${skippedTiles} / 9 0-SKIP 클램프`);
    }

    setText('pktNodeSummary', DATA.cheonbu81_qec_top_0mul.topology);

    const txFrameByte17 = isEmergencySkip ? 255 : 253;
    setText(
      'pktTxSafety',
      `119-bit TX: 17B (7-bit/B < 128 < 243) + Byte[17]=${txFrameByte17} → 대역 충돌 0건 (Safe)`
    );

    const topMod = DATA.cheonbu81_qec_top_0mul.sky130_modules[4];
    setText(
      'pktRtlMetrics',
      `Sky130: ${topMod.area_um2.toLocaleString('en-US')} µm² · ${topMod.cells.toLocaleString('en-US')} cells · ${topMod.delay_ns.toFixed(3)} ns (${topMod.fmax_mhz} MHz) · ${topMod.ports} pins · t:$mul=0`
    );
  }

  function bindTileHandlers() {
    const btns = ensureTileButtons();
    btns.forEach((btn) => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-tile-idx'));
        if (idx >= 0 && idx < 9) {
          tileSyndromes[idx] = !tileSyndromes[idx];
          updatePkt18Lab();
        }
      });
    });
  }

  if (pktCtrlSelect) pktCtrlSelect.addEventListener('change', updatePkt18Lab);
  if (pktCorruptByteCheck) pktCorruptByteCheck.addEventListener('change', updatePkt18Lab);
  if (pktPadCheck) pktPadCheck.addEventListener('change', updatePkt18Lab);
  if (pktRxLastCheck) pktRxLastCheck.addEventListener('change', updatePkt18Lab);
  if (pktZeroSkipCheck) pktZeroSkipCheck.addEventListener('change', updatePkt18Lab);
  if (pktSoftModeCheck) pktSoftModeCheck.addEventListener('change', updatePkt18Lab);

  if (pktResetBtn) {
    pktResetBtn.addEventListener('click', () => {
      if (pktCtrlSelect) pktCtrlSelect.value = '248';
      if (pktCorruptByteCheck) pktCorruptByteCheck.checked = false;
      if (pktPadCheck) pktPadCheck.checked = false;
      if (pktRxLastCheck) pktRxLastCheck.checked = true;
      if (pktZeroSkipCheck) pktZeroSkipCheck.checked = true;
      if (pktSoftModeCheck) pktSoftModeCheck.checked = false;
      const defaults = [false, true, false, false, true, false, false, false, false];
      for (let i = 0; i < 9; i++) tileSyndromes[i] = defaults[i];
      updatePkt18Lab();
    });
  }

  bindTileHandlers();
  updatePkt18Lab();
})();
