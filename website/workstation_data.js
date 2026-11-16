(() => {
  'use strict';

  function deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    Object.keys(obj).forEach((key) => {
      deepFreeze(obj[key]);
    });
    return Object.freeze(obj);
  }

  const SUBSYSTEM_ORDER = [
    'optical_quantum_core',
    'digital_0mul_control',
    'cryo_vacuum_safety',
    'host_memory_storage',
    'chassis_rack_emi_power'
  ];

  const SUBSYSTEM_META = {
    optical_quantum_core: {
      id: 'optical_quantum_core',
      label: '1. 77K Free-Space Li-Fi 6N Au+DBR Cavity & Quantum Core',
      label_ko: '1. 77K 자유공간 Li-Fi 6N Au+DBR 광학 캐비티 & 양자 코어',
      color: '#38BDF8',
      tag: '[ENGINEERING] / [TARGET]'
    },
    digital_0mul_control: {
      id: 'digital_0mul_control',
      label: '2. 0-MUL Digital Control (cheonbu81_qec_top_0mul & 18B WDM)',
      label_ko: '2. 0-MUL 디지털 제어 (cheonbu81_qec_top_0mul & 18B WDM)',
      color: '#34D399',
      tag: '[SYNTHESIZED] / [VERIFIED]'
    },
    cryo_vacuum_safety: {
      id: 'cryo_vacuum_safety',
      label: '3. 77K Dry-Cavity Cryogenic, 10^-5 Torr Vacuum & PRV/ODH Safety',
      label_ko: '3. 77K 건식 냉각, 10^-5 Torr 진공 & PRV/ODH 안전 계통',
      color: '#E3B341',
      tag: '[ENGINEERING]'
    },
    host_memory_storage: {
      id: 'host_memory_storage',
      label: '4. 300K Host Compute, Memory (DDR5/CXL/HBM3E) & NVMe Storage',
      label_ko: '4. 300K 호스트 연산, 메모리 (DDR5/CXL/HBM3E) & NVMe 스토리지',
      color: '#A78BFA',
      tag: '[ENGINEERING]'
    },
    chassis_rack_emi_power: {
      id: 'chassis_rack_emi_power',
      label: '5. Chassis, Rack Mechanics (74/85mm), EMI Shielding & Power',
      label_ko: '5. 섀시, 랙 기구학 (74/85mm), EMI 차폐 & 전원 계통',
      color: '#FB7185',
      tag: '[ENGINEERING]'
    }
  };

  const DATA = {
    schema_version: '1.0.0',
    ssot_reference: 'AXON_QUANTUM_SSOT.md v1.2.0 (2026-11-06 KST)',
    fabrication_release_status: 'BLOCKED',
    pricing_policy: '[DERIVED/ASSUMED], EQ-01..EQ-12 OPEN',
    pricing_policy_full:
      'All unit prices are budgetary engineering ranges [DERIVED/ASSUMED] with zero fabricated vendor PO quotes (EQ-01..EQ-12 OPEN).',

    assumptions: {
      fx_krw_per_usd: 1350,
      fx_tag: '[DERIVED/ASSUMED]',
      electricity_tariff_krw_per_kwh: 150,
      electricity_tariff_tag: '[DERIVED/ASSUMED]',
      tco_horizon_years: 5,
      hours_per_year: 8760,
      duty_factor: 1.0,
      pricing_policy: '[DERIVED/ASSUMED], EQ-01..EQ-12 OPEN'
    },

    subsystem_order: SUBSYSTEM_ORDER,
    subsystem_meta: SUBSYSTEM_META,

    rack_mechanics: {
      pcb_dimensions_mm: '75.00 × 75.00 × 1.60 mm',
      pcb_spec: '6L ENEPIG Rev A2 (QSH-030 J1, YZ Edge-On)',
      cavity_lid_dimensions_mm: '58.00 × 58.00 × 5.00 mm',
      cavity_material: 'C10200 OFHC + 6N Au (99.9999%) + DBR 4-facet ring (Ø50 mm)',
      target_rq_nm: 1.74,
      scatter_budget_ppm: 100,
      slot_width_mm: 74.0,
      slot_pitch_mm: 85.0,
      rack_width_inch: 19,
      rack_clear_width_mm: 435.0,
      slots_per_shelf: 5,
      used_shelf_width_mm: 414.0,
      shelf_height_u: 4,
      shelf_height_mm: 177.8,
      vacuum_torr: '10^-5 Torr',
      vacuum_seal: 'Ø54 / 51.5 mm Indium / O-ring seal',
      dewar_volume_ml: 261.4,
      dewar_dimensions_mm: 'Ø51.6 × 125 mm',
      ln2_fill_ml: 200.0,
      hold_time_ideal_hours: 11.15,
      hold_time_loaded_hours: 9.70,
      parasitic_heat_w: 0.12,
      thermal_resistance_k_per_w: 1858,
      vibration_mount_status: '[UNCONFIRMED]'
    },

    packet_18b: {
      frame_bytes: 18,
      data_bytes: 17,
      ctrl_byte_index: 17,
      radix_base: 243,
      ctrl_min: 243,
      ctrl_max: 255,
      ctrl_count: 13,
      trits_per_byte: 5,
      total_trits_capacity: 85,
      grid_cells: 81,
      padding_trit_indices: [81, 82, 83, 84],
      clock_mhz: 129.7,
      critical_path_ns: 7.710,
      serial_bandwidth_mbps: 129.7,
      wdm_parallel_bandwidth_gbps: 2.335,
      wdm_rtt_ns: 10,
      tx_snapshot_bits: 119,
      tx_safe_byte_max: 127,
      tx_ctrl_bytes: [253, 255],
      commands: [
        { code: 243, symbol: 'CTRL_NOP_SKIP', label_ko: '유휴 / 0-SKIP 유지', desc_ko: '상태 변경 없이 0-SKIP 게이팅을 유지합니다.' },
        { code: 244, symbol: 'QEC_TRIT_ROUND', label_ko: '3진 QEC 라운드 실행', desc_ko: '18B 내 Ancilla 3진 신드롬을 디코딩해 Pauli 프레임을 갱신합니다.' },
        { code: 245, symbol: 'SPIRAL_PATH_A', label_ko: '나선 경로 A (천부 정방향)', desc_ko: '81-Trit 나선 LUT 경로 A를 선택합니다.' },
        { code: 246, symbol: 'SPIRAL_PATH_B1', label_ko: '나선 경로 B1 (성환 위상)', desc_ko: '81-Trit 나선 LUT 경로 B1을 선택합니다.' },
        { code: 247, symbol: 'SPIRAL_PATH_C', label_ko: '나선 경로 C (점대칭 역산)', desc_ko: '81-Trit 나선 LUT 경로 C를 선택합니다.' },
        { code: 248, symbol: 'PAULI_FRAME_COMMIT', label_ko: 'Pauli 프레임 커밋', desc_ko: '스테이징 버퍼의 V4 XOR Pauli 프레임을 원자적으로 커밋합니다.' },
        { code: 249, symbol: 'PAULI_FRAME_RESET', label_ko: 'Pauli 프레임 초기화', desc_ko: '45개 데이터 큐비트의 Pauli 프레임을 항등원(I=00)으로 리셋합니다.' },
        { code: 250, symbol: 'SEONGHWAN_SYNC', label_ko: '성환(成環) 루프 동기', desc_ko: '중심 六(40) 및 성환(48→49) 40쌍 점대칭 균형을 동기화합니다.' },
        { code: 251, symbol: 'ERASURE_MASK_LATCH', label_ko: '소실(Erasure) 마스크 래치', desc_ko: 'T0..T8.D0 광자 소실 격리 마스크를 래치합니다.' },
        { code: 252, symbol: 'RING_SCALE_SHIFT', label_ko: '동심원 링 배럴시프트', desc_ko: 'Center/Axial/Corner 5-링 가중치 시프트(-2..+2)를 적용합니다.' },
        { code: 253, symbol: 'TELEMETRY_READOUT', label_ko: '119-bit 텔레메트리 송신', desc_ko: '119비트 상태 스냅샷을 7-bit/byte (<128) + 253 프레임으로 출력합니다.' },
        { code: 254, symbol: 'HOTSWAP_PARAM_COMMIT', label_ko: 'Soft-IQ 파라미터 핫스왑', desc_ko: '8-bit Soft-IQ 임계 레지스터 뱅크(iq_wr_en)를 실시간 교체합니다.' },
        { code: 255, symbol: 'EMERGENCY_ZERO_SKIP', label_ko: '비상 전 타일 0-SKIP 차단', desc_ko: '전 타일 오퍼랜드를 즉시 0으로 클램프하고 안전 정지(Fail-Closed)합니다.' }
      ]
    },

    cheonbu81_qec_top_0mul: {
      topology: '3×3 = 9 Tiles (45 Data + 36 Ancilla = 81 nodes)',
      status_tags: ['[RTL-VERIFIED]', '[SYNTHESIZED-SKY130]', '[FORMAL-BMC-PROVED]'],
      openlane_pnr_status: '[NOT_RUN_IN_SANDBOX]',
      die_area_um: [0, 0, 340, 340],
      core_area_um: [20, 20, 320, 320],
      core_utilization_pct: 43.29,
      core_bound_factor: 3.18,
      pin_reduction_pct: 72.9,
      verification: {
        slang_lint: '0 errors, 0 warnings',
        iverilog_cosim: '9/9 PASS (0 errors)',
        rust_reference: '12/12 PASS (bit-exact)',
        symbiyosys_bmc: 'PASS (rc=0, depth 20, 35s)',
        yosys_mul_instances: 0
      },
      sky130_modules: [
        {
          module: 'qec_decoder_5qubit_0mul',
          role_ko: '기존 [[5,1,3]] 0-MUL 코어',
          ports: 57,
          cells: 78,
          ff: 0,
          area_um2: 380.36,
          delay_ns: 1.447,
          fmax_mhz: 691.1,
          lut4: null,
          ltp: null
        },
        {
          module: 'qec_tile_100q_0mul',
          role_ko: '기존 1D 평면 20타일 (IO-bound)',
          ports: 409,
          cells: 1450,
          ff: 326,
          area_um2: 13673.11,
          delay_ns: 4.110,
          fmax_mhz: 243.3,
          lut4: null,
          ltp: null
        },
        {
          module: 'cheonbu81_qec_tile_0mul',
          role_ko: 'Cheonbu-81 3×3 단일 타일 (5D+4A)',
          ports: 66,
          cells: 132,
          ff: 14,
          area_um2: 1084.79,
          delay_ns: 2.032,
          fmax_mhz: 492.1,
          lut4: 69,
          ltp: 18
        },
        {
          module: 'cheonbu81_qec_top_0mul (직렬감산 전)',
          role_ko: '개선 전 4단 감산 체인 버전',
          ports: 111,
          cells: 4708,
          ff: 631,
          area_um2: 38371.80,
          delay_ns: 10.285,
          fmax_mhz: 97.2,
          lut4: 3902,
          ltp: 53
        },
        {
          module: 'cheonbu81_qec_top_0mul (최종 243-LUT)',
          role_ko: '최종 243-상태 조합 LUT RTL',
          ports: 111,
          cells: 4749,
          ff: 631,
          area_um2: 38957.36,
          delay_ns: 7.710,
          fmax_mhz: 129.7,
          lut4: 3952,
          ltp: 32
        }
      ]
    },

    tier_order: [
      'tier_1_personal',
      'tier_2_enterprise',
      'tier_3_research',
      'tier_4_national'
    ],

    tiers: {
      tier_1_personal: {
        tier_id: 'tier_1_personal',
        tier_rank: 1,
        name: 'Tier 1: Personal / Developer Workstation',
        name_ko: 'Tier 1: 개인 · 개발자용 워크스테이션',
        short_name_ko: 'Tier 1 · 개인용',
        target_segment: 'Individual developers, startups, academic researchers',
        target_segment_ko: '개인 개발자, 딥테크 스타트업, 대학 개인 연구실',
        image: 'assets/images/tier1-workstation.jpg',
        image_caption_ko: 'AXON Tier 1: Mini 4U 데스크사이드 타워 (단일 74mm YZ 슬롯, 0.45 kW 가정용 220V 구동)',
        fabrication_release_status: 'BLOCKED',
        physical_qubits: { min: 5, max: 20 },
        logical_qubits_range: '1 ~ 4 LQ',
        qec_code: '[[5,1,3]] d=3 (1x Cheonbu-81 starter)',
        qec_mapping_detail:
          '[[5,1,3]] d=3 (5 Data Q/LQ -> 1~4 LQ; 45D 풀 Cheonbu-81 9타일 구성 시 최대 9 LQ). [[25,1,9]] d=9는 논리 큐비트당 25 Data Q 필요.',
        form_factor: 'Deskside Tower (Mini 4U, single 74mm YZ slot)',
        form_factor_ko: 'Mini 4U 데스크사이드 타워 (74mm 단일 YZ 슬롯, 75×75×1.6mm PCB)',
        cryo_architecture: 'Closed-cycle miniature Stirling (~15W @ 77K, sealed He)',
        cryo_architecture_ko: '폐쇄형 소형 스털링 극저온기 (~15W @ 77K, 봉입 He, 10^-5 Torr 건식)',
        host_memory_spec: '128GB LPDDR5X / DDR5',
        host_storage_spec: '4TB PCIe 5.0 NVMe SSD',
        packet_throughput: {
          blades: 1,
          serial_mbps: 129.7,
          wdm_gbps: 2.335,
          label: '129.7 MB/s 직렬 · 2.335 GB/s WDM (1 블레이드)'
        },
        rack_visual: {
          rack_count: 1,
          shelves: 1,
          slots_total: 5,
          slots_occupied: 1,
          blades_total: 1,
          slot_label_ko: '1 / 5 슬롯 점유 (Mini 4U 단일 카드)'
        },
        friendly_summary_ko:
          '책상 옆 일반 220V 콘센트(0.45 kW, 헤어드라이어 절반 이하)에 꽂아 쓰는 개인용 77K 광양자 워크스테이션입니다. 수십억 원대 초전도 냉동기 없이도 5~20 물리 큐비트([[5,1,3]] 1~4 LQ)를 직접 실험할 수 있습니다.',
        deep_summary_ko:
          'Rev A2 75×75×1.6 mm 6L ENEPIG 캐리어 PCB 1매 + 58×58×5 mm C10200 OFHC 6N Au+DBR 건식 캐비티(Ø50mm 4-패싯) + 261.4 mL(10^-5 Torr) 진공 조립체와 cheonbu81_qec_top_0mul 블레이드 1기(18B WDM 2.335 GB/s, ~10 ns RTT)를 74 mm 단일 YZ 슬롯에 통합했습니다.',
        wall_power_kw: 0.45,
        annual_kwh: 3942.0,
        cryo_maint_annual_krw: { low: 400000, baseline: 600000, high: 900000 },
        bom_capex: {
          krw: { low: 30500000, baseline: 39800000, high: 52300000 },
          usd: { low: 22592.59, baseline: 29481.48, high: 38740.74 }
        },
        subsystems: {
          optical_quantum_core: {
            label: SUBSYSTEM_META.optical_quantum_core.label,
            label_ko: SUBSYSTEM_META.optical_quantum_core.label_ko,
            baseline_share_pct: 35.18,
            krw: { low: 10500000, baseline: 14000000, high: 19000000 },
            usd: { low: 7777.78, baseline: 10370.37, high: 14074.07 }
          },
          digital_0mul_control: {
            label: SUBSYSTEM_META.digital_0mul_control.label,
            label_ko: SUBSYSTEM_META.digital_0mul_control.label_ko,
            baseline_share_pct: 12.56,
            krw: { low: 3500000, baseline: 5000000, high: 6500000 },
            usd: { low: 2592.59, baseline: 3703.7, high: 4814.81 }
          },
          cryo_vacuum_safety: {
            label: SUBSYSTEM_META.cryo_vacuum_safety.label,
            label_ko: SUBSYSTEM_META.cryo_vacuum_safety.label_ko,
            baseline_share_pct: 31.41,
            krw: { low: 10000000, baseline: 12500000, high: 16000000 },
            usd: { low: 7407.41, baseline: 9259.26, high: 11851.85 }
          },
          host_memory_storage: {
            label: SUBSYSTEM_META.host_memory_storage.label,
            label_ko: SUBSYSTEM_META.host_memory_storage.label_ko,
            baseline_share_pct: 13.82,
            krw: { low: 4500000, baseline: 5500000, high: 7000000 },
            usd: { low: 3333.33, baseline: 4074.07, high: 5185.19 }
          },
          chassis_rack_emi_power: {
            label: SUBSYSTEM_META.chassis_rack_emi_power.label,
            label_ko: SUBSYSTEM_META.chassis_rack_emi_power.label_ko,
            baseline_share_pct: 7.04,
            krw: { low: 2000000, baseline: 2800000, high: 3800000 },
            usd: { low: 1481.48, baseline: 2074.07, high: 2814.81 }
          }
        },
        baseline_15mk: {
          name: '15mK Superconducting Dilution Fridge Baseline (5~20Q)',
          name_ko: '15mK 초전도 희석냉동기 기준 모델 (5~20Q)',
          capex_krw: { low: 2025000000, baseline: 2497500000, high: 3240000000 },
          wall_power_kw: 28.0,
          annual_kwh: 245280.0,
          cryo_maint_annual_krw: { low: 80000000, baseline: 110000000, high: 150000000 },
          notes: 'Baseline $1.5M-$2.4M fridge + 4K pulse-tube + He-3 + 25kW+ chiller + RF racks'
        },
        tco_5yr_ref: {
          axon_tco_krw: { low: 35456500, baseline: 45756500, high: 59756500 },
          sc15mk_tco_krw: { low: 2608960000, baseline: 3231460000, high: 4173960000 },
          savings_krw: { low: 2573503500, baseline: 3185703500, high: 4114203500 },
          savings_pct: { low: 98.64, baseline: 98.58, high: 98.57 }
        }
      },

      tier_2_enterprise: {
        tier_id: 'tier_2_enterprise',
        tier_rank: 2,
        name: 'Tier 2: Enterprise / Industrial 42U Appliance',
        name_ko: 'Tier 2: 기업 · 산업용 42U 단일 랙 어플라이언스',
        short_name_ko: 'Tier 2 · 기업 42U',
        target_segment: 'Finance, pharma, logistics enterprise data centers',
        target_segment_ko: '금융·제약·물류 기업 전산실 및 산업용 AI·최적화 센터',
        image: 'assets/images/tier2-enterprise-rack.jpg',
        image_caption_ko: 'AXON Tier 2: 42U 표준 19" 단일 랙 (8U Cryo + 12U 0-MUL 제어 + 22U CXL/NVMe ZNS 호스트)',
        fabrication_release_status: 'BLOCKED',
        physical_qubits: { min: 100, max: 200 },
        logical_qubits_range: '20 ~ 40 LQ',
        qec_code: '[[5,1,3]] d=3 (20-card blade shelf)',
        qec_mapping_detail:
          '[[5,1,3]] d=3 기준 20 ~ 40 LQ (100~200 Data Q), [[25,1,9]] d=9 연접 코드 적용 시 4 ~ 8 LQ 구성 가능.',
        form_factor: '42U Single Standard 19-in Rack (8U Cryo + 12U Control + 22U Host/PSU)',
        form_factor_ko: '42U 표준 19인치 단일 랙 (8U 극저온 + 12U 제어 + 22U 호스트/전원)',
        cryo_architecture: 'Low-vibration pulse-tube cryocooler (~50W @ 77K, MTBF 50,000h)',
        cryo_architecture_ko: '저진동 펄스튜브 냉동기 (~50W @ 77K, MTBF 50,000h, 8U 진공 챔버)',
        host_memory_spec: '1TB DDR5 ECC + CXL 3.0 Memory Pool',
        host_storage_spec: '64TB NVMe ZNS (Zone Append syndrome/state dump)',
        packet_throughput: {
          blades: 4,
          serial_mbps: 518.8,
          wdm_gbps: 9.34,
          label: '블레이드당 129.7 MB/s · 2.335 GB/s WDM (4제어 블레이드 합산 9.34 GB/s)'
        },
        rack_visual: {
          rack_count: 1,
          shelves: 4,
          slots_total: 5,
          slots_occupied: 5,
          blades_total: 20,
          slot_label_ko: '5 / 5 풀 슬롯 × 4 쉘프 = 20 QPU 카드 (435mm 유효폭 중 414mm 사용)'
        },
        friendly_summary_ko:
          '일반 기업 전산실 표준 19인치 42U 서버 랙 1칸에 그대로 들어가는 산업용 양자 어플라이언스입니다. 냉각·제어·호스트 서버가 한 랙에 통합되어 있어 별도의 특수 건물 없이 2.5 kW 전력으로 100~200 물리 큐비트(20~40 LQ)를 가동합니다.',
        deep_summary_ko:
          'Rev 0.3 19인치 5-슬롯(74.0 mm 폭 / 85.0 mm 피치, 414/435 mm) 4U 쉘프 4단 적재로 20매 캐비티 카드를 수용합니다. 4× cheonbu81_qec_top_0mul 멀티타일 제어 블레이드(12U)가 18B WDM으로 300K 듀얼 소켓 서버(1TB DDR5 ECC + CXL 3.0 풀, 64TB NVMe ZNS)와 직결됩니다.',
        wall_power_kw: 2.5,
        annual_kwh: 21900.0,
        cryo_maint_annual_krw: { low: 2500000, baseline: 4000000, high: 6000000 },
        bom_capex: {
          krw: { low: 247000000, baseline: 330000000, high: 439000000 },
          usd: { low: 182962.96, baseline: 244444.44, high: 325185.19 }
        },
        subsystems: {
          optical_quantum_core: {
            label: SUBSYSTEM_META.optical_quantum_core.label,
            label_ko: SUBSYSTEM_META.optical_quantum_core.label_ko,
            baseline_share_pct: 44.24,
            krw: { low: 108000000, baseline: 146000000, high: 196000000 },
            usd: { low: 80000.0, baseline: 108148.15, high: 145185.19 }
          },
          digital_0mul_control: {
            label: SUBSYSTEM_META.digital_0mul_control.label,
            label_ko: SUBSYSTEM_META.digital_0mul_control.label_ko,
            baseline_share_pct: 13.03,
            krw: { low: 32000000, baseline: 43000000, high: 57000000 },
            usd: { low: 23703.7, baseline: 31851.85, high: 42222.22 }
          },
          cryo_vacuum_safety: {
            label: SUBSYSTEM_META.cryo_vacuum_safety.label,
            label_ko: SUBSYSTEM_META.cryo_vacuum_safety.label_ko,
            baseline_share_pct: 18.48,
            krw: { low: 47000000, baseline: 61000000, high: 80000000 },
            usd: { low: 34814.81, baseline: 45185.19, high: 59259.26 }
          },
          host_memory_storage: {
            label: SUBSYSTEM_META.host_memory_storage.label,
            label_ko: SUBSYSTEM_META.host_memory_storage.label_ko,
            baseline_share_pct: 16.67,
            krw: { low: 42000000, baseline: 55000000, high: 72000000 },
            usd: { low: 31111.11, baseline: 40740.74, high: 53333.33 }
          },
          chassis_rack_emi_power: {
            label: SUBSYSTEM_META.chassis_rack_emi_power.label,
            label_ko: SUBSYSTEM_META.chassis_rack_emi_power.label_ko,
            baseline_share_pct: 7.58,
            krw: { low: 18000000, baseline: 25000000, high: 34000000 },
            usd: { low: 13333.33, baseline: 18518.52, high: 25185.19 }
          }
        },
        baseline_15mk: {
          name: '15mK Superconducting Dilution Fridge Baseline (100~200Q)',
          name_ko: '15mK 초전도 희석냉동기 기준 모델 (100~200Q)',
          capex_krw: { low: 3240000000, baseline: 4320000000, high: 5670000000 },
          wall_power_kw: 40.0,
          annual_kwh: 350400.0,
          cryo_maint_annual_krw: { low: 110000000, baseline: 150000000, high: 210000000 },
          notes: 'Large-bore 15mK DR ($2.4M-$4.2M) + 200-ch coax wiring + cryo-amps + 40kW chiller'
        },
        tco_5yr_ref: {
          axon_tco_krw: { low: 275925000, baseline: 366425000, high: 485425000 },
          sc15mk_tco_krw: { low: 4052800000, baseline: 5332800000, high: 6982800000 },
          savings_krw: { low: 3776875000, baseline: 4966375000, high: 6497375000 },
          savings_pct: { low: 93.19, baseline: 93.13, high: 93.05 }
        }
      },

      tier_3_research: {
        tier_id: 'tier_3_research',
        tier_rank: 3,
        name: 'Tier 3: Research / University Mega-Rack Cluster',
        name_ko: 'Tier 3: 전문 연구소 · 대학용 메가-랙 클러스터',
        short_name_ko: 'Tier 3 · 연구 클러스터',
        target_segment: 'National labs, physics/chemistry institutes, leading universities',
        target_segment_ko: '국책연구소, 물리·화학·재료 대학 연구단, AI 파운데이션 랩',
        image: 'assets/images/tier3-research-cluster.jpg',
        image_caption_ko: 'AXON Tier 3: 4~10× 42U 랙 + Blue SM-PM Fiber Optical OXC 베이 (<0.5 dB IL [TARGET])',
        fabrication_release_status: 'BLOCKED',
        physical_qubits: { min: 1000, max: 2000 },
        logical_qubits_range: '200 ~ 400 LQ',
        qec_code: '[[5,1,3]] FT-QEC demonstration (200 tiles)',
        qec_mapping_detail:
          '200타일 규모에서 [[5,1,3]] d=3 기준 200 ~ 400 LQ, [[25,1,9]] d=9 연접 FT-QEC 기준 40 ~ 80 LQ 실증.',
        form_factor: '4 ~ 10 x 42U Racks + Blue SM-PM Fiber Optical OXC Bay (<0.5 dB IL [TARGET])',
        form_factor_ko: '4~10× 42U 랙 + Blue SM-PM Fiber Optical OXC 스위치 베이',
        cryo_architecture: 'Distributed 77K VIP LN2 Plant (>200W @ 77K, isolated cryo plant)',
        cryo_architecture_ko: '독립 77K VIP 진공단열 배관 플랜트 (>200W @ 77K, 진동 격리)',
        host_memory_spec: '8TB CXL 3.0 Shared Memory Pool (8-node RoCEv2 100GbE)',
        host_storage_spec: '512TB NVMe-oF Lustre Parallel FS (100 GB/s)',
        packet_throughput: {
          blades: 40,
          serial_mbps: 5188.0,
          wdm_gbps: 93.4,
          label: '블레이드당 129.7 MB/s · 2.335 GB/s WDM (40블레이드 패브릭 합산 93.4 GB/s)'
        },
        rack_visual: {
          rack_count: 6,
          shelves: 40,
          slots_total: 5,
          slots_occupied: 5,
          blades_total: 200,
          slot_label_ko: '5 / 5 풀 슬롯 × 40 쉘프 (6×42U 랙) = 200 타일 클러스터'
        },
        friendly_summary_ko:
          '대학·국책연구소에서 내결함성 양자오류정정(FT-QEC)과 신소재·신약 시뮬레이션을 수행하는 멀티-랙 클러스터입니다. 6개의 랙과 중앙 광교차연결(OXC)이 1,000~2,000 물리 큐비트(200~400 LQ)를 15 kW 전력으로 구동합니다.',
        deep_summary_ko:
          '200× 77K 건식 캐비티 타일과 40× cheonbu81_qec_top_0mul 블레이드를 Blue SM-PM Fiber Optical OXC(<0.5 dB IL, ±2 ps skew [TARGET])로 비차단 라우팅합니다. 300K 단에서는 8노드 HPC(RoCEv2 100GbE), 8TB CXL 3.0 공유 풀, 512TB~1PB NVMe-oF Lustre(100 GB/s)가 18B WDM 텔레메트리를 실시간 수집합니다.',
        wall_power_kw: 15.0,
        annual_kwh: 131400.0,
        cryo_maint_annual_krw: { low: 20000000, baseline: 30000000, high: 45000000 },
        bom_capex: {
          krw: { low: 2330000000, baseline: 3160000000, high: 4180000000 },
          usd: { low: 1725925.93, baseline: 2340740.74, high: 3096296.3 }
        },
        subsystems: {
          optical_quantum_core: {
            label: SUBSYSTEM_META.optical_quantum_core.label,
            label_ko: SUBSYSTEM_META.optical_quantum_core.label_ko,
            baseline_share_pct: 42.41,
            krw: { low: 980000000, baseline: 1340000000, high: 1760000000 },
            usd: { low: 725925.93, baseline: 992592.59, high: 1303703.7 }
          },
          digital_0mul_control: {
            label: SUBSYSTEM_META.digital_0mul_control.label,
            label_ko: SUBSYSTEM_META.digital_0mul_control.label_ko,
            baseline_share_pct: 20.89,
            krw: { low: 480000000, baseline: 660000000, high: 880000000 },
            usd: { low: 355555.56, baseline: 488888.89, high: 651851.85 }
          },
          cryo_vacuum_safety: {
            label: SUBSYSTEM_META.cryo_vacuum_safety.label,
            label_ko: SUBSYSTEM_META.cryo_vacuum_safety.label_ko,
            baseline_share_pct: 15.19,
            krw: { low: 350000000, baseline: 480000000, high: 640000000 },
            usd: { low: 259259.26, baseline: 355555.56, high: 474074.07 }
          },
          host_memory_storage: {
            label: SUBSYSTEM_META.host_memory_storage.label,
            label_ko: SUBSYSTEM_META.host_memory_storage.label_ko,
            baseline_share_pct: 15.51,
            krw: { low: 380000000, baseline: 490000000, high: 640000000 },
            usd: { low: 281481.48, baseline: 362962.96, high: 474074.07 }
          },
          chassis_rack_emi_power: {
            label: SUBSYSTEM_META.chassis_rack_emi_power.label,
            label_ko: SUBSYSTEM_META.chassis_rack_emi_power.label_ko,
            baseline_share_pct: 6.01,
            krw: { low: 140000000, baseline: 190000000, high: 260000000 },
            usd: { low: 103703.7, baseline: 140740.74, high: 192592.59 }
          }
        },
        baseline_15mk: {
          name: '15mK Superconducting Dilution Fridge Cluster Baseline (1,000~2,000Q)',
          name_ko: '15mK 초전도 희석냉동기 클러스터 기준 모델 (1,000~2,000Q)',
          capex_krw: { low: 16200000000, baseline: 21600000000, high: 29700000000 },
          wall_power_kw: 180.0,
          annual_kwh: 1576800.0,
          cryo_maint_annual_krw: { low: 500000000, baseline: 700000000, high: 950000000 },
          notes: '4x large 15mK DR cluster + cryo microwave links + He-3 + 180kW chiller plant'
        },
        tco_5yr_ref: {
          axon_tco_krw: { low: 2528550000, baseline: 3408550000, high: 4503550000 },
          sc15mk_tco_krw: { low: 19882600000, baseline: 26282600000, high: 35632600000 },
          savings_krw: { low: 17354050000, baseline: 22874050000, high: 31129050000 },
          savings_pct: { low: 87.28, baseline: 87.03, high: 87.36 }
        }
      },

      tier_4_national: {
        tier_id: 'tier_4_national',
        tier_rank: 4,
        name: 'Tier 4: National / Defense Quantum Supercomputing DC',
        name_ko: 'Tier 4: 국가기관 · 국방 슈퍼컴퓨팅 양자 데이터센터',
        short_name_ko: 'Tier 4 · 국가 DC',
        target_segment: 'Defense agencies, national HPC centers, sovereign security',
        target_segment_ko: '국방·안보 기관, 국가 슈퍼컴퓨팅 센터, 주권 암호·기후 인프라',
        image: 'assets/images/tier4-national-dc.jpg',
        image_caption_ko: 'AXON Tier 4: 2층 복층 DC 홀 (상층 50+ 랙 QPU/HPC 홀 + 하층 MW급 질소 재액화 플랜트)',
        fabrication_release_status: 'BLOCKED',
        physical_qubits: { min: 10000, max: 100000 },
        logical_qubits_range: '2,000+ LQ',
        qec_code: '[[25,1,9]] d=9 concatenated FTQC (2,000+ tiles)',
        qec_mapping_detail:
          '10,000 Data Q = 400 LQ ([[25,1,9]] d=9) 또는 2,000 LQ ([[5,1,3]] d=3). 2,000+ LQ ([[25,1,9]] d=9)는 50,000~100,000+ Data Q (2,000+ 타일) 규모에서 달성.',
        form_factor: '2-Floor Dedicated Data Center (50+ Racks QPU Hall + Lower Cryo Plant)',
        form_factor_ko: '2층 복층 전용 DC 홀 (상층 50+ 랙 QPU/HPC 홀 + 하층 Cryo 플랜트)',
        cryo_architecture: 'MW-class nitrogen reliquefaction & turbo-expansion plant (isolated floor)',
        cryo_architecture_ko: 'MW급 질소 재액화 & 터보팽창 플랜트 (하층 방진 슬래브 완전 격리)',
        host_memory_spec: 'Tens of TB HBM3E Accelerator Cluster + CXL Supercomputer Fabric',
        host_storage_spec: 'Multi-PB to EB-class Tiered NVMe-oF / ZFS Archive',
        packet_throughput: {
          blades: 400,
          serial_mbps: 51880.0,
          wdm_gbps: 934.0,
          label: '블레이드당 129.7 MB/s · 2.335 GB/s WDM (400블레이드 합산 934 GB/s + 10× Time-Bin)'
        },
        rack_visual: {
          rack_count: 50,
          shelves: 400,
          slots_total: 5,
          slots_occupied: 5,
          blades_total: 2000,
          slot_label_ko: '5 / 5 풀 슬롯 × 400 쉘프 (50+ 랙) = 2,000+ 타일 (100,000+ Q)'
        },
        friendly_summary_ko:
          '국가 암호·국방·초거대 AI를 위한 주권 양자 슈퍼컴퓨팅 센터입니다. 2층 복층 구조로 하층에 거대한 질소 냉각 플랜트를 격리하고, 상층 50개 이상의 랙에서 1만~10만+ 큐비트(2,000+ 고신뢰 논리 큐비트)를 120 kW 전력으로 운용합니다.',
        deep_summary_ko:
          '2,000+ 타일 6N Au+DBR 건식 캐비티와 400× [[25,1,9]] d=9 0-MUL 디코더 블레이드가 3D WDM + 10× Time-Bin + Loss-to-Erasure(T0..T8.D0 래치) OXC 패브릭으로 결합됩니다. 300K 슈퍼컴 단은 수십 TB HBM3E + CXL 패브릭(IB Quantum-2)과 4~16 PB~EB급 NVMe-oF Lustre/ZFS 아카이브를 구성합니다.',
        wall_power_kw: 120.0,
        annual_kwh: 1051200.0,
        cryo_maint_annual_krw: { low: 180000000, baseline: 260000000, high: 380000000 },
        bom_capex: {
          krw: { low: 25200000000, baseline: 36800000000, high: 52500000000 },
          usd: { low: 18666666.67, baseline: 27259259.26, high: 38888888.89 }
        },
        subsystems: {
          optical_quantum_core: {
            label: SUBSYSTEM_META.optical_quantum_core.label,
            label_ko: SUBSYSTEM_META.optical_quantum_core.label_ko,
            baseline_share_pct: 32.07,
            krw: { low: 8500000000, baseline: 11800000000, high: 16400000000 },
            usd: { low: 6296296.3, baseline: 8740740.74, high: 12148148.15 }
          },
          digital_0mul_control: {
            label: SUBSYSTEM_META.digital_0mul_control.label,
            label_ko: SUBSYSTEM_META.digital_0mul_control.label_ko,
            baseline_share_pct: 20.11,
            krw: { low: 5000000000, baseline: 7400000000, high: 10400000000 },
            usd: { low: 3703703.7, baseline: 5481481.48, high: 7703703.7 }
          },
          cryo_vacuum_safety: {
            label: SUBSYSTEM_META.cryo_vacuum_safety.label,
            label_ko: SUBSYSTEM_META.cryo_vacuum_safety.label_ko,
            baseline_share_pct: 16.3,
            krw: { low: 4200000000, baseline: 6000000000, high: 8700000000 },
            usd: { low: 3111111.11, baseline: 4444444.44, high: 6444444.44 }
          },
          host_memory_storage: {
            label: SUBSYSTEM_META.host_memory_storage.label,
            label_ko: SUBSYSTEM_META.host_memory_storage.label_ko,
            baseline_share_pct: 18.48,
            krw: { low: 4500000000, baseline: 6800000000, high: 10000000000 },
            usd: { low: 3333333.33, baseline: 5037037.04, high: 7407407.41 }
          },
          chassis_rack_emi_power: {
            label: SUBSYSTEM_META.chassis_rack_emi_power.label,
            label_ko: SUBSYSTEM_META.chassis_rack_emi_power.label_ko,
            baseline_share_pct: 13.04,
            krw: { low: 3000000000, baseline: 4800000000, high: 7000000000 },
            usd: { low: 2222222.22, baseline: 3555555.56, high: 5185185.19 }
          }
        },
        baseline_15mk: {
          name: '15mK Superconducting Dilution Fridge Facility Baseline (10k~100k+Q)',
          name_ko: '15mK 초전도 희석냉동기 데이터센터 기준 모델 (10k~100k+Q)',
          capex_krw: { low: 135000000000, baseline: 189000000000, high: 270000000000 },
          wall_power_kw: 1800.0,
          annual_kwh: 15768000.0,
          cryo_maint_annual_krw: { low: 4000000000, baseline: 6000000000, high: 9000000000 },
          notes: '~50x modular/super-fridge 15mK DC ($100M-$200M) + He-3 inventory + 1.8MW chillers'
        },
        tco_5yr_ref: {
          axon_tco_krw: { low: 26888400000, baseline: 38888400000, high: 55188400000 },
          sc15mk_tco_krw: { low: 166826000000, baseline: 230826000000, high: 326826000000 },
          savings_krw: { low: 139937600000, baseline: 191937600000, high: 271637600000 },
          savings_pct: { low: 83.88, baseline: 83.15, high: 83.11 }
        }
      }
    }
  };

  window.AXON_WORKSTATION_DATA = deepFreeze(DATA);
})();
