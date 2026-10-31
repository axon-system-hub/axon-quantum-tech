# RTL PPA 합성 및 동치 검증 보고서 (AXON-PPA-001)

- **작성일**: 2026-10-31 KST
- **도구 버전**: Yosys 0.70+16 (Release, x86_64-w64-mingw32) + ABC + Icarus Verilog 12.0
- **증거 상태**: 🟢 **SYNTHESIZED & VERIFIED** (동일 합성 스크립트 실측 및 RTL-Rust 비트 동치 검증)
- **대상**:
  1. 4레인 int8 활성화 x 삼진 가중치 MAC (`H:/.hermes/evidence/cryo_0mul/rtl/macs.v`)
     - **B (`mac_tern_mul`)**: 2비트 삼진 가중치를 Verilog `*` 곱셈 연산자로 기술한 기준선
     - **C (`mac_0mul`)**: 물리 곱셈기를 배제하고 Sign-Select 및 0-SKIP으로 기술한 AXON 구조
  2. M3 극저온 QEC 0-MUL 디코더 (`D:/axon-양자기술/rtl/`)
     - **`qec_decoder_3qubit_0mul.v`**: 3-Qubit 비트반전 부호 [[3, 1, 1]] 0-MUL 소프트/하드 디코더
     - **`qec_decoder_5qubit_0mul.v`**: 5-Qubit 완전 부호 [[5, 1, 3]] 단일 사이클 조합 디코더

---

## 1. 정량 측정 결과: 4레인 MAC (동일 합성 옵션: `synth -flatten; abc`)

| 평가 지표 | B (`mac_tern_mul`) | C (`mac_0mul`) | 격차 (C vs B) | 해석 |
| --- | :---: | :---: | :---: | --- |
| **RTL 수준 곱셈기 (`$mul`)** | 4개 | **0개** | **-4개 (100% 제거)** | 물리 곱셈기 배제 규격 만족 |
| **표준 논리 게이트 총수 (ABC `stdcells`)** | 385 cells | **295 cells** | **-90 cells (-23.4%)** | 가산/감산 전용 회로의 게이트 수 절감 |
| **- AND / NAND 셀** | 50 / 162 | 84 / 98 | -30 cells | 부호선택 제어로 논리 단순화 |
| **- XOR / XNOR 셀** | 116 / 15 | 48 / 11 | -72 cells | 곱셈 어레이 제거로 패리티 트리 축소 |
| **FPGA 4-입력 LUT 수 (`abc -lut 4`)** | 178 LUTs | **110 LUTs** | **-68 LUTs (-38.2%)** | FPGA 상온 실장 시 로직 자원 38% 절감 |
| **최장 위상 경로 (Logic Depth, `ltp -noff`)** | 28 levels | **26 levels** | **-2 levels (-7.1%)** | 조합회로 전파 지연 개선 |

---

## 2. 정량 측정 결과: M3 극저온 QEC 디코더 PPA

동일 합성 플로우(`synth -flatten; abc; ltp -noff; abc -lut 4`)로 추출한 QEC 디코더 실측치:

| 평가 지표 | 3-Qubit [[3, 1, 1]] 디코더 | 5-Qubit [[5, 1, 3]] 디코더 | 비고 |
| --- | :---: | :---: | --- |
| **물리 곱셈기 수 (`$mul`)** | **0개** | **0개** | 완전 무곱셈(0-MUL) 구현 |
| **표준 논리 게이트 총수 (ABC `stdcells`)** | **86 cells** | **50 cells** | 초경량 조합 논리 셀 |
| **- AND / ANDNOT 셀** | 3 / 2 | 13 / 7 | 제어 및 마스크 논리 |
| **- NAND / NOR / OR 셀** | 26 / 0 / 16 (ORNOT) | 10 / 2 / 9 (OR/ORNOT) | 신드롬 판정 및 전파 |
| **- XOR / XNOR 셀** | 19 / 16 | 0 / 0 | 3-Qubit 아날로그 차분 패리티 |
| **- MUX 셀** | 2 | 6 | 큐비트별 보정 디스패치 |
| **FPGA 4-입력 LUT 수 (`abc -lut 4`)** | **44 LUTs** | **20 LUTs** | 극저온/상온 FPGA 자원 부담 전무 |
| **최장 위상 경로 (Logic Depth, `ltp`)** | **15 levels** | **9 levels** | 단위: `logic_levels` (`[SYNTHESIZED]`, ns 지연은 별도 STA/실측 대상) |

---

## 2.1 100-Qubit 모듈러 타일링 디코더 (`qec_tile_100q_0mul.v`) PPA 측정 (`[SYNTHESIZED]`)

20개 5-Qubit 타일 병렬 복호기 및 집적 오류 카운터 전체 합성 구조 통계:

| 평가 지표 | 100-Qubit 타일링 디코더 (`qec_tile_100q_0mul`) | 비고 |
|---|:---:|---|
| **물리 곱셈기 수 (`$mul`)** | **0개 (`select -assert-none t:$mul`)** | 100 물리 데이터 큐비트(20타일) 전체 완전 0-MUL |
| **조합 표준 논리 게이트 총수 (ABC `stdcells`)** | **1,014 cells** | 20개 타일 복호기 + 트리 가산기 |
| **플립플롭 레지스터 수 (`$_DFF_PN0_`)** | **326 FFs** | 단일 사이클 파이프라인 레지스터 |
| **FPGA 4-입력 LUT 수 (`abc -lut 4`)** | **354 LUTs** | 4-LUT 매핑 기준 구조 통계 |
| **최장 위상 경로 (Logic Depth, `ltp -noff`)** | **20 levels** | 개별 타일 9 levels + 오류 집계 11 levels |
| **동시 복호 폭** | **20 타일 (100 물리 데이터 큐비트) / 클록** | 80-bit 신드롬 입력 $\to$ 200-bit 파울리 보정 버스 |

---

## 2.2 평면 CSS 회전 표면 부호 $d=3$ 디코더 (`qec_decoder_surface_d3_0mul.v`) PPA 측정 (`[SYNTHESIZED]`)

비트별(Transversal) CNOT이 부호 공간을 자연 보존하는 CSS 부호인 회전 표면 부호([[9, 1, 3]], $d=3$)의 온칩 신드롬 추출(XOR 패리티 트리) 및 단일 사이클 0-MUL 복호기 합성 구조 통계:

| 평가 지표 | 회전 표면 부호 [[9, 1, 3]] 디코더 (`qec_decoder_surface_d3_0mul`) | 비고 |
|---|:---:|---|
| **물리 곱셈기 수 (`$mul`)** | **0개 (`select -assert-none t:$mul`)** | 순수 XOR 패리티 트리 + 전단사 조합 매핑 |
| **표준 논리 게이트 총수 (ABC `stdcells`)** | **76 cells** | 19 AND, 16 ANDNOT, 15 XOR, 14 XNOR, 8 MUX, 3 NOR, 1 NAND |
| **FPGA 4-입력 LUT 수 (`abc -lut 4`)** | **46 LUTs** | 9 데이터 큐비트 + 8 플래킷 신드롬 전체 복호 |
| **최장 위상 경로 (Logic Depth, `ltp -noff`)** | **7 levels** | 초단경로 조합 논리 깊이 (`logic_levels`) |

---

## 3. 기능 동치 및 비트 일치 검증 (`[CODE-VERIFIED]` / `[RTL-VERIFIED]`)

1. **MAC 코어 단일 레인 768개 전수 검사 (`tests/interface_and_exhaustive.rs`)**:
   - int8 $[-128, 127]$ (256개) x 삼진 $\{-1, 0, +1\}$ (3개) = **768개 전수 조합 100% 비트 단위 일치 (PASS)**.
2. **MAC 코어 다레인 20,000개 무작위 벡터 시뮬레이션 (`H:/.hermes/evidence/cryo_0mul/rtl/tb_equiv.v`)**:
   - B와 C 및 Golden 모델 간 **불일치 오류 0건 (errors=0, PASS)**.
3. **QEC Rust 참조 모델 및 확장 아키텍처 단위 검증 (`tests/qec_tests.rs`, `tests/qec_expansion_tests.rs` — 총 17개 테스트 PASS)**:
   - 3-Qubit 단일 비트반전 전수 정정 및 10,000 무작위 소프트/하드 신드롬 일치: 100% PASS
   - 5-Qubit 15개 단일 큐비트 파울리 에러($X, Y, Z$) 1대1 전단사 신드롬 복호: 100% PASS
   - 5-Qubit 비-CSS 단순 Transversal CNOT 안정자 이탈 반례 검증 및 부호 공간 보존형 논리 CNOT 프로토콜(`logical_cnot_5q_protocol`) 무누설 검증: 100% PASS
   - 100-Qubit 20타일 병렬 복호 및 [[25, 1, 9]] 2단계 연쇄 부호 결함허용 검증: 100% PASS
   - 회전 표면 부호([[9, 1, 3]], $d=3$) 단일 파울리 $X, Y, Z$ 전수 복호 및 OpenQASM 3.0 $\to$ T-ASM 컴파일러 검증: 100% PASS
4. **QEC RTL Icarus Verilog 테스트벤치 (`rtl/tb_qec_decoder.v`, `rtl/tb_qec_tile_100q.v`, `rtl/tb_qec_surface_d3.v`)**:
   - `tb_qec_decoder.v`: 3-Qubit(9케이스) + 5-Qubit(16케이스) = **25개 테스트 0 Errors (PASS)**
   - `tb_qec_tile_100q.v`: 100-Qubit 20타일 병렬 복호 파이프라인 = **3개 시나리오 0 Errors (PASS)**
   - `tb_qec_surface_d3.v`: [[9, 1, 3]] 회전 표면 부호 무오류 + 27개 단일 파울리($X, Y, Z$) 전수 검사 = **28개 테스트 0 Errors (PASS)**

---

## 4. 공학적 한계 및 주의사항 (Strict Evidence Bounds)

- 본 PPA는 기술 독립적 표준 게이트(`stdcells.genlib`) 및 4-LUT 추상화 매핑 결과입니다.
- 특정 파운드리(Sky130 등)의 실제 스탠다드 셀 면적($\mu m^2$), 배선 기생 커패시턴스(RC), 동적 전력($\mu W$)은 향후 OpenSTA 배치 및 배선(P&R) 완료 후 추출해야 확정됩니다.
- 본 디코더는 단일 사이클 조합회로로서 신드롬 복호 자체의 지연은 1~2ns 수준이나, 공진기 판독 복조(Demodulation), ADC 변환, 피드백 펄스 DAC 전송을 포함하는 **전체 QEC 루프 지연 및 1,000 큐비트 극저온 물리 동작은 여전히 `NOT_EVALUATED`** 상태를 유지합니다.
