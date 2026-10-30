# M3 로컬 원본 인계 작업지시서 — v0.3.1

목적: 로컬 보고를 재현 가능한 근거와 연결한다. 실행 완료 보고가 아니다. 원본 worktree를 덮어쓰거나 자동 commit/push하지 않는다.

## 1. 소스 귀속

D:/axon-양자기술의 실제 저장소에서 `git rev-parse HEAD`, `git status --porcelain`, `git show --stat --oneline ef5ceff`를 기록한다. SHA는 40자리 전체를 쓴다. 토큰·환경변수·자격증명 파일은 수집하지 않는다.

기준 commit을 고정하고 clean worktree의 해당 소스를 별도 폴더에서 실행한다. dirty tree 결과를 HEAD 결과로 기록하지 않는다. 기존 변경은 보존하고 필요하면 별도 worktree를 사용한다. source_snapshot은 해당 commit의 `git archive --format=tar` 산출물이다. 파일 해시는 `Get-FileHash -Algorithm SHA256 -LiteralPath ...`로 계산할 수 있다.

## 2. 코드별 계약

서식의 [[3,1,1]]·[[5,1,3]]은 사용자 보고의 자리표시자다. stabilizer·논리 연산자·입출력으로 실제 코드와 n/k/d를 확인한다. 두 코드와 Steane [[7,1,3]] 참조는 별도 implementation이다.

data/ancilla 수, syndrome 순서·bit order, 지원 X/Y/Z, measurement error, 라운드 수, correction/frame 의미, reset/valid/ready를 명세한다. syndrome_bits와 output_bits는 실제 port에 맞춘다. bounds 검사만으로 코드 거리가 입증되지는 않는다.

## 3. Rust↔RTL 대조

기존 Rust10·Icarus25 시험의 command/tool/source SHA/종료 코드와 전체 로그를 보존한다. 교차검증은 동일 golden_vectors를 두 구현에 입력하고 벡터별 출력·mismatch를 남긴다. 전수 범위 또는 coverage를 명시하고 종료 코드를 즉시 확인한다.

신드롬→보정표 일치와 오류 상태에 보정을 적용한 뒤 논리 상태 보존은 별도 검사다. 기존 시험 건수만으로 모든 Pauli 오류 교정·fault tolerance를 선언하지 않는다.

## 4. 합성 통계

50 cells와20 LUT4가 다른 실행에서 나오면 별도 synthesis run으로 기록한다. top·hierarchy·target·tool_version·command·script·종료 코드·pre-map/mapped netlist·전체 log를 연결한다.

metric마다 raw_field·value·unit·log_line을 적는다. cells를 환산 gate count로 바꾸지 않는다. LTP9의 단위는 logic_levels다. 다른 top의 통계를 합치지 않는다. DSP0·operator0은 구조 검토 전의 좁은 통계다.

ns·W·온도 결과는 구조 통계에 넣지 않는다. evidence_gate용 별도 report에 방법·PVT·제약·배선 또는 계측기·부하·표본 수를 제출한다. STA/PnR은 타이밍 분석이며 보드 실측이 아니다.

## 5. 접수 및 후속 게이트

패키지 밖 D:/m3-evidence에 서식 사본 submission.json과 원시 파일을 놓는다. null을 실제 근거로 채운다. 패키지 내부 서식은 source manifest가 추적하므로 편집하지 않는다.

```text
python m3_intake.py D:/m3-evidence/submission.json --root D:/m3-evidence --output D:/m3-evidence/intake_result.json
```

종료 코드2: 누락·불일치. 코드0: 자료 완결성이 맞아 검토할 준비가 됨. 접수기가 로그를 재실행하거나 진위·동치를 인증하지 않는다. 현재 패키지에는 실제 M3 자료가 제출되지 않았다.

리뷰 순서: 소스 귀속→코드 계약→벡터·논리 상태→합성 원문→동일 기능 기준선→타이밍/전력→상온 HIL→광 링크→극저온→QPU. 근거가 충족된 항목만 승격한다.

## 6. YourOS·광학 캡

YourOS4c450b4의 full SHA·ABI·호출부·Code254 소비 시험·CI job 로그를 별도 묶음으로 남긴다. Python job 성공은 커널 검증이 아니다. 1a80b18의 CAD·DXF·가공 규격·치수 대조는 광학 링크 성능과 별도로 검사한다. 이 패키지는 원본 수정 완료로 표시하지 않는다.
