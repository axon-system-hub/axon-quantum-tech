# YourOS ↔ 로컬 양자 제어기 인터페이스 계약 v0.3

상태: 구현 대상 명세 [TARGET]. 실제 YourOS 소스·드라이버·ABI를 수정한 결과가 아니다.

## 1. 작업 봉투

host가 제출할 필수 필드는 `schema_version`, `job_id`, `program_sha256`, `calibration_sha256`, `decoder_code_id`, `sequence`, `expected_input_format`, `expected_output_format`, `timeout_ticks`, `telemetry_policy`이다. SHA-256은 64자리 hex, sequence와 timeout은 폭을 고정한 unsigned 값으로 정의한다. 실제 레지스터 주소와 syscall 번호는 원본 ABI 확인 후 배정하며 여기서 임의 확정하지 않는다.

상태는 `PREPARED → STAGED → ARMED → RUNNING → DRAINING → COMPLETE`이다. 준비 검증 실패는 REJECTED, 실행 오류는 FAULT, 사용자 또는 정책 중단은 ABORTED로 기록한다. COMPLETE는 프로그램 실행 종료이며 논리 오류 0·양자 성능 목표 달성이라는 뜻이 아니다.

## 2. 소유권·동기화

host는 descriptor와 payload를 모두 쓴 뒤 적절한 DMA/cache 동기화와 release ordering을 수행하고 doorbell을 갱신한다. controller는 acquire ordering 이후 descriptor를 검증한다. 메모리 일관성 규칙은 CPU·PCIe/CXL·DMA 구성에서 확인하며 일반 MMIO write만으로 데이터 가시성을 가정하지 않는다.

ARMED부터 program·calibration은 controller 로컬 복사본 또는 보호된 고정 영역에 둔다. 실행 중 host의 파일 변경이나 agent 제안이 현재 버전을 바꾸지 못하게 한다. 취소·상태 조회·결과 회수는 별도 제어 채널에서 수행한다.

## 3. 시간과 이벤트

제어기 clock의 tick 단위, counter 폭, rollover, clock domain crossing, timestamp 위치를 명세한다. CPU clock/TSC와 제어기 clock은 자동 일치하지 않는다. 양쪽 시간을 비교하려면 동기화·offset·drift·계측 오차를 기록한다.

디코더 시작 이벤트, valid input 정의, 완료 이벤트, output valid·ready 의미를 고정한다. 조합회로는 glitch·입력 안정시간·출력 샘플링 규칙을 포함한다. clock이 없는 작은 논리라는 이유로 입력 동기화·메타안정성·출력 레지스터 문제가 사라지지 않는다.

## 4. 로그·버퍼·장애 정책

- 필수 데이터: job/sequence, code·calibration hash, 오류 코드, 필요한 syndrome/result, 실험 완전성 판정.
- 선택 데이터: 고빈도 상세 telemetry, 디버그 캡처. 사전 정의한 정책으로만 축약·drop하고 개수를 기록한다.
- 필수 buffer가 부족하면 다음 안전한 shot/round boundary에서 PAUSE 또는 ABORT한다. 해당 QPU가 대기를 허용하지 않으면 중단·재초기화 절차를 실행한다.
- 원격 파일시스템 대기를 ns 경로에 넣지 않는다. 그렇다고 저장소 무기한 중단을 무시하지도 않는다.
- watchdog, 중복 descriptor, 누락 sequence, stale calibration, CRC/hash 불일치, 전원·온도 경보를 FAULT로 전환한다.

## 5. 합격 시험

저장소 전송 지연·중단, host 부하, buffer 포화, counter rollover, stale descriptor, 잘못된 길이와 hash를 주입한다. 필수 데이터 누락·잘못된 보정 출력·숨겨진 deadline miss가 없는지 검사한다. 최대 관찰 지연·실패 건수·재현 seed를 남긴다. 무지터·나노초 제어라는 문구는 실제 출력 계측과 적용 범위 근거가 있을 때만 쓴다.
