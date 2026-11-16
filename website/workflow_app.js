/* AXON Quantum — Interactive Development Workflow & Fabrication Release App */
(function () {
  'use strict';

  const STORAGE_KEY = 'axon_quantum_workflow_v1';

  const GALLERY_ITEMS = [
    {
      src: 'assets/images/axon_sovereign_ai_quantum_arch.jpg',
      alt: 'AXON Sovereign AI Quantum 전체 시스템 아키텍처 다이어그램',
      caption: 'ARCH-01 · AXON Sovereign AI Quantum 전체 아키텍처 — 0-MUL 코어, 77K 자유공간 광학 캐비티, 243+13 WDM 코덱'
    },
    {
      src: 'assets/images/cheonbu81_chip_cavity_floorplan.jpg',
      alt: 'Cheonbu-81 Sky130 9타일 칩 및 58x58mm 광학 캐비티 플로어플랜',
      caption: 'ARCH-02 · Cheonbu-81 칩 & 캐비티 플로어플랜 — Sky130 9타일 코어(38,957.36 µm²) & 58×58 mm 6N 골드 4-반사 링'
    },
    {
      src: 'assets/images/axon_quantum_4tier_roadmap.jpg',
      alt: 'AXON Quantum 4-Tier 워크스테이션 및 M1-M24 로드맵',
      caption: 'ARCH-03 · AXON Quantum 4-Tier 마스터 로드맵 — Tier 1 데스크톱부터 Tier 4 국가 양자 데이터센터'
    }
  ];

  const state = {
    milestone: 'ALL',
    domain: 'ALL',
    status: 'ALL',
    search: '',
    activeDirTab: 'workloads',
    checked: {},
    expanded: new Set(),
    lightboxIdx: 0
  };

  let normalized = null;
  let toastTimer = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function asArray(val) {
    if (Array.isArray(val)) return val;
    if (val === null || val === undefined || val === '') return [];
    return [val];
  }

  function normalizeTask(raw, index) {
    const id = String(raw.id || `TASK-${String(index + 1).padStart(2, '0')}`);
    const priorityRaw = String(raw.priority || 'P1').toUpperCase();
    const priority = ['P0', 'P1', 'P2'].includes(priorityRaw) ? priorityRaw : 'P1';
    const evidence = String(
      raw.evidenceStatus || raw.evidence || raw.statusBadge || raw.badge || '[TARGET]'
    );
    const defaultDone = Boolean(
      raw.defaultDone !== undefined
        ? raw.defaultDone
        : raw.completed !== undefined
          ? raw.completed
          : raw.done
    );

    const specs = asArray(raw.specs || raw.parts || raw.requiredParts || raw.requirements);
    const vendors = asArray(raw.vendors || raw.companies || raw.partners);
    const files = asArray(raw.files || raw.relatedFiles || raw.artifacts);
    const budget = raw.budget || raw.estimatedBudget || raw.cost || '미정 / 추후 산정';

    return {
      id,
      title: String(raw.title || raw.name || id),
      description: String(raw.description || raw.desc || raw.summary || ''),
      domain: String(raw.domain || raw.domainId || raw.category || 'general'),
      milestone: String(raw.milestone || 'M1-M6'),
      gate: String(raw.gate || raw.gateId || ''),
      priority,
      evidence,
      defaultDone,
      specs,
      vendors,
      budget: String(budget),
      files
    };
  }

  function normalizeData(raw) {
    const safe = raw && typeof raw === 'object' ? raw : {};
    const rawTasks = Array.isArray(safe.tasks)
      ? safe.tasks
      : Array.isArray(safe.checklist)
        ? safe.checklist
        : Array.isArray(safe.items)
          ? safe.items
          : [];

    const tasks = rawTasks.map(normalizeTask);

    let domains = [];
    if (Array.isArray(safe.domains) && safe.domains.length > 0) {
      domains = safe.domains.map((d, idx) => {
        if (typeof d === 'string') return { id: d, name: d };
        return {
          id: String(d.id || d.key || `domain-${idx + 1}`),
          name: String(d.name || d.label || d.title || d.id || `Domain ${idx + 1}`),
          description: String(d.description || '')
        };
      });
    } else {
      const seen = new Set();
      tasks.forEach((t) => {
        if (!seen.has(t.domain)) {
          seen.add(t.domain);
          domains.push({ id: t.domain, name: t.domain, description: '' });
        }
      });
    }

    const rawGates = Array.isArray(safe.gates)
      ? safe.gates
      : Array.isArray(safe.fabricationGates)
        ? safe.fabricationGates
        : [];

    const gates = (rawGates.length > 0
      ? rawGates
      : [
          { id: 'Gate 1', title: 'RTL & Formal Verification', condition: '0-MUL 코어 Yosys/ABC 합성 및 SymbiYosys BMC 통과' },
          { id: 'Gate 2', title: '77K Optical Cavity Alignment', condition: '58×58 mm 6N 골드 4-반사 링 캐비티 광로 정합 검증' },
          { id: 'Gate 3', title: 'MPW Tape-out Readiness', condition: 'Sky130 DRC/LVS/STA Sign-off 및 BOM 조달 확정' },
          { id: 'Gate 4', title: 'System & Sovereign AI Integration', condition: '워크스테이션·드라이버·243+13 WDM 종단간 통합 검증' }
        ]
    ).map((g, idx) => ({
      id: String(g.id || `Gate ${idx + 1}`),
      title: String(g.title || g.name || `Gate ${idx + 1}`),
      condition: String(g.condition || g.criteria || g.description || ''),
      milestone: String(g.milestone || ''),
      taskIds: Array.isArray(g.taskIds) ? g.taskIds.map(String) : null
    }));

    const workloads = Array.isArray(safe.workloads) ? safe.workloads : [];
    const vendorDirectory = Array.isArray(safe.vendorDirectory)
      ? safe.vendorDirectory
      : Array.isArray(safe.vendors)
        ? safe.vendors
        : [];

    return { tasks, domains, gates, workloads, vendorDirectory };
  }

  function buildDefaultCheckedMap(tasks) {
    const map = {};
    tasks.forEach((t) => {
      map[t.id] = Boolean(t.defaultDone);
    });
    return map;
  }

  function loadCheckedState(tasks) {
    const defaults = buildDefaultCheckedMap(tasks);
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (!savedRaw) return defaults;
      const parsed = JSON.parse(savedRaw);
      const savedMap = parsed && typeof parsed === 'object'
        ? (parsed.checked && typeof parsed.checked === 'object' ? parsed.checked : parsed)
        : {};
      const merged = { ...defaults };
      Object.keys(merged).forEach((id) => {
        if (typeof savedMap[id] === 'boolean') {
          merged[id] = savedMap[id];
        }
      });
      return merged;
    } catch {
      return defaults;
    }
  }

  function saveCheckedState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          updatedAt: new Date().toISOString(),
          checked: state.checked
        })
      );
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }

  function showToast(msg) {
    const el = document.getElementById('wfToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 2600);
  }

  function getDomainName(domainId) {
    const found = normalized.domains.find((d) => d.id === domainId || d.name === domainId);
    return found ? found.name : domainId;
  }

  function matchGateTask(gate, task) {
    if (gate.taskIds && gate.taskIds.length > 0) {
      return gate.taskIds.includes(task.id);
    }
    const gId = gate.id.toLowerCase().replace(/\s+/g, '');
    const tGate = task.gate.toLowerCase().replace(/\s+/g, '');
    if (!tGate) return false;
    return tGate === gId || tGate.includes(gId) || gId.includes(tGate);
  }

  function computeGateStats() {
    return normalized.gates.map((gate) => {
      const linked = normalized.tasks.filter((t) => matchGateTask(gate, t));
      const done = linked.filter((t) => state.checked[t.id]).length;
      const total = linked.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const pass = total > 0 && done === total;
      return { gate, done, total, pct, pass };
    });
  }

  function getEvidenceClass(badge) {
    const upper = badge.toUpperCase();
    if (upper.includes('VERIFIED') || upper.includes('PASS') || upper.includes('PROVED')) {
      return 'badge-verified';
    }
    if (upper.includes('BLOCKED') || upper.includes('FAIL')) {
      return 'badge-blocked';
    }
    return 'badge-target';
  }

  function renderDashboard() {
    const tasks = normalized.tasks;
    const total = tasks.length;
    const done = tasks.filter((t) => state.checked[t.id]).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const p0Tasks = tasks.filter((t) => t.priority === 'P0');
    const p0Done = p0Tasks.filter((t) => state.checked[t.id]).length;

    const totalPctEl = document.getElementById('wfTotalPct');
    const totalBarEl = document.getElementById('wfTotalBar');
    const totalBarWrap = document.getElementById('wfTotalBarWrap');
    const doneCountEl = document.getElementById('wfDoneCount');
    const p0CountEl = document.getElementById('wfP0Count');

    if (totalPctEl) totalPctEl.textContent = `${pct}%`;
    if (totalBarEl) totalBarEl.style.width = `${pct}%`;
    if (totalBarWrap) totalBarWrap.setAttribute('aria-valuenow', String(pct));
    if (doneCountEl) doneCountEl.textContent = `${done} / ${total}`;
    if (p0CountEl) p0CountEl.textContent = `${p0Done} / ${p0Tasks.length}`;

    // Gate stats & fabrication_release
    const gateStats = computeGateStats();
    const allGatesPass = gateStats.length > 0 && gateStats.every((g) => g.pass);
    const fabBadge = document.getElementById('wfFabReleaseBadge');
    const fabDesc = document.getElementById('wfFabReleaseDesc');
    const miniRow = document.getElementById('wfGateMiniRow');

    if (fabBadge) {
      fabBadge.textContent = allGatesPass ? 'READY' : 'BLOCKED';
      fabBadge.className = `wf-gate-pill mono ${allGatesPass ? 'ready' : 'blocked'}`;
    }
    if (fabDesc) {
      fabDesc.textContent = allGatesPass
        ? 'Gate 1~4 모든 제작승인 게이트가 통과되어 테이프아웃 및 제작 착수가 가능합니다.'
        : 'Gate 1~4 중 미완료 게이트가 남아 있어 fabrication_release가 BLOCKED 상태입니다.';
    }
    if (miniRow) {
      miniRow.innerHTML = gateStats
        .map(
          (gs, idx) => `
          <div class="wf-gate-mini ${gs.pass ? 'pass' : 'fail'}">
            <strong>G${idx + 1}</strong>
            <span>${gs.done}/${gs.total}</span>
          </div>`
        )
        .join('');
    }

    // 6-Domain Mini Progress Strip
    const stripEl = document.getElementById('wfDomainStrip');
    if (stripEl) {
      stripEl.innerHTML = normalized.domains
        .slice(0, 6)
        .map((dom) => {
          const domTasks = tasks.filter((t) => t.domain === dom.id || t.domain === dom.name);
          const domDone = domTasks.filter((t) => state.checked[t.id]).length;
          const domPct = domTasks.length > 0 ? Math.round((domDone / domTasks.length) * 100) : 0;
          const isActive = state.domain === dom.id;
          return `
            <button type="button" class="wf-domain-chip ${isActive ? 'active' : ''}" data-domain-chip="${escapeHtml(dom.id)}" aria-pressed="${isActive}">
              <div class="wf-domain-chip-top">
                <span class="wf-domain-name">${escapeHtml(dom.name)}</span>
                <span class="wf-domain-pct mono">${domPct}%</span>
              </div>
              <div class="wf-mini-track">
                <div class="wf-mini-fill" style="width: ${domPct}%"></div>
              </div>
              <span class="wf-domain-count mono">${domDone} / ${domTasks.length} 완료</span>
            </button>`;
        })
        .join('');
    }

    // Gate 1~4 Detail Cards
    const gatesGrid = document.getElementById('wfGatesGrid');
    if (gatesGrid) {
      gatesGrid.innerHTML = gateStats
        .map(
          (gs) => `
          <article class="wf-gate-card ${gs.pass ? 'pass' : ''}">
            <div class="wf-gate-card-head">
              <span class="wf-gate-id mono">${escapeHtml(gs.gate.id)}</span>
              <span class="wf-gate-status mono ${gs.pass ? 'pass' : 'pending'}">
                ${gs.pass ? 'PASS' : 'PENDING'}
              </span>
            </div>
            <h3>${escapeHtml(gs.gate.title)}</h3>
            <p class="wf-gate-cond">${escapeHtml(gs.gate.condition)}</p>
            <div class="wf-gate-foot">
              <div class="wf-mini-track">
                <div class="wf-mini-fill" style="width: ${gs.pct}%"></div>
              </div>
              <div class="wf-gate-ratio mono">
                <span>연결 태스크 ${gs.done} / ${gs.total}</span>
                <span>${gs.pct}%</span>
              </div>
            </div>
          </article>`
        )
        .join('');
    }
  }

  function getFilteredTasks() {
    const q = state.search.trim().toLowerCase();
    return normalized.tasks.filter((task) => {
      if (state.milestone !== 'ALL' && task.milestone !== state.milestone) {
        return false;
      }
      if (state.domain !== 'ALL' && task.domain !== state.domain && getDomainName(task.domain) !== state.domain) {
        return false;
      }
      const isDone = Boolean(state.checked[task.id]);
      if (state.status === 'TODO' && isDone) return false;
      if (state.status === 'DONE' && !isDone) return false;
      if (state.status === 'P0' && task.priority !== 'P0') return false;

      if (q) {
        const haystack = [
          task.id,
          task.title,
          task.description,
          task.domain,
          getDomainName(task.domain),
          task.milestone,
          task.gate,
          task.evidence,
          task.budget,
          ...task.specs,
          ...task.vendors,
          ...task.files
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  function renderChecklist() {
    const listEl = document.getElementById('wfChecklistList');
    const countEl = document.getElementById('wfResultCount');
    if (!listEl) return;

    const filtered = getFilteredTasks();
    if (countEl) {
      countEl.textContent = `${filtered.length}개 항목 표시`;
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="wf-empty-state">
          <p>선택한 필터 또는 검색어와 일치하는 태스크가 없습니다.</p>
        </div>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((task) => {
        const isDone = Boolean(state.checked[task.id]);
        const isExpanded = state.expanded.has(task.id);
        const prioClass = `badge-${task.priority.toLowerCase()}`;
        const evClass = getEvidenceClass(task.evidence);
        const domainName = getDomainName(task.domain);

        const specsHtml =
          task.specs.length > 0
            ? `<ul>${task.specs.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
            : '<p>등록된 부품·스펙 정보 없음</p>';

        const vendorsHtml =
          task.vendors.length > 0
            ? `<ul>${task.vendors.map((v) => `<li>${escapeHtml(v)}</li>`).join('')}</ul>`
            : '<p>내부 자체 수행 / 지정 벤더 없음</p>';

        const filesHtml =
          task.files.length > 0
            ? `<div class="wf-file-list">${task.files
                .map((f) => `<span class="wf-file-pill">${escapeHtml(f)}</span>`)
                .join('')}</div>`
            : '<p>연관 파일 없음</p>';

        return `
          <article class="wf-task-card ${isDone ? 'is-done' : ''}" data-task-id="${escapeHtml(task.id)}">
            <div class="wf-task-main">
              <div class="wf-check-wrap">
                <input
                  type="checkbox"
                  class="wf-checkbox"
                  id="chk-${escapeHtml(task.id)}"
                  data-toggle-task="${escapeHtml(task.id)}"
                  ${isDone ? 'checked' : ''}
                  aria-label="${escapeHtml(task.title)} 완료 표시"
                />
              </div>

              <div class="wf-task-body">
                <div class="wf-task-meta">
                  <span class="wf-task-id mono">${escapeHtml(task.id)}</span>
                  <span class="wf-badge ${prioClass} mono">${escapeHtml(task.priority)}</span>
                  <span class="wf-badge ${evClass} mono">${escapeHtml(task.evidence)}</span>
                  <span class="wf-tag mono">${escapeHtml(task.milestone)}</span>
                  ${task.gate ? `<span class="wf-tag mono">${escapeHtml(task.gate)}</span>` : ''}
                  <span class="wf-tag">${escapeHtml(domainName)}</span>
                </div>

                <label class="wf-task-title" for="chk-${escapeHtml(task.id)}">
                  ${escapeHtml(task.title)}
                </label>
                <p class="wf-task-desc">${escapeHtml(task.description)}</p>
              </div>

              <button
                type="button"
                class="wf-detail-toggle"
                data-toggle-detail="${escapeHtml(task.id)}"
                aria-expanded="${isExpanded}"
              >
                ${isExpanded ? '상세 접기 ▲' : '상세 보기 ▼'}
              </button>
            </div>

            <div class="wf-task-details" ${isExpanded ? '' : 'hidden'}>
              <div class="wf-detail-block">
                <h4>필요 부품 · 스펙</h4>
                ${specsHtml}
              </div>
              <div class="wf-detail-block">
                <h4>관련 기업 / 벤더</h4>
                ${vendorsHtml}
              </div>
              <div class="wf-detail-block">
                <h4>예상 예산</h4>
                <p class="mono">${escapeHtml(task.budget)}</p>
              </div>
              <div class="wf-detail-block">
                <h4>연관 파일</h4>
                ${filesHtml}
              </div>
            </div>
          </article>`;
      })
      .join('');
  }

  function renderDirectory() {
    const wlCount = document.getElementById('wfWorkloadCount');
    const vdCount = document.getElementById('wfVendorCount');
    const wlPanel = document.getElementById('wfWorkloadsPanel');
    const vdPanel = document.getElementById('wfVendorsPanel');

    if (wlCount) wlCount.textContent = String(normalized.workloads.length);
    if (vdCount) vdCount.textContent = String(normalized.vendorDirectory.length);

    if (wlPanel) {
      if (normalized.workloads.length === 0) {
        wlPanel.innerHTML = '<div class="wf-empty-state"><p>등록된 워크로드 데이터가 없습니다.</p></div>';
      } else {
        wlPanel.innerHTML = `
          <div class="wf-table-wrap">
            <table class="wf-table">
              <thead>
                <tr>
                  <th>ID / 워크로드</th>
                  <th>도메인 · 티어</th>
                  <th>목표 성능 / 지연</th>
                  <th>검증 상태</th>
                  <th>설명</th>
                </tr>
              </thead>
              <tbody>
                ${normalized.workloads
                  .map((w) => {
                    const name = w.name || w.title || w.id || '-';
                    const tier = w.tier || w.domain || '-';
                    const target = w.target || w.latency || w.throughput || w.metric || '-';
                    const status = w.status || w.evidenceStatus || '[TARGET]';
                    const desc = w.description || w.desc || w.notes || '-';
                    return `
                      <tr>
                        <td><strong>${escapeHtml(name)}</strong>${w.id ? `<br><span class="mono" style="color:var(--axon-cyan);font-size:0.75rem">${escapeHtml(w.id)}</span>` : ''}</td>
                        <td><span class="wf-tag">${escapeHtml(tier)}</span></td>
                        <td class="mono">${escapeHtml(target)}</td>
                        <td><span class="wf-badge ${getEvidenceClass(String(status))} mono">${escapeHtml(status)}</span></td>
                        <td>${escapeHtml(desc)}</td>
                      </tr>`;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>`;
      }
    }

    if (vdPanel) {
      if (normalized.vendorDirectory.length === 0) {
        vdPanel.innerHTML = '<div class="wf-empty-state"><p>등록된 기업·벤더 데이터가 없습니다.</p></div>';
      } else {
        vdPanel.innerHTML = `
          <div class="wf-table-wrap">
            <table class="wf-table">
              <thead>
                <tr>
                  <th>기업 / 벤더명</th>
                  <th>분야 · 도메인</th>
                  <th>국가</th>
                  <th>핵심 역할 / 품목</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                ${normalized.vendorDirectory
                  .map((v) => {
                    const name = v.name || v.company || '-';
                    const cat = v.category || v.domain || '-';
                    const country = v.country || v.region || '-';
                    const role = Array.isArray(v.products)
                      ? v.products.join(', ')
                      : (v.role || v.products || v.specs || '-');
                    const notes = v.notes || v.status || v.leadTime || '-';
                    return `
                      <tr>
                        <td><strong>${escapeHtml(name)}</strong></td>
                        <td><span class="wf-tag">${escapeHtml(cat)}</span></td>
                        <td class="mono">${escapeHtml(country)}</td>
                        <td>${escapeHtml(role)}</td>
                        <td>${escapeHtml(notes)}</td>
                      </tr>`;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>`;
      }
    }
  }

  function populateDomainSelect() {
    const select = document.getElementById('wfDomainFilter');
    if (!select) return;
    const options = ['<option value="ALL">전체 도메인</option>'];
    normalized.domains.forEach((d) => {
      options.push(`<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)}</option>`);
    });
    select.innerHTML = options.join('');
    select.value = state.domain;
  }

  function syncDomainFilterUI() {
    const select = document.getElementById('wfDomainFilter');
    if (select) select.value = state.domain;
    renderDashboard();
    renderChecklist();
  }

  function openLightbox(idx) {
    const modal = document.getElementById('wfLightbox');
    const img = document.getElementById('wfLightboxImg');
    const cap = document.getElementById('wfLightboxCaption');
    if (!modal || !img || !cap) return;

    state.lightboxIdx = (idx + GALLERY_ITEMS.length) % GALLERY_ITEMS.length;
    const item = GALLERY_ITEMS[state.lightboxIdx];
    img.src = item.src;
    img.alt = item.alt;
    cap.textContent = item.caption;
    modal.hidden = false;
  }

  function closeLightbox() {
    const modal = document.getElementById('wfLightbox');
    if (modal) modal.hidden = true;
  }

  function bindEvents() {
    // Mobile nav toggle
    const menuBtn = document.getElementById('wfMobileMenuBtn');
    const nav = document.getElementById('wfMainNav');
    if (menuBtn && nav) {
      menuBtn.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(open));
      });
    }

    // Domain strip click
    const strip = document.getElementById('wfDomainStrip');
    if (strip) {
      strip.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-domain-chip]');
        if (!btn) return;
        const domId = btn.getAttribute('data-domain-chip');
        state.domain = state.domain === domId ? 'ALL' : domId;
        syncDomainFilterUI();
      });
    }

    // Milestone tabs
    const tabs = document.getElementById('wfMilestoneTabs');
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-milestone]');
        if (!btn) return;
        state.milestone = btn.getAttribute('data-milestone') || 'ALL';
        tabs.querySelectorAll('.wf-tab').forEach((el) => {
          const active = el === btn;
          el.classList.toggle('active', active);
          el.setAttribute('aria-selected', String(active));
        });
        renderChecklist();
      });
    }

    // Domain select
    const domainSel = document.getElementById('wfDomainFilter');
    if (domainSel) {
      domainSel.addEventListener('change', (e) => {
        state.domain = e.target.value;
        syncDomainFilterUI();
      });
    }

    // Status select
    const statusSel = document.getElementById('wfStatusFilter');
    if (statusSel) {
      statusSel.addEventListener('change', (e) => {
        state.status = e.target.value;
        renderChecklist();
      });
    }

    // Search input
    const searchInput = document.getElementById('wfSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.search = e.target.value;
        renderChecklist();
      });
    }

    // Checklist checkbox & detail toggle (event delegation)
    const listEl = document.getElementById('wfChecklistList');
    if (listEl) {
      listEl.addEventListener('change', (e) => {
        const chk = e.target.closest('[data-toggle-task]');
        if (!chk) return;
        const id = chk.getAttribute('data-toggle-task');
        state.checked[id] = chk.checked;
        saveCheckedState();
        renderDashboard();
        renderChecklist();
        if (window.AXON_SUPABASE && window.AXON_SUPABASE.isConnected()) {
          window.AXON_SUPABASE.pushTask(id, chk.checked).then((res) => {
            if (!res.ok) showToast(`클라우드 동기화 실패: ${res.message || '권한 확인'}`);
          });
        }
      });

      listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-toggle-detail]');
        if (!btn) return;
        const id = btn.getAttribute('data-toggle-detail');
        if (state.expanded.has(id)) {
          state.expanded.delete(id);
        } else {
          state.expanded.add(id);
        }
        renderChecklist();
      });
    }

    // Export JSON
    const exportBtn = document.getElementById('wfExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const payload = {
          app: 'AXON_QUANTUM_WORKFLOW',
          version: 1,
          exportedAt: new Date().toISOString(),
          checked: state.checked
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `axon-workflow-progress-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('진행상태를 JSON 파일로 내보냈습니다.');
      });
    }

    // Import JSON
    const importBtn = document.getElementById('wfImportBtn');
    const importInput = document.getElementById('wfImportInput');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result || '{}'));
            const incoming = parsed && parsed.checked && typeof parsed.checked === 'object'
              ? parsed.checked
              : parsed;
            if (!incoming || typeof incoming !== 'object') {
              throw new Error('Invalid JSON');
            }
            const next = { ...state.checked };
            Object.keys(next).forEach((id) => {
              if (typeof incoming[id] === 'boolean') {
                next[id] = incoming[id];
              }
            });
            state.checked = next;
            saveCheckedState();
            renderDashboard();
            renderChecklist();
            showToast('JSON 진행상태를 성공적으로 불러왔습니다.');
          } catch {
            showToast('올바른 JSON 진행상태 파일이 아닙니다.');
          } finally {
            importInput.value = '';
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset to defaults
    const resetBtn = document.getElementById('wfResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!window.confirm('모든 체크리스트 진행상태를 기본값으로 초기화할까요?')) return;
        state.checked = buildDefaultCheckedMap(normalized.tasks);
        saveCheckedState();
        renderDashboard();
        renderChecklist();
        showToast('기본값으로 초기화되었습니다.');
      });
    }

    // Gallery & Lightbox
    const galleryGrid = document.getElementById('wfGalleryGrid');
    if (galleryGrid) {
      galleryGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.wf-gallery-card');
        if (!card) return;
        openLightbox(Number(card.getAttribute('data-idx') || 0));
      });
      galleryGrid.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('.wf-gallery-card');
        if (!card) return;
        e.preventDefault();
        openLightbox(Number(card.getAttribute('data-idx') || 0));
      });
    }

    const lbModal = document.getElementById('wfLightbox');
    const lbClose = document.getElementById('wfLightboxClose');
    const lbPrev = document.getElementById('wfLightboxPrev');
    const lbNext = document.getElementById('wfLightboxNext');

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', () => openLightbox(state.lightboxIdx - 1));
    if (lbNext) lbNext.addEventListener('click', () => openLightbox(state.lightboxIdx + 1));
    if (lbModal) {
      lbModal.addEventListener('click', (e) => {
        if (e.target === lbModal) closeLightbox();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (!lbModal || lbModal.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightbox(state.lightboxIdx - 1);
      if (e.key === 'ArrowRight') openLightbox(state.lightboxIdx + 1);
    });

    // Directory Tabs (Workloads / Vendors)
    document.querySelectorAll('.wf-dir-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-dir-tab');
        state.activeDirTab = target;
        document.querySelectorAll('.wf-dir-tab').forEach((btn) => {
          const active = btn === tab;
          btn.classList.toggle('active', active);
          btn.setAttribute('aria-selected', String(active));
        });
        const wlPanel = document.getElementById('wfWorkloadsPanel');
        const vdPanel = document.getElementById('wfVendorsPanel');
        if (wlPanel) wlPanel.hidden = target !== 'workloads';
        if (vdPanel) vdPanel.hidden = target !== 'vendors';
      });
    });
  }

  function updateSupabaseBadge() {
    const badge = document.getElementById('wfSupaBadge');
    const logoutBtn = document.getElementById('wfSupaLogoutBtn');
    const supa = window.AXON_SUPABASE;
    if (!badge || !supa) return;
    if (supa.isConnected()) {
      const user = supa.getUser();
      badge.textContent = user ? `Supabase (${user.email})` : 'Supabase 연결됨';
      badge.className = 'wf-supa-badge online mono';
      if (logoutBtn) logoutBtn.hidden = !user;
    } else {
      badge.textContent = '로컬 모드';
      badge.className = 'wf-supa-badge offline mono';
      if (logoutBtn) logoutBtn.hidden = true;
    }
  }

  async function refreshSupabaseLogs() {
    const listEl = document.getElementById('wfSupaLogsList');
    const supa = window.AXON_SUPABASE;
    if (!listEl || !supa) return;
    if (!supa.isConnected()) {
      listEl.innerHTML = '<p class="wf-supa-empty">Supabase에 연결하면 클라우드 실험 로그가 표시됩니다.</p>';
      return;
    }
    const res = await supa.listLogs(15);
    if (!res.ok) {
      listEl.innerHTML = `<p class="wf-supa-empty">로그 조회 실패: ${escapeHtml(res.message || '')}</p>`;
      return;
    }
    if (!res.logs.length) {
      listEl.innerHTML = '<p class="wf-supa-empty">아직 등록된 실험 로그가 없습니다.</p>';
      return;
    }
    listEl.innerHTML = res.logs
      .map((log) => {
        const dateStr = log.created_at ? new Date(log.created_at).toLocaleString('ko-KR') : '';
        return `
          <div class="wf-supa-log-item">
            <div class="wf-supa-log-item-head">
              <strong>${escapeHtml(log.task_id ? `[${log.task_id}] ` : '')}${escapeHtml(log.title)}</strong>
              <span class="wf-badge mono ${getEvidenceClass(log.evidence_tier)}">${escapeHtml(log.evidence_tier)}</span>
            </div>
            ${log.notes ? `<p style="margin:0 0 0.25rem;color:var(--text-light-muted)">${escapeHtml(log.notes)}</p>` : ''}
            <small class="mono" style="color:var(--text-light-muted)">${escapeHtml(dateStr)}</small>
          </div>
        `;
      })
      .join('');
  }

  async function pullFromSupabase(silent) {
    const supa = window.AXON_SUPABASE;
    if (!supa || !supa.isConnected()) {
      if (!silent) showToast('먼저 Supabase에 연결해 주세요.');
      return;
    }
    const res = await supa.pullTasks();
    if (!res.ok) {
      if (!silent) showToast(`불러오기 실패: ${res.message}`);
      return;
    }
    const next = { ...state.checked };
    let changed = 0;
    Object.keys(res.checkedMap).forEach((id) => {
      if (id in next && next[id] !== res.checkedMap[id]) {
        next[id] = res.checkedMap[id];
        changed += 1;
      }
    });
    state.checked = next;
    saveCheckedState();
    renderDashboard();
    renderChecklist();
    if (!silent) showToast(`클라우드 동기화 완료 (${Object.keys(res.checkedMap).length}건 수신, ${changed}건 갱신)`);
  }

  function bindSupabaseUI() {
    const supa = window.AXON_SUPABASE;
    if (!supa) return;

    const toggleBtn = document.getElementById('wfSupaToggleBtn');
    const panel = document.getElementById('wfSupaPanel');
    const urlInput = document.getElementById('wfSupaUrl');
    const keyInput = document.getElementById('wfSupaKey');

    const cfg = supa.getConfig();
    if (urlInput && cfg.url) urlInput.value = cfg.url;
    if (keyInput && cfg.anonKey) keyInput.value = cfg.anonKey;

    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', () => {
        const nextHidden = !panel.hidden;
        panel.hidden = nextHidden;
        toggleBtn.setAttribute('aria-expanded', String(!nextHidden));
      });
    }

    const connectBtn = document.getElementById('wfSupaConnectBtn');
    if (connectBtn) {
      connectBtn.addEventListener('click', async () => {
        const u = urlInput ? urlInput.value : '';
        const k = keyInput ? keyInput.value : '';
        const res = await supa.connect(u, k);
        updateSupabaseBadge();
        if (res.ok) {
          showToast('Supabase 연결 성공!');
          await pullFromSupabase(true);
          await refreshSupabaseLogs();
        } else {
          showToast(`연결 실패: ${res.message || res.reason}`);
        }
      });
    }

    const pullBtn = document.getElementById('wfSupaPullBtn');
    if (pullBtn) pullBtn.addEventListener('click', () => pullFromSupabase(false));

    const pushBtn = document.getElementById('wfSupaPushBtn');
    if (pushBtn) {
      pushBtn.addEventListener('click', async () => {
        if (!supa.isConnected()) return showToast('먼저 Supabase에 연결해 주세요.');
        const res = await supa.syncAll(state.checked);
        showToast(res.ok ? `현재 상태 ${res.count}건 클라우드 업로드 완료` : `업로드 실패: ${res.message}`);
      });
    }

    const discBtn = document.getElementById('wfSupaDisconnectBtn');
    if (discBtn) {
      discBtn.addEventListener('click', () => {
        supa.clearConfig();
        if (urlInput) urlInput.value = '';
        if (keyInput) keyInput.value = '';
        updateSupabaseBadge();
        refreshSupabaseLogs();
        showToast('Supabase 연결을 해제했습니다.');
      });
    }

    const loginBtn = document.getElementById('wfSupaLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('wfSupaEmail')?.value || '';
        const pass = document.getElementById('wfSupaPass')?.value || '';
        const res = await supa.signIn(email, pass);
        updateSupabaseBadge();
        showToast(res.ok ? `로그인 성공: ${res.user?.email || ''}` : `로그인 실패: ${res.message}`);
      });
    }

    const logoutBtn = document.getElementById('wfSupaLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await supa.signOut();
        updateSupabaseBadge();
        showToast('로그아웃되었습니다.');
      });
    }

    const logRefreshBtn = document.getElementById('wfLogRefreshBtn');
    if (logRefreshBtn) logRefreshBtn.addEventListener('click', refreshSupabaseLogs);

    const logAddBtn = document.getElementById('wfLogAddBtn');
    if (logAddBtn) {
      logAddBtn.addEventListener('click', async () => {
        if (!supa.isConnected()) return showToast('먼저 Supabase에 연결해 주세요.');
        const taskId = document.getElementById('wfLogTaskId')?.value || '';
        const tier = document.getElementById('wfLogTier')?.value || '[TARGET]';
        const title = document.getElementById('wfLogTitle')?.value || '';
        const notes = document.getElementById('wfLogNotes')?.value || '';
        if (!title.trim()) return showToast('실험/진행 제목을 입력해 주세요.');
        const res = await supa.addLog(taskId, title, tier, notes);
        if (res.ok) {
          document.getElementById('wfLogTitle').value = '';
          document.getElementById('wfLogNotes').value = '';
          showToast('클라우드 실험 로그가 저장되었습니다.');
          await refreshSupabaseLogs();
        } else {
          showToast(`로그 저장 실패: ${res.message}`);
        }
      });
    }

    // 저장된 설정이 있으면 자동 연결 시도
    if (cfg.url && cfg.anonKey) {
      supa.connect().then(async (res) => {
        updateSupabaseBadge();
        if (res.ok) {
          await pullFromSupabase(true);
          await refreshSupabaseLogs();
        }
      });
    } else {
      updateSupabaseBadge();
    }
  }

  function init() {
    normalized = normalizeData(window.AXON_WORKFLOW_DATA);
    state.checked = loadCheckedState(normalized.tasks);
    populateDomainSelect();
    renderDashboard();
    renderChecklist();
    renderDirectory();
    bindEvents();
    bindSupabaseUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
