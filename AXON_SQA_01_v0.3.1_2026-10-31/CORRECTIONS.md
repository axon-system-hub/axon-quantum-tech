# v0.3.1 추가 정정

STA/PnR은 타이밍 분석이며 실측이 아니다. v0.3 manifest 핵심20개와 전체42개를 구별한다. 기존 부정 claim fixture의 거부는 신규 M3 자료 심사가 아니다. 상세 근거·승인 문구는 `AUDIT_ADDENDUM.md`를 따른다. 원본 로컬 보고는 `LOCAL_AUDIT_RECEIPT.json`에 미인증 접수로 보존한다.

---

# 주장별 정정 등록부 v0.3

전체 판정: 개발 방향은 유지한다. 원본 M3 자원·속도·전력은 재현 근거가 없어 미확인으로 유지한다. 아래 수치는 원 보고의 주장 또는 명시된 계산이며 새 하드웨어 실측이 아니다.

| 주장 | 값 | 증거 라벨 | 적용 범위 | 비교 기준·조건 | 계산/출처 | 한계 | 판정 |
|---|---:|---|---|---|---|---|---|
| M3 자원량 | 20 LUT·50 gate | ASSUMED, 합성 보고 미확인 | AXON-SPECIFIC | top·part·mapping·기능 동일 | 사용자 제공 보고 | num_cells와 gate 환산 구별 필요 | 미검증 |
| M3 zero multiplier | 0 | ASSUMED, 보고 미확인 | AXON-SPECIFIC | pre/post mapping·구조·입력영역 | 사용자 보고·SQA S2 | post-map $mul0만으로 불충분 | 미검증 |
| LTP9에서 실제 시간 확정 | 0.5/1.5ns | ASSUMED | AXON-SPECIFIC | STA/PnR·PVT·부하 | SQA S1·S3 | 위상 깊이는 시간값이 아님 | 미검증 |
| 0-MUL이면 무발열 | 0W | ASSUMED | GENERAL | clock·logic·I/O 전체 | SQA S8 | 일반 CMOS 스위칭·누설 존재 | 반증됨 |
| 합성으로 cryo 동작 확인 | 4K | TARGET | AXON-SPECIFIC | 부품별 기능·열·시간 계측 | 원시 시험 없음 | 합성과 저온 소자 동작은 다름 | 미검증 |
| 전체 QEC 즉시 완료 | 5ns | TARGET | PROJECTED-AXON | readout부터 feedback/frame | SQA S4·S9 | 코드·노이즈·경계 미확정 | 미검증 |
| 광 링크로 외부 열 전체 제거 | 100% | ASSUMED | GENERAL | 광흡수·복사·전원·기구 포함 | SQA S5 | 특정 배선 전도 감소와 다름 | 반증됨 |
| Ring0로 무지터 보장 | 0ns jitter | TARGET | AXON-SPECIFIC | 실제 출력·부하·최악조건 | SQA S12·S13 | syscall 진입 주소는 timing engine 아님 | 미검증 |
| 500μm 전파가 전체 연산 | 약5.8ps | DERIVED, ng3.48 가정 | PROJECTED-AXON | 측정·변환·배선 포함 | t=ngL/c | chip 전파와 전체 latency 경계 다름 | 비교 불가 |
| MZI dark port가 에너지 제거 | 0mW 소멸 | ASSUMED | GENERAL | 양쪽 출력·손실·흡수 | 기존 모델 energy 검사 | 에너지 재분배·열을 누락 | 반증됨 |
| ER로 양자 gate 품질 보장 | 45dB | TARGET | PROJECTED-AXON | pulse-to-gate channel 필요 | power10^(-ER/10) | classical cosine·ER와 gate fidelity 다름 | 미검증 |
| 1,000 physical에서 logical 수 고정 | 수개~수십개 | ASSUMED | GENERAL | 코드·거리·오류율·프로토콜 | 조건별 resource 산정 필요 | 보편적 환산율 없음 | 미검증 |
| classical trit=qutrit state | 1:1 | ASSUMED | MLQT-ONLY 주장 | 임의 복소진폭 상태 포함 | 코드 기호와 양자상태 구별 | basis 기호 매핑만으로 상태 저장 아님 | 반증됨 |
| Steane 참조 단일 오류 기능 | 22 사례 | CODE-VERIFIED | GENERAL_REFERENCE | 이상적 noiseless syndrome | results/qec_reference.json | 원본 M3·실제 readout은 평가 안 함 | 검증됨 |
| 전체 Pauli 패턴 분류 | 16,384개 | DERIVED·CODE-VERIFIED | GENERAL_REFERENCE | 7 data qubit Pauli 오류 | 4^7·독립 statevector 대조 | 모두 교정된다는 뜻 아님 | 검증됨 |

SQA 출처 번호는 `AXON_SQA_01_v0.3.1.md`의 출처 목록이다.

**수정 문구:** AXON은 고전 제어와 광 링크의 비용을 줄이는 후보 구조를 개발하며, 공개·내부 근거가 지지하는 범위에서 성능을 갱신한다.

**누락 근거:** 원본 M3 source SHA·TB·raw log·target·제약·Liberty/FPGA timing·계측·온도·대상 QPU.

**최소 다음 실험:** 원본 M3의 코드·오류모형을 고정하고 동일 기능 baseline과 RTL 정확도·처리율·꼬리지연·자원·energy를 비교한다. 상온 결과 후 광·저온으로 확장한다.
