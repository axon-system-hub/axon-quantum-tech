(() => {
  'use strict';

  function deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    Object.keys(obj).forEach((key) => {
      deepFreeze(obj[key]);
    });
    return Object.freeze(obj);
  }

  const DATA = {
    meta: {
      version: 'v1.0.0',
      date: '2026-11-16',
      duration: '24개월 (2026.11 ~ 2028.11)',
      referenceDoc: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md',
      targetSystem: 'AXON Sovereign AI + 77K 광양자 QPU + Cheonbu-81 0-MUL 제어 칩',
      ssotVersion: 'AXON_QUANTUM_SSOT.md v1.2.0',
      fabricationRelease: 'BLOCKED (G1~G4 게이트 통과 시 해제)'
    },

    milestones: [
      {
        id: 'M1-M6',
        label: 'M1 ~ M6 (2026.11 ~ 2027.04)',
        subtitle: '기반 완성 & 상온 실증',
        focus: 'OpenLane2 GDSII Sign-off, chp.rs/Stim 교차검증, FPGA HIL <5 ns 루프백 실측, EQ-01..12 발주 및 Gate 1~3 안전 게이트 통과'
      },
      {
        id: 'M7-M12',
        label: 'M7 ~ M12 (2027.05 ~ 2027.10)',
        subtitle: 'MPW 테이프아웃 & 77K 광양자 실측',
        focus: 'Cheonbu-81 (+ Padframe/TEG) MPW 셔틀 테이프아웃, 77K 건식 콜드핑거 단일광자(g²(0)<0.05)·HOM(≥90%)·CHSH(|S|>2) 실측, Erasure 디코더 RTL 합성'
      },
      {
        id: 'M13-M18',
        label: 'M13 ~ M18 (2027.11 ~ 2028.04)',
        subtitle: '실물 Cryo-Silicon 연동 & Break-even',
        focus: 'MPW 실리콘 칩 77K Cryo-probe 검증, 광학 캐비티 직결, 단일 [[5,1,3]] 타일 Break-even 실증 및 검출→EOM 종단 지연 확정'
      },
      {
        id: 'M19-M24',
        label: 'M19 ~ M24 (2028.05 ~ 2028.11)',
        subtitle: 'Tier 2 100Q 통합 & 소버린 멀티모달 AI 융합',
        focus: '20-카드(100Q) 42U 랙 통합 및 [[25,1,9]] 게이트 텔레포테이션 검증, YourOS+CPNPU MLQT 243+13 18B 광트렁크 직결 AXON Sovereign Quantum V1 출하'
      }
    ],

    domains: [
      {
        id: 'silicon',
        name: '디지털 실리콘 & 77K Cryo-CMOS',
        icon: 'cpu',
        color: '#34D399',
        summary: '곱셈기 0개(t:$mul=0) Cheonbu-81 3진 QEC 제어 ASIC, OpenLane2 GDSII Sign-off, 77K Cryo-SPICE/.lib 및 FPGA HIL <5 ns 실증'
      },
      {
        id: 'photonics',
        name: '광양자 QPU 물리 코어',
        icon: 'sparkles',
        color: '#38BDF8',
        summary: '양자 인코딩(ADR C1), 초협선폭 시드 및 PPLN/PPKTP 단일광자(g²(0)<0.05), Varshni 77K 투트랙 검출기(PIN/Cryo-SPAD), HOM/CHSH/Type-II 퓨전 실측'
      },
      {
        id: 'cryo',
        name: '캐비티 · PCB · 건식 극저온 & 진공',
        icon: 'snowflake',
        color: '#60A5FA',
        summary: 'Rev C 58×58mm 4-평면 패싯 6N Au+DBR 캐비티, Rev A2 75×75mm 6층 ENEPIG PCB, 10⁻⁵ Torr 건식 진공 및 OFHC 콜드핑거/스털링 냉각'
      },
      {
        id: 'qec',
        name: 'QEC 이론 · 시뮬레이터 · 디코더',
        icon: 'git-branch',
        color: '#A78BFA',
        summary: 'chp.rs Y-기저 수정 및 Stim 교차검증, 회로 수준 잡음(DEM), Erasure-aware(251) 시공간 Union-Find 디코더, d=3→9 임계값(Λ>1) 검증'
      },
      {
        id: 'sovereign',
        name: '소버린 AI 하이브리드 · 소프트웨어',
        icon: 'brain',
        color: '#F472B6',
        summary: '18B(243+13) 통합 데이터플레인, YourOS HAL 및 CPNPU MLQT 243+13 오프로딩, NOC 야코비안(‖J‖≤1.0) 자율 캘리브레이션, axon-evidence 감사 원장'
      },
      {
        id: 'safety',
        name: '안전 · 방진 · 벤더 DFM & 제작 게이트',
        icon: 'shield-alert',
        color: '#E3B341',
        summary: 'EQ-01..12 벤더 질의, ASME/KGS PRV 사이징, 이중 ODH+강제배기 인터록, 외부 LSO Class 3R/3B 레이저 안전 리뷰 및 방진 마운트 확정'
      }
    ],

    gates: [
      {
        id: 'G1',
        title: 'Gate 1: DFM / 상온 더미 검증',
        criteria: 'EQ-01..12 벤더 회신 완료, Rev C 4-평면 패싯 및 Rq≤1.74nm 코팅 시편 300K/77K 정반사율 실측, OPA855 안정성 스윕 통과, 광다이/SMA MPN 확정',
        requiredTaskIds: ['SAF-01', 'CRY-02', 'CRY-03', 'PHO-05']
      },
      {
        id: 'G2',
        title: 'Gate 2: 압력 / 진공 안전 인증',
        criteria: 'ASME/KGS 기반 P&ID FMEA 및 PRV 오리피스 사이징 확정, 10⁻⁵ Torr 헬륨 리크 테스트 및 77K 인듐/O-링 건식 기밀 씰 인증',
        requiredTaskIds: ['SAF-02', 'CRY-04', 'CRY-05']
      },
      {
        id: 'G3',
        title: 'Gate 3: ODH / 레이저 인터록 구축',
        criteria: '이중 ODH 산소결핍 센서 + 강제 배기 + 하드와이어드 E-Stop 구축, 외부 LSO 리뷰 및 Class 3R/3B 레이저 차폐 인클로저 완료',
        requiredTaskIds: ['SAF-03', 'SAF-04']
      },
      {
        id: 'G4',
        title: 'Gate 4: 양자 계측 / GDSII Sign-off',
        criteria: 'chp.rs/Stim 정합, g²(0)<0.05, HOM>90%, CHSH |S|>2.0, 종단 피드포워드 지연(<5 ns) 실측 및 Cheonbu-81 OpenLane DRC/LVS 0 error',
        requiredTaskIds: ['SIL-04', 'SIL-07', 'QEC-02', 'PHO-02', 'PHO-06', 'PHO-07']
      }
    ],

    checklist: [
      // ==================== SILICON (8) ====================
      {
        id: 'SIL-01',
        domain: 'silicon',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[VERIFIED]',
        defaultChecked: true,
        title: 'Cheonbu-81 0-MUL RTL 코어 구현 완료 (18B 코덱 · Pauli Frame · 0-SKIP)',
        description: '9×9=81 노드 18-Byte(243+13) Fail-Closed 코덱, 45 Data Qubit 90b V4 XOR Pauli Frame 추적, 0-SKIP 동적 전력 클램프 RTL 구현 및 테스트벤치 검증 완료.',
        partsAndSpecs: 'cheonbu81_qec_top_0mul (111 pins, 3.18× Core-Bound), 물리 곱셈기 t:$mul=0',
        vendors: 'In-house RTL (Verilog)',
        budget: '₩0 (완료)',
        relatedFile: 'rtl/cheonbu81_pkt18_codec_0mul.v'
      },
      {
        id: 'SIL-02',
        domain: 'silicon',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[SYNTHESIZED-SKY130]',
        defaultChecked: true,
        title: 'Sky130A 논리 합성 기준선 확보 (38,957 µm², 7.710 ns)',
        description: 'Yosys/Sky130A 합성 완료: Top 면적 38,957.36 µm²(4,749 셀, FF 631), 임계경로 7.710 ns(129.70 MHz), 5Q 코어 1.447 ns, 타일 매크로 2.032 ns 달성.',
        partsAndSpecs: 'sky130_fd_sc_hd, 111 pins (기존 409핀 대비 72.9% 절감), t:$mul=0',
        vendors: 'SkyWater / Yosys 오픈소스 툴체인',
        budget: '₩0 (완료)',
        relatedFile: 'eda/cheonbu81_qec_v1/floorplan_cheonbu81.tcl'
      },
      {
        id: 'SIL-03',
        domain: 'silicon',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[FORMAL-BMC-PROVED]',
        defaultChecked: true,
        title: 'SymbiYosys 정형 검증(BMC depth 20) 통과',
        description: '인밴드 제어코드(243..255) 무결성, Fail-Closed 원자 커밋 및 0-SKIP 클럭 게이팅 안전성을 SymbiYosys BMC depth 20(rc=0)으로 증명 완료.',
        partsAndSpecs: 'SymbiYosys BMC depth=20, rc=0, Fail-Closed 불변식 검증',
        vendors: 'SymbiYosys / Z3 / Boolector',
        budget: '₩0 (완료)',
        relatedFile: 'eda/cheonbu81_qec_v1/formal_cheonbu81_prove.sby'
      },
      {
        id: 'SIL-04',
        domain: 'silicon',
        milestone: 'M1-M6',
        gate: 'G4',
        priority: 'P0',
        evidenceTag: '[NOT_RUN_IN_SANDBOX]',
        defaultChecked: false,
        title: 'OpenLane2 물리 P&R 및 DRC/LVS GDSII Sign-off 완주',
        description: '3×3 FENCE 플로어플랜 적용 후 CTS, 기생 RC 포함 OpenSTA 타이밍 검증, Magic/KLayout DRC 0 error, Netgen LVS 0 error 달성하여 GDSII 생성.',
        partsAndSpecs: '340×340 µm 코어 매크로, OpenSTA, Magic/KLayout DRC=0, Netgen LVS=0',
        vendors: 'OpenLane2 / OpenROAD / Magic / KLayout',
        budget: '₩0 (오픈소스 EDA)',
        relatedFile: 'eda/cheonbu81_qec_v1/floorplan_cheonbu81.tcl'
      },
      {
        id: 'SIL-05',
        domain: 'silicon',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '77K Cryo-CMOS SPICE 모델링 및 77K 전용 .lib 재특성화',
        description: '77K 환경의 문턱전압 상승(+100~200 mV), 캐리어 이동도 증가, Kink effect를 반영한 Cryo-SPICE 모델 구축 및 77K 타이밍/전력 .lib 생성(28FDSOI 백게이트 바이어스 평가 포함).',
        partsAndSpecs: '77K Cryo-SPICE netlist, ΔVth +100~200mV 보정, 77K .lib/.db',
        vendors: 'Synopsys / Cadence / Keysight B1500A (공용장비)',
        budget: '$5,000 ~ $20,000 (공용장비 임차)',
        relatedFile: 'AXON_CHEONBU81_CHIP_EDA_ALIGNMENT_SPEC.md'
      },
      {
        id: 'SIL-06',
        domain: 'silicon',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '패드프레임(ESD IO 링) 및 고속 AMS 인터페이스(TIA/ADC/EOM) 설계',
        description: '코어 매크로(340×340 µm)를 감싸는 77K 대응 ESD IO 패드 링, 고속 LVDS/SerDes, OPA855 TIA 연동 고속 비교기/ADC 및 50Ω EOM 드라이버 통합.',
        partsAndSpecs: 'ESD IO 링, 50Ω EOM 드라이버, OPA855 연동 고속 비교기/ADC',
        vendors: 'SkyWater / Samsung 28FDSOI / IDEC',
        budget: 'MPW 패키징 예산 내 포함',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'SIL-07',
        domain: 'silicon',
        milestone: 'M1-M6',
        gate: 'G4',
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: 'AMD/Xilinx FPGA HIL (<5 ns 루프백) 실시간 지연 실측',
        description: 'ASIC 투하 전 KCU116/VCU118 FPGA와 Rev A2 PCB, OPA855 TIA를 결합해 18B 패킷 스트림 및 TIA→ADC→디코더→EOM 루프백 <5.0 ns 지연 실측.',
        partsAndSpecs: 'AMD/Xilinx KCU116/VCU118, 루프백 지연 <5.0 ns, 2.335 GB/s 광트렁크',
        vendors: 'AMD/Xilinx / Swabian Instruments Time Tagger',
        budget: '$8,000 ~ $20,000',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'SIL-08',
        domain: 'silicon',
        milestone: 'M7-M12',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: 'Cheonbu-81 (+ Padframe/TEG) MPW 셔틀 테이프아웃 및 세라믹 패키징',
        description: 'Sky130 PoC MPW($26K~$73K) 또는 28nm FDSOI 상용 MPW($110K~$440K) 셔틀 투하 후 77K 열충격 대응 세라믹 패키지·와이어본딩 완료.',
        partsAndSpecs: 'MPW 셔틀 다이 + TEG, 77K 열충격 대응 세라믹 패키지',
        vendors: 'SkyWater / Samsung Foundry / IDEC / Quik-Pak / Kyocera / 하나마이크론',
        budget: '$13,000 ~ $33,000 (Sky130 기준) / $110K~$440K (28nm)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },

      // ==================== PHOTONICS (9) ====================
      {
        id: 'PHO-01',
        domain: 'photonics',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[OPEN]',
        defaultChecked: false,
        title: '양자 인코딩 방식(ADR C1) 및 검출기 온도단(ADR C3) 아키텍처 확정',
        description: 'Dual-Rail, Time-Bin, Frequency-Bin, Polarization 중 기본 인코딩 확정(Stage 2: 20카드×5파장 하이브리드, Stage 4: 10× Time-Bin) 및 Varshni 77K 투트랙 검출기 온도단 확정.',
        partsAndSpecs: 'ADR C1(양자 인코딩), ADR C3(1310nm PIN @77K vs 1550nm Cryo-SPAD/SNSPD)',
        vendors: 'In-house Architecture Review',
        budget: '₩0 (설계 확정)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'PHO-02',
        domain: 'photonics',
        milestone: 'M7-M12',
        gate: 'G4',
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '초협선폭 시드 및 77K PPLN/PPKTP 단일광자 광원 g²(0) < 0.05 실측',
        description: '초협선폭 마스터 광원(Δν < 1 kHz)과 비선형 광원(PPLN SPDC / PPKTP)을 77K 콜드핑거 챔버에서 구동하여 단일광자 순도 g²(0) < 0.05 실측.',
        partsAndSpecs: 'ECDL/SIL-DFB (Δν<1kHz), PPLN/PPKTP, HBT 상관측정 g²(0) < 0.05',
        vendors: 'Toptica / Thorlabs / Covesion / Raicol / Swabian Time Tagger',
        budget: '₩6,000,000 (Tier 1 광원 기준)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'PHO-03',
        domain: 'photonics',
        milestone: 'M7-M12',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: 'Varshni 77K Track A: 1310nm InGaAs PIN + OPA855 호모다인 검출 실측',
        description: '77K에서 표준 InGaAs 차단파장 청색 천이(1671→1540 nm)에 대응하는 1310 nm InGaAs PIN 쌍과 OPA855 TIA(±2.5V) 조합의 양자효율(목표 QE 98.8~99.1%) 실측.',
        partsAndSpecs: '1310nm InGaAs PIN 쌍, OPA855IDSGT (±2.5V), 목표 QE 98.8~99.1%',
        vendors: 'TI (OPA855) / Hamamatsu / 우리로(Wooriiro)',
        budget: '₩2,500,000',
        relatedFile: 'AXON_QUANTUM_SSOT.md'
      },
      {
        id: 'PHO-04',
        domain: 'photonics',
        milestone: 'M7-M12',
        gate: null,
        priority: 'P1',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: 'Varshni 77K Track B: 1550nm Cryo-SPAD / SNSPD 단일광자 계수 검증',
        description: '1550 nm 대역 단일광자 계수를 위한 Extended-InGaAs Cryo-APD/SPAD(PDE 40~60%) 또는 2.5K SNSPD(SDE >85~90%, 지터 <15 ps) 벤치마크 실측.',
        partsAndSpecs: '1550nm Cryo-SPAD (PDE 40~60%) 또는 SNSPD (SDE >85%, 지터 <15ps)',
        vendors: 'Single Quantum / ID Quantique / Excelitas / 우리로',
        budget: '₩4,500,000 ~ ₩25,000,000 (SNSPD 옵션 시)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'PHO-05',
        domain: 'photonics',
        milestone: 'M1-M6',
        gate: 'G1',
        priority: 'P0',
        evidenceTag: '[OPEN]',
        defaultChecked: false,
        title: '광다이(TX1/DP1/DN1), SMA(J2) 및 고속 EOM/광스위치(D2) MPN 확정',
        description: 'Rev A2 PCB에 실장될 광다이(TX1, DP1, DN1), RF SMA 커넥터(J2) 및 77K/상온 EOM·광스위치(D2)의 정확한 제조사 부품번호(MPN) 및 50Ω 정합 확정.',
        partsAndSpecs: 'TX1/DP1/DN1 광다이, 50Ω SMA(J2), 고속 EOM/OXC (<0.5 dB, ±2 ps 스큐)',
        vendors: 'Exail(구 iXblue) / EOspace / Newport / Edmund Optics / Semrock',
        budget: '₩2,000,000',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'PHO-06',
        domain: 'photonics',
        milestone: 'M7-M12',
        gate: 'G4',
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '77K 캐비티 내 HOM 간섭 가시도 ≥ 90% 및 CHSH |S| > 2.0 실측',
        description: '자유공간 6N Au+DBR 캐비티 내에서 Hong-Ou-Mandel 이광자 간섭 가시도 ≥ 90% 및 CHSH 벨 부등식 |S| > 2.0(얽힘 인증) 실측 달성.',
        partsAndSpecs: 'HOM 가시도 ≥ 90%, CHSH |S| > 2.0, 편광/위상 안정화 루프',
        vendors: 'Newport / Thorlabs / Swabian Instruments',
        budget: '₩3,000,000 (광학 소자)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'PHO-07',
        domain: 'photonics',
        milestone: 'M13-M18',
        gate: 'G4',
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '검출 → TIA → Cheonbu-81 → EOM 종단 피드포워드 지연(< 5.0 ns) 실측',
        description: '실물 MPW 실리콘 칩과 77K 광양자 캐비티를 직결하여 광자 검출부터 EOM 위상/기저 변조까지의 전체 종단 지연 < 5.0 ns 실측 검증.',
        partsAndSpecs: '종단 지연 < 5.0 ns (디지털 코어 1.45~2.03 ns + 아날로그/EOM < 3 ns)',
        vendors: 'Keysight / Zurich Instruments / Exail EOM',
        budget: '₩5,000,000 (계측 및 인터커넥트)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'PHO-08',
        domain: 'photonics',
        milestone: 'M13-M18',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '비-CSS [[5,1,3]] Type-II 퓨전 및 단일 논리 큐비트 Break-even 실증',
        description: '벨 쌍 주입 기반 Type-II 퓨전 및 측정 기반 게이트 텔레포테이션을 구현하고, 단일 [[5,1,3]] 타일(5~10Q)에서 물리 오류 대비 논리 오류 감소(Break-even) 실증.',
        partsAndSpecs: '[[5,1,3]] 완전부호 타일, Type-II 퓨전 게이트, 논리 오류율 < 물리 오류율',
        vendors: 'In-house QPU Lab',
        budget: 'Tier 1 R&D 예산 내',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'PHO-09',
        domain: 'photonics',
        milestone: 'M19-M24',
        gate: null,
        priority: 'P1',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '20-카드(100Q) 42U 랙 통합 및 [[25,1,9]] 연쇄 부호 텔레포테이션 검증',
        description: 'Tier 2 42U 랙에 20장의 광양자 블레이드(100~200Q, 20~40 LQ)와 저손실 OXC(<0.5 dB, ±2 ps 스큐)를 통합하고 [[25,1,9]] 게이트 텔레포테이션 검증.',
        partsAndSpecs: '20카드 42U 랙, OXC(<0.5 dB, ±2 ps), 펄스튜브(50W @77K), 2.5 kW',
        vendors: 'Cryomech / Samtec / LAYERTEC',
        budget: '₩3.30억 원 (Tier 2 BOM Capex Base)',
        relatedFile: 'AXON_Qubit_Workstation_Tiers_and_BOM_Report.md'
      },

      // ==================== CRYO & CAVITY & PCB (7) ====================
      {
        id: 'CRY-01',
        domain: 'cryo',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[ENGINEERING]',
        defaultChecked: true,
        title: 'Rev A2 캐리어 PCB 6층 ENEPIG 설계 완료 (75×75×1.6 mm)',
        description: 'YZ 수직 Edge-on 실장(74 mm 슬롯), 50Ω±10% 임피던스 정합, OPA855 Pin 3 반전 입력 최적화 및 ±2.5V 아날로그/디지털 전원 분리가 반영된 Rev A2 PCB 설계 완료.',
        partsAndSpecs: '75.00×75.00×1.60 mm 6층 ENEPIG (High-Tg FR-4/RO4350B), Samtec QSH-030',
        vendors: '한샘디지텍 / 인터플렉스 / Samtec',
        budget: '₩1,500,000 (설계 완료, 시제품 발주 별도)',
        relatedFile: 'AXON_QUANTUM_SSOT.md'
      },
      {
        id: 'CRY-02',
        domain: 'cryo',
        milestone: 'M1-M6',
        gate: 'G1',
        priority: 'P0',
        evidenceTag: '[OPEN]',
        defaultChecked: false,
        title: 'Rev C 광학 캐비티 4-평면 반사 패싯 CAD 반영 및 CNC/다이아몬드 터닝 가공',
        description: '58.00×58.00×5.00 mm C10200 OFHC(또는 AL6061-T6) Ø50 mm 포켓 내 원통 비점수차(ft≈8.84 mm) 방지를 위한 4개 평면 반사 패싯 CAD 수정 및 초정밀 가공.',
        partsAndSpecs: '58×58×5 mm C10200 OFHC, Ø50 mm 포켓, 4-평면 패싯 (ft≈8.84 mm 제거)',
        vendors: '국내 초정밀 CNC / 다이아몬드 터닝 가공 파트너',
        budget: '₩2,000,000',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'CRY-03',
        domain: 'cryo',
        milestone: 'M1-M6',
        gate: 'G1',
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '6N Au + DBR 다층 코팅 (Rq ≤ 1.74 nm) 및 300K/77K 정반사율 실측',
        description: 'Rev C 평면 패싯 시편에 6N 순금(Au) + 유전체 DBR 코팅을 증착하여 표면 거칠기 Rq ≤ 1.74 nm 및 8회 반사 기준 총 반사율 ≥ 99.8745% 실측 검증.',
        partsAndSpecs: '6N Au + DBR 코팅, Rq ≤ 1.74 nm, 8-bounce 반사율 ≥ 99.8745%',
        vendors: 'LAYERTEC / 국내 박막 증착사',
        budget: '₩1,500,000',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'CRY-04',
        domain: 'cryo',
        milestone: 'M1-M6',
        gate: 'G2',
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '10⁻⁵ Torr 건식 진공 챔버 헬륨 리크 테스트 및 77K 인듐/O-링 씰 인증',
        description: 'LN2 비등 기포로 인한 광학 산란을 원천 차단하기 위해 내부 10⁻⁵ Torr 건식 기밀을 유지하는 인듐/극저온 O-링 씰의 77K 열사이클 헬륨 리크 테스트 통과.',
        partsAndSpecs: '진공도 ≤ 10⁻⁵ Torr, 인듐 와이어 씰 / 극저온 O-링, He 리크 < 10⁻⁹ mbar·L/s',
        vendors: 'Pfeiffer Vacuum / 국내 진공 챔버 제작사',
        budget: '₩2,500,000',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'CRY-05',
        domain: 'cryo',
        milestone: 'M1-M6',
        gate: 'G2',
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '외부 OFHC 콜드핑거 전도 냉각 및 소형 스털링 냉동기(15W @77K) 통합',
        description: '261.4 mL LN2 듀어(~9.7h 유지) 또는 Sunpower/AMETEK 소형 스털링 냉동기(15W @77K)를 OFHC 콜드핑거와 열전도 결합하여 77K 정상상태 도달 시간·열부하 실측.',
        partsAndSpecs: 'C10200 OFHC 콜드핑거, 15W @77K 스털링 냉동기 또는 261.4 mL 듀어',
        vendors: 'Sunpower/AMETEK / Cryomech',
        budget: '₩10,000,000 (스털링 냉동기 기준)',
        relatedFile: 'AXON_Qubit_Workstation_Tiers_and_BOM_Report.md'
      },
      {
        id: 'CRY-06',
        domain: 'cryo',
        milestone: 'M7-M12',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: 'Rev A2 PCB 시제품 제작, 77K 열충격 시험 및 OPA855 안정성 스윕',
        description: 'Rev A2 6층 ENEPIG PCB 실물 제작 후 300K↔77K 반복 열충격 시험 및 OPA855 TIA 위상여유·대역폭 안정성 스윕 완료.',
        partsAndSpecs: 'Rev A2 6L ENEPIG PCB, OPA855IDSGT, Samtec QSH-030, 50Ω TDR 검증',
        vendors: '한샘디지텍 / 인터플렉스 / Samtec / TI',
        budget: '₩2,000,000',
        relatedFile: 'AXON_QUANTUM_SSOT.md'
      },
      {
        id: 'CRY-07',
        domain: 'cryo',
        milestone: 'M13-M18',
        gate: null,
        priority: 'P1',
        evidenceTag: '[ENGINEERING]',
        defaultChecked: false,
        title: 'MPW 실리콘 칩 77K Cryo-probe 계측 및 캐비티 직결 통합',
        description: '수령한 Cheonbu-81 MPW 다이를 77K Cryo-probe 스테이션에서 클럭/전력/18B 타이밍 실측 후 Rev A2 캐리어 및 Rev C 캐비티에 와이어본딩 직결.',
        partsAndSpecs: 'Cheonbu-81 MPW 다이, 77K Cryo-probe 검증, 77K .lib 실측 정합',
        vendors: 'NNFC / KANC / Keysight',
        budget: '$5,000 ~ $15,000 (공용장비)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },

      // ==================== QEC THEORY & SIMULATOR (8) ====================
      {
        id: 'QEC-01',
        domain: 'qec',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[VERIFIED]',
        defaultChecked: true,
        title: 'Rust axon-qpu-sim 코어 및 OpenQASM/Qiskit 브릿지 구축 완료',
        description: 'Stabilizer 시뮬레이터(chp.rs), 81-노드 천부경 런타임(cheonbu_runtime.rs), surface_code.rs, OpenQASM 3.0 부분집합 파서 및 Qiskit 브릿지 구현 완료.',
        partsAndSpecs: 'Rust axon-qpu-sim, qasm_bridge.rs, qpu_runner.py',
        vendors: 'In-house Rust/Python',
        budget: '₩0 (완료)',
        relatedFile: 'src/qasm_bridge.rs'
      },
      {
        id: 'QEC-02',
        domain: 'qec',
        milestone: 'M1-M6',
        gate: 'G4',
        priority: 'P0',
        evidenceTag: '[OPEN]',
        defaultChecked: false,
        title: 'chp.rs Y-기저/rowsum 잔여 실패(A8) 수정 및 Stim 교차검증',
        description: 'chp.rs의 Y-기저 위상 및 rowsum 테스트 잔여 오류(A8)를 완전히 수정하고, Google Quantum AI Stim 시뮬레이터와 무작위 클리포드 회로 10,000건 교차검증 일치.',
        partsAndSpecs: 'chp.rs A8 버그 패치, Stim v1.13+ 교차검증 100% 일치',
        vendors: 'Google Stim (오픈소스)',
        budget: '₩0 (SW 개발)',
        relatedFile: 'AXON_QEC_QPU_DEVELOPMENT_WORKFLOW.md'
      },
      {
        id: 'QEC-03',
        domain: 'qec',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '광학 회로 수준 잡음 모델(DEM) 구축 (광손실·암계수·위상오차 반영)',
        description: '단순 Code-capacity 가정을 탈피해 광자 손실(Erasure), 검출기 암계수(Dark Count), 77K 위상 드리프트, 게이트 오류를 포함하는 Stim Detector Error Model(DEM) 구축.',
        partsAndSpecs: '광학 회로 수준 DEM (Photon Loss, Dark Count, Phase Error, Measurement Error)',
        vendors: 'Stim / PyMatching',
        budget: '₩0 (SW 개발)',
        relatedFile: 'AXON_QEC_QPU_DEVELOPMENT_WORKFLOW.md'
      },
      {
        id: 'QEC-04',
        domain: 'qec',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: 'Erasure-aware 시공간 디코더(Sliding-Window Union-Find) SW 완성',
        description: '18B 패킷 제어코드 251(ERASURE_MASK_LATCH)과 직결되는 광자 손실(Erasure) 가중치 반영 Sliding-Window Union-Find 시공간 디코더 소프트웨어 완성.',
        partsAndSpecs: 'Sliding-Window Union-Find, 제어코드 251 연동, O(N α(N)) 복잡도',
        vendors: 'In-house Rust / Riverlane Deltaflow 벤치마크',
        budget: '₩0 (SW 개발)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'QEC-05',
        domain: 'qec',
        milestone: 'M7-M12',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: 'Erasure-aware 시공간 디코더 0-MUL RTL 합성 및 BMC 검증',
        description: '검증된 Sliding-Window Union-Find 디코더를 곱셈기 없는(0-MUL) 하드웨어 상태머신으로 RTL 구현하고 <5 ns 파이프라인 및 Sky130/28nm 합성 완료.',
        partsAndSpecs: '0-MUL Union-Find RTL, 코드 251 하드웨어 마스크, <5 ns 디코딩 목표',
        vendors: 'Yosys / SymbiYosys / OpenLane2',
        budget: '₩0 (EDA 개발)',
        relatedFile: 'rtl/cheonbu81_qec_tile_0mul.v'
      },
      {
        id: 'QEC-06',
        domain: 'qec',
        milestone: 'M7-M12',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: 'd=3→5→7→9 임계값(p_th) 및 오류 억제 계수 Λ > 1 몬테카를로 검증',
        description: '회로 수준 DEM 위에서 surface-d3/d5/d7/d9 및 [[25,1,9]] 연쇄 부호의 물리 오류율 스캔을 수행하여 임계값(p_th) 및 부호 거리 증가에 따른 Λ > 1 지수적 억제 증명.',
        partsAndSpecs: 'd=3,5,7,9 몬테카를로 ≥ 10^7 샷, 오류 억제 계수 Λ > 1.0 곡선 확정',
        vendors: 'In-house CUDA / Stim 클러스터',
        budget: '₩0 (자체 GPU 연산)',
        relatedFile: 'AXON_QEC_QPU_DEVELOPMENT_WORKFLOW.md'
      },
      {
        id: 'QEC-07',
        domain: 'qec',
        milestone: 'M7-M12',
        gate: null,
        priority: 'P1',
        evidenceTag: '[OPEN]',
        defaultChecked: false,
        title: 'qasm_bridge.rs 비-클리포드(T, rx/ry/rz) 및 VQE/QAOA 컴파일러 확장',
        description: 'OpenQASM 3.0 파서의 클리포드 전용 제한을 해제하여 T 게이트(매직 상태 증류 연계) 및 파라미터화 회전 게이트(rx/ry/rz) 지원, VQE/QAOA 직접 실행 경로 확보.',
        partsAndSpecs: 'qasm_bridge.rs T/rx/ry/rz AST 지원, 매직 상태 증류(MSD) 스케줄러',
        vendors: 'Quantinuum tket 참조 / In-house Rust',
        budget: '₩0 (SW 개발)',
        relatedFile: 'src/qasm_bridge.rs'
      },
      {
        id: 'QEC-08',
        domain: 'qec',
        milestone: 'M13-M18',
        gate: null,
        priority: 'P1',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '[[5,1,3]] → [[25,1,9]] 매직 상태 증류(MSD) 및 내결함성 T 게이트 검증',
        description: '15-to-1 또는 [[5,1,3]] 기반 매직 상태 증류 프로토콜을 시뮬레이터 및 단일 타일 하드웨어 루프에서 검증하여 비-클리포드 논리 연산 정확도 확보.',
        partsAndSpecs: 'Magic State Distillation, 비-클리포드 논리 T 게이트 오류율 < 10⁻⁴',
        vendors: 'In-house QEC Team',
        budget: '₩0 (SW/실증)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },

      // ==================== SOVEREIGN AI & SOFTWARE (7) ====================
      {
        id: 'SOV-01',
        domain: 'sovereign',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[VERIFIED]',
        defaultChecked: true,
        title: 'AXON_QUANTUM_SSOT v1.2.0 및 4-Tier BOM/TCO 경제성 모델 확정',
        description: '전 시스템 단일 진실 원천(SSOT v1.2.0) 문서화 및 Tier 1(₩3,980만)~Tier 4(₩368억) 4개 티어 상세 BOM·5년 TCO(15mK 대비 83.15~98.58% 절감) 산출 완료.',
        partsAndSpecs: 'SSOT v1.2.0, Tier 1~4 Capex/Opex/TCO 모델 (환율 ₩1,350/$ 기준)',
        vendors: 'In-house System Architecture',
        budget: '₩0 (완료)',
        relatedFile: 'AXON_Qubit_Workstation_Tiers_and_BOM_Report.md'
      },
      {
        id: 'SOV-02',
        domain: 'sovereign',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[VERIFIED]',
        defaultChecked: true,
        title: 'CUDA 96-스레드 Tri-Warp 0-MUL 커널 및 18B 패킷 통합 구현 완료',
        description: '로컬 AI 가중치(MLQT T3)와 QPU 제어 패킷(CudaBlockPacket18)이 동일한 18-Byte(243+13) 5-Trits/Byte 포맷으로 동작하는 axon_cheonbu81.cu 커널 구현 완료.',
        partsAndSpecs: '96-thread Tri-Warp 0-MUL CUDA 커널, CudaBlockPacket18',
        vendors: 'NVIDIA CUDA / In-house CPNPU',
        budget: '₩0 (완료)',
        relatedFile: 'kernels/axon_cheonbu81.cu'
      },
      {
        id: 'SOV-03',
        domain: 'sovereign',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[VERIFIED]',
        defaultChecked: true,
        title: '0-MUL 물리 법칙 양자 월드 모델(world_model.rs) 기초 구현 완료',
        description: '3진 플럭스(TernaryFlux), 0-SKIP 최소작용 원리, CliffordSim 얽힘을 결합해 부동소수점 회귀 모델의 에너지 드리프트·환각을 억제하는 월드 모델 구현 완료.',
        partsAndSpecs: 'TernaryFlux + 0-SKIP + CliffordSim 하이브리드 월드 모델',
        vendors: 'In-house Rust',
        budget: '₩0 (완료)',
        relatedFile: 'src/world_model.rs'
      },
      {
        id: 'SOV-04',
        domain: 'sovereign',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P0',
        evidenceTag: '[VERIFIED]',
        defaultChecked: true,
        title: 'axon-evidence WS-3 SHA-256 해시체인 감사 원장 구현 완료',
        description: '양자 연산 결과, PQC 키 검증 및 AI 추론 근거의 무결성을 변조 불가능하게 기록하는 WS-3 해시체인 기반 provenance.rs 감사 원장 구현 완료.',
        partsAndSpecs: 'SHA-256 해시체인, WS-3 무결성 원장',
        vendors: 'In-house Rust',
        budget: '₩0 (완료)',
        relatedFile: 'src/provenance.rs'
      },
      {
        id: 'SOV-05',
        domain: 'sovereign',
        milestone: 'M7-M12',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: 'YourOsCheonbuAdapter 실물 FPGA/ASIC HAL 드라이버 및 2-Fiber WDM 연동',
        description: '소프트웨어 시뮬레이터와 물리 QPU 하드웨어를 단일 추상화하는 YourOsCheonbuAdapter를 2-Fiber WDM 광트렁크(왕복 ~10 ns, 2.335 GB/s) 드라이버와 직결.',
        partsAndSpecs: 'YourOsCheonbuAdapter HAL, 2-Fiber WDM 광트렁크 2.335 GB/s/블레이드',
        vendors: 'In-house YourOS / WDM 트랜시버 벤더',
        budget: '₩1,500,000 (WDM 트랜시버)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'SOV-06',
        domain: 'sovereign',
        milestone: 'M13-M18',
        gate: null,
        priority: 'P1',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: 'NOC 야코비안 수축(‖J‖≤1.0) 자율 캘리브레이션 & 254 HOTSWAP 폐루프',
        description: '77K 열 드리프트와 레이저 위상 오차를 야코비안 수축 제약(‖J‖ ≤ 1.0) 하에 실시간 감시하고, 제어코드 254(HOTSWAP_PARAM_COMMIT)로 Soft-IQ 임계치를 자동 보정.',
        partsAndSpecs: '‖J‖ ≤ 1.0 수축 감시 루프, 코드 254 Soft-IQ 무중단 커밋',
        vendors: 'Q-CTRL 참조 / In-house NOC Engine',
        budget: '₩0 (SW 개발)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'SOV-07',
        domain: 'sovereign',
        milestone: 'M19-M24',
        gate: null,
        priority: 'P0',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: '로컬 멀티모달 AI(YourOS+CPNPU MLQT) × QPU 오프로딩 V1 통합 출하',
        description: '로컬 오픈소스 멀티모달 AI가 분자 VQE/최적화 QAOA 서브루틴을 OpenQASM 3.0/T-ASM으로 QPU에 오프로딩하고, axon-evidence 검증 결과를 환류하는 Sovereign Quantum V1 완성.',
        partsAndSpecs: 'YourOS + safetensors_bridge.rs MLQT T3 + 18B 광트렁크 + Tier 2 QPU',
        vendors: 'In-house AXON Full Stack',
        budget: '₩5,500,000 (300K 호스트 노드 기준)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },

      // ==================== SAFETY & VENDOR DFM (6) ====================
      {
        id: 'SAF-01',
        domain: 'safety',
        milestone: 'M1-M6',
        gate: 'G1',
        priority: 'P0',
        evidenceTag: '[OPEN]',
        defaultChecked: false,
        title: '벤더 DFM/RFQ 질의서 EQ-01..EQ-12 전수 발송 및 회신 수령',
        description: '캐비티 CNC/6N Au+DBR 코팅, Rev A2 6L ENEPIG 임피던스, 극저온 진공 씰, 광소자 MPN 등 12건의 엔지니어링 질의(EQ-01..12) 발송 및 사양 확정.',
        partsAndSpecs: 'EQ-01 ~ EQ-12 DFM/견적/납기 회신서 전수 확보',
        vendors: 'LAYERTEC / 한샘디지텍 / Pfeiffer / Exail / 국내 CNC',
        budget: '₩0 (발주 전 RFQ)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'SAF-02',
        domain: 'safety',
        milestone: 'M1-M6',
        gate: 'G2',
        priority: 'P0',
        evidenceTag: '[BLOCKED]',
        defaultChecked: false,
        title: 'ASME/KGS 기준 P&ID FMEA 및 PRV(압력방출밸브) 오리피스 사이징 확정',
        description: 'LN2 듀어 및 77K 진공 챔버의 급격한 기화·과압 사고를 방지하기 위한 ASME/KGS 규격 기반 P&ID FMEA 수행 및 PRV 오리피스 크기·릴리프 압력 확정.',
        partsAndSpecs: 'ASME Sec. VIII / KGS 규격 PRV, 파열판(Rupture Disc), P&ID FMEA 보고서',
        vendors: 'Swagelok / 국내 고압가스 안전인증 기관',
        budget: '₩1,500,000',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'SAF-03',
        domain: 'safety',
        milestone: 'M1-M6',
        gate: 'G3',
        priority: 'P0',
        evidenceTag: '[BLOCKED]',
        defaultChecked: false,
        title: '이중 ODH(산소결핍감지) + 강제배기 + 하드와이어드 E-Stop 인터록 구축',
        description: '질소 가스 누출 시 산소 농도 19.5% 미만 감지를 위한 이중(2-out-of-2/1-out-of-2) ODH 센서, 자동 강제 배기 팬 및 하드와이어드 비상정지(E-Stop) 인터록 구축.',
        partsAndSpecs: '이중 ODH 센서(<19.5% 경보), 강제 배기 덕트, SIL-2 하드와이어드 E-Stop',
        vendors: 'Honeywell / Crowcon / 국내 산업안전 설비사',
        budget: '₩2,500,000 (듀어/안전 예산 내)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'SAF-04',
        domain: 'safety',
        milestone: 'M1-M6',
        gate: 'G3',
        priority: 'P0',
        evidenceTag: '[BLOCKED]',
        defaultChecked: false,
        title: '외부 LSO(레이저 안전관리자) 리뷰 및 Class 3R/3B 차폐 인클로저 완료',
        description: '405nm/1310nm/1550nm 광원 운용에 따른 외부 LSO 안전 리뷰(PENDING 해소)를 완료하고, 인터록 연동 Class 3R/3B 암실·차폐 인클로저 및 보안경 구비.',
        partsAndSpecs: 'Class 3R/3B 광학 차폐 인클로저, 도어 인터록, OD5+ 레이저 보안경, LSO 승인서',
        vendors: 'Thorlabs (레이저 안전) / 외부 공인 LSO 컨설턴트',
        budget: '₩1,500,000',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'SAF-05',
        domain: 'safety',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P1',
        evidenceTag: '[OPEN]',
        defaultChecked: false,
        title: '냉동기 진동 스펙트럼 실측 및 방진 마운트(UNCONFIRMED) 사양 확정',
        description: '스털링/펄스튜브 냉동기 가동 시 발생하는 기계적 진동 스펙트럼(Hz~kHz)을 가속도계로 실측하고, 광학 캐비티 위상 노이즈를 억제할 방진 마운트 사양 확정.',
        partsAndSpecs: '3축 가속도계 진동 PSD 실측, 극저온 탄성체/벨로우즈 방진 마운트',
        vendors: 'Newport / Minus K / 국내 방진 마운트사',
        budget: '₩1,800,000',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      },
      {
        id: 'SAF-06',
        domain: 'safety',
        milestone: 'M1-M6',
        gate: null,
        priority: 'P1',
        evidenceTag: '[TARGET]',
        defaultChecked: false,
        title: 'fabrication_release: BLOCKED 최종 해제 승인 및 섀시/PSU EMI 차폐 조립',
        description: 'Gate 1~4 모든 필수 조건 충족 확인 후 제작 승인(BLOCKED→RELEASED) 전환 및 Mini 4U(Tier 1) 섀시·저노이즈 ±2.5V 리니어 PSU·EMI 차폐 조립 완료.',
        partsAndSpecs: 'Mini 4U 섀시, 450W 저노이즈 PSU, EMI 차폐 개스킷, Gate 1~4 서명본',
        vendors: 'In-house System Integration',
        budget: '₩2,800,000 (Tier 1 섀시/PSU)',
        relatedFile: 'AXON_QUANTUM_MASTER_EXECUTION_BLUEPRINT.md'
      }
    ],

    workloads: [
      {
        category: 'L0~L2 실시간 제어',
        name: '18-Byte (243+13) 인밴드 패킷 스트리밍 & Fail-Closed 검증',
        targetMetric: '17B 데이터(5-Trit/B) + 1B 제어코드(243..255), 2.335 GB/s/블레이드',
        status: '[VERIFIED] RTL & BMC depth 20 통과',
        description: '81-노드 상태를 무손실 직렬화하고 bytes[0..16]<243 및 패딩 트릿==0 검증을 통과해야만 원자적 커밋.'
      },
      {
        category: 'L0~L2 실시간 제어',
        name: 'Pauli Frame V4 XOR 추적 & 0-SKIP 하드웨어 격리',
        targetMetric: '45 Data Qubit (90b) 1사이클 XOR, t:$mul=0, 129.70 MHz',
        status: '[SYNTHESIZED-SKY130]',
        description: '클리포드 연산 중 물리 펄스를 생략하고 XOR로 추적하며, 유휴/격리 타일은 클럭 인에이블을 차단해 전력 절감.'
      },
      {
        category: 'L0~L2 실시간 제어',
        name: '2계층 지연 분리 (<5 ns Inner Loop + ~10 ns Outer Loop)',
        targetMetric: '77K Local < 5.0 ns (코어 1.447 ns), 300K↔77K WDM RTT ~10 ns',
        status: '[TARGET] 실물 종단 지연 미실측',
        description: '77K 내부 피드포워드로 신드롬 백로그를 차단하고 300K 호스트는 비동기 텔레메트리(119-bit <128) 수신.'
      },
      {
        category: '양자 알고리즘 & QEC',
        name: '[[5,1,3]] / [[25,1,9]] / Surface-d3~d9 내결함성 & 임계값 검증',
        targetMetric: '오류 억제 계수 Λ > 1, Type-II 퓨전 게이트 텔레포테이션',
        status: '[TARGET] Stim DEM & Erasure 디코더 구축 중',
        description: 'Erasure(251) 연동 Sliding-Window Union-Find 디코더로 광손실·암계수 하에서 Break-even 및 임계값 증명.'
      },
      {
        category: '양자 알고리즘 & QEC',
        name: 'VQE / QAOA 변분 양자 & 양자 보안/증거 원장',
        targetMetric: 'CHSH |S| > 2.0, QRNG/PQC 검증, axon-evidence SHA-256',
        status: '[OPEN] qasm_bridge.rs 비-클리포드 확장 필요',
        description: '양자 화학·조합 최적화 서브루틴 실행 및 얽힘 인증·무결성 해시체인 원장 기록.'
      },
      {
        category: '소버린 AI 하이브리드',
        name: 'YourOS + CPNPU MLQT (243+13) 통합 데이터플레인 & 월드 모델',
        targetMetric: '동일 18B 포맷, 96-스레드 Tri-Warp CUDA 커널, ‖J‖ ≤ 1.0 자율 보정',
        status: '[VERIFIED] CUDA/Rust 기초 구현 완료 / 실기 직결 [TARGET]',
        description: '로컬 멀티모달 AI가 고난도 연산을 QPU에 오프로딩하고, NOC가 77K 드리프트를 코드 254(HOTSWAP)로 보정.'
      }
    ],

    vendorDirectory: [
      {
        category: '반도체 파운드리 / MPW',
        vendors: 'SkyWater (sky130A), Samsung Foundry (28FDSOI), TSMC (28/22nm), GF (22FDX), IDEC / MOSIS / Europractice',
        parts: 'Cheonbu-81 0-MUL ASIC, Padframe, 77K Cryo-TEG',
        purpose: 'Sky130 PoC($26K~$73K) 및 상용 28nm Cryo-CMOS MPW 테이프아웃'
      },
      {
        category: 'EDA 툴체인',
        vendors: 'OpenLane2 / OpenROAD / Yosys / SymbiYosys (오픈소스), Synopsys, Cadence, Siemens Calibre',
        parts: 'P&R, OpenSTA, Cryo-SPICE, DRC/LVS Sign-off',
        purpose: '0-MUL RTL 합성, 정형 검증 및 GDSII 물리 검증'
      },
      {
        category: '패키징 / 계측 / FPGA HIL',
        vendors: 'Quik-Pak, Kyocera / NTK, 하나마이크론, AMD/Xilinx (KCU116/VCU118), Keysight (B1500A), Swabian Instruments',
        parts: '77K 세라믹 패키지, FPGA HIL 보드, Time Tagger TDC',
        purpose: '77K 열충격 대응 패키징, <5 ns HIL 루프백 및 Cryo-probe 계측'
      },
      {
        category: '광양자 광원 & 변조기',
        vendors: 'Toptica (ECDL), Thorlabs, Covesion (PPLN), Raicol (PPKTP), Exail (구 iXblue), EOspace, Newport, Semrock',
        parts: 'Δν<1kHz 시드 레이저, PPLN/PPKTP SPDC, 고속 EOM, 필터/편광소자',
        purpose: '단일광자/압축광 생성(g²(0)<0.05) 및 고속 위상/기저 피드포워드'
      },
      {
        category: '단일광자 / PIN 검출기 & TIA',
        vendors: 'Single Quantum (SNSPD), ID Quantique, Excelitas, Hamamatsu, 우리로(Wooriiro), TI (OPA855)',
        parts: '1310nm InGaAs PIN, 1550nm Cryo-SPAD/SNSPD, OPA855IDSGT TIA',
        purpose: 'Varshni 77K 청색 천이 대응 호모다인(QE 99%) 및 단일광자 계수'
      },
      {
        category: '정밀가공 · 코팅 · 극저온 · PCB',
        vendors: 'LAYERTEC, Sunpower/AMETEK, Cryomech, Pfeiffer Vacuum, Samtec (QSH-030), 한샘디지텍 / 인터플렉스',
        parts: '58×58mm C10200 4-패싯 캐비티, 6N Au+DBR, 스털링/펄스튜브, Rev A2 6L PCB',
        purpose: 'Rq≤1.74nm 초고반사 캐비티, 10⁻⁵ Torr 건식 77K 냉각 및 고속 캐리어'
      },
      {
        category: '양자 SW 벤치마크',
        vendors: 'PsiQuantum (FBQC), Xanadu (Time-Bin), Riverlane (Deltaflow QEC), Quantinuum (tket), Q-CTRL',
        parts: 'FBQC/Time-Bin 아키텍처, Erasure 디코더, 자율 캘리브레이션 알고리즘',
        purpose: 'QEC 임계값, 시공간 디코딩 및 폐루프 드리프트 보정 성능 벤치마크'
      }
    ]
  };

  window.AXON_WORKFLOW_DATA = deepFreeze(DATA);
})();
