# AXON-QT-003 — M3 수정·검증 작업지시서

상태: 원본 M3 접근 전 실행 가능한 검증 계약. 현재 저장소 경로는 이전 자료가 지칭한 `Axon-Labs-Org/axon-quantum-tech`이며 이번 README 조회도 404였다. 이는 저장소 부재의 증명이 아니라 현재 연결의 접근 한계이다.

## 1. 원본에 적용할 수정

1. 원본 branch·HEAD·worktree 변경을 기록하고 M3 RTL·TB·합성 스크립트·로그를 동일 SHA로 묶는다. 기존 사용자 변경을 덮어쓰지 않는다.
2. 코드명·거리·data/ancilla 수·rounds·syndrome layout·noise model을 README와 testbench의 단일 계약으로 만든다.
3. `20 LUT`, `50 gate`, `$mul=0`, `LTP9`를 원시 로그의 정확한 항목명으로 옮긴다. FPGA part/speed grade, top, hierarchy 포함 범위를 적는다. num_cells를 환산 gate count로 바꾸지 않는다.
4. 근거 없는 ASIC0.5ns·FPGA1.5ns 변환식을 제거한다. 숫자를 유지하려면 TARGET으로 분리하고 실제 STA/PnR 결과와 다른 키에 둔다.
5. `0W`, `무발열`, `4K 직접실장 완료`, `전체 QEC5ns`, `나노초 OS 무지터`를 현재 성능 문구에서 제거한다. 실패·가정 원본은 history에 남긴다.
6. post-map `$mul=0` 외에 pre-map operators, DSP/MACC, mapped cone 구조와 입력 영역을 검토한다. FPGA DSP0만으로 일반 게이트 곱셈 구조 부재를 증명하지 않는다.

## 2. 이번 참조 구현의 정확한 계약

`qec_reference.py`는 기존 M3의 복제나 패치가 아니다. 원본을 볼 수 없는 상태에서 새로 작성한 공통 기능 기준선이다.

| 항목 | 정의 |
|---|---|
| 코드 | Steane CSS [[7,1,3]], data qubit 7개 |
| check matrix rows | 0b1010101, 0b1100110, 0b1111000 |
| bit order | bit i = qubit i+1 |
| 입력 sx | Z-check 측정에서 얻는 H·x_error, 3bit |
| 입력 sz | X-check 측정에서 얻는 H·z_error, 3bit |
| 출력 | X correction 7bit, Z correction 7bit |
| decoder | syndrome0이면 0, 그 외 해당 index의 one-hot |
| 기능 범위 | 이상적 noiseless syndrome, 단일 Pauli 오류 교정 |
| 제외 | syndrome extraction 회로·고장, measurement noise, leakage, 다중 라운드 history |
| 정확한 비교 조건 | 같은 코드·신드롬·noise·출력 의미 |

H의 각 열은 1..7의 이진 index이고 행들은 서로 직교하므로 CSS stabilizer가 commute한다. residual X/Z가 각각 H의 row span 안에 있으면 logical state에 자명하게 작용한다. 이 판정을 16,384개 Pauli 패턴에 대해 수행하며 별도의 상태벡터 적용 결과와 대조한다. 단일 Pauli 전수 통과가 multi-fault QEC 또는 fault tolerance의 증명은 아니다.

## 3. 실제 RTL 검증

원본이 이 계약과 같으면 64개 syndrome 조합과 Pauli 오류 대응을 대조한다. 다르면 원본 코드에 맞는 별도 golden reference를 만든다. Hamming lookup 참조를 surface-code decoder의 성능 기준선으로 사용하지 않는다.

reset/enable/valid·ready·output register·입력 안정성·CDC를 명세한다. X/Z 오류를 모두 다루는지, 측정 오류를 처리하는지, 동일 syndrome을 만드는 서로 다른 오류를 어떻게 다루는지 검사한다. formal equivalence 범위와 simulation coverage를 구별한다.

## 4. 동일 조건 PPA

동일 top·기능·pipeline·input/output load·clock/reset·target·tool·노이즈를 사용하는 baseline을 둔다. 일반 int8 MAC와 작은 syndrome XOR 회로의 gate 수를 직접 비교하지 않는다. 다음 파일을 남긴다.

- pre-map netlist와 연산자 통계, mapped netlist와 primitive 통계
- 전체 synthesis log·명령·도구 버전·source SHA·종료 코드
- ASIC Liberty/SDC/SPEF 또는 기생 모델과 corner·STA report
- FPGA part/speed grade·constraint·배치배선 report·unconstrained path 보고
- VCD/SAIF 활동·시간창·power methodology, leakage·internal·switching·clock·I/O 경계

`energy/decoded_round = measured_total_power / sustained_completed_rounds_per_second`이며 idle·batch·I/O 포함 범위를 적는다. 합성 전력은 모델 추정으로, 보드 계측은 FPGA-MEASURED로 구별한다.

## 5. 실제 QEC 확장 게이트

기준선 대비 logical error, 평균/p95/p99·최대 관찰 latency, 처리율, backlog, 필수 데이터 누락, energy/round를 동시에 평가한다. logical error acceptance는 사전 등록한 code·physical noise·목표 알고리즘 요구에서 정한다. 기능과 정확도를 맞춘 뒤 속도·전력 우위를 주장한다.

4K/77K 확장은 상온 HIL과 독립된 부품·coupon·패키지 시험 이후 진행한다. QPU·readout을 연결하기 전에는 QPU feasibility와 종단 간 QEC는 NOT_EVALUATED로 남긴다.

## 6. 원본 통합 및 CI

새 검증 묶음을 별도 `validation/sqa_v03` 폴더에 넣고 `python verify_release.py`로 확인한다. Rust golden model 이식은 동일 bit order·입력 오류 처리·정확한 실패 사례와 fixture를 보존한다. workflow 예제는 `integration/axon-sqa-validation.yml`이며 repository root의 `.github/workflows/`에 옮겨야 활성화된다.

기존 Windows self-hosted runner를 사용한다. 이 패키지에 포함된 workflow를 기존 quantum/YourOS workflow 전체의 대체로 사용하지 않는다. 실제 RTL·PPA 도구 실행 job은 원본 경로·도구 설치를 확인한 뒤 추가한다. 본 Python job의 녹색 상태는 Python 기능검사 성공만 의미한다.
