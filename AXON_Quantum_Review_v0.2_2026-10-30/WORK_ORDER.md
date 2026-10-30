# AXON-QT-002 — 증거 보존 및 공정한 검증 작업지시서

상태: 설계 제안. 원본 저장소 변경 또는 원격 push를 수행하지 않음.
대상 저장소: Axon-Labs-Org/axon-quantum-tech.
기본 플랫폼: 기존 Windows self-hosted runner. 새 workflow는 `runs-on: [self-hosted, Windows]`를 사용한다.

## 1. 기존 결과 보존

1. 작업 시작 시 현재 branch/HEAD와 clean 여부를 기록한다. 사용자의 미커밋 변경을 덮어쓰지 않는다.
2. `94dac01` 등 제공된 commit의 존재와 실제 parent tree를 확인한다. 현재 기본 branch가 다르면 차이를 기록한다.
3. `scale_sim.rs`, `optical.rs`, `fusion_pat34.rs`, 기존 README와 결과를 보존한다. 기존 가정 기반 모델은 `legacy_assumptions`라는 표기를 붙이고 기존 수치를 삭제하지 않는다.
4. 실행 명령, seed, 반복 수, 도구 버전, PDK 및 라이브러리 hash, start/end time, raw log를 수집한다.
5. 본 보고서의 정정 문구를 검토해 README에 반영한다. 물리 성능이 미검증인 수치를 실측으로 부르지 않는다.

## 2. Rust 이식 계약

새 모델은 별도 모듈로 이식하며 기존 benchmark를 대체하지 않는다. 제안 경로는 `src/engineering_ledger.rs`와 `src/bin/engineering_ledger.rs`이다.

- 입력 필드: schema version, source, evidence, unit, value.
- 미입력은 `Option<f64>::None`으로 유지한다. `unwrap_or(0.0)`로 열·전력·지연을 채우지 않는다.
- 입력에 NaN/Inf/음수, 잘못된 온도, 0 이하 채널 수가 있으면 오류 처리한다.
- 온도 단계별 열부하와 cooling curve를 구별한다. 부품을 옮기면 어느 단계의 열이 증가/감소하는지 기록한다.
- 전도 항은 구간별 열고정 조건을 보존한다. 광흡수·판독·전원 변환·clock/memory 항을 생략하지 않는다.
- WDM은 방향과 채널 수를 입력으로 받는다. fiber count가 산술상 맞아도 throughput/crosstalk 시험 합격으로 취급하지 않는다.
- QEC·QPU 모델이 없으면 `NOT_EVALUATED`를 출력한다. thermal budget의 여유만으로 시스템 PASS를 출력하지 않는다.
- 입력을 단순 가정·목표에서 measured로 바꾸려면 raw evidence 식별자와 측정 조건이 필요하다. 프로그램의 label은 증거를 인증하지 않는다.
- 본 Python 모델의 reference output을 고정 fixture로 사용한다. 핵심 계산은 허용 오차를 명시한다.

## 3. RTL 기능과 PPA

기준선 A는 일반 int8 MAC로 유지하되 기능/정밀도가 달라지는 비교를 AXON 독자 효과로 부르지 않는다. 핵심 구조 비교는 B `mac_tern_mul`과 C `mac_0mul`이다.

- x∈[−128,127], w∈{−1,0,+1}; 1레인 곱의 768조합을 전수 검사한다.
- 부호 반전 전 폭을 늘린다. 여러 레인의 누산에서 exact/wrap/saturate 모드를 명시한다.
- 모든 조합을 검증하기 어려운 다레인 회로는 directed·고정 seed random에 formal equivalence를 추가한다. random test 성공을 formal proof라 부르지 않는다.
- 가중치 인코딩의 미사용 코드 처리, reset, enable, clock gating을 같은 계약으로 맞춘다.
- 동일 pipeline latency, clock target, input transition, output load 및 합성 옵션을 사용한다.
- 4/16/64레인, 0 비율 0/33/66%를 별도 실험한다. 입력 활동과 부호 분포·상관·시간창을 고정한다.
- 내역: 셀 면적, slack, mapped multiplier 구조, total/internal/switching/leakage power, energy per completed operation.
- `energy/op = total power / completed operations per second`; clock/idle 비용과 연산 경계를 명시한다.
- ABC timeout은 원인 진단용 로그로 보존한다. subprocess timeout을 걸고 중단 시 불완전 JSON을 정상 결과로 파싱하지 않는다.
- no-ABC 논리 결과와 Liberty 기반 매핑 결과를 별도 파일에 저장한다.
- OpenSTA 출력은 합성/모델 추정이다. 온도 검증 없는 77K/4K extrapolation을 금지한다.

## 4. 광학 모델

1. classical control path와 quantum state path를 분리한다.
2. 양쪽 MZI 출력, 삽입손실, unused-port termination, detector quantum efficiency와 흡수광 열부하를 포함한다.
3. ER dB를 power 기준인지 field 기준인지 명시한다: power=10^(−ER/10), field=10^(−ER/20).
4. signed value의 입력 인코딩·LO·balanced detector 전류식을 적고 선형성부터 검증한다.
5. shot/thermal/RIN/phase noise, offset, ADC quantization, wavelength crosstalk, clipping 및 drift를 포함한다.
6. 같은 cosine similarity라도 전체 gain error가 남을 수 있다. L2·max error·waveform error·해당 task 품질을 함께 본다.
7. 고전 벡터 cosine을 quantum state/gate fidelity라고 이름 붙이지 않는다.
8. 45dB를 보편적인 gate-fidelity threshold로 하드코딩하지 않는다. 실제 pulse-to-gate channel을 검증해 요구치를 역산한다.

## 5. 상온·77K 보드 단계

상온 FPGA 전기 loopback부터 수행한다. 일반 FPGA/개발보드를 바로 LN2에 담그는 작업으로 시작하지 않는다.

- 상온에서 입력-출력 지연 분해, throughput, waveform quality 또는 decoder logical error를 측정한다.
- 77K 후보 부품은 coupon 보드로 시험한다. 전원·clock·memory·RF·광수신기의 온도별 동작을 각각 기록한다.
- 진공 전도 냉각으로 시작하고 다이 근접 센서, 냉각판 센서, 히터 및 전류 제한을 포함한다.
- 패키지 CTE, 광결합 드리프트, 접착제, outgassing, connector, solder, 열사이클을 별도 승인 기준으로 둔다.
- 실제 LN2 장비를 제작할 때는 배기·압력 relief·산소결핍 관리 등 해당 시설의 극저온 취급 기준을 반영한다.

## 6. QEC 단계

특정 코드·거리·syndrome 수·round rate와 noise model을 선정한다. 비교 대상은 같은 오류모형의 구현 가능한 decoder이다. 삼진 신경망 디코더를 택하면 학습·양자화 후의 logical error penalty를 포함한다.

합격 조건은 (1) 기준선과 비교한 logical error, (2) round당 처리율, (3) mean/p95/p99 latency, (4) backlog 유무, (5) power/energy, (6) 실제 feedback 또는 Pauli-frame 반영까지의 경계이다. 목표 수치는 대상 QPU 요구조건으로 정하며 임의 4ns를 전체 합격선으로 사용하지 않는다.

## 7. 완료 산출물

- 원본 재현 로그와 실패 로그
- 정정된 claim registry와 입력 출처
- RTL 기능검증 결과와 매핑된 PPA
- 광학 에너지·신호 예산
- 단계별 열수지 및 미확인 항목
- 실제 소자 검증이 끝나기 전까지 `QPU feasibility: NOT_EVALUATED`

위 항목이 채워진 뒤에만 외부 성능 문구·가격·큐비트 규모를 갱신한다.
