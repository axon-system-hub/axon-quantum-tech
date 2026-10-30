# AXON Quantum Review v0.2

제공된 AXON Quantum 기술 설명의 검토 보고서와 재현 가능한 공학 계산 자료.

## 읽는 순서

1. `AXON_QUANTUM_AUDIT_AND_DESIGN.md`: 주장별 판정, 물리 검산, 세 가지 경로와 설계안.
2. `WORK_ORDER.md`: 기존 Rust/RTL 자산에 적용할 검증 작업지시서. `AI_AND_HPC_CLAIMS.md`: AI·양자 알고리즘·1랙·24/7 주장 검토. `DC_MEMORY_INTEGRATION.md`: DC·저장소·상태 준비·실시간 제어 통합안.
3. `engineering_model.py`: 온도 단계별 열·채널·지연 장부. Python 3.10 이상, 외부 패키지 없음.
4. `inputs_unknown.json`: 미확인 입력을 null로 보존하는 기본안.
5. `inputs_illustrative.json`: 77K 장부에만 가정값을 넣은 사용 예제.
6. `results_*.json`: 모델 실행 결과. `sensitivity.csv`: 임의 입력 민감도.
7. `VERIFICATION.txt`: 이번 모델 자체의 테스트 결과.

## 실행

이 폴더에서 Windows PowerShell 또는 일반 터미널로 실행한다.

```text
python -m unittest -v test_engineering_model.py
python engineering_model.py inputs_unknown.json --output results_unknown.json
python engineering_model.py inputs_illustrative.json --qubits 100 500 1000 --output results_illustrative.json
```

배포 파일의 illustrative 결과는 기본 크기 100/200/300/400/500/1000을 포함한다. 동일 결과를 다시 만들려면 `--qubits`를 생략한다.

## 입력 계약

- 각 물리 입력은 `value`, `evidence`, `source`를 갖는다. null은 미확인이고 명시적인 0과 다르다.
- `basis`는 fixed/per_qubit/per_signal/per_fiber이다. per_signal은 별도 방향을 포함한 총 directional logical stream 수에 곱한다.
- 채널 수·방향·WDM 구성은 모두 제안이다. 각각 양의 정수여야 한다.
- 온도 stage와 지연·벽전력 장부는 필수다. 확인하지 못한 항목은 삭제하지 말고 null로 남긴다.
- capacity와 총열을 알 수 있을 때만 해당 stage의 `WITHIN_INPUT_BUDGET` 여부를 계산한다. 이는 부품 기능·QPU·QEC 성공 판정이 아니다.
- absorbed optical power는 그 단계에서 실제 열로 바뀌는 값이다. 레이저 출력 전체 또는 검출 전기전력을 중복 합산하지 않도록 경계를 정한다.
- heat ledger와 wall power ledger는 별도 경계이다. 실제 전체 시스템 meter 입력을 사용하거나, 장치 목록과 변환 손실을 갖춘 독립 장부를 구성한다.
- 300K sink 기준 Carnot 출력은 이상적 하한이며 실제 벽전력이 아니다. LN2 생산·운송 에너지로 해석하지 않는다.
- evidence label은 사용자가 넣은 출처 설명을 보존할 뿐 외부 증거를 자동 인증하지 않는다.

## 이 자료의 한계

기존 비공개 저장소가 현재 연결에서 404를 반환해 원본 코드를 확인하지 못했다. 원본 Windows 폴더·Rust crate·RTL을 변경하거나 실행·푸시하지 않았다. 본 Python 테스트는 장부 계산의 논리·단위·누락처리를 검증하며 반도체·광학·QPU의 제작 성능을 검증하지 않는다.
