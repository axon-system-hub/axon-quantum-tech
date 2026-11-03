# [AXON-DIR-SQA-01 v2.0] AXON 양자 제어 및 광학 CPNPU 마스터 지침서

> **2026-11-01 제조 RFQ 정정:** 신규 PCB·기구 견적에는
> [PCB A2 / 리드 C 패키지](hardware/rfq_rev_a2/README_RFQ_KO.md)를 사용한다.
> 아래 A1/B의 제작 준비 완료·부품 핀 기능·기밀/77 K 관련 표현은 신규 RFQ의
> 승인 근거가 아니다. 새 패키지는 견적/DFM용이며 제조사 CAM·조립·실측 검증을 대체하지 않는다.

> **2026-11-01 정정 우선 적용:** `QPU_REPAIR_KO.md`와 `surface-d3/v2` 계약이
> 아래의 이전 표면부호·QASM 실행·연쇄 복호 주장보다 우선한다. 과거 합성
> 통과는 유효한 안정자 부호나 물리 QPU 구현을 증명하지 않았다.
### (Sovereign Quantum-Classical & Optical CPNPU Full-Stack Directive)

> **“완벽함을 선언하지 않는다. 근거를 기억하고, 스스로 오류를 찾아, 검증된 개선을 축적한다.”**  
> **“물리 곱셈기를 0개로 제거하고, 구리 동축선 대신 WDM 광섬유로 상온-극저온을 연결하며, 77K 인시츄(In-Situ) 국소 폐루프와 금(Au) 반사 캐비티 Li-Fi로 실시간 연산과 오류 정정을 수행한다.”**

---

## Ⅰ. 6대 기본 공리 (Core Engineering Axioms)

모든 엔지니어와 에이전트는 본 프로젝트의 설계·구현·검증 시 아래 6가지 불변 원칙을 준수한다.

1. **0-MUL 불변성 (Zero-Multiplier Axiom):**  
   상온 및 극저온(77K) 제어 코어(ALU)와 양자 오류 정정(QEC) 디코더에서 **물리 곱셈기(`$mul`)를 0개로 강제**한다. 모든 연산은 부호선택(Sign-Select: $+1, -1$), `0-SKIP`, CSD Shift-Add, 조합 논리 LUT로만 구현하며, 합성 시 `select -assert-none t:$mul` 게이트로 검증한다.
2. **2계층 제어 경계 분리 (Two-Tier Control Boundary Axiom):**  
   상온(300K)과 극저온(77K)을 잇는 편도 $1\,\mathrm{m}$ 광섬유의 물리적 왕복 전파 바닥값($\approx 10.007\,\mathrm{ns}$)을 직시한다.
   - **외부 트렁크 (Outer Loop, $300\mathrm{K} \leftrightarrow 77\mathrm{K}$):** 2가닥 WDM/TDM 다중화 광섬유를 통해 OpenQASM/T-ASM 회로 명령 하향 및 신드롬 통계 수집을 수행하여 다수 구리 동축선의 전도열을 차단한다.
   - **내부 고속 폐루프 (Inner In-Situ Loop, $77\mathrm{K}$ Local):** $<5.0\,\mathrm{ns}$ 목표의 실시간 신드롬 복호 및 피드백은 상온을 거치지 않고 **77K 스테이지 내부의 0-MUL 하드웨어 디코더에서 단일 사이클로 종결**한다.
3. **건식 기밀 캐비티 및 콜드핑거 전도 냉각 (Dry-Cavity & Cold-Finger Axiom):**  
   광학 경로 내부로 액체질소(LN2)가 유입되어 비등(기포 산란)하는 것을 엄금한다. $58\times 58\,\mathrm{mm}$ 금(Au) 반사 캐비티 리드와 캐리어 PCB는 $\varnothing 54\,\mathrm{mm}$ O-링/인듐 실링으로 기밀 밀봉(진공 또는 건조 불활성 기체 유지)하고, 냉각은 외부 무산소동 콜드핑거(Cold-Finger) 전도 냉각으로 수행한다.
4. **극저온 밴드갭 청색 천이 대응 (Cryogenic Varshni Bandgap Axiom):**  
   77K 냉각 시 반도체 밴드갭 증가로 인해 표준 $\mathrm{In}_{0.53}\mathrm{Ga}_{0.47}\mathrm{As}$의 차단 파장이 단파장($\approx 1540\,\mathrm{nm}$ 모델치)으로 이동함을 설계에 반영한다. 상온(300K) 보드는 `표준 InGaAs + 1550nm`를 기본으로 하되, 77K 보드는 **`표준 InGaAs + 1310nm(O-Band)`** 또는 **`Extended-InGaAs + 1550nm(C-Band)`** 투트랙 후보를 실측 비교하여 확정한다.
5. **고전 삼진 연산과 양자 위상 계약 분리:**
   그로버 위상 오라클의 대각 성분은 ±1이며 유니터리다. 진폭을 0으로
   만드는 마스킹은 일반적으로 유니터리가 아니다. 물리 게이트의 0-SKIP은
   항등 동작과 진폭 소거를 구분해야 한다. BPD의 음전류는 양자 위상 반전과
   동치가 아니며, 직접 검출은 위상 부호만으로 광세기를 바꾸지 않는다.
   간섭계·위상 기준·상태 준비·검출 프로토콜과 얽힘 게이트를 별도로 구현하고
   검증하기 전에는 고전 KCL 합산을 Grover 양자 가속으로 표시하지 않는다.
6. **엄격한 증거 등급 분리 (Strict Epistemic Tiering):**  
   모든 산출물과 수치는 아래 5단계 증거 태그로 엄격히 분리하며, 모델 가정치를 실측치로 둔갑시키는 행위를 금지한다.
   - 🟢 `[VERIFIED]`: 단위 테스트, 비트 동치 시뮬레이션, 독립 파서(Gerber/SHA-256) 검증 완료.
   - 🟢 `[SYNTHESIZED]`: Yosys/ABC 합성 넷리스트 구조적 셀 및 LUT 카운트 확인 완료.
   - 🟠 `[TIMING-ANALYZED / ASSUMED]`: 정적 타이밍 분석(STA), 논리 단수(LTP), 열·링크 예산 및 반도체 모델 계산치.
   - 🔵 `[ENGINEERING]`: 상용 통합 및 보드 조립·레시피 고도화 진행 중.
   - 🔴 `[TARGET / NOT_EVALUATED]`: 물리 QPU 실칩 동작, 77K 챔버 실측, 종단간 아날로그 폐루프 실측 대기.

---

## Ⅱ. 5계층 풀스택 통합 아키텍처 (L0 ~ L4)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ [L4: 지능 & 영속 기억] CAMEL-Swarm 자가교정 + CORAL/Engram 3진 그로버 탐색     │
├──────────────────────────────────────────────────────────────────────────────┤
│ [L3: 양자-고전 브릿지] OpenQASM 3.0 -> T-ASM 컴파일러 + 야코비안 수축 안정화   │
├──────────────────────────────────────────────────────────────────────────────┤
│ [L2: 0-MUL 실시간 QEC] 5Q(20 LUT) & 100Q 타일링(354 LUT) 단일 사이클 디코더    │
├──────────────────────────────────────────────────────────────────────────────┤
│ [L1: 광학 CPNPU (PAT-35/36)] 58mm Au 미러 캐비티 + InGaAs BPD KCL 차동 합산   │
├──────────────────────────────────────────────────────────────────────────────┤
│ [L0: 기구·PCB·극저온 링크] 75mm 6층 Rogers 캐리어 보드 + 2가닥 WDM + 콜드핑거 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### [L0 Layer] 기구·고주파 PCB 및 2가닥 WDM 극저온 패키징
- **$58\times 58\,\mathrm{mm}$ 금(Au) 반사 캐비티 리드 (`AXON_PAT35_CAVITY_LID_REV_B.dxf`):** AL6061-T6 / C10200 무산소동 모재, 단결정 다이아몬드 플라이커팅($Ra \le 0.02\,\mu\mathrm{m}$ 목표), 3층 PVD 스퍼터링(`10nm Ti/Cr + 150nm 4N Au + 80nm SiO2`).
- **$75\times 75\,\mathrm{mm}$ 6층 하이브리드 캐리어 PCB (`AXON_OPTICAL_CPNPU_CARRIER_GERBER_REV_A1.zip`):** Rogers RO4350B + High-Tg FR-4 6층 구조(`F_Cu`, `In1_GND`, `In2_PWR`, `In3_Stripline`, `In4_GND`, `B_Cu`), 54mm ENIG 금도금 차폐 링, 74개 드릴 홀(IPC-NC-349 규격, `gerbonara` 독립 감사 100% 통과).
- **2가닥 광섬유 WDM/TDM 트렁크 (`P2_v0.3` / `P3_WDM_v0.4`):** 하향 제어 1가닥 + 상향 판독 1가닥 구성. CWDM($4\lambda \times 13\text{슬롯}$) 및 DWDM($10\lambda \times 5\text{슬롯} = 50\text{채널}$, 프레임 $50\,\mathrm{ns}$, 갱신율 $20\,\mathrm{MHz}$ 계산치) 스케줄링 모델 확보.

### [L1 Layer] 광학 CPNPU 및 KCL 0-MUL 차동 연산 코어 (특허 34/35/36)
- **3진 광-전자 차동 수신 (`cryo_bpd_ternary.py`):**
  - $+1$: 양(+) 포토다이오드 어레이 경로 전달 ($I_{\text{diff}} > +\theta$)
  - $-1$: 음(-) 포토다이오드 어레이 경로 전달 ($I_{\text{diff}} < -\theta$).
    $\pi$ 위상 반전만으로 같은 직접검출기의 광전류 부호가 바뀌지는 않는다.
  - $0$ (`0-SKIP`): 광원/변조기 게이팅 차단 ($I_{\text{diff}} \approx 0$, 구동 전력 절감)
- **무곱셈 아날로그 합산:** 16채널 VCSEL 어레이와 2x 1x16 InGaAs 균형 광다이오드(BPD)의 캐소드/애노드 접합점(KCL 가상접지 노드)에서 디지털 곱셈기 없이 전류 차동 합산 후 초저잡음 TIA(OPA855급)로 증폭.

### [L2 Layer] 0-MUL 실시간 양자 오류 정정(QEC) 하드웨어 디코더
- **3-Qubit 비트반전 디코더 (`qec_decoder_3qubit_0mul.v`):** 하드 판정 및 int8 아날로그 차분 패리티 지원. **86 표준 셀, 44개 4-LUT, 최장 경로 15단, 곱셈기 0개** 🟢 `[SYNTHESIZED]`.
- **5-Qubit 완전 부호 디코더 (`qec_decoder_5qubit_0mul.v`):** `[[5, 1, 3]]` 안정자 생성자 기반 15개 단일 큐비트 파울리 오류($X, Y, Z$) 1:1 전단사 복호. **50 표준 셀, 20개 4-LUT, 최장 경로 9단, 곱셈기 0개** 🟢 `[SYNTHESIZED]`. (주의: `[[5, 1, 3]]`은 비-CSS 부호이므로 논리 CNOT은 횡단 게이트가 아닌 보조 상태 주입/격자 수술 규약을 따름).
- **100-Qubit 모듈러 타일링 디코더 (`qec_tile_100q_0mul.v` / `tiler_100q.rs`):** 20개 5-Qubit 타일 병렬 구동(Mode A: 20 논리 큐비트 $d=3$ / Mode B: 4 연결 논리 큐비트 $d=9$). **1,014 조합 셀, 354개 4-LUT, 326 FFs, 곱셈기 0개**로 클록당 100 물리 큐비트 동시 복호 🟢 `[SYNTHESIZED]`.
- **회전형 표면 부호 디코더 (`surface_code.rs`):** $d=3$ 평면 격자(9 데이터 큐비트, 8 플라켓 체크)의 모든 단일 파울리 오류를 그래프 탐색(MWPM) 없이 단일 사이클 조합 논리로 복호 🟢 `[VERIFIED]`.

### [L3 Layer] OpenQASM 3.0 $\to$ T-ASM 브릿지 및 야코비안 안정화
- **OpenQASM 부분집합 브릿지 (`qasm_bridge.rs`):** 범위·문법 검사 후 가상 양자 IR 생성.
  `T_0MUL_*`는 기존 CPNPU ISA의 실행 가능한 명령이 아니다. `tools/qpu_runner.py`는
  지원 게이트를 Qiskit에 연결하며 `qec_5q` 실행은 실제 신드롬 추출 회로가 없어 거부한다.
  H/S/CX 물리 구현 및 보정 펄스, 0-MUL QEC 피드백 연결은 별도 계약이다.
- **5-Trit/Byte & 13-Code 코덱:** $3^5 = 243$ 상태와 13개 인밴드 제어 코드(Zero-run 등)를 결합하여 가중치와 양자 제어 시퀀스를 무손실 압축 🟢 `[VERIFIED]`.
- **야코비안 수축 매핑:** 다층 양자화 및 위상 드리프트 오차를 스펙트럴 제약과 레인지 투영으로 억제.

### [L4 Layer] CORAL 영속 증거 원장 및 CAMEL-Swarm 검증 루프
- **독립 감사 및 접수 체계 (`AXON_SQA_01_v0.3.1` & `m3_intake.py`):** 모든 RTL·Rust·합성 로그는 SHA-256 해시 매니페스트와 커밋 귀속 검사기를 통과해야 하며, 현재 `repetition_3` 및 `five_qubit` 모두 `READY_FOR_REVIEW` (이슈 0건) 달성 🟢 `[VERIFIED]`.

---

## Ⅲ. 마일스톤 현황 및 검증 게이트 (Milestones & Evidence Ledger)

| 마일스톤 | 핵심 검증 목표 | 검증 기준 및 달성 내역 | 증거 등급 |
|:---:|---|---|:---:|
| **M1** | 0-MUL vs 곱셈기 MAC 비트 동치 및 합성 | Rust 768 전수 검사 & Verilog 20,000 벡터 오류 0건, `$mul = 0`, LUT 38.2% 절감 | 🟢 **VERIFIED & SYNTHESIZED** |
| **M2** | 광 CPNPU 수치 모델 및 EDA 멀티 사인오프 | `control01_top` STA(373.1 MHz), LVS(5/5 일치), CDC, DFT(99.84%), REA 통과 | 🟢 **SYNTHESIZED** / 🟠 **TIMING-ANALYZED** |
| **M3** | 극저온 0-MUL QEC 디코더 (3Q / 5Q / 100Q / Surface $d=3$) | Rust 16/16 테스트 & Icarus Verilog 28/28 테스트 PASS, 100Q 디코더 **354 4-LUTs** 합성, `m3_intake` 통과 | 🟢 **VERIFIED & SYNTHESIZED** |
| **M4** | 캐비티 리드 CAD 도면 및 6층 캐리어 PCB 거버 패키지 | 58mm 리드 DXF/RFQ 완성 + 75mm 6층 거버/74홀 드릴 `gerbonara` 2차 독립 감사 100% 통과 | 🟢 **VERIFIED (PRODUCTION READY)** |
| **M5** | 2가닥 WDM 스케줄링 및 300K/77K 밴드갭·BPD 모델 | `P2_v0.3`(19 시험), `P3_WDM_v0.4`(21 시험), `P4_CryoBPD_v0.5`(25 시험) 및 SHA-256 전수 일치 | 🟢 **CODE VERIFIED** / 🟠 **ASSUMED MODEL** |
| **M6** | 상온(300K) $\to$ 극저온(77K) 콜드핑거 보드 HIL 실측 | CNC 리드 + 6층 PCB 실물 조립 후 300K 및 77K에서 3진(`+1, 0, -1`) 응답도·오판율·발열 실측 | 🔴 **TARGET (다음 실증 단계)** |
| **M7** | 외부 물리 QPU 연동 및 1,000-Qubit 랙 스케일 확장 | 1,550mm 콤팩트 랙(엣지/이동체) 및 2,750mm 고밀도 메가-랙(4단×5장=20장 QPU 카드, 랙당 100 물리 큐비트), QPU 홀 4열·중앙 광학 OXC·독립 크라이오 플랜트·NOC 통합 데이터센터 실증 | 🔴 **TARGET (장기 목표)** |
| **M8** | 0-MUL 물리 법칙 양자 월드 모델 + 이산 파동장 + 오픈소스 `243+13` 웨이브 AI | `YourOS/axon-qpu-sim/src/world_model.rs` 구현 완료: 10,000 스텝 에너지·운동량 드리프트 `0`, `243+13` 5-Trits/Byte 전수 무손실 왕복, 파동 상쇄간섭 `0-SKIP`, 21/21 테스트 PASS | 🟢 **CODE VERIFIED (SIMULATOR)** |

---

## Ⅳ. 실증 추진 3단계 프로토콜 (Actionable Execution Plan)

1. **Step 1 — 상온(300K) 3진 광 CPNPU 기준선 실측:**  
   확보된 6층 거버(`AXON_OPTICAL_CPNPU_CARRIER_GERBER_REV_A1.zip`)와 금 캐비티 리드(`AXON_PAT35_CAVITY_LID_REV_B.dxf`)를 발주·조립하여, 상온에서 `표준 InGaAs + 1550nm` 조합의 KCL 차동 전류($+1, 0, -1$) 분리도와 `0-SKIP` 전력을 먼저 실측한다.
2. **Step 2 — 77K 건식 콜드핑거 비교 실측:**  
   동일 패키지를 O-링/인듐으로 기밀 밀봉한 뒤 진공 챔버 내 구리 콜드핑거(77K)에 장착하여, 냉각 전후의 광응답도 변화(`1310nm` vs `1550nm Extended-InGaAs`), 암전류 감소, 광학 정렬 유지 여부를 상온 데이터와 1:1 대조한다.
3. **Step 3 — 77K 국소 0-MUL QEC 폐루프 연동:**  
   FPGA/SoC에 합성된 354-LUT 100큐비트 0-MUL 디코더(`qec_tile_100q_0mul.v`)를 캐리어 보드 고속 커넥터에 직결하여, 광학 신드롬 수신부터 보정 펄스 출력까지의 종단간 국소 루프 지연을 오실로스코프로 실측 검증한다.
