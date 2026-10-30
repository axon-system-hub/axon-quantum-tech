# RTL PPA 합성 및 동치 검증 보고서 (AXON-PPA-001)

- **작성일**: 2026-10-30 KST
- **도구 버전**: Yosys 0.70+16 (Release, x86_64-w64-mingw32) + ABC
- **증거 상태**: 🟢 **SYNTHESIZED** (동일 합성 스크립트 및 ABC 게이트/LUT 매핑 실측)
- **대상**: 4레인 int8 활성화 x 삼진 가중치 MAC (`H:/.hermes/evidence/cryo_0mul/rtl/macs.v`)
  - **B (`mac_tern_mul`)**: 2비트 삼진 가중치를 Verilog `*` 곱셈 연산자로 기술한 기준선
  - **C (`mac_0mul`)**: 물리 곱셈기를 배제하고 Sign-Select 및 0-SKIP으로 기술한 AXON 구조

---

## 1. 정량 측정 결과 (동일 합성 옵션: `synth -flatten; abc`)

| 평가 지표 | B (`mac_tern_mul`) | C (`mac_0mul`) | 격차 (C vs B) | 해석 |
|---|:---:|:---:|:---:|---|
| **RTL 수준 곱셈기 (`$mul`)** | 4개 | **0개** | **-4개 (100% 제거)** | 물리 곱셈기 배제 규격 만족 |
| **표준 논리 게이트 총수 (ABC `stdcells`)** | 385 cells | **295 cells** | **-90 cells (-23.4%)** | 가산/감산 전용 회로의 게이트 수 절감 |
| **- AND / NAND 셀** | 50 / 162 | 84 / 98 | -30 cells | 부호선택 제어로 논리 단순화 |
| **- XOR / XNOR 셀** | 116 / 15 | 48 / 11 | -72 cells | 곱셈 어레이 제거로 패리티 트리 축소 |
| **FPGA 4-입력 LUT 수 (`abc -lut 4`)** | 178 LUTs | **110 LUTs** | **-68 LUTs (-38.2%)** | FPGA 상온 실장 시 로직 자원 38% 절감 |
| **최장 위상 경로 (Logic Depth, `ltp -noff`)** | 28 levels | **26 levels** | **-2 levels (-7.1%)** | 조합회로 전파 지연 개선 |

---

## 2. 기능 동치 검증 (Functional Equivalence)

1. **단일 레인 768개 전수 검사 (`tests/interface_and_exhaustive.rs`)**:
   - int8 $[-128, 127]$ (256개) x 삼진 $\{-1, 0, +1\}$ (3개) = **768개 전수 조합 100% 비트 단위 일치 (PASS)**.
2. **다레인 20,000개 무작위 벡터 시뮬레이션 (`rtl/tb_equiv.v`)**:
   - B와 C 및 Golden 모델 간 **불일치 오류 0건 (errors=0, PASS)**.

---

## 3. 공학적 한계 및 주의사항

- 본 측정은 기술 독립적 표준 게이트(`stdcells.genlib`) 및 4-LUT 추상화 매핑 결과입니다.
- 특정 파운드리(Sky130 등)의 실제 스탠다드 셀 면적($\mu m^2$), 배선 기생 커패시턴스(RC), 동적 전력($\mu W$)은 향후 OpenSTA 배치 및 배선(P&R) 완료 후 추출해야 확정됩니다.
- 1,000 큐비트 전체 시스템 및 극저온 QEC 피드백 성능은 **`NOT_EVALUATED`** 상태를 유지합니다.
