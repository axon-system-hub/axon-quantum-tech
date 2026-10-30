# 추가 검토 — 1,000큐비트 랙이 AI·슈퍼컴퓨팅에 미치는 영향

작성일: 2026-10-30 KST. 앞선 극저온·광학 검토에 이어, 추가 제공된 응용 및 데이터센터 대체 주장을 검토한다.

**전체 판정: 신뢰성 있는 소형 QPU를 데이터센터에 통합하는 것은 가치 있는 목표다. 그러나 랙 크기와 큐비트 수만으로 AI 추론 즉시 완결, 범용 NP-hard 문제의 ms 해법, 무오차 분자 계산, GPU 데이터센터 대체가 도출되지는 않는다. AXON은 고전 제어·인터커넥트와 특정 양자 응용을 분리해 검증해야 한다.**

## 1. 주장별 판정

| 주장 | 값 | 증거 라벨 | 적용 범위 | 비교 기준·조건 | 계산/출처 | 한계 | 판정 |
|---|---:|---|---|---|---|---|---|
| 1,000 qubit의 상태 공간 차원 | 2^1000≈1.07×10^301 | [THEORETICAL] | [GENERAL] | 이상적 2준위 register | 1000 log10(2) | 상태 공간 차원이지 같은 수의 읽기 가능한 답이 아님 | 검증됨 |
| 위 차원이 곧 모든 추론 경로 동시 판독 | 무제한 답 접근 | [ASSUMED] | [PROJECTED-AXON] | 상태 준비·간섭·측정 필요 | 양자 측정 구조 | 중첩과 접근 가능한 고전 정보 혼동 | 반증됨 |
| QAOA가 모든 추론 경로의 global optimum 보장 | 1ms | [ASSUMED] | [PROJECTED-AXON] | 문제 인코딩·깊이·shots·최적화 필요 | A1 | 일반적 최적해·실시간 보장 없음 | 미검증 |
| 표준 attention이 역행렬 계산임 | O(N²) inverse | [ASSUMED] | [GENERAL] 주장 | scaled dot-product attention | A3의 식 | 표준 식은 QKᵀ·softmax·V | 반증됨 |
| HHL이면 attention 전체가 로그 시간 | O(log N) | [ASSUMED] | [PROJECTED-AXON] | 희소성·조건수·입력 준비·출력 조건 필요 | A2·A3 | 다른 계산 문제·측정/출력 비용 누락 | 미검증 |
| MLQT와 qutrit이 같으므로 native 추론 완성 | 변환 손실 0 | [ASSUMED] | [MLQT-ONLY] 주장 | 기저상태 부호화와 알고리즘 분리 | 상태 인코딩은 가능 | 유니터리·가중치 로딩·측정·양자화 품질 미검증 | 미검증 |
| 1,000 qubit과 630 qutrit이 정확히 같은 크기 | 630 qutrit | [DERIVED] | [GENERAL] | Hilbert 공간 차원만 비교 | 1000/log2(3)=630.93 | 630은 근사; 정확한 차원·기능 등가 아님 | 조건부 가능 |
| 1,000 physical qubit이 1,000 logical qubit | 1:1 | [ASSUMED] | [GENERAL] 주장 | 오류정정 인코딩 필요 | 아래 footprint 예제 | 코드·오류율·오류예산에 따라 overhead 변동 | 반증됨 |
| 큰 분자의 정확한 전자구조를 무근사 계산 | 100% | [ASSUMED] | [PROJECTED-AXON] | Hamiltonian·기저·정밀도·오류예산 필요 | A4 | 유한 기저·상태 준비·통계·gate error | 미검증 |
| 모든 산업 NP-hard 최적화가 몇 초에 완료 | 보편적 speedup | [ASSUMED] | [PROJECTED-AXON] | 동일 문제·품질·성공률·전체 시간 필요 | A1은 근사 알고리즘 | 범용 효율 해법 보장 근거 없음 | 미검증 |
| QPU를 HPC에 붙이는 방법이 웹 API뿐 | 수백 ms만 가능 | [ASSUMED] | [GENERAL] 주장 | 실제 기존 host-controller 연결 | A5의 NVQLink | 기존 실시간 통합 사례 존재 | 반증됨 |
| 광 PCIe/CXL 선만 붙이면 QPU 직결 | 메모리처럼 사용 | [ASSUMED] | [PROJECTED-AXON] | controller endpoint·driver·runtime 필요 | 인터페이스 요구조건 | 전송 매체와 프로토콜·QPU 의미론 혼동 | 미검증 |
| QPU 랙이 GPU 수백~수천 장을 대체 | 수천 배 절전 | [ASSUMED] | [PROJECTED-AXON] | 동일 업무·품질·완료 시간·모든 보조장비 필요 | 동등 workload 자료 없음 | 서로 다른 일을 하는 시스템 비교 | 비교 불가 |
| LN2 기반으로 1랙에서 24/7 운용 | 수백 W·수억 원 | [TARGET] | [PROJECTED-AXON] | 소자·검출·시설·정비·실제 견적 필요 | 이번 자료에 없음 | 냉각기·외부 tank/압축기·host 경계 미정 | 미검증 |

## 2. 상태 공간은 큰 창고의 모든 서랍을 동시에 읽는 기능이 아니다

1,000 qubit의 일반 상태는 2^1000개의 복소 진폭으로 표현한다. 하지만 computational-basis 측정 한 번에서 얻는 것은 그 분포에서 나온 하나의 1,000-bit 결과다. 원하는 값의 확률을 높이려면 문제에 맞는 회로와 간섭을 설계하고 반복 측정해야 한다.

따라서 큰 Hilbert 공간은 중요한 계산 자원이지만, 가능한 추론 경로를 전부 읽거나 최적 경로를 자동으로 골라주는 장치가 아니다. 알고리즘별 구조와 데이터 접근 비용을 분석해야 한다.

## 3. 1,000개의 물리 큐비트와 논리 큐비트를 먼저 구분한다

오류정정에는 데이터 큐비트 외에 syndrome 측정용 ancilla 등이 필요하다. footprint의 단순 예로, rotated surface-code 독립 patch 하나를 data d²개 + ancilla (d²−1)개 = 2d²−1개로 세는 모형을 사용한다.

| 가정한 코드 거리 d | 단일 patch 물리 큐비트 [DERIVED] | 1,000개로 들어가는 독립 patch 수의 산술 상한 |
|---:|---:|---:|
| 3 | 17 | 58 |
| 7 | 97 | 10 |
| 21 | 881 | 1 |

이 표는 특정 장치 예측이 아니다. routing, lattice surgery, magic-state factory, spare, control ancilla 등의 공간을 제외한 산술 예제다. 필요한 d는 실제 물리 오류율과 알고리즘 오류예산으로 정하며 다른 code family는 footprint가 다르다. 따라서 ‘1,000 physical이면 1 logical밖에 없다’는 고정 결론도 잘못이다.

1,000 logical qubit이 확보되어도 시간은 gate count·depth와 logical gate time에 좌우된다. 단순한 오류예산 예로 실패 확률 ≤1%, 논리 오류 위치 10^9개를 가정하면 union-bound 기준 위치당 오류 상한은 10^−11이어야 한다. 이 수치는 목표·가정 기반 예시이며 요구조건의 보편적 기준이 아니다.

## 4. AI 응용에서 바꿔야 할 세 가지

### 4.1 QAOA와 MCTS는 자동 교환되는 알고리즘이 아니다

QAOA는 objective와 mixer를 반복 적용하고 고전 최적화기로 파라미터를 조정하는 근사 최적화 방법이다. 원 논문 A1도 일반 문제를 항상 정확히 풀거나 1ms 내 완료하는 알고리즘으로 제시하지 않는다. 회로 깊이·게이트 연결·sampling과 고전 반복 비용이 남는다. circuit QAOA를 ‘터널링이 최적해를 즉시 찾는다’는 설명으로 통일하면 안 된다.

LLM 추론 트리는 매 확장마다 모델 호출과 새로운 score 계산이 필요할 수 있다. 이를 정적인 QUBO로 바꿀 수 있는지, 비용함수를 coherent oracle로 계산할 수 있는지부터 확인해야 한다. 특정 상용 추론 모델이 내부적으로 어떤 MCTS/Beam Search를 쓰는지도 공개 근거 없이 단정하지 않는다.

현실적인 AXON 실험은 **고전 에이전트가 만든 작은 고정 후보 집합의 제약 선택 문제**다. QAOA와 CP-SAT/MILP/휴리스틱을 동일 품질·성공률·전체 wall time으로 비교한다. CPU/GPU에서 문제를 만들고 결과를 검증하는 비용도 포함한다.

### 4.2 표준 attention에는 역행렬이 없다

표준 scaled dot-product attention은 다음 식이다. [A3]

Attention(Q,K,V) = softmax(QKᵀ/√d_k)V.

고정 feature dimension에서 sequence 길이 N에 대한 dense attention의 주요 비용은 토큰 쌍의 점수·값 집계에서 나온다. 표준 식에는 A^−1이 없다. HHL을 가져와 이 연산 전체가 O(log N)이 된다고 말할 수 없다.

HHL은 조건을 갖춘 Ax=b에서 해에 관련된 양자상태 또는 관측량을 얻는 알고리즘이다. sparse access, 효율적인 |b⟩ 준비, condition number κ, 정밀도 ε, 출력 요구를 포함해야 한다. 전체 고전 벡터를 출력하려면 그 길이에 따른 비용이 생긴다. A2의 복잡도도 단순히 N만의 로그 시간이 아니다.

‘Jacobian contraction’은 수축 조건이 성립하는 어떤 반복해법에 관한 주장인지 먼저 정의해야 한다. 예를 들어 선택한 norm에서 ||J||<1이 보장되는 범위와 각 반복의 구현 비용을 보여야 한다. 모든 신경망 역전파가 즉시 끝난다는 결론은 따르지 않는다.

### 4.3 고전 trit과 qutrit은 역할이 다르다

고전 삼진 값 −1/0/+1을 qutrit의 |0⟩/|1⟩/|2⟩ label에 대응시킬 수는 있다. 하지만 label 자체가 음수 확률이나 multiplication operation을 의미하지 않는다. 반대로 qubit 두 개에서도 세 label을 정확히 표현할 수 있다.

3-state 가중치 하나는 고전 정보로 한 trit이다. ‘3 trit’이라면 세 자리로 27개 조합을 가진다는 뜻이므로 용어를 구분한다. MLQT의 저장 표현을 qutrit register에 넣을 수 있다는 사실만으로 양자 신경망 연산·speedup·원 모델 대비 무손실이 확보되지 않는다.

차원만 맞추면 1000/log₂3≈630.93이다. 630 qutrit은 약 998.53 qubit 상당의 Hilbert 공간 차원, 631 qutrit은 약 1000.11 상당이다. 이는 단순 크기 비교이며 오류정정 overhead나 gate set의 기능 등가를 나타내지 않는다.

## 5. 분자·산업 최적화는 유망하지만 ‘100% 종결’이 아니다

양자화학은 유망한 응용이다. 그러나 Hamiltonian 구성, basis/active-space 선정, 상태 준비, 원하는 energy precision, 측정·phase estimation, 오류정정과 gate synthesis 비용을 포함한다. 원자핵 운동과 환경·반응 동역학·약효·독성·임상 결과까지 전자구조 계산 하나로 해결되는 것도 아니다.

A4는 특정 반응 메커니즘의 자원 추정 연구이며 오류정정과 gate compilation 부담을 고려한다. 따라서 비교할 것은 ‘분자 이름 + basis/active space + 정확도 + 고전 기준선 + 논리 회로·물리 자원 + 예상/측정 시간’이다. 유한한 qubit 수만 제시해 무근사·100% 정밀성을 주장하지 않는다.

최적화도 같은 구조다. 임의 NP-hard 문제를 효율적으로 정확히 푸는 보편적 양자 알고리즘은 입증되지 않았다. QAOA의 성능은 instance·depth·노이즈·최적화 비용에 의존한다. 전력망·금융·항공의 실제 제약을 빼고 간단한 toy QUBO의 결과를 산업 전체로 확대하지 않는다.

## 6. QPU 통합은 새로운 연구 기회이지만 기존 기술도 있다

GPU/QPU 간 tightly coupled system은 이미 연구·구현되고 있다. NVIDIA A5의 NVQLink는 RoCE 기반 host-controller 구조를 공개했고 특정 FPGA→GPU→FPGA loopback에서 평균 3.84μs를 보고했다. 이것은 양자 알고리즘 총 실행 시간이나 AXON의 성능이 아니다. ‘기존에는 수백 ms 웹 API만 가능’이라는 기준선은 사용할 수 없다.

AXON의 광 링크·PCIe·CXL 제안은 다음을 구분해야 한다.

- 광섬유: 물리 전송 매체.
- PCIe/CXL/RoCE: 선택한 endpoint·프로토콜·일관성/전송 방식.
- quantum controller runtime: 회로·펄스·샷·신드롬·measurement result의 의미와 타이밍.

프로토콜이 지원되는 광 cable을 구하는 것만으로 QPU를 메모리처럼 CPU 주소 공간에 넣거나 coherence를 얻는 것은 아니다. 초기 검증에는 기존 controller와의 explicit message interface가 더 명확한 시작점이다. 선택한 인터페이스의 지연·throughput과 전체 workload 이득을 각각 측정한다.

## 7. 1랙·24/7 요구조건을 제품 사양으로 바꾼다

아래는 달성값이 아닌 [TARGET] 검증 항목이다. 현재 부품·냉동기 선정이 없어 실제 42U 적합성은 미확인이다.

| 항목 | 사양서에 기록할 것 | 검증 방법 |
|---|---|---|
| 1랙의 경계 | QPU, controller, optics, host, pumps/cryocooler/compressor와 LN2 tank의 포함·외부 여부 | 실제 치수·중량·service clearance 및 전체 장비 목록 |
| 환경 | 온도·습도·진동·EMI·laser·배기 및 시설 조건 | 해당 IDC의 반입·운영 조건과 대조 |
| 냉각 | 각 단계 capacity curve, steady-state 및 transient load, LN2 증발·보충 | 실제 calorimetry와 운전 로그 |
| 전력 | rack PDU와 외부 보조장비, idle/peak·cooldown, 필요하면 LN2 외부 에너지 경계 | 전력계·운전 기록 |
| 가용성 | calibration·보충·고장·정비 시간을 포함한 available compute time | 초기 72h 기능 burn-in, 이후 30일 pilot을 제안; 시간은 시험 목표 |
| 연산 품질 | usable physical/logical qubits, gate/readout error, connectivity, depth, logical error | randomized benchmarking·대상 알고리즘 등 적합 시험 |
| 응용 성능 | 같은 입력·출력 품질·성공 확률에서 전체 job 완료 시간 | 가장 강한 실용 classical baseline과 비교 |
| 비용 | 모든 모듈·시설·인력·소모품·service를 포함한 견적 범위 | 공급업체 견적과 TCO 장부 |

상시 전원이 켜져 있는 것, qubit이 교정되어 있는 것, 고객 job을 연속 수행할 수 있는 것은 서로 다른 가용성 지표다. 72h 시험만으로 연간 신뢰성을 입증했다고 쓰지 않는다.

## 8. AXON 응용 개발의 세 경로

| 경로 | 첫 검증 대상 | 장점 | Trade-off |
|---|---|---|---|
| 제어·교정·QEC 가속 | 고정 decoder 또는 pulse pipeline에서 삼진 baseline과 Sign-Select 비교 | 기존 Rust/RTL·광 자산을 직접 시험 가능 | QPU 자체 성능 향상과 구별해야 함 |
| 작은 조합 최적화 | 고정 후보 선택·scheduling의 QUBO, CPU solver와 QAOA 비교 | 모델 크기·품질·총시간을 명확히 정의 가능 | quantum advantage가 나오지 않을 수 있음 |
| 양자화학 pilot | 작은 active-space Hamiltonian의 energy estimate | AXON 바이오 연구와 연결 가능한 방향 | logical resource·정밀도·검증 비용이 큼 |

우선 제어 가속을 주 개발 경로로 두고, 작은 최적화는 알고리즘 실험, 화학은 독립 응용 연구로 진행하는 안을 권장한다. QPU가 같은 task에서 이득을 보인 부분만 host scheduler가 offload한다. LLM 학습·추론 전체를 무조건 QPU로 넘기는 구조는 전제하지 않는다.

## 9. 문서용 수정 문구와 다음 실험

**수정 문구:**

> AXON은 0-MUL 고전 제어기와 광 인터커넥트를 기반으로 소형 하이브리드 양자 시스템의 제어·배선 비용을 낮추는 구조를 연구한다. QPU의 소형화가 모든 AI/HPC 업무의 가속을 보장하지는 않는다. 특정 제어·최적화·양자화학 workload에서 정확도, 전체 완료 시간, 총 에너지와 운영비를 동등 조건으로 비교해 적용 범위를 정한다.

**누락 근거:** physical/logical 구분, usable gate depth·error model, QAOA 실제 circuit/shot/optimizer 로그, HHL input/oracle와 출력 계약, molecule Hamiltonian과 ε, 실제 42U 기구도·부품·시설 경계, 종합 전력계 및 운영 로그.

**최소 다음 실험:** 상온에서 하나의 고정 크기 syndrome decoder를 선정하고 binary/ternary/Sign-Select 구현을 비교한다. 분류 정확도 대신 필요한 logical error 또는 decoder 실패율을 비교하고, input부터 output까지의 p50/p99 지연·처리율·energy를 측정한다. 미세 회로 하나의 개선을 전체 GPU 데이터센터 대체로 외삽하지 않는다.

## 10. 추가 출처

- **A1** Farhi, Goldstone & Gutmann, A Quantum Approximate Optimization Algorithm (2014). https://arxiv.org/abs/1411.4028
- **A2** Harrow, Hassidim & Lloyd, Quantum algorithm for solving linear systems of equations (2009). https://arxiv.org/abs/0811.3171 ; 전문 https://arxiv.org/html/0811.3171v3
- **A3** Vaswani et al., Attention Is All You Need, §3.2.1. https://arxiv.org/html/1706.03762v7
- **A4** Reiher et al., Elucidating reaction mechanisms on quantum computers, PNAS 114, 7555–7560 (2017). https://pmc.ncbi.nlm.nih.gov/articles/PMC5530650/
- **A5** NVIDIA official technical blog, 2025-11-17, NVQLink architecture and measured transport loopback. https://developer.nvidia.com/blog/nvidia-nvqlink-architecture-integrates-accelerated-computing-with-quantum-processors/

위 문헌은 해당 알고리즘과 외부 시스템의 근거이며, AXON 성능의 실증 자료가 아니다.
