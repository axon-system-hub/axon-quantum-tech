# AXON-SQA-01 v0.3.1 — 감사 보완 및 M3 근거 접수

개정일: 2026-10-31 KST. v0.3의 소프트웨어 기준선 검증을 유지하고, 배포 해시와 재실행 결과를 분리했다. 원본 M3·YourOS 수정이나 하드웨어 완성을 선언하는 패키지가 아니다.

## 보완 내용

- `AUDIT_ADDENDUM.md`: 승인 범위, STA/PnR 용어, 핵심 20개/전체 42개 항목, 거부 예제와 신규 M3 심사의 구분.
- `LOCAL_AUDIT_RECEIPT.json`: 사용자 제공 커밋과 로컬 보고를 독립 확인 결과와 구분해 기록.
- `release_integrity.py`: 소스 및 배포 snapshot 해시를 각각 검사. 누락·변조·미등록 파일·경로 이탈을 거부.
- `verify_release.py`: 실행 전 소스 해시 검사. 새 출력은 `runs/latest/`에 쓰고 배포 `results/`를 보존.
- `m3_intake.py`, `submissions/m3_evidence_template.json`: 코드 계약·동일 commit·RTL/Rust 대조·합성 run·top·통계 원문 위치와 파일 해시 접수 검사.
- `M3_HANDOFF.md`: 로컬 원본 작업 순서 및 독립 심사 항목.
- 기존 공학 모델·Steane 참조·증거 검사기·실패 사례 유지. 공백 metadata·boolean count·Windows 경로 검사를 보강.
- `baseline/`의 원본 v0.3 ZIP과 `legacy_v02/` 원본 기록 보존.

## 실행

Python 3.10 이상, 외부 Python 패키지 없음. 압축 해제한 최상위 폴더에서 실행한다.

```text
python release_integrity.py snapshot
python verify_release.py
python release_integrity.py snapshot
```

세 명령 모두 종료 코드 0이어야 한다. 기본 재실행 출력은 `runs/latest/`다. 외부 출력은 `python verify_release.py --output-dir D:/sqa-runs/run001`로 지정한다. 패키지 내부는 runs 아래만 허용한다.

`SOURCE_SHA256SUMS.txt`는 실행 소스·문서·입력·역사 자료를, `SHA256SUMS.txt`는 source manifest와 배포 results까지 추적한다. runs와 Python cache는 제외한다. `--write`는 제작자의 빌드 명령이며 수신자가 변조 오류를 덮는 데 사용하지 않는다. 해시는 진위 인증이 아니다.

## 두 종류의 거부 시험

```text
python evidence_gate.py claims_m3_unverified.json
python m3_intake.py submissions/m3_evidence_template.json
```

둘 다 종료 코드 **2가 예상 결과**다. 첫 번째는 기존 미검증 주장 예제, 두 번째는 빈 접수 서식의 거부 시험이다. 신규 로컬 M3 로그 심사나 합성 재현을 수행한 것이 아니다.

실제 자료는 패키지 밖 evidence 폴더에 서식 사본과 원시 파일을 놓고 `python m3_intake.py D:/m3-evidence/submission.json --root D:/m3-evidence`로 검사한다. 완결성이 맞으면 종료 코드 0과 READY_FOR_REVIEW를 반환한다. 측정 진위·기능 동치·하드웨어 PASS를 뜻하지 않는다.

## 결과의 권위와 범위

배포 결과는 `results/verification.json`, 새 실행은 `runs/latest/verification.json`이다. v0.3은 49개였으며 v0.3.1은 신규 회귀 시험을 더해 71개다. 실행 결과 JSON과 tests.log가 실제 성공 건수의 근거다.

Steane [[7,1,3]]의 22개 사례는 오류 없음 1개와 단일 Pauli 오류 21개다. 16,384개는 전수 분류 수이며 전수 교정 수가 아니다. 로컬 보고의 [[3,1,1]]·[[5,1,3]]와 기능·자원량을 합치지 않는다.

세 커밋은 현 연결에서 404였다. 로컬 보고는 USER_REPORTED_PENDING_ARTIFACT_REVIEW로 기록한다. 원본 변경·push·극저온·QPU 계측은 수행하지 않았다.
