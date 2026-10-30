# v0.3 변경 내역 — 2026-10-31

## 실제 수정

- v0.2 원본 ZIP을 다시 받아 manifest 15개 파일의 SHA-256 일치를 확인하고 `legacy_v02`에 보존했다.
- `engineering_model.py`를 v0.2 입력과 호환되게 유지했다. 출력의 `model_version`을 0.3으로 표시하고 증거 미인증·시스템 미평가를 명시했다.
- WDM 방향별 합계에 여유가 있어도 개별 파장이 과부하되는 사례를 차단했다. 할당된 fiber·wavelength에 stream을 균등 배치한다는 가정 아래 peak stream 수를 계산한다. 실제 배치·변조·프로토콜 검증은 별도이다.
- boolean angle, 음수 multiplier, 스케일·합계 overflow, 빈 장부 항목명, 중복·빈 thermal stage명을 거부하도록 보강했다.
- Steane ideal-syndrome 참조, 전수 Pauli 분류, 독립 상태벡터 대조 및 다중 오류 반례를 추가했다.
- 근거 누락·hash 불일치·경로 이탈·부적절한 timing/power 추론을 차단하는 증거 완결성 검사기를 추가했다. 해당 도구는 측정 진위를 인증하지 않는다.
- 원본 M3 claim fixture의 승인 실패를 예상 결과로 보존했다.
- 양자·고전 아키텍처 지침, YourOS 계약, M3 작업지시서, Windows self-hosted CI 예제를 작성했다.

## 변경하지 못한 범위

원본 M3 RTL·testbench·PPA 로그, 원본 YourOS·Rust 소스, 특허 34/35/36 원문은 확보하지 못했다. 해당 원본 변경·성능 재현·저온 시험·원격 push는 이번 변경 내역에 포함되지 않는다.

현재 성공 건수는 `results/verification.json`을 따른다. 이 문서의 completion은 문서·참조·검증 도구의 완성 범위이다.
