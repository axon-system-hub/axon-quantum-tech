# AXON-SQA-01 v0.3 — 수정 지침서와 실행 검증 패키지

작성일: 2026-10-31 KST. v0.2의 원본 15개 manifest 항목은 `legacy_v02`에 보존했다.

## 완성한 범위

- `AXON_SQA_01_v0.3.md`: 0-MUL·광학·77K/4K/mK·QEC·YourOS·DC의 통합 개발 지침서 개정본.
- `engineering_model.py`: 기존 입력 형식을 유지하면서 파장별 과부하, 숫자 overflow, 잘못된 입력·중복 stage 검사를 수정.
- `qec_reference.py`: Steane [[7,1,3]]의 이상적 신드롬 참조. 22개 단일 Pauli 사례와 전체 16,384개 패턴을 검사.
- `evidence_gate.py`: 근거 파일·hash·필수 조건 검사. LTP→ns, 0-MUL→0W 등 잘못된 승격을 차단.
- `M3_IMPLEMENTATION_CONTRACT.md`, `YOUR_OS_INTERFACE.md`: 원본 코드에 적용할 수정·검증·인터페이스 계약.
- `CORRECTIONS.md`: 주장별 정정·판정. `CHANGELOG.md`: 실제 수정 내역.
- `results/`: 현재 실행 결과, 원시 테스트 로그, 미확인 입력·M3 증거 상태.
- `integration/axon-sqa-validation.yml`: 기존 Windows self-hosted runner용 수동 실행 CI 예제.

## 실행

Python 3.10 이상, 외부 Python 패키지 없음. 이 폴더에서 실행한다.

```text
python verify_release.py
```

전체 Python 테스트와 계산 결과를 `results`에 쓴다. `software_validation_status=PASS`는 이 소프트웨어 범위의 검증 성공이다. 원본 RTL, 타이밍·전력, FPGA·실리콘·극저온·QPU 실측 성공을 뜻하지 않는다.

개별 실행:

```text
python qec_reference.py --output results/qec_reference.json
python engineering_model.py inputs_unknown.json --output results/results_unknown.json
python evidence_gate.py claims_m3_unverified.json --output results/m3_evidence_gate.json
```

마지막 명령의 **exit code 2는 의도한 결과**이다. 현재 M3 보고에 원시 근거가 없거나 잘못된 추론이 있으므로 검토 준비 완료로 승인하지 않는다. 전체 `verify_release.py`는 이 부정 사례가 정확히 차단되는지도 확인한다.

## 문서의 권위와 한계

현행 지침은 v0.3 최상위 문서이다. `legacy_v02`의 README·결과·당시 접근 상태는 역사적 기록으로 유지한다. 새 결과는 `results/verification.json`과 `results/tests.log`에 있다. 기본 물리 입력의 null은 미확인으로 남으며 실제 시스템 PASS를 계산하지 않는다.

Steane 참조는 기존 AXON M3 구현과 무관하게 새로 작성한 제한된 기능 기준선이다. 16,384개 패턴을 분류한다는 뜻이지 모두 교정한다는 뜻이 아니다. 독립된 상태벡터 대조도 같은 이상적 잡음 모델 범위의 수학·코드 검증이다.

이번에 원본 비공개 저장소의 README 조회는 404였다. 원본 M3·YourOS·Rust 자산을 수정·합성·설치·푸시하지 않았다. 지침서·참조 코드·검증 도구는 완성했으며 실제 하드웨어는 단계별 후속 검증 대상이다.
